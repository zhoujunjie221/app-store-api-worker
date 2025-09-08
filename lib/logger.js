'use strict';

// Simple logger with levels: error < warn < info < debug
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

let currentLevel = (globalThis && globalThis.LOG_LEVEL)
  ? String(globalThis.LOG_LEVEL).toLowerCase()
  : 'warn';

function isValidLevel(level) {
  return typeof level === 'string' && Object.prototype.hasOwnProperty.call(LEVELS, level.toLowerCase());
}

function setLevel(level) {
  if (isValidLevel(level)) {
    currentLevel = level.toLowerCase();
  }
}

function shouldLog(level) {
  return LEVELS[level] <= LEVELS[currentLevel];
}

// Simple in-memory throttle for repeated warnings
const throttleBuckets = new Map();
function warnThrottled(key, windowMs, ...args) {
  if (!shouldLog('warn')) return;
  const now = Date.now();
  const bucket = throttleBuckets.get(key) || { last: 0, suppressed: 0 };
  if (now - bucket.last >= windowMs) {
    const suffix = bucket.suppressed ? ` (suppressed ${bucket.suppressed} similar logs)` : '';
    console.warn(...args, suffix);
    bucket.last = now;
    bucket.suppressed = 0;
    throttleBuckets.set(key, bucket);
  } else {
    bucket.suppressed += 1;
    throttleBuckets.set(key, bucket);
  }
}

const logger = {
  setLevel,
  getLevel: () => currentLevel,
  debug: (...args) => { if (shouldLog('debug')) console.debug(...args); },
  info: (...args) => { if (shouldLog('info')) (console.info ? console.info : console.log)(...args); },
  warn: (...args) => { if (shouldLog('warn')) console.warn(...args); },
  warnThrottled,
  error: (...args) => { if (shouldLog('error')) console.error(...args); }
};

module.exports = logger;

