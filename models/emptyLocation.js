class EmptyLocation {
	constructor(geoData) {
		this.northWest = {};
		this.northWest.lat = this.getNorthWestLocationLatitudeByPoint(geoData.lat);
		this.northWest.lng = this.getNorthWestLocationLongitudeByPoint(geoData);
		// this.getNorthWestLocationCoordsByPoint(geoData);
		this.mapFeatureCoords = this.getMapFeatureCoords();
		// this.mapFeatureGeometry = this.getMapFeatureGeometry();
	}

	get lngSizeCoefficients() {
		return this.getLatutideBreakpointsObject();
	}

	get latBreakPoints() {
		return Object.keys(this.lngSizeCoefficients);
	}

	get equatorLength() {
		return 40075696;
	}

	get meridianLength() {
		return 20004274;
	}

	get preferableLocSideSize() {
		return 100;
	}

	get locSideMetersSizeOnEquatorLat() {
		return this.preferableLocSideSize * 1.5;
	}

	get minAbsoluteLatSize() {
		return this.meridianLength / 1800000000;
	}

	get minAbsoluteLngSize() {
		return this.equatorLength / 3600000000;
	}

	get relativeLatSize() {
		return this.getClosestRelSize(
			Math.round(this.preferableLocSideSize / this.minAbsoluteLatSize),
			'lat');
	}

	get initialRelativeLngSize() {
		return this.getClosestRelSize(
			Math.round(this.locSideMetersSizeOnEquatorLat / this.minAbsoluteLngSize),
			'lng');
	}

	getRelLngSize(pointLat) {
		let lat = pointLat || this.northWest.lat;
		let result;
		const lngSizeCoefficients = this.getLatutideBreakpointsObject();
		const breakPoints = Object.keys(lngSizeCoefficients);

		if (lat < 0) {
			lat = (lat - (this.relativeLatSize / 10000000)) * (-1);
		}

		if (lat <= breakPoints[0]) {
			return this.initialRelativeLngSize;
		}

		for (let i = 0, maxValue = this.latBreakPoints.length; i < maxValue; i += 1) {
			if (
				(lat > breakPoints[i] && this.northWest.lat <= breakPoints[i + 1]) ||
				(lat > breakPoints[i] && !breakPoints[i + 1])
			) {
				result = this.initialRelativeLngSize * lngSizeCoefficients[breakPoints[i]];
				break;
			}
		}

		return result;
	}

	getMapFeatureCoords() {
		return [{
			// north west
			lat: this.northWest.lat,
			lng: this.northWest.lng
		}, {
			// south west
			lat: ((this.northWest.lat * 10000000) - this.relativeLatSize) / 10000000,
			lng: this.northWest.lng
		}, {
			// south east
			lat: ((this.northWest.lat * 10000000) - this.relativeLatSize) / 10000000,
			lng: ((this.northWest.lng * 10000000) + this.getRelLngSize()) / 10000000
		}, {
			// north east
			lat: this.northWest.lat,
			lng: ((this.northWest.lng * 10000000) + this.getRelLngSize()) / 10000000
		}];
	}

	// getMapFeatureGeometry() {
	// 	return [[
	// 	// north west
	// 		this.northWest.lng,
	// 		this.northWest.lat
	// 	], [
	// 	// south west
	// 		this.northWest.lng,
	// 		((this.northWest.lat * 10000000) - this.relativeLatSize) / 10000000
	// 	], [
	// 	// south east
	// 		((this.northWest.lng * 10000000) + this.getRelLngSize()) / 10000000,
	// 		((this.northWest.lat * 10000000) - this.relativeLatSize) / 10000000
	// 		// north east
	// 	], [
	// 		((this.northWest.lng * 10000000) + this.getRelLngSize()) / 10000000,
	// 		this.northWest.lat
	// 	], [
	// 	// north west
	// 		this.northWest.lng,
	// 		this.northWest.lat
	// 	]];
	// }

	getLatutideBreakpointsObject() {
		const lngSizeCoefficients = {};
		let lngPrimeFactorsArr = this.findPrimeFactors(3600000000 / this.initialRelativeLngSize);
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
		});

		return lngSizeCoefficients;
	}

	getClosestRelSize(preferRelSize, latOrLng) {
		let maxDeg;
		if (latOrLng === 'lat') {
			maxDeg = 1800000000;
		} else if (latOrLng === 'lng') {
			maxDeg = 3600000000;
		} else {
			return false;
		}

		if (Math.round(maxDeg / this.preferRelSize) === maxDeg / this.preferRelSize) {
			return preferRelSize;
		}

		if (Math.round(maxDeg / this.preferRelSize) !== maxDeg / this.preferRelSize) {
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

	findPrimeFactors(value) {
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

	getNorthWestLocationLatitudeByPoint(pointLat) {
		return (
			Math.ceil(
				Math.round(pointLat * 10000000) / this.relativeLatSize
			) * this.relativeLatSize
		) /	10000000;
	}

	getNorthWestLocationLongitudeByPoint(point) {
		const relLngSize = this.getRelLngSize(point.lat);
		return (
			Math.floor(
				Math.round(point.lng * 10000000) / relLngSize
			) * relLngSize
		) /	10000000;
	}
}

module.exports = EmptyLocation;
