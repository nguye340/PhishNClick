// seedPopups.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Popup from '../models/popup.model.js'; // Assuming your model is in '../models/popup.model.js'

// Import all your individual seed data arrays
import adwareMalwarePopups from './adware_malware.js';
import becFraudPopups from './bec_fraud.js';
import benignNeutralPopups from './benign_notification.js';
import brandImpersonationPopups from './brand_impersonation.js';
import credentialHarvestingPopups from './credential_harvesting.js';
import prizeRewardPopups from './prize_reward.js';
import securityWarningPopups from './security_warning.js';
import subscriptionScamPopups from './subscription_scam.js';
import techSupportScamPopups from './tech_support_scam.js';

dotenv.config(); // Load environment variables from .env file

const seedPopups = async () => {
  try {
    console.log('Connecting to database...');
    // Connect to MongoDB using the URI from your .env file
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, // Recommended options for mongoose 6.x and higher
      useUnifiedTopology: true, // are true by default, but explicit for clarity
    });
    console.log('Successfully connected to MongoDB.');

    // Clear existing popups to prevent duplicates on successive runs
    console.log('Clearing existing popups...');
    await Popup.deleteMany({});
    console.log('Existing popups cleared.');

    // Combine all individual popup arrays into one large array
    const allPopupsToSeed = [
      ...adwareMalwarePopups,
      ...becFraudPopups,
      ...benignNeutralPopups,
      ...brandImpersonationPopups, // Ensure this array exists or handle its absence
      ...credentialHarvestingPopups,
      ...prizeRewardPopups,
      ...securityWarningPopups,
      ...subscriptionScamPopups,
      ...techSupportScamPopups,
      // Add any other popup arrays here as you create them
    ];

    // Insert all combined popups into the database
    console.log(`Seeding ${allPopupsToSeed.length} new popups...`);
    await Popup.insertMany(allPopupsToSeed);
    console.log(`Successfully seeded ${allPopupsToSeed.length} popups!`);

    // Exit the process
    // process.exit(0);
  } catch (error) {
    console.error('Error seeding popups:', error);
    // Exit with an error code if something went wrong
    process.exit(1);
  } finally {
    // Ensure the MongoDB connection is closed even if there's an error
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
};

// If you want to run this script directly, call the function:
export default seedPopups;

// If you intend to import this function into another script (e.g., your main app.js for a dev environment),
// you can export it like this:
// export default seedPopups;





// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import Popup from '../models/popup.model.js';
// import fs from 'fs/promises';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// // Load environment variables
// dotenv.config();

// const seedPopups = async () => {
//   try {
//     console.log('Seeding popups...');
//     const filePath = path.join(__dirname, 'seedSamples.json');
//     const jsonData = await fs.readFile(filePath, 'utf-8');

//     const popups = JSON.parse(jsonData);

//     await mongoose.connect(process.env.MONGO_URI);
//     await Popup.deleteMany(); // Optional: Clear old data
//     await Popup.insertMany(popups);
//     console.log('Popups seeded successfully!');
//     process.exit();
//   } catch (error) {
//     console.error('Error seeding popups:', error);
//     process.exit(1);
//   }
// };

// export default seedPopups;
