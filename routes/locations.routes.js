const express = require('express');
const OccupiedLocation = require('../models/occupiedLocation');
const locAuth = require('../middleware/locAuth');
const sockets = require('../services/sockets');
const svgTemplate = require('../views/svg-tmpl');

const router = express.Router();

router.get('/', (req, res, next) => {
	OccupiedLocation.getAllLocations()
		.then((locations) => {
			locations.forEach((item) => {
				if (item.masterId === req.decoded.id) {
					item.isMaster = true;
				}
				// else {
				// 	item.dailyBank = undefined;
				// 	item.loyalPopulation = undefined;
				// 	item.dailyCheckin = undefined;
				// }
			});
			res.json(locations);
		})
		.catch(err => next(err));
});


// '/create?clicked=true'
router.get('/create', (req, res, next) => {
	const clicked = req.query.clicked;
	const isAdmin = req.decoded.isAdmin;

	if (clicked && !isAdmin) {
		next(new Error('Forbieden!'));
	}

	res.render('loc-form', {
		location: null,
		clicked: req.query.clicked,
		isAdmin: req.decoded.isAdmin
	});
});

router.post('/create', (req, res, next) => {
	const newLocationData = Object.assign({
		userId: req.decoded.id
	}, req.body);
	const newLocation = new OccupiedLocation(newLocationData);
	newLocation.saveLocation()
		.then((createdLocation) => {
			createdLocation.isMaster = true;
			res.json(createdLocation);
			sockets.sendMessage('update', {'masterName': createdLocation.masterName, 'locationName': createdLocation.locationName, 'dailyMessage': createdLocation.dailyMessage});
		})
		.catch(err => next(err));
});

router.get('/geo-json', (req, res, next) => {
	OccupiedLocation.getAllLocationsGeoJSON()
		.then((geoJSON) => {
			geoJSON.features.forEach((item) => {
				if (item.properties.info.masterId === req.decoded.id) {
					item.properties.info.isMaster = true;
				} else {
					item.properties.info.dailyBank = undefined;
				}
			});
			res.json(geoJSON);
		})
		.catch(err => next(err));
});
// '/check-location?lat=xxx&lng=xxx'
router.get('/check-location', (req, res, next) => {
	const geoData = {
		lat: +req.query.lat,
		lng: +req.query.lng
	};
	OccupiedLocation.checkLocationOnCoords(geoData)
		.then((locationObj) => {
			if (locationObj.masterId === req.decoded.id) {
				locationObj.isMaster = true;
			}
			// else {
			// 	locationObj.dailyCheckin = undefined;
			// 	locationObj.dailyBank = undefined;
			// 	locationObj.loyalPopulation = undefined;
			// }
			console.log(JSON.stringify(locationObj));
			res.json(locationObj);
		})
		.catch((err) => {
			next(err);
		});
});

router.use('/:id', locAuth);

router.get('/:id', (req, res) => {
	res.json(req.reqLocation);
});

router.get('/:id/svg', (req, res) => {
	res.set('Content-Type', 'image/svg+xml')
		.send(svgTemplate(req.reqLocation));
});

router.put('/:id', (req, res, next) => {
	if (req.reqLocation.isMaster || req.decoded.isAdmin) {
		const editedLocation = Object.assign(req.reqLocation, req.body);

		editedLocation.editLocation()
			.then(() => {
				res.sendStatus(200);
			})
			.catch((err) => {
				next(err);
			});
	} else {
		next(new Error('No such rights!'));
	}
});

// '/:id/loc-info?current=xxx&highlighted=xxx'
router.get('/:id/loc-info', (req, res) => {
	req.reqLocation.isHighlighted = req.query.highlighted;
	req.reqLocation.isCurrent = req.query.current;
	res.render('loc-info', {
		location: req.reqLocation,
		isAdmin: req.decoded.isAdmin
	});
});

router.delete('/:id', (req, res, next) => {
	if (req.reqLocation.isMaster || req.decoded.isAdmin) {
		req.reqLocation.deleteLocation()
			.then(() => {
				res.sendStatus(200);
			})
			.catch((err) => {
				next(err);
			});
	} else {
		next(new Error('No such rights!'));
	}
});

router.put('/:id/do-checkin', (req, res, next) => {
	if ((req.reqLocation.userIsThere && req.reqLocation.isMaster) ||
		(req.decoded.isAdmin && req.reqLocation.isMaster)) {
		req.reqLocation.doCheckin()
			.then(() => {
				res.sendStatus(200);
			})
			.catch((err) => {
				next(err);
			});
	} else {
		next(new Error('You must be master or be there!'));
	}
});

router.put('/:id/get-bank', (req, res, next) => {
	if (req.reqLocation.userIsThere && req.reqLocation.isMaster) {
		req.reqLocation.takeDailyBank()
			.then(() => {
				res.sendStatus(200);
			})
			.catch((err) => {
				next(err);
			});
	} else {
		next(new Error('You must be master or be there!'));
	}
});

router.put('/:id/restore-population', (req, res, next) => {
	if (req.reqLocation.isMaster || req.decoded.isAdmin) {
		req.reqLocation.restoreLoyalPopulation()
			.then(() => {
				res.sendStatus(200);
			})
			.catch((err) => {
				next(err);
			});
	} else {
		next(new Error('No such rights!'));
	}
});

module.exports = router;
