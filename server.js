const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const multer = require('multer');

const app = express();
const PORT = 3000;

// ------------------ MongoDB Connection ------------------
mongoose.connect(
  "mongodb+srv://celciadas8:LostFound2026@cluster0.t5p3je2.mongodb.net/lostandfound?retryWrites=true&w=majority"
)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log(err));

// ------------------ Middleware ------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));
app.use('/uploads', express.static('uploads'));

// ------------------ Multer Setup ------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ------------------ Models ------------------
const LostItem = mongoose.model("LostItem", {
  itemName: String,
  description: String,
  location: String,
  date: String,
  contact: String
});

const FoundItem = mongoose.model("FoundItem", {
  itemName: String,
  description: String,
  location: String,
  date: String,
  contact: String,
  image: String
});

// ------------------ Routes ------------------

// Lost page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'lost.html'));
});

// Found page
app.get('/found', (req, res) => {
  res.sendFile(path.join(__dirname, 'found.html'));
});

// ------------------ LOST SUBMISSION ------------------
app.post('/lost', async (req, res) => {
  const { itemName, description, location, date, contact } = req.body;

  // Save lost item
  await new LostItem({
    itemName: itemName.trim().toLowerCase(),
    description,
    location,
    date,
    contact
  }).save();

  // 🔑 MATCH ONLY BY ITEM NAME
  const keyword = itemName.trim().toLowerCase();

  const matches = await FoundItem.find({
    itemName: { $regex: keyword, $options: 'i' }
  });

  console.log("🔍 Searching for:", keyword);
  console.log("📦 Matches found:", matches.length);

  // ------------------ RESULT PAGE ------------------
  let html = `
  <html>
  <head>
    <link rel="stylesheet" href="/style.css">
  </head>
  <body>
    <div class="container">
      <h1>${matches.length > 0 ? "🔍 Possible Matches Found" : "😔 No Match Yet"}</h1>
  `;

  if (matches.length > 0) {
    matches.forEach(item => {
      html += `
      <div class="matches-wrapper">
        <div class="match-card">
          <img src="/uploads/${item.image}" class="match-image">
          <p><b>Item:</b> ${item.itemName}</p>
          <p><b>Description:</b> ${item.description}</p>
          <p><b>Found at:</b> ${item.location}</p>
          <p><b>Contact:</b> ${item.contact}</p>
        </div>
        </div>
      `;
    });
  } else {
    html += `<p>Your lost item has been saved.</p>`;
  }

  html += `
      <a href="/">Back to Lost Form</a>
    </div>
  </body>
  </html>
  `;

  res.send(html);
});

// ------------------ FOUND SUBMISSION ------------------
app.post('/found', upload.single('image'), async (req, res) => {
  const { itemName, description, location, date, contact } = req.body;

  await new FoundItem({
    itemName: itemName.trim().toLowerCase(),
    description,
    location,
    date,
    contact,
    image: req.file.filename
  }).save();

  res.sendFile(path.join(__dirname, 'found-success.html'));
});

// ------------------ Server ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


