import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getStatistics } from '../controllers/statisticsController.js';

const router = Router();
router.get('/', asyncHandler(getStatistics));

export default router;