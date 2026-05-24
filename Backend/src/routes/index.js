import express from 'express';
import { getHealth, handleLogin, notFound } from '../controllers/healthController.js';
import { strictLimiter } from '../middleware/security.js';

const router = express.Router();

// Health check endpoint
router.get('/', getHealth);

// Login endpoint with strict rate limiting
router.post('/login', strictLimiter, handleLogin);

// 404 handler - must be last
router.use(notFound);

export default router;
