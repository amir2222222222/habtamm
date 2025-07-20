const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const asyncHandler = require("../Utils/AsyncHandler");
const { user } = require("../Middleware/AuthMiddleware");
// Constants
const VOICE_FOLDER = path.join(__dirname, '..', 'public', 'mp3');
const defaultPatterns = ['h', 'v', 'd', 'sc', 'lc'];
const defaultVoiceType = 'Recommended_Black_Male_Voice';
const defaultGameSpeed = 5;

// Helpers
function getVoiceOptions() {
  try {
    return fs.readdirSync(VOICE_FOLDER).filter(file =>
      fs.statSync(path.join(VOICE_FOLDER, file)).isDirectory()
    );
  } catch (err) {
    console.error('Failed to read voice folders:', err);
    return [];
  }
}

// GET /setting
router.get('/setting', user, asyncHandler(async (req, res) => {
  const voiceType = req.cookies.Voice || defaultVoiceType;
  const gameSpeed = req.cookies.Speed || defaultGameSpeed;
  const patterns = req.cookies.Patterns ? JSON.parse(req.cookies.Patterns) : defaultPatterns;
  const voiceOptions = getVoiceOptions();

  res.render('setting', {
    GameSpeed: gameSpeed,
    selectedVoice: voiceType,
    voiceOptions,
    checkedPatterns: patterns,
    patternLabels: {
      h: 'Horizontal',
      v: 'Vertical',
      d: 'Diagonal',
      sc: 'Small Corner',
      lc: 'Large Corner',
    },
  });
}));

// POST /save-speed
router.post('/save-speed', user, asyncHandler(async (req, res) => {
  const newSpeed = req.body.speed || defaultGameSpeed;

  res.cookie('Speed', newSpeed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.redirect('/setting');
}));

// POST /save-voice
router.post('/save-voice', user, asyncHandler(async (req, res) => {
  const newVoice = req.body.voice || defaultVoiceType;

  res.cookie('Voice', newVoice, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.redirect('/setting');
}));

// POST /save-patterns
router.post('/save-patterns', user, asyncHandler(async (req, res) => {
  const inputPattern = req.body.pattern;
  const newPatterns = inputPattern
    ? Array.isArray(inputPattern)
      ? inputPattern
      : [inputPattern]
    : defaultPatterns;

  res.cookie('Patterns', JSON.stringify(newPatterns), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.redirect('/setting');
}));

module.exports = router;                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                             
                                                                                                                               
                                                                                                                     
                                                                                                                                                                                           