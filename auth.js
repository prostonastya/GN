'use strict';

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

router.use((req, res, next) => {
  const token = req.cookies || req.body.token || req.query.token || req.headers['x-access-token'];
  if (token.auth) {
    jwt.verify(token.auth, 'secret', (err, decoded) => {
      if (err) {
        res.redirect('/login');
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.redirect('/login');
  }
});

router.get('/', (req, res) => {
  res.render('main');
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth');
  res.redirect('/login');
});

module.exports = router;
