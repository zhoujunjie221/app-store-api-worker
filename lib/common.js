'use strict';

const debug = require('debug')('app-store-scraper');
const c = require('./constants');

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

function cleanApp (app) {
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

// Alternative request function using different approach
const doRequestAlternative = async (url, headers, requestOptions, limit) => {
  console.log('Trying alternative request method for:', url);

  // Try using a simple fetch with minimal headers
  const simpleHeaders = {
    'User-Agent': 'curl/7.68.0',
    'Accept': '*/*'
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: simpleHeaders,
      cf: {
        // Cloudflare-specific options to bypass some restrictions
        cacheEverything: false,
        cacheTtl: 0
      }
    });

    if (response.ok) {
      const body = await response.text();
      console.log('Alternative request successful');
      return body;
    }

    throw new Error(`Alternative request failed: ${response.status}`);
  } catch (error) {
    console.log('Alternative request also failed:', error.message);
    throw error;
  }
};

// Fetch-based request function with fallback
const doRequest = async (url, headers, requestOptions, limit) => {
  console.log('Making request to:', url);
  console.log('Request headers:', headers);

  // Default headers to mimic iTunes application requests
  const defaultHeaders = {
    'User-Agent': 'iTunes/12.12.0 (Macintosh; OS X 10.15.7) AppleWebKit/605.1.15',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-us',
    'Accept-Encoding': 'gzip, deflate, br',
    'X-Apple-Store-Front': '143441-1,29',
    'X-Apple-Tz': '28800',
    'X-Apple-Request-UUID': crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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

  console.log('Final fetch options:', JSON.stringify(fetchOptions, null, 2));

  try {
    let response;
    if (limit) {
      throttler.configure({
        requests: limit,
        milliseconds: 1000
      });
      response = await throttler.throttledFetch(url, fetchOptions);
    } else {
      response = await fetch(url, fetchOptions);
    }

    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // If primary request fails with 403, try alternative method
      if (response.status === 403) {
        console.log('Primary request blocked, trying alternative method...');
        try {
          return await doRequestAlternative(url, headers, requestOptions, limit);
        } catch (altError) {
          console.log('Alternative method also failed, falling back to original error');
        }
      }

      // Try to get response body for more details
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.log('Error response body:', errorBody);
      } catch (e) {
        console.log('Could not read error response body');
      }

      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.response = response;
      error.body = errorBody;
      throw error;
    }

    const body = await response.text();
    console.log('Request successful, body length:', body.length);
    return body;
  } catch (error) {
    console.error('Request error details:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

const LOOKUP_URL = 'https://itunes.apple.com/lookup';

function lookup (ids, idField, country, lang, requestOptions, limit) {
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

function storeId (countryCode) {
  const markets = c.markets;
  const defaultStore = '143441';
  return (countryCode && markets[countryCode.toUpperCase()]) || defaultStore;
}

module.exports = { cleanApp, lookup, request: doRequest, storeId };
