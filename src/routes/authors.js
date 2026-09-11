import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as controller from '../controllers/authorsController.js';

const router = Router();

router.get('/', asyncHandler(controller.listAuthors));
router.get('/:id', asyncHandler(controller.getAuthor));
router.post('/', asyncHandler(controller.createAuthor));
router.put('/:id', asyncHandler(controller.updateAuthor));
router.delete('/:id', asyncHandler(controller.deleteAuthor));

export default router;