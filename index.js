require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ObjectId } = require('mongodb'); // Added ObjectId
const dns = require('dns');
const urlparser = require('url');

const client = new MongoClient(process.env.DB_URL);
const db = client.db("urlshortener");
const urls = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async function(req, res) {
  const url = req.body.url;
  const dnslookup = dns.lookup(urlparser.parse(url).hostname, async (err, address) => {
    if (!address) {
      res.json({ error: "Invalid URL" });
    } else {
      const urlCount = await urls.countDocuments({});
      const urlDoc = {
        url,
        short_url: urlCount + 1 // Increment the count for the next short URL
      };
      const result = await urls.insertOne(urlDoc);
      console.log(result);
      res.json({ original_url: url, short_url: urlCount + 1 });
    }
  });
});

// GET endpoint for retrieving the original URL from short URL
app.get("/api/shorturl/:short_url", async (req, res) => {
  const shorturl = req.params.short_url;
  const urlDoc = await urls.findOne({ short_url: +shorturl });
  if (!urlDoc) {
    res.status(404).json({ error: "Short URL not found" });
  } else {
    res.redirect(urlDoc.url);
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
