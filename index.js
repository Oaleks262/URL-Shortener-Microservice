require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const shortid = require('shortid');
const dns = require('dns');

const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Database for storing shortened URLs
const urlDatabase = [];

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl/new', (req, res) => {
  const originalUrl = req.body.url;
  const id = shortid.generate();

  const urlRegex = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'invalid url' });
  }

  const urlObj = new URL(originalUrl);
  const host = urlObj.hostname;

  dns.lookup(host, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    urlDatabase.push({ short_url: id, original_url: originalUrl });

    res.json({ original_url: originalUrl, short_url: id });
  });
});

app.get('/api/shorturl/:id', (req, res) => {
  const id = req.params.id;
  const urlData = urlDatabase.find(item => item.short_url === id);

  if (urlData) {
    res.redirect(urlData.original_url);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
