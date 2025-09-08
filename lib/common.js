'use strict';

// const debug = require('debug')('app-store-scraper');
const c = require('./constants');
const logger = require('./logger');

// Runtime config (can be set from worker via common.configure)
const _config = {
  throttling: { enabled: false, requests: 10, intervalMs: 1000 },
  retry: { enabled: true, retries: 1, attemptTimeoutMs: 1500, totalTimeoutMs: 4000 },
  breaker: { enabled: true, failureThreshold: 3, openMs: 120000, halfOpenProbeIntervalMs: 30000 }
};

function configure(options = {}) {
  if (options.throttling) {
    const t = options.throttling;
    _config.throttling.enabled = Boolean(t.enabled);
    if (t.requests) _config.throttling.requests = Number(t.requests) || _config.throttling.requests;
    if (t.intervalMs) _config.throttling.intervalMs = Number(t.intervalMs) || _config.throttling.intervalMs;
  }
  if (options.retry) {
    const r = options.retry;
    if (r.enabled !== undefined) _config.retry.enabled = Boolean(r.enabled);
    if (r.retries !== undefined) _config.retry.retries = Math.max(0, Number(r.retries));
    if (r.attemptTimeoutMs) _config.retry.attemptTimeoutMs = Number(r.attemptTimeoutMs) || _config.retry.attemptTimeoutMs;
    if (r.totalTimeoutMs) _config.retry.totalTimeoutMs = Number(r.totalTimeoutMs) || _config.retry.totalTimeoutMs;
  }
  if (options.breaker) {
    const b = options.breaker;
    if (b.enabled !== undefined) _config.breaker.enabled = Boolean(b.enabled);
    if (b.failureThreshold) _config.breaker.failureThreshold = Math.max(1, Number(b.failureThreshold));
    if (b.openMs) _config.breaker.openMs = Number(b.openMs) || _config.breaker.openMs;
    if (b.halfOpenProbeIntervalMs) _config.breaker.halfOpenProbeIntervalMs = Number(b.halfOpenProbeIntervalMs) || _config.breaker.halfOpenProbeIntervalMs;
  }
}

// Simple circuit breaker for primary (direct) requests
const _directBreaker = { failures: 0, openUntil: 0, lastProbeAt: 0 };
function _isBreakerOpen(now) {
  if (!_config.breaker.enabled) return false;
  if (_directBreaker.openUntil > now) return true; // OPEN
  return false;
}
function _shouldProbe(now) {
  // Half-open if open window elapsed, permit sparse probes
  if (!_config.breaker.enabled) return true;
  if (_directBreaker.openUntil > now) return false; // still open
  return (now - _directBreaker.lastProbeAt) >= _config.breaker.halfOpenProbeIntervalMs;
}
function _recordFailure(now) {
  if (!_config.breaker.enabled) return;
  _directBreaker.failures += 1;
  if (_directBreaker.failures >= _config.breaker.failureThreshold) {
    _directBreaker.openUntil = now + _config.breaker.openMs;
    _directBreaker.lastProbeAt = now;
    logger.warnThrottled('breaker_open', 60000, `Circuit breaker opened for ${_config.breaker.openMs}ms`);
  }
}
function _recordSuccess() {
  _directBreaker.failures = 0;
  _directBreaker.openUntil = 0;
}

// Promise.race timeout helper
function _withTimeout(promise, ms, label = 'operation') {
  return Promise.race([
    promise,
    new Promise((resolve, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms))
  ]);
}

function _sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function _jitter(baseMs) { return Math.floor(baseMs * (0.5 + Math.random())); }

