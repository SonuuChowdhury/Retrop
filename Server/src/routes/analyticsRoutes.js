// ============================================================================
// ANALYTICS ROUTES (/api/analytics/*)
// ============================================================================

import express from 'express';
import { trackHit, heartbeat, getSummary } from '../controllers/analyticsController.js';

const router = express.Router();

router.post('/track', trackHit);
router.post('/heartbeat', heartbeat);
router.get('/summary', getSummary);

export default router;
