// routes/scoreRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');

const DB_PATH = path.join(__dirname, '../data/db.json');
const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// Post Score
router.post('/', authMiddleware, (req, res) => {
  const { score, game } = req.body;
  const { username } = req.user;
  const db = readDB();

  const userIndex = db.users.findIndex(u => u.username === username);
  if (userIndex !== -1) {
    db.users[userIndex].score += score;
    // Also track high scores for specific games
    db.scores.push({ username, score, game, date: new Date().toISOString() });
    writeDB(db);
    res.json({ message: 'Score updated', totalScore: db.users[userIndex].score });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Get Leaderboard
router.get('/leaderboard', (req, res) => {
  const db = readDB();
  const topUsers = db.users
    .map(({ username, score, color }) => ({ username, score, color }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  
  res.json(topUsers);
});

module.exports = router;
