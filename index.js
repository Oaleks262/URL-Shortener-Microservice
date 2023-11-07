const express = require('express');
const dns = require('dns');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

// Connect to your MongoDB database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const { Schema } = mongoose;

// Create a URL model
const urlSchema = new Schema({
  original_url: String,
  short_url: Number,
});
const Url = mongoose.model('Url', urlSchema);

// Utility function to generate a short URL
async function generateShortUrl() {
  const urlCount = await Url.countDocuments();
  return urlCount + 1;
}

// Utility function to validate URLs
function isValidURL(string) {
  const regex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([/\w\.-]*)*\/?$/;
  return regex.test(string);
}

// Serve the HTML form
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

// Handle URL shortening
app.post('/api/shorturl/new', async (req, res) => {
  const originalUrl = req.body.url;

  // Check if the URL is valid
  if (!isValidURL(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // Check if the URL is already in the database
    const existingUrl = await Url.findOne({ original_url: originalUrl });
    if (existingUrl) {
      return res.json({ original_url: existingUrl.original_url, short_url: existingUrl.short_url });
    }

    // Generate a new short URL
    const short_url = await generateShortUrl();

    // Create a new URL document
    const newUrl = new Url({ original_url, short_url });

    // Save it to the database
    await newUrl.save();

    return res.json({ original_url: newUrl.original_url, short_url: newUrl.short_url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'server error' });
  }
});

// Redirect to the original URL
app.get('/api/shorturl/:short_url', async (req, res) => {
  const short_url = req.params.short_url;

  try {
    // Find the URL document by short URL
    const url = await Url.findOne({ short_url });

    if (!url) {
      return res.json({ error: 'short url not found' });
    }

    res.redirect(url.original_url);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'server error' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
