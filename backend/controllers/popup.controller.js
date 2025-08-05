
import mongoose from 'mongoose';
import Popup from '../models/popup.model.js';

export async function getAllPopups(req, res) {
  try {
    const popups = await Popup.find({});
    res.status(200).json({success: true, data: popups});
  } catch (err) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
}

export async function getRandomPopup(req, res) {
  try {
    console.log('Getting random popup...');
    
    // Use MongoDB's aggregate with $sample for better random selection
    const randomPopups = await Popup.aggregate([
      { $sample: { size: 1 } }
    ]);
    
    console.log('Random popups found:', randomPopups.length);
    
    if (randomPopups.length === 0) {
      return res.status(404).json({ success: false, error: "No popups found in database" });
    }
    
    const popup = randomPopups[0];
    console.log('Found popup:', popup ? 'Yes' : 'No');
    res.status(200).json({success: true, data: popup});
  } catch (err) {
    console.error('Error in getRandomPopup:', err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
}

export const createPopup = async (req, res) => {
  const popup = req.body;
 
  if (!popup.title || !popup.message || !popup.type) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }
  
  const newPopup = new Popup(popup);
  
  try {
    await newPopup.save();
    res.status(201).json({success: true, data: newPopup});
  } catch (err) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

export const updatePopup = async (req, res) => {
  const { id } = req.params;
  const popup = req.body;
 
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ success: false, error: "Invalid Popup ID" });
  }
  try {
    const updatedPopup = await Popup.findByIdAndUpdate(id, popup, { new: true });
    res.status(200).json({success: true, data: updatedPopup});
  } catch (err) {
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

export const deletePopup = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ success: false, error: "Invalid Popup ID" });
  }
  try {
    const popup = await Popup.findByIdAndDelete(id);
    res.status(200).json({success: true, data: popup, message: "Popup deleted successfully"});
  } catch (err) {
    console.log("Error deleting popup: ", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Function to get popups by category
export async function getPopupsByCategory(req, res) {
  try {
    const { categoryName } = req.params; // Get categoryName from URL parameters

    // Case-insensitive search for category
    const popups = await Popup.find({ category: { $regex: new RegExp(`^${categoryName}$`, 'i') } });

    if (popups.length === 0) {
      return res.status(404).json({ success: false, error: `No popups found for category: ${categoryName}` });
    }

    res.status(200).json({ success: true, data: popups });
  } catch (err) {
    console.error("Error getting popups by category:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
}

// Function to get popups by category and subcategory
export async function getPopupsByCategoryAndSubtype(req, res) {
  try {
    const { categoryName, subtypeName } = req.params; // Get categoryName and subtypeName from URL parameters

    // Case-insensitive search for both category and subtype
    const popups = await Popup.find({
      category: { $regex: new RegExp(`^${categoryName}$`, 'i') },
      subtype: { $regex: new RegExp(`^${subtypeName}$`, 'i') }
    });

    if (popups.length === 0) {
      return res.status(404).json({ success: false, error: `No popups found for category: ${categoryName} and subtype: ${subtypeName}` });
    }

    res.status(200).json({ success: true, data: popups });
  } catch (err) {
    console.error("Error getting popups by category and subtype:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
}
