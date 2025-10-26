import User from "../models/user.model.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getUsers = async (req, res) => 
{
    try
    {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const total = await User.countDocuments();
        const users = await User.find().skip(skip).limit(limit).select("-password_hash"); // -password_hash means exclude password_hash from the response to the frontend
        return res.status(200).json({ 
            users, total, totalPages: Math.ceil(total / limit), currentPage: page 
        }); 
    }
    catch (error)
    {
        console.error("Error fetching user:", error);
        return res.status(500).json({ error: error.message });
    }
}

export const getFirstUser = async (req, res) => 
{
    try
    {
        const user = await User.findOne().select("-password_hash");
        if (!user)
        {
            return res.status(404).json({ error: "No users found" });
        }
        return res.status(200).json(user);
    }
    catch (error)
    {
        console.error("Error fetching first user:", error);
        return res.status(500).json({ error: error.message });
    }
}

export const deleteUser = async (req, res) => 
{
    try
    {
        const { id } = req.params;
        const user = await User.findByIdAndDelete(id);
        if (!user)
        {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json({ message: "User deleted successfully" });
    }
    catch (error)
    {
        console.error("Error deleting user:", error);
        return res.status(500).json({ error: error.message });
    }
}

export const getProfile = async (req, res) => 
{
    try
    {
        // Get the user ID from the authenticated token (set by middleware)
        const userId = req.user.id;
        console.log('Getting profile for user ID:', userId);
        
        const user = await User.findById(userId).select("-password_hash");
        if (!user)
        {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Return consistent format with name field matching auth responses
        return res.status(200).json({
            id: user._id,
            name: user.username,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
    catch (error)
    {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ error: error.message });
    }
}

export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // SECURITY: Validate file signature (magic numbers) to prevent malware
        const fileBuffer = fs.readFileSync(req.file.path);
        const { validateFileSignature } = await import('../config/upload.config.js');
        const actualFileType = validateFileSignature(fileBuffer);
        
        if (!actualFileType) {
            // File signature doesn't match any allowed image type - potential malware
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ 
                error: "Invalid file format. File signature verification failed." 
            });
        }

        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            // Clean up uploaded file if user not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: "User not found" });
        }

        // Delete old profile picture if it exists
        if (user.profilePicture) {
            const oldPicturePath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(oldPicturePath)) {
                fs.unlinkSync(oldPicturePath);
            }
        }

        // Store relative path from backend root
        const relativePath = `/uploads/profiles/${req.file.filename}`;
        user.profilePicture = relativePath;
        await user.save();

        return res.status(200).json({
            message: "Profile picture uploaded successfully",
            profilePicture: relativePath
        });
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error("Error uploading profile picture:", error);
        return res.status(500).json({ error: error.message });
    }
}