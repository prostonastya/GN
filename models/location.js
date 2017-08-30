
class Location {
	constructor(userData) {
		this.lat = this.getTopLeftLocationCoordsByPoint({
			lat: userData.userLat,
			lng: userData.userLng,
		}).lat;
		this.lng = this.getTopLeftLocationCoordsByPoint({
			lat: userData.userLat,
			lng: userData.userLng,
		}).lng;
		this.locationId = `${this.lat}${this.lng}`;
		this.masterId = userData.userId;
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


	static deleteAllLocations() {
		global.db.none('delete from location');
	}

	static getAllLocations() {
		return global.db.any(`select locations.loc_id AS loc_id, lat, lng, user_id from locations
									 full join master_location ON locations.loc_id = master_location.loc_id;`);
	}

	static getLocationById(id) {
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
				Math.floor(Math.round(lngBreakPoint * 10000000) / Location.prototype.relativeLatSize) *
				Location.prototype.relativeLatSize) /
				10000000;
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
		const lat = (Math.ceil(Math.round(point.lat * 10000000) /
								this.relativeLatSize) * this.relativeLatSize) /
								10000000;
		const lng = (Math.floor(Math.round(point.lng * 10000000) /
								this.getRelLngSize(this.lat)) * this.getRelLngSize(this.lat)) /
								10000000;

		return {
			lat,
			lng,
		};
	}

	getRelLngSize() {
		let result;

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
				result = this.relativeLngSize * this.lngSizeCoefficients[this.latBreakPoints[i]];
			}
		}

		return result;
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

	static recalcLocationsLifecycle() {
		global.db.tx(t => t.batch([
			t.none(`delete from locations
							where loc_id IN (
								select loc_id from master_location
								where loyal_popul = 0
							);`),
			t.none(`delete from master_location
							where loyal_popul = 0;`),
		]))
			.then(() => global.db.none(`update locations
																	set daily_bank = loyal_popul
																	from master_location
																	where locations.loc_id = master_location.loc_id;`))
			.then(() => global.db.none(`update master_location 
																	set loyal_popul = loyal_popul - ceil(loyal_popul * 0.1)
																	where daily_checkin = false;`))
			.then(() => global.db.none('update master_location set daily_checkin = false;'))
			.then(() => {
				console.log('OK');
			})
			.catch((err) => {
				console.log(err.message);
			});
	}

	static restoreLoyalPopulByLocId(id) {
		return global.db.none(`update master_location
													 set loyal_popul = population
													 from locations
													 where locations.loc_id = master_location.loc_id
													 and locations.loc_id = '${id}';`);
	}

	static getOwnerByLocId(id) {
		return global.db.oneOrNone(`select user_id from master_location
													 where loc_id = '${id}';`);
	}
}

Location.initLocationGrid();

module.exports = Location;
