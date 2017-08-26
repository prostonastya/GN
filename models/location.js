// const pgp = require('pg-promise')();

// const db = pgp({
//   host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
//   port: 5432,
//   database: 'detamp7dm7n5kt',
//   user: 'smdtzebruscqxv',
//   password: 'b988acabcae53edc03642deec8eabbbd891f2c549a02100e9f5b134c624ea4cd',
//   ssl: true,
//   sslfactory: 'org.postgresql.ssl.NonValidatingFactory',
// });
class Location {
	constructor(userData) {
		// this.lat = Math.floor(userData.userLat * 100) / 100;
		this.lat = this.getTopLeftLocationCoordsByPoint({
			lat: userData.userLat,
			lng: userData.userLng,
		}).lat;
		// this.lng = Math.floor(userData.userLng * 100) / 100;
		this.lng = this.getTopLeftLocationCoordsByPoint({
			lat: userData.userLat,
			lng: userData.userLng,
		}).lng;
		this.locationId = `${this.lat}${this.lng}`;
		this.masterId = userData.userId; // get from req when auth will be ready
		this.population = 10;
		this.dailyBank = 0;
		this.loyalPopulation = 1;
		this.dailyCheckin = true;
		this.creationDate = new Date();
	}
	saveLocation() {
		// ESLint deleted curly braces. Not sure if it is OK

		return global.db.tx(t => t.batch([
			t.none(`insert into locations (loc_id, lat, lng,
					population, daily_bank, creation_date)
				      values(
				        '${this.locationId}',
				        ${this.lat},
				        ${this.lng},
				        ${this.population},
				        ${this.dailyBank},
				        '${this.creationDate.toISOString()}'
				    	)`),
			t.none(`insert into master_location (user_id, loc_id, loyal_popul, daily_checkin)
								values(
									${this.masterId},
									'${this.locationId}',
									${this.loyalPopulation},
									${this.dailyCheckin}
				    		)`),
		]))
			.then((data) => {
				console.log(data);
			})
			.catch((error) => {
				console.log(error);
			});
	}
	// saveLocation() {
	// 	return global.db.none(`insert into locations (loc_id, lat, lng,
	// population, daily_bank, creation_date)
	// 									values(
	// 										'${this.locationId}',
	// 										${this.lat},
	// 										${this.lng},
	// 										${this.population},
	// 										${this.dailyBank},
	// 										'${this.creationDate.toISOString()}'
	// 									)`);

	// need to make transaction with master-location

	// return db.tx((transaction) => {
	//   const createLocationQuery = transaction.none(
	//     `insert into locations (loc_id, lat, lng, population, daily_bank, creation_date)
	//      values(
	//        '${this.locationId}',
	//        ${this.lat},
	//        ${this.lng},
	//        ${this.population},
	//        ${this.dailyBank},
	//        '${this.creationDate.toISOString()}'
	//     )`);
	//   const createMasterQuery = transaction.one(
	//     `insert into master_location (user_id, loc_id, loyal_popul, daily_checkin)
	//      values(
	//        ${this.masterId},
	//        '${this.locationId}',
	//        ${this.loyalPopulation},
	//        ${this.dailyCheckin}
	//      )`);

	//   return transaction.batch([createLocationQuery, createMasterQuery]);
	// });

	// }
	static deleteAllLocations() {
		global.db.none('delete from location');
	}

	static getAllLocations() {
		return global.db.any(`select locations.loc_id AS loc_id, lat, lng, user_id from locations
									 full join master_location ON locations.loc_id = master_location.loc_id;`);
	}

	static getLocationById(id) {
		/* return db.one(`select locations.loc_id AS loc_id, lat, lng, user_id from locations
						full join master_location on locations.loc_id = master_location.loc_id
						where locations.loc_id = $1`, id); */
		const queryResult = global.db.oneOrNone(`select locations.loc_id AS loc_id, lat, lng, user_id from locations
						full join master_location on locations.loc_id = master_location.loc_id
						where locations.loc_id = $1`, id);
		console.log(queryResult);
		if (!queryResult) {
			return [];
		}
		return queryResult;
	}

