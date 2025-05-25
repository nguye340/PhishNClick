
import { Router } from 'express';
import { getAllPopups, getRandomPopup, createPopup, updatePopup, deletePopup } from '../controllers/popup.controller.js';

import auth from '../middleware/auth.js';

const router = Router();

router.get('/', auth, getAllPopups);
router.get('/random', auth, getRandomPopup);

// For admin/dev use
router.post('/', auth, createPopup); 
router.put('/:id', auth, updatePopup); 
router.delete('/:id', auth, deletePopup); 


export default router;
