import express from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { getUsers, deleteUser, getProfile } from '../controllers/user.controller.js';


const router = express.Router();

router.get("/", verifyToken, verifyRole("admin"), getUsers);
router.delete("/:id", verifyToken, verifyRole("admin"), deleteUser);
router.get("/profile", verifyToken, getProfile);
router.post("/profile", verifyToken, getProfile);

export default router;