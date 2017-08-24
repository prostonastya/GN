'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const url = require('url');

const router = express.Router();
const regexp = new RegExp(/^\/?api.*$/);

router.use((req, res, next) => {
  const token = req.cookies || req.body.token || req.query.token || req.headers['x-access-token'];
  if (req.url.match(regexp)) {
    if (token.auth) {
      jwt.verify(token.auth, 'secret', (err, decoded) => {
        if (err) {
          res.status(500).send('Internal Server Error');
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else res.status(401).send('UNAUTHORIZED');
  }
  if (!req.url.match(regexp)) {
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
  }
});

module.exports = router;
