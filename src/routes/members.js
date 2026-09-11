import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import * as controller from '../controllers/membersController.js';

const router = Router();

router.get('/', asyncHandler(controller.listMembers));
router.get('/:id/loans', asyncHandler(controller.memberHistory));
router.get('/:id', asyncHandler(controller.getMember));
router.post('/', asyncHandler(controller.createMember));
router.put('/:id', asyncHandler(controller.updateMember));
router.delete('/:id', asyncHandler(controller.deleteMember));

export default router;