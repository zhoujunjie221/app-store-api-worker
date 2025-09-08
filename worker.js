'use strict';

import store from './index.js';

// API key validation middleware
function validateApiKey(request, env) {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey || apiKey !== env.API_KEY) {
    console.warn('[Auth] API key validation failed', JSON.stringify({
      hasApiKey: !!apiKey,
      reason: !apiKey ? 'missing' : 'invalid',
      ua: request.headers.get('user-agent') || '',
      ip: request.headers.get('cf-connecting-ip') || '',
      country: request.headers.get('cf-ipcountry') || ''
    }));
    return new Response(JSON.stringify({
      error: 'Unauthorized - Invalid API Key'
    }), {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
      }
    });
  }

  return null;
}

// CORS headers helper
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key'
  };
}
// Logging helpers
function getRequestContext(request) {
  const h = request.headers;
  return {
    url: request.url,
    method: request.method,
    headers: {
      'user-agent': h.get('user-agent') || '',
      'accept': h.get('accept') || '',
      'cf-connecting-ip': h.get('cf-connecting-ip') || '',
      'cf-ipcountry': h.get('cf-ipcountry') || ''
    }
  };
}

function logRouteError(route, request, error, details) {
  try {
    const context = getRequestContext(request);
    const payload = {
      route,
      error: {
        message: error && error.message ? error.message : String(error),
        name: error && error.name ? error.name : 'Error'
      },
      context,
      details: details || null
    };
    console.error('[RouteError]', JSON.stringify(payload));
  } catch (e) {
    // Fallback logging
    console.error('Route error:', route, error);
  }
}

// Error response helper
function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders()
    }
  });
}

// Success response helper
function successResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders()
    }
  });
}

// URL pattern matching helper
function matchRoute(url, pattern) {
  const urlParts = url.pathname.split('/').filter(Boolean);
  const patternParts = pattern.split('/').filter(Boolean);

  if (urlParts.length !== patternParts.length) {
    return null;
  }

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].slice(1);
      params[paramName] = urlParts[i];
    } else if (patternParts[i] !== urlParts[i]) {
      return null;
    }
  }

  return params;
}

// Route handlers
async function handleAppRoute(request, params) {
  try {
    console.log('Requesting app with id:', params.id);
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const result = await store.app({ id: params.id, ...queryParams });
    return successResponse(result);
  } catch (error) {
    logRouteError('GET /app/:id', request, error, { params });

    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error && typeof error.message === 'string') {
      errorMessage = error.message;
      if (error.message.includes('404') || error.message.includes('not found')) {
        statusCode = 404;
      }
    }

    return errorResponse(errorMessage, statusCode);
  }
}

async function handleListRoute(request, params) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    // Preprocess parameters: convert number types
    const processedParams = {
      collection: params.collection,
      ...queryParams
    };

    // Explicitly convert number parameters
    if (processedParams.category) processedParams.category = Number(processedParams.category);
    if (processedParams.num) processedParams.num = Number(processedParams.num);

    const result = await store.list(processedParams);
    return successResponse(result);
  } catch (error) {
    logRouteError('GET /list/:collection', request, error, { params });
    return errorResponse(error.message);
  }
}

async function handleSearchRoute(request) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const result = await store.search(queryParams);
    return successResponse(result);
  } catch (error) {
    logRouteError('GET /search', request, error);
    return errorResponse(error.message);
  }
}

async function handleDeveloperRoute(request, params) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const result = await store.developer({ devId: params.devId, ...queryParams });
    return successResponse(result);
  } catch (error) {
    logRouteError('GET /developer/:devId', request, error, { params });
    const statusCode = error.message.includes('404') ? 404 : 500;
    return errorResponse(error.message, statusCode);
  }
}

async function handlePrivacyRoute(request, params) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const result = await store.privacy({ id: params.id, ...queryParams });
    return successResponse(result);
  } catch (error) {
    logRouteError('GET /privacy/:id', request, error, { params });
    const statusCode = error.message.includes('404') ? 404 : 500;
    return errorResponse(error.message, statusCode);
  }
}

async function handleReviewsRoute(request, params) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const result = await store.reviews({ id: params.id, ...queryParams });
    return successResponse(result);
  } catch (error) {
    logRouteError('GET /reviews/:id', request, error, { params });
    return errorResponse(error.message);
  }
}

async function handleSimilarRoute(request, params) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const result = await store.similar({ id: params.id, ...queryParams });
    return successResponse(result);
  } catch (error) {
    logRouteError('GET /similar/:id', request, error, { params });
    return errorResponse(error.message);
  }
}

async function handleVersionHistoryRoute(request, params) {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);
    const result = await store.versionHistory({ id: params.id, ...queryParams });
    return successResponse(result);
  } catch (error) {
    logRouteError('GET /version-history/:id', request, error, { params });
    const statusCode = error.message.includes('404') ? 404 : 500;
    return errorResponse(error.message, statusCode);
  }
}

// Main request handler
export default {
  async fetch(request, env, _ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: getCorsHeaders()
      });
    }

    // Validate API key
    const authError = validateApiKey(request, env);
    if (authError) {
      return authError;
    }

    const url = new URL(request.url);

    // Route matching
    let params;

    // GET /app/:id
    if ((params = matchRoute(url, '/app/:id'))) {
      return handleAppRoute(request, params);
    }

    // GET /list/:collection
    if ((params = matchRoute(url, '/list/:collection'))) {
      return handleListRoute(request, params);
    }

    // GET /search
    if (url.pathname === '/search') {
      return handleSearchRoute(request);
    }

    // GET /developer/:devId
    if ((params = matchRoute(url, '/developer/:devId'))) {
      return handleDeveloperRoute(request, params);
    }

    // GET /privacy/:id
    if ((params = matchRoute(url, '/privacy/:id'))) {
      return handlePrivacyRoute(request, params);
    }

    // GET /reviews/:id
    if ((params = matchRoute(url, '/reviews/:id'))) {
      return handleReviewsRoute(request, params);
    }

    // GET /similar/:id
    if ((params = matchRoute(url, '/similar/:id'))) {
      return handleSimilarRoute(request, params);
    }

    // GET /version-history/:id
    if ((params = matchRoute(url, '/version-history/:id'))) {
      return handleVersionHistoryRoute(request, params);
    }

    // 404 for unmatched routes
    return errorResponse('Not Found', 404);
  }
};
