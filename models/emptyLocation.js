class EmptyLocation {
	constructor(geoData) {
		this.coords = this.getLocationPointsByTopLeft(
			this.getTopLeftLocationCoordsByPoint(geoData)
		);
	}

	get locationId() {
		const northWestPoint = this.coords.northWest;

		return `${
			this.convertCoordToIdString(northWestPoint.lat, true)
		}${
			this.convertCoordToIdString(northWestPoint.lng, false)
		}`;
	}

	// location ID string convertor

	static convertCoordToIdString(coord, isLat) {
		const digitsQuantity = isLat ? 2 : 3;
		coord = `${coord}`;
		coord = coord.split('.');
		if (coord[0].indexOf('-') === 0) {
			coord[0] = coord[0][0].slice(1);

			while (coord[0].length < digitsQuantity) {
				coord[0] = `0${coord[0]}`;
			}

			coord[0] = `n${coord[0]}`;
		} else {
			while (coord[0].length < digitsQuantity) {
				coord[0] = `0${coord[0]}`;
			}

			coord[0][0] = `p${coord[0][0]}`;
		}

		while (coord[1].length < 7) {
			coord[1] = `${coord[1]}0`;
		}

		return coord.join('x');
	}

	getLatutideBreakpointsObject() {
		// this.prototype.lngSizeCoefficients = {};
		// this.prototype.latBreakPoints = [];

		const lngSizeCoefficients = {};
		// const latBreakPoints = [];
		let lngPrimeFactorsArr = EmptyLocation.findPrimeFactors(3600000000 / this.relativeLngSize);
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
				Math.floor(
					Math.round(lngBreakPoint * 10000000) / this.relativeLatSize
				) * this.relativeLatSize
			) /	10000000;
			lngSizeCoefficients[lngBreakPoint] = lngSizeCoefficient;
			// latBreakPoints.push(lngBreakPoint);
		});

		return lngSizeCoefficients;
	}

	static initLocationGrid(options) {
		options = options || {};

		EmptyLocation.prototype.EQUATOR_LENGTH = options.EQUATOR_LENGTH || 40075696;
		EmptyLocation.prototype.MERIDIAN_LENGTH = options.MERIDIAN_LENGTH || 20004274;
		EmptyLocation.prototype.preferableLocSideSize = options.preferableLocSideSize || 100;

		EmptyLocation.prototype
			.locSideMetersSizeOnEquatorLat = EmptyLocation.prototype.preferableLocSideSize * 1.5;

		const minAbsoluteLatSize = EmptyLocation.prototype.MERIDIAN_LENGTH / 1800000000;
		const minAbsoluteLngSize = EmptyLocation.prototype.EQUATOR_LENGTH / 3600000000;

		EmptyLocation.prototype.relativeLatSize = this.getClosestRelSize(
			Math.round(EmptyLocation.prototype.preferableLocSideSize / minAbsoluteLatSize),
			'lat');
		EmptyLocation.prototype.relativeLngSize = this.getClosestRelSize(
			Math.round(EmptyLocation.prototype.locSideMetersSizeOnEquatorLat / minAbsoluteLngSize),
			'lng');

		EmptyLocation.prototype.lngSizeCoefficients = EmptyLocation.prototype.getLatutideBreakpointsObject();
		EmptyLocation.prototype.latBreakPoints = Object.keys(EmptyLocation.prototype.lngSizeCoefficients);
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
					preferRelSize = relativeSizeToIncrease;
					break;
				}

				if (Math.round(maxDeg / relativeSizeToDecrease) === maxDeg / relativeSizeToDecrease) {
					preferRelSize = relativeSizeToDecrease;
					break;
				}
			}
		}
		return preferRelSize;
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
		const lat = (
			Math.ceil(
				Math.round(point.lat * 10000000) / this.relativeLatSize
			) * this.relativeLatSize
		) /	10000000;
		const lng = (
			Math.floor(
				Math.round(point.lng * 10000000) / this.getRelLngSize(point.lat)
			) * this.getRelLngSize(point.lat)
		) /	10000000;

		return {
			lat,
			lng
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

	static getLocationPointsByNorthWestPoint(northWestPoint) {
		return {
			northWest: {
				lat: northWestPoint.lat,
				lng: northWestPoint.lng
			},
			southWest: {
				lat: (
					(northWestPoint.lat * 10000000) - this.relativeLatSize
				) / 10000000,
				lng: northWestPoint.lng
			},
			southEast: {
				lat: (
					(northWestPoint.lat * 10000000) - this.relativeLatSize
				) / 10000000,
				lng: (
					(northWestPoint.lng * 10000000) + this.getRelLngSize(this.lat)
				) / 10000000
			},
			northEast: {
				lat: northWestPoint.lat,
				lng: (
					(northWestPoint.lng * 10000000) + this.getRelLngSize(this.lat)
				) / 10000000
			}
		};
	}
}

EmptyLocation.initLocationGrid();

module.exports = EmptyLocation;