function _shouldRetry(status, err) {
  if (!_config.retry.enabled) return false;
  if (status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  if (!status && err) return true; // network/timeout
  return false;
}

// Simple throttling implementation for fetch
class RequestThrottler {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.requestsPerSecond = 10; // default limit
    this.interval = 1000; // 1 second
  }

  configure(options) {
    if (options.requests && options.milliseconds) {
      this.requestsPerSecond = options.requests;
      this.interval = options.milliseconds;
    }
  }

  async throttledFetch(url, options) {
    return new Promise((resolve, reject) => {
      this.queue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const batchSize = this.requestsPerSecond;
    const batch = this.queue.splice(0, batchSize);

    // Process batch in parallel
    const promises = batch.map(async ({ url, options, resolve, reject }) => {
      try {
        const response = await fetch(url, options);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });

    await Promise.all(promises);

    // Wait before processing next batch
    if (this.queue.length > 0) {
      setTimeout(() => {
        this.processing = false;
        this.processQueue();
      }, this.interval);
    } else {
      this.processing = false;
    }
  }
}

const throttler = new RequestThrottler();

function cleanApp(app) {
  return {
    id: app.trackId,
    appId: app.bundleId,
    title: app.trackName,
    url: app.trackViewUrl,
    description: app.description,
    icon: app.artworkUrl512 || app.artworkUrl100 || app.artworkUrl60,
    genres: app.genres,
    genreIds: app.genreIds,
    primaryGenre: app.primaryGenreName,
    primaryGenreId: app.primaryGenreId,
    contentRating: app.contentAdvisoryRating,
    languages: app.languageCodesISO2A,
    size: app.fileSizeBytes,
    requiredOsVersion: app.minimumOsVersion,
    released: app.releaseDate,
    updated: app.currentVersionReleaseDate || app.releaseDate,
    releaseNotes: app.releaseNotes,
    version: app.version,
    price: app.price,
    currency: app.currency,
    free: app.price === 0,
    developerId: app.artistId,
    developer: app.artistName,
    developerUrl: app.artistViewUrl,
    developerWebsite: app.sellerUrl,
    score: app.averageUserRating,
    reviews: app.userRatingCount,
    currentVersionScore: app.averageUserRatingForCurrentVersion,
    currentVersionReviews: app.userRatingCountForCurrentVersion,
    screenshots: app.screenshotUrls,
    ipadScreenshots: app.ipadScreenshotUrls,
    appletvScreenshots: app.appletvScreenshotUrls,
    supportedDevices: app.supportedDevices
  };
}

// Alternative request function using reliable proxy
const doRequestViaProxy = async (url, _headers, _requestOptions, _limit) => {
  logger.debug('Trying proxy request method for:', url);

  // Use allorigins.win which is reliable for iTunes API
  try {
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(url);
    logger.debug('Using allorigins proxy:', proxyUrl);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.contents) {
        logger.debug('Proxy request successful via allorigins');
        return data.contents;
      }
    }

    throw new Error(`Proxy request failed: ${response.status}`);
  } catch (error) {
    logger.warn('Proxy request error:', error.message);
    throw error;
  }
};

// Direct request to iTunes API using different approach
const doRequestDirect = async (url, _headers, _requestOptions, _limit) => {
  logger.debug('Trying direct request with different strategy for:', url);

  // Try using different headers that might bypass detection
  const alternativeHeaders = {
    'User-Agent': 'AppStore/3.0 CFNetwork/1240.0.4 Darwin/20.6.0',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Apple-Store-Front': '143441-1,29',
    'X-Apple-Tz': '28800'
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: alternativeHeaders
    });

    if (response.ok) {
      const body = await response.text();
      logger.debug('Direct alternative request successful');
      return body;
    }

    throw new Error(`Direct alternative request failed: ${response.status}`);
  } catch (error) {
    logger.warn('Direct alternative request failed:', error.message);
    throw error;
  }
};

