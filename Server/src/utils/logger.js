import { SERVER_CONFIG } from '../config/constants.js';

const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
};

const colorize = (level) => {
  const colors = {
    INFO: '\x1b[36m',  // Cyan
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
    DEBUG: '\x1b[35m', // Magenta
    RESET: '\x1b[0m',
  };
  return colors[level] || '';
};

// Get IST timestamp (UTC+5:30)
const getISTTimestamp = () => {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  return istTime.toISOString().replace('Z', '+05:30');
};

export const logger = {
  info: (message, data = '') => {
    const timestamp = getISTTimestamp();
    console.log(`${colorize('INFO')}[${timestamp}] INFO${colorize('RESET')}: ${message}`, data);
  },

  warn: (message, data = '') => {
    const timestamp = getISTTimestamp();
    console.warn(`${colorize('WARN')}[${timestamp}] WARN${colorize('RESET')}: ${message}`, data);
  },

  error: (message, error = '') => {
    const timestamp = getISTTimestamp();
    console.error(`${colorize('ERROR')}[${timestamp}] ERROR${colorize('RESET')}: ${message}`, error);
  },

  debug: (message, data = '') => {
    if (SERVER_CONFIG.NODE_ENV === 'development') {
      const timestamp = getISTTimestamp();
      console.log(`${colorize('DEBUG')}[${timestamp}] DEBUG${colorize('RESET')}: ${message}`, data);
    }
  },
};