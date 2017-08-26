const express = require('express');
const Location = require('../models/location');

const router = express.Router();

router.get('/', (req, res, next) => {
	Location.getAllLocations()
		.then((locations) => {
			res.status(200)
				.json(locations);
		})
		.catch(err => next(err));
});
router.get('/:id', (req, res, next) => {
	Location.getLocationById(req.params.id)
		.then((location) => {
			res.status(200)
				.json(location);
		})
		.catch(err => next(err));
});
router.post('/', (req, res, next) => {
	const userData = {
		userId: req.decoded.id,
		userLng: req.body.userLng,
		userLat: req.body.userLat,
	};
	const newLocation = new Location(userData);
	newLocation.saveLocation()
		.then(() => {
			res.json(newLocation);
		})
		.catch(err => next(err));
});


module.exports = router;