	// location grid methods

	static initLocationGrid(options) {
		options = options || {};

		Location.prototype.EQUATOR_LENGTH = options.EQUATOR_LENGTH || 40075696;
		Location.prototype.MERIDIAN_LENGTH = options.MERIDIAN_LENGTH || 20004274;
		Location.prototype.preferableLocSideSize = options.preferableLocSideSize || 100;

		Location.prototype.locSideMetersSizeOnEquatorLat = this.prototype.preferableLocSideSize * 1.5;

		const minAbsoluteLatSize = this.prototype.MERIDIAN_LENGTH / 1800000000;
		const minAbsoluteLngSize = this.prototype.EQUATOR_LENGTH / 3600000000;

		Location.prototype.relativeLatSize = this.getClosestRelSize(
			Math.round(this.prototype.preferableLocSideSize / minAbsoluteLatSize),
			'lat');
		Location.prototype.relativeLngSize = this.getClosestRelSize(
			Math.round(this.prototype.locSideMetersSizeOnEquatorLat / minAbsoluteLngSize),
			'lng');

		Location.prototype.lngSizeCoefficients = {};
		Location.prototype.latBreakPoints = [];

		let lngPrimeFactorsArr = this.findPrimeFactors(3600000000 / this.prototype.relativeLngSize);
		lngPrimeFactorsArr.splice(-1);

		lngPrimeFactorsArr = lngPrimeFactorsArr.map((item) => {
			if (item > 2) {
				return [item / 2, 2];
			}
			return item;
		});

		for (let i = 0; i < lngPrimeFactorsArr.length; i += 1) {
			if (Array.isArray(lngPrimeFactorsArr[i])) {
				const innerArr = lngPrimeFactorsArr.splice(i, 1)[0];
				i -= 1;
				innerArr.forEach((currentValue) => {
					lngPrimeFactorsArr.push(currentValue);
				});
			}
		}

		let lngSizeCoefficient = 1;

		lngPrimeFactorsArr.forEach((currentValue) => {
			lngSizeCoefficient *= currentValue;
			let lngBreakPoint = (Math.acos(1 / lngSizeCoefficient) * 180) / Math.PI;
			lngBreakPoint = (
				Math.floor(Math.round(lngBreakPoint * 10000000) / Location.prototype.relativeLatSize) * Location.prototype.relativeLatSize
			) / 10000000;
			Location.prototype.lngSizeCoefficients[lngBreakPoint] = lngSizeCoefficient;
			Location.prototype.latBreakPoints.push(lngBreakPoint);
		});
	}

	static getClosestRelSize(preferRelSize, latOrLng) {
		let maxDeg;
		if (latOrLng === 'lat') {
			maxDeg = 1800000000;
		} else if (latOrLng === 'lng') {
			maxDeg = 3600000000;
		} else {
			return false;
		}

		if (Math.round(maxDeg / preferRelSize) === maxDeg / preferRelSize) {
			return preferRelSize;
		}

		if (Math.round(maxDeg / preferRelSize) !== maxDeg / preferRelSize) {
			let relativeSizeToIncrease = preferRelSize;
			let relativeSizeToDecrease = preferRelSize;
			while (true) {
				relativeSizeToIncrease += 1;
				relativeSizeToDecrease -= 1;
				if (Math.round(maxDeg / relativeSizeToIncrease) === maxDeg / relativeSizeToIncrease) {
					return relativeSizeToIncrease;
				}

				if (Math.round(maxDeg / relativeSizeToDecrease) === maxDeg / relativeSizeToDecrease) {
					return relativeSizeToDecrease;
				}
			}
		}
	}

	static findPrimeFactors(value) {
		let tempValue = value;
		let checker = 2;
		const result = [];

		while (checker * checker <= tempValue) {
			if (tempValue % checker === 0) {
				result.push(checker);
				tempValue /= checker;
			} else {
				checker += 1;
			}
		}
		if (tempValue !== 1)	{
			result.push(tempValue);
		}
		return result;
	}

