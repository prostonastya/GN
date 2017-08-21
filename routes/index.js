let express = require('express');
let router = express.Router();
let db = require('../queries');

router.get('/api/locations', db.getLocations);
router.get('/api/locations/:id', db.getSingleLocation);

module.exports = router;