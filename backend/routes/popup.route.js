
import { Router } from 'express';
import { getAllPopups, getRandomPopup, createPopup, updatePopup, deletePopup, getPopupsByCategory, getPopupsByCategoryAndSubtype } from '../controllers/popup.controller.js';

import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, getAllPopups);
router.get('/random', getRandomPopup); // Removed auth for frontend access
// GET /api/popup/category/:categoryName
router.get('/category/:categoryName', getPopupsByCategory);
// GET /api/popup/category/:categoryName/:subtypeName
router.get('/category/:categoryName/:subtypeName', getPopupsByCategoryAndSubtype);

// For admin/dev use
router.post('/', auth, createPopup); 
router.put('/:id', auth, updatePopup); 
router.delete('/:id', auth, deletePopup); 


export default router;
