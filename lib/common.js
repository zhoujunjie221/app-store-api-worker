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

// Fetch-based request function
const doRequest = async (url, headers, requestOptions, limit) => {
  console.log('Making request to:', url);
  console.log('Request headers:', headers);

  // Default headers to mimic a regular browser request
  const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  const finalHeaders = {
    ...defaultHeaders,
    ...headers
  };

  const fetchOptions = {
    method: 'GET',
    headers: finalHeaders,
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
