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
	const userId = req.decoded.id;
	const locId = req.params.id;
	let isMaster;
	Location.getOwnerByLocId(locId)
		.then((data) => {
			if (data) {
				isMaster = data.user_id === userId;
			}
			return Location.getLocationById(req.params.id);
		})
		.then((location) => {
			if (location) {
				location.isMaster = isMaster;
			}
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
router.put('/:id/restore-population', (req, res, next) => {
	const userId = req.decoded.id;
	const locId = req.params.id;
	Location.getOwnerByLocId(locId)
		.then((data) => {
			if (data.user_id !== userId) {
				throw new Error('Permission denied!');
			}
			return Location.restoreLoyalPopulByLocId(locId);
		})
		.then(() => {
			res.sendStatus(200);
		})
		.catch((err) => {
			next(err);
		});
});


module.exports = router;
