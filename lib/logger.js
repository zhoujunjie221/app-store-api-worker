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

const logger = {
  setLevel,
  getLevel: () => currentLevel,
  debug: (...args) => { if (shouldLog('debug')) console.debug(...args); },
  info: (...args) => { if (shouldLog('info')) console.info ? console.info(...args) : console.log(...args); },
  warn: (...args) => { if (shouldLog('warn')) console.warn(...args); },
  error: (...args) => { if (shouldLog('error')) console.error(...args); }
};

module.exports = logger;

