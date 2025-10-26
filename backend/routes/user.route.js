import express from 'express';
import { verifyToken, verifyRole } from '../middleware/auth.middleware.js';
import { getUsers, getFirstUser, deleteUser, getProfile, uploadProfilePicture } from '../controllers/user.controller.js';
import { uploadProfilePicture as upload } from '../config/upload.config.js';

const router = express.Router();

router.get("/", verifyToken, verifyRole("admin"), getUsers);
router.get("/first", getFirstUser); // No auth required - for telemetry fallback
router.delete("/:id", verifyToken, verifyRole("admin"), deleteUser);
router.get("/profile", verifyToken, getProfile);
router.post("/profile", verifyToken, getProfile);
router.post("/profile/picture", verifyToken, upload.single('profilePicture'), uploadProfilePicture);

export default router;