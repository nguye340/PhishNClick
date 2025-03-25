const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection (uncomment when ready to connect to a database)
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => console.log('MongoDB connection established'))
//   .catch(err => console.log('MongoDB connection error:', err));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'PhishNClick API is running' });
});

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