// Fetch-based request function with fallback
const doRequest = async (url, headers, requestOptions, limit) => {
  logger.debug('Making request to:', url);
  logger.debug('Request headers:', headers);

  // Default headers to mimic iTunes application requests
  const defaultHeaders = {
    'User-Agent': 'iTunes/12.12.0 (Macintosh; OS X 10.15.7) AppleWebKit/605.1.15',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-us',
    'Accept-Encoding': 'gzip, deflate, br',
    'X-Apple-Store-Front': '143441-1,29',
    'X-Apple-Tz': '28800',
    'X-Apple-Request-UUID': crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    })
  };

  const finalHeaders = {
    ...defaultHeaders,
    ...headers
  };

  const fetchOptions = {
    method: 'GET',
    headers: finalHeaders,
    cf: {
      // Cloudflare-specific options
      cacheEverything: false,
      cacheTtl: 0
    },
    ...requestOptions
  };

  logger.debug('Final fetch options:', JSON.stringify(fetchOptions, null, 2));

  try {
    let response;

    async function _fetchDirectOnce() {
      if (limit) {
        throttler.configure({ requests: limit, milliseconds: 1000 });
        return await throttler.throttledFetch(url, fetchOptions);
      } else {
        return await fetch(url, fetchOptions);
      }
    }

    const start = Date.now();
    const retryCfg = _config.retry;
    const breakerOpen = _isBreakerOpen(start);

    // Attempt direct request if breaker allows (or probing)
    if (!breakerOpen || _shouldProbe(start)) {
      if (breakerOpen) { _directBreaker.lastProbeAt = start; }
      let attempt = 0;
      let lastErr;
      while (true) {
        attempt += 1;
        try {
          response = await _withTimeout(_fetchDirectOnce(), retryCfg.attemptTimeoutMs, 'direct request');
          break;
        } catch (e) {
          lastErr = e;
        }
        const elapsed = Date.now() - start;
        if (attempt <= retryCfg.retries && elapsed < retryCfg.totalTimeoutMs && _shouldRetry(0, lastErr)) {
          await _sleep(_jitter(200));
          continue;
        } else {
          break;
        }
      }
    }

    if (response) {
      logger.debug('Response status:', response.status, response.statusText);
      logger.debug('Response headers:', Object.fromEntries(response.headers.entries()));
    }

    // If no response or non-ok, consider fallbacks and error handling
    if (!response || !response.ok) {
      const status = response ? response.status : 0;

      // Record breaker signals on blocking/server errors or timeouts
      if (!response || status === 403 || status === 429 || (status >= 500 && status <= 599)) {
        _recordFailure(Date.now());
      }

      // Fallback to alternative methods for known blocking/timeouts/server errors
      if (!response || status === 403 || status === 429 || (status >= 500 && status <= 599)) {
        if (status === 403) {
          logger.warnThrottled('blocked_403', 60000, 'Primary request blocked, trying alternative methods...');
        } else if (!response) {
          logger.warnThrottled('direct_timeout', 60000, 'Primary request timed out or failed, trying alternative methods...');
        } else {
          logger.warnThrottled('primary_non_ok', 60000, `Primary request non-ok (${status}), trying alternative methods...`);
        }

        // Try direct alternative first
        try {
          logger.debug('Trying direct alternative method...');
          return await doRequestDirect(url, headers, requestOptions, limit);
        } catch (directError) {
          logger.warnThrottled('direct_alt_failed', 60000, 'Direct alternative failed:', directError.message);
        }

        // Try proxy method as last resort
        try {
          logger.debug('Trying proxy method...');
          return await doRequestViaProxy(url, headers, requestOptions, limit);
        } catch (proxyError) {
          logger.warnThrottled('proxy_alt_failed', 60000, 'Proxy method also failed:', proxyError.message);
        }

        logger.warnThrottled('all_alternatives_failed', 60000, 'All alternative methods failed, falling back to original error');
      }

      // If we still have a response, try to read body for more details and throw
      if (response) {
        let errorBody = '';
        try {
          errorBody = await response.text();
          logger.debug('Error response body:', errorBody);
        } catch (e) {
          logger.debug('Could not read error response body');
        }
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.response = response;
        error.body = errorBody;
        throw error;
      } else {
        // No response case (timeout/network) after fallbacks
        throw new Error('Primary request failed without response');
      }
    }

    // Success path
    _recordSuccess();
    const body = await response.text();
    logger.debug('Request successful, body length:', body.length);
    return body;
  } catch (error) {
    logger.error('Request error details:', error.message);
    logger.debug('Error stack:', error.stack);
    throw error;
  }
};

const LOOKUP_URL = 'https://itunes.apple.com/lookup';

function lookup(ids, idField, country, lang, requestOptions, limit) {
  idField = idField || 'id';
  country = country || 'us';
  const langParam = lang ? `&lang=${lang}` : '';
  const joinedIds = ids.join(',');
  const url = `${LOOKUP_URL}?${idField}=${joinedIds}&country=${country}&entity=software${langParam}`;
  return doRequest(url, {}, requestOptions, limit)
    .then(JSON.parse)
    .then((res) => res.results.filter(function (app) {
      return typeof app.wrapperType === 'undefined' || app.wrapperType === 'software';
    }))
    .then((res) => res.map(cleanApp));
}

function storeId(countryCode) {
  const markets = c.markets;
  const defaultStore = '143441';
  return (countryCode && markets[countryCode.toUpperCase()]) || defaultStore;
}

module.exports = { cleanApp, lookup, request: doRequest, storeId, configure };
