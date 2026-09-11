import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as controller from '../controllers/loansController.js';

const router = Router();

router.get('/', asyncHandler(controller.listLoans));
router.get('/current', asyncHandler(controller.currentLoans));
router.get('/overdue', asyncHandler(controller.overdueLoans));
router.post('/', asyncHandler(controller.createLoan));
router.patch('/:id/return', asyncHandler(controller.returnLoan));

export default router;