	getTopLeftLocationCoordsByPoint(point) {
		const lat = (Math.ceil(Math.round(point.lat * 10000000) /	this.relativeLatSize) * this.relativeLatSize) / 10000000;
		const lng = (Math.floor(Math.round(point.lng * 10000000) / this.getRelLngSize(this.lat)) * this.getRelLngSize(this.lat)) / 10000000;

		return {
			lat,
			lng,
		};
	}

	getRelLngSize() {
		if (this.lat < 0) {
			this.lat = (this.lat - (this.relativeLatSize / 10000000)) * (-1);
		}

		if (this.lat <= this.latBreakPoints[0]) {
			return this.relativeLngSize;
		}

		for (let i = 0, maxValue = this.latBreakPoints.length; i < maxValue; i += 1) {
			if (
				(this.lat > this.latBreakPoints[i] && this.lat <= this.latBreakPoints[i + 1]) ||
			(this.lat > this.latBreakPoints[i] && !this.latBreakPoints[i + 1])
			) {
				return this.relativeLngSize * this.lngSizeCoefficients[this.latBreakPoints[i]];
			}
		}
	}

	getLocationPointsByTopLeft() {
		return [{
			// north west
			lat: this.lat,
			lng: this.lng,
		}, {
			// south west
			lat: ((this.lat * 10000000) - this.relativeLatSize) / 10000000,
			lng: this.lng,
		}, {
			// south east
			lat: ((this.lat * 10000000) - this.relativeLatSize) / 10000000,
			lng: ((this.lng * 10000000) + this.getRelLngSize(this.lat)) / 10000000,
		}, {
			// north east
			lat: this.lat,
			lng: ((this.lng * 10000000) + this.getRelLngSize(this.lat)) / 10000000,
		}];
	}
}

// let relativeLatSize;
// let relativeLngSize;
// const lngSizeCoefficients = {};
// const latBreakPoints = [];

// initLocationGrid();

// function initLocationGrid(options) {
// options = options || {};
// const preferableLocSideSize = options.preferableLocSideSize || 100;
// const EARTH_EQUATOR_LENGTH = options.EARTH_EQUATOR_LENGTH || 40075696;
// const EARTH_MERIDIAN_LENGTH = options.EARTH_MERIDIAN_LENGTH || 20004274;

// const locSideMetersSizeOn30Lat = preferableLocSideSize;
// const locSideMetersSizeOnEquatorLat = locSideMetersSizeOn30Lat * 1.5;
// const minAbsoluteLatSize = EARTH_MERIDIAN_LENGTH / 1800000000;
// const minAbsoluteLngSize = EARTH_EQUATOR_LENGTH / 3600000000;

// relativeLatSize = getClosestRelSize(Math.round(preferableLocSideSize / minAbsoluteLatSize), 'lat');
// relativeLngSize = getClosestRelSize(Math.round(locSideMetersSizeOnEquatorLat / minAbsoluteLngSize), 'lng');

// let lngPrimeFactorsArr = findPrimeFactors(3600000000 / relativeLngSize);
// lngPrimeFactorsArr.splice(-1);

// lngPrimeFactorsArr = lngPrimeFactorsArr.map((item) => {
// 	if (item > 2) {
// 		return [item / 2, 2];
// 	}
// 	return item;
// });

// for (let i = 0; i < lngPrimeFactorsArr.length; i += 1) {
// 	if (Array.isArray(lngPrimeFactorsArr[i])) {
// 		const innerArr = lngPrimeFactorsArr.splice(i, 1)[0];
// 		i -= 1;
// 		innerArr.forEach((currentValue) => {
// 			lngPrimeFactorsArr.push(currentValue);
// 		});
// 	}
// }

// let lngSizeCoefficient = 1;

// lngPrimeFactorsArr.forEach((currentValue) => {
// 	lngSizeCoefficient *= currentValue;
// 	let lngBreakPoint = (Math.acos(1 / lngSizeCoefficient) * 180) / Math.PI;
// 	lngBreakPoint = (Math.floor(Math.round(lngBreakPoint * 10000000) / relativeLatSize) * relativeLatSize) / 10000000;
// 	lngSizeCoefficients[lngBreakPoint] = lngSizeCoefficient;
// 	latBreakPoints.push(lngBreakPoint);
// });
// console.dir(lngSizeCoefficients);
// }

