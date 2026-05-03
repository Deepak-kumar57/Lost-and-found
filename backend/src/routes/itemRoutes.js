import express from 'express';
import multer from 'multer';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createItem, listItems, getItem, updateItemStatus, smartSearch, deleteItem } from '../controllers/itemController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype?.startsWith('image/')) return cb(new Error('Only image uploads are allowed'));
    cb(null, true);
  }
});

function uploadImage(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large. Maximum size is 5MB.' : err.message;
    return res.status(400).json({ message });
  });
}

const router = express.Router();
router.get('/search', smartSearch);
router.get('/:type', listItems);
router.get('/:type/:id', getItem);
router.post('/:type', requireAuth, uploadImage, createItem);
router.patch('/:type/:id/status', requireAuth, requireAdmin, updateItemStatus);
router.delete('/:type/:id', requireAuth, requireAdmin, deleteItem);
export default router;
