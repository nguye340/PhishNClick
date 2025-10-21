import User from "../models/user.model.js";

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