// function getTopLeftLocationCoordsByPoint(pointLat, pointLng) {
// 	const lat = (Math.ceil(Math.round(pointLat * 10000000) /	relativeLatSize) * relativeLatSize) / 10000000;
// 	const lng = (Math.floor(Math.round(pointLng * 10000000) / getRelLngSize(lat)) * getRelLngSize(lat)) / 10000000;

// 	return {
// 		lat,
// 		lng,
// 	};
// }

// function getClosestRelSize(preferRelSize, latOrLng) {
// 	let maxDeg;
// 	if (latOrLng === 'lat') {
// 		maxDeg = 1800000000;
// 	} else if (latOrLng === 'lng') {
// 		maxDeg = 3600000000;
// 	} else {
// 		return false;
// 	}

// 	if (Math.round(maxDeg / preferRelSize) === maxDeg / preferRelSize) {
// 		return preferRelSize;
// 	}

// 	if (Math.round(maxDeg / preferRelSize) !== maxDeg / preferRelSize) {
// 		let relativeSizeToIncrease = preferRelSize;
// 		let relativeSizeToDecrease = preferRelSize;
// 		while (true) {
// 			relativeSizeToIncrease += 1;
// 			relativeSizeToDecrease -= 1;
// 			if (Math.round(maxDeg / relativeSizeToIncrease) === maxDeg / relativeSizeToIncrease) {
// 				return relativeSizeToIncrease;
// 			}

// 			if (Math.round(maxDeg / relativeSizeToDecrease) === maxDeg / relativeSizeToDecrease) {
// 				return relativeSizeToDecrease;
// 			}
// 		}
// 	}
// }

// function getLocationPointsByTopLeft(topLeftCoords) {
// 	return [{
// 		// north west
// 		lat: topLeftCoords.lat,
// 		lng: topLeftCoords.lng,
// 	}, {
// 		// south west
// 		lat: ((topLeftCoords.lat * 10000000) - relativeLatSize) / 10000000,
// 		lng: topLeftCoords.lng,
// 	}, {
// 		// south east
// 		lat: ((topLeftCoords.lat * 10000000) - relativeLatSize) / 10000000,
// 		lng: ((topLeftCoords.lng * 10000000) + getRelLngSize(topLeftCoords.lat)) / 10000000,
// 	}, {
// 		// north east
// 		lat: topLeftCoords.lat,
// 		lng: ((topLeftCoords.lng * 10000000) + getRelLngSize(topLeftCoords.lat)) / 10000000,
// 	}];
// }

// function getRelLngSize(topLeftLat) {
// 	if (topLeftLat < 0) {
// 		topLeftLat = (topLeftLat - (relativeLatSize / 10000000)) * (-1);
// 	}

// 	if (topLeftLat <= latBreakPoints[0]) {
// 		return relativeLngSize;
// 	}

// 	for (let i = 0, maxValue = latBreakPoints.length; i < maxValue; i += 1) {
// 		if (
// 			(topLeftLat > latBreakPoints[i] && topLeftLat <= latBreakPoints[i + 1]) ||
// 			(topLeftLat > latBreakPoints[i] && !latBreakPoints[i + 1])
// 		) {
// 			return relativeLngSize * lngSizeCoefficients[latBreakPoints[i]];
// 		}
// 	}
// }

// function findPrimeFactors(value) {
// 	let tempValue = value;
// 	let checker = 2;
// 	const result = [];

// 	while (checker * checker <= tempValue) {
// 		if (tempValue % checker === 0) {
// 			result.push(checker);
// 			tempValue /= checker;
// 		} else {
// 			checker += 1;
// 		}
// 	}
// 	if (tempValue !== 1)	{
// 		result.push(tempValue);
// 	}
// 	return result;
// }

Location.initLocationGrid();

module.exports = Location;
