// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

// Helper to read DB
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
// Helper to write DB
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// Register
router.post('/register', async (req, res) => {
  const { username, password, color } = req.body;
  const db = readDB();

  if (db.users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { username, password: hashedPassword, color, score: 0 };
  db.users.push(newUser);
  writeDB(db);

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { username, color, score: 0 } });
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = readDB();

  const user = db.users.find(u => u.username === username);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { username, color: user.color, score: user.score } });
});

module.exports = router;
