import express from 'express';
import { createCategory, getCategories } from '../controllers/categories.js';
import { protect, authorize } from '../middleware/auth.js';
const router = express.Router();

router.route('/')
  .get(getCategories)
  .post(protect, authorize('seller'), createCategory);

export default router;

