const express = require('express');
const EmptyLocation = require('../models/emptyLocation');

const router = express.Router();
// '/grid?lat=xxx&lng=xxx'
router.get('/', (req, res) => {
	const geoData = {
		lat: +req.query.lat,
		lng: +req.query.lng
	};
	const location = new EmptyLocation(geoData);
	res.json(location);
});

router.get('/loc-info', (req, res) => {
	const emptyLoc = new EmptyLocation({
		lat: req.query.lat,
		lng: req.query.lng
	});
	emptyLoc.isHighlighted = req.query.highlighted;
	emptyLoc.isCurrent = req.query.current;
	res.render('loc-info', {
		location: emptyLoc,
		isAdmin: req.decoded.isAdmin
	});
});

module.exports = router;
