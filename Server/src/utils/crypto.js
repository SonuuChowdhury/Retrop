import eciesjs from 'eciesjs';
const { encrypt } = eciesjs;
import { logger } from './logger.js';

// Pre-generated ECC Public Key (corresponds to private key on the client app)
let rawKey = process.env.ECC_PUBLIC_KEY;
if (!rawKey || rawKey.trim() === '' || rawKey === 'undefined') {
  rawKey = '0216c2c74ee2e9f6eb93c95293c37b38438bcd870701c7cc06695042a10b3138ba';
}
const ECC_PUBLIC_KEY = rawKey.trim();

/**
 * Encrypts the server URL and product key into a Base64-encoded ECIES ciphertext.
 * Uses the default secp256k1 curve.
 * 
 * @param {string} serverUrl 
 * @param {string} productKey 
 * @returns {string} Base64 ciphertext
 */
export function encryptSetupPayload(serverUrl, productKey) {
  try {
    const payload = JSON.stringify([serverUrl.trim(), productKey.trim()]);
    const payloadBuffer = Buffer.from(payload, 'utf8');
    const pkBuffer = Buffer.from(ECC_PUBLIC_KEY, 'hex');

    const ciphertext = encrypt(pkBuffer, payloadBuffer);
    return Buffer.from(ciphertext).toString('base64');
  } catch (err) {
    logger.error('Failed to encrypt setup payload via ECIES', err.message);
    throw err;
  }
}

