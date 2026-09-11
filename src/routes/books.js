import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as controller from '../controllers/booksController.js';

const router = Router();

router.get('/', asyncHandler(controller.listBooks));
router.get('/:id', asyncHandler(controller.getBook));
router.post('/', asyncHandler(controller.createBook));
router.put('/:id', asyncHandler(controller.updateBook));
router.delete('/:id', asyncHandler(controller.deleteBook));

export default router;