const OccupiedLocation = require('../models/occupiedLocation');

module.exports = (req, res, next) => {
	OccupiedLocation.getLocationById(req.params.id)
		.then((foundLocation) => {
			if (foundLocation.masterId === req.decoded.id) {
				foundLocation.isMaster = true;
				if (req.body.userGeoData) {
					OccupiedLocation.checkLocationOnCoords(req.body.userGeoData)
						.then((checkedLocation) => {
							if (foundLocation.locationId === checkedLocation.locationId) {
								foundLocation.userIsThere = true;
							}
							req.reqLocation = foundLocation;
							next();
						});
				} else {
					req.reqLocation = foundLocation;
					next();
				}
			} else if (req.decoded.isAdmin) {
				global.db.one(
					`select is_admin from users
					 where id = ${req.decoded.id}`
				)
					.then((data) => {
						if (!data.is_admin) {
							req.decoded.isAdmin = false;
						}
						req.reqLocation = foundLocation;
						next();
					});
			} else {
				foundLocation.dailyCheckin = undefined;
				foundLocation.dailyBank = undefined;
				foundLocation.loyalPopulation = undefined;
				req.reqLocation = foundLocation;
				next();
			}
		});
};
