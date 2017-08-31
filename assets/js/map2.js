'use strict';

class Game {
	constructor() {
		this.usersGeocordsInfo = document.getElementById('users-geocords');
		this.clickedInfo = document.getElementById('output');
		this.clickedLocationHeading = document.getElementById('click-loc-heading');
		this.clickedLocationInfo = document.getElementById('click-location');
		this.usersLocContainer = document.getElementById('current-loc-info');
		this.usersLocationInfo = document.getElementById('users-location');
		this.occupyBtn = document.getElementById('occupy-btn');


		this.map = null;


		this.userGeoData = null;

		this.relativeLatSize = null;
		this.relativeLngSize = null;
		this.latBreakPoints = [];
		this.lngSizeCoefficients = {};

		navigator.geolocation.watchPosition((position) => {
			const userCoords = position.coords;
			console.log(userCoords);
			// this.currentCoords = userCoords;
			this.setUserGeoData(userCoords);
			this.createCurrentLocation(userCoords);
			this.setMapCenter(userCoords.latitude, userCoords.longitude);
			this.addMarker(userCoords.latitude, userCoords.longitude);
			this.currentCoords = {
				lat: userCoords.latitude,
				lng: userCoords.longitude
			};
		});

		this.initLocationGrid();

		this.occupyBtn.addEventListener('click', () => {
			this.occupyLocation();
		});
	}

	setMapCenter(lat, lng) {
		this.map.setZoom(15);
		this.map.setCenter({ lat, lng });
	}
	addMarker(lat, lng) {
		const marker = new google.maps.Marker({
			position: { lat, lng },
			map: this.map,
			title: 'Hello World!'
		  });
	}
	setUserGeoData(position) {
		this.userGeoData = position;
	}

	setStyleLocation(location) {
		let color = 'gray';
		let background = 'white';
		if (location.getProperty('color')) {
			color = location.getProperty('color');
		}
		if (location.getProperty('background')) {
			background = location.getProperty('background');
		}
		return /** @type {google.maps.Data.StyleOptions} */({
			fillColor: background,
			fillOpacity: 0.2,
			strokeColor: color,
			strokeWeight: 2
		});
	}

	renderLocationsFromDB() {
		const getLocationPromise = new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();

			xhr.open('GET', '/api/locations');
			xhr.send();
			xhr.addEventListener('load', (e) => {
				const srcXHR = e.target;
				if (srcXHR.status === 200) {
					res(JSON.parse(srcXHR.response));
				} else {
					rej(srcXHR.response);
				}
			});
		});

		getLocationPromise.then((locArray) => {
			const geoObj = {
				type: 'FeatureCollection',
				features: []
			};

			// creating geoJSON Object from recieved data

			locArray.forEach((item) => {
				geoObj.features.push({
					type: 'Feature',
					id: item.loc_id,
					properties: {
						color: 'green',
						background: 'green',
						info: {
							master: item.master
						}
					},
					geometry: {
						type: 'Polygon',
						coordinates: [
							this.getLocationPointsByTopLeft({
								lat: item.lat,
								lng: item.lng
							}, true)
						]
					}
				});
			});
			console.log(geoObj);

			this.map.data.addGeoJson(geoObj);
		})
			.catch((err) => {
				console.log(err);
			});

		this.map.data.setStyle(this.setStyleLocation);
	}


	getRelLngSize(topLeftLat) {
		if (topLeftLat < 0) {
			topLeftLat = (topLeftLat - (this.relativeLatSize / 10000000)) * (-1);
		}

		if (topLeftLat <= this.latBreakPoints[0]) {
			return this.relativeLngSize;
		}

		for (let i = 0, maxValue = this.latBreakPoints.length; i < maxValue; i += 1) {
			if (
				(topLeftLat > this.latBreakPoints[i] && topLeftLat <= this.latBreakPoints[i + 1]) ||
				(topLeftLat > this.latBreakPoints[i] && !this.latBreakPoints[i + 1])
			) {
				return this.relativeLngSize * this.lngSizeCoefficients[this.latBreakPoints[i]];
			}
		}
	}

	initLocationGrid(options) {
		options = options || {};
		const preferableLocSideSize = options.preferableLocSideSize || 100;
		const EARTH_EQUATOR_LENGTH = options.EARTH_EQUATOR_LENGTH || 40075696;
		const EARTH_MERIDIAN_LENGTH = options.EARTH_MERIDIAN_LENGTH || 20004274;

		const locSideMetersSizeOn30Lat = preferableLocSideSize;
		const locSideMetersSizeOnEquatorLat = locSideMetersSizeOn30Lat * 1.5;
		const minAbsoluteLatSize = EARTH_MERIDIAN_LENGTH / 1800000000;
		const minAbsoluteLngSize = EARTH_EQUATOR_LENGTH / 3600000000;

		this.relativeLatSize = this.getClosestRelSize(Math.round(preferableLocSideSize / minAbsoluteLatSize), 'lat');
		this.relativeLngSize = this.getClosestRelSize(Math.round(locSideMetersSizeOnEquatorLat / minAbsoluteLngSize), 'lng');

		let lngPrimeFactorsArr = this.findPrimeFactors(3600000000 / this.relativeLngSize);
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
			lngBreakPoint = (Math.floor(Math.round(lngBreakPoint * 10000000) / this.relativeLatSize) * this.relativeLatSize) / 10000000;
			this.lngSizeCoefficients[lngBreakPoint] = lngSizeCoefficient;
			this.latBreakPoints.push(lngBreakPoint);
		});
		console.dir(this.lngSizeCoefficients);
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

	createCurrentLocation(currentCoords) {
		this.usersGeocordsInfo.textContent = `${currentCoords.latitude} 
											${currentCoords.longitude}
											${currentCoords.accuracy}`;

		this.usersLocContainer.classList.add('open');

		const currentLocationCoords = this.getTopLeftLocationCoordsByPoint(currentCoords.latitude,	currentCoords.longitude);

		this.usersLocationInfo.textContent = `${currentLocationCoords.lat} 
											 ${currentLocationCoords.lng}`;

		const getLocationInfoPromise = new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();

			xhr.open('GET', `/api/locations/${currentLocationCoords.lat}${currentLocationCoords.lng}`);
			// xhr.open('GET', `/api/locations/grid?lat=${this.userGeoData.latitude}&lng=${this.userGeoData.longitude}`);
			xhr.send();
			xhr.addEventListener('load', (e) => {
				const getLocationInfoXHR = e.srcElement;

				if (getLocationInfoXHR.status !== 200) {
					rej(getLocationInfoXHR.response);
				}
				res(JSON.parse(getLocationInfoXHR.response));
			});
		});
		getLocationInfoPromise
			.then((locationData) => {
				if (!locationData) {
					console.log(locationData);
					if (this.map.data.getFeatureById('currentLocation')) {
						this.map.data.remove(this.map.data.getFeatureById('currentLocation'));
					}
					this.map.data.add(this.createLocation(currentLocationCoords));
					this.occupyBtn.style.display = 'block';
				} else {
					const currentLocation = this.map.data.getFeatureById(locationData.loc_id);
					currentLocation.setProperty('color', 'crimson');
				}
			})
			.catch((err) => {
				console.log(err);
			});
	}

	getLocationPointsByTopLeft(topLeftCoords, isForMapArray) {
		if (!isForMapArray) {
			return [{
			// north west
				lat: +topLeftCoords.lat,
				lng: +topLeftCoords.lng
			}, {
			// south west
				lat: ((topLeftCoords.lat * 10000000) - this.relativeLatSize) / 10000000,
				lng: +topLeftCoords.lng
			}, {
			// south east
				lat: ((topLeftCoords.lat * 10000000) - this.relativeLatSize) / 10000000,
				lng: ((topLeftCoords.lng * 10000000) + this.getRelLngSize(topLeftCoords.lat)) / 10000000
			}, {
			// north east
				lat: +topLeftCoords.lat,
				lng: ((topLeftCoords.lng * 10000000) + this.getRelLngSize(topLeftCoords.lat)) / 10000000
			}];
		}
		return [[
			// north west
			+topLeftCoords.lng,
			+topLeftCoords.lat
		], [
			// south west
			+topLeftCoords.lng,
			((topLeftCoords.lat * 10000000) - this.relativeLatSize) / 10000000
		], [
			// south east
			((topLeftCoords.lng * 10000000) + this.getRelLngSize(topLeftCoords.lat)) / 10000000,
			((topLeftCoords.lat * 10000000) - this.relativeLatSize) / 10000000
		], [
			// north east
			((topLeftCoords.lng * 10000000) + this.getRelLngSize(topLeftCoords.lat)) / 10000000,
			+topLeftCoords.lat
		], [
			// north west
			+topLeftCoords.lng,
			+topLeftCoords.lat
		]];
	}
	createLocation(locationCoords) {
		const location = this.getLocationPointsByTopLeft(locationCoords);
		const locationGeoObj = {
			type: 'Feature',
			id: 'currentLocation',
			properties: {
				color: 'crimson',
				info: {
					name: 'Current location'
				}
			},
			geometry: new google.maps.Data.Polygon([location])
		};
		return locationGeoObj;
	}
	hilightEmptyLocation(event) {
		if (this.map.data.getFeatureById('highlight')) {
			this.map.data.remove(this.map.data.getFeatureById('highlight'));
		}

		const gridPromise = new Promise((res, rej) => {
			const gridXHR = new XMLHttpRequest();
			gridXHR.open('GET', `/api/locations/grid?lat=${event.latLng.lat()}&lng=${event.latLng.lng()}`);
			gridXHR.send();

			gridXHR.onload = (e) => {
				const xhr = e.srcElement;

				if (xhr.status !== 200) {
					rej(xhr.response);
				}

				res(JSON.parse(xhr.response));
			};
		});

		gridPromise
			.then((clickedLocation) => {
				this.clickedInfo.style.display = 'block';
				this.clickedInfo.classList.add('open');
				this.usersLocContainer.classList.remove('open');
				this.clickedLocationInfo.textContent = `${clickedLocation.northWest.lat} ${clickedLocation.northWest.lng}`;
				this.clickedLocationHeading.textContent = 'Empty location';
				console.log(clickedLocation);

				const locationNew = {
					type: 'Feature',
					id: 'highlight',
					properties: {
						color: 'blue'
						// info: {
						//   name: 'Empty location',
						// },
					},
					geometry: new google.maps.Data.Polygon([clickedLocation.mapFeatureCoords])
				};

				this.map.data.add(locationNew);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	getTopLeftLocationCoordsByPoint(pointLat, pointLng) {
		const lat = (Math.ceil(Math.round(pointLat * 10000000) /	this.relativeLatSize) * this.relativeLatSize) / 10000000;
		const lng = (Math.floor(Math.round(pointLng * 10000000) / this.getRelLngSize(lat)) * this.getRelLngSize(lat)) / 10000000;

		return {
			lat,
			lng
		};
	}

	occupyLocation() {
		const createLocatonPromise = new Promise((res, rej) => {
			const createLocationXHR = new XMLHttpRequest();
			createLocationXHR.open('POST', 'api/locations');
			createLocationXHR.setRequestHeader('Content-Type', 'application/json');
			createLocationXHR.send(JSON.stringify({
				userLat: this.userGeoData.latitude,
				userLng: this.userGeoData.longitude,
				accuracy: this.userGeoData.accuracy
			}));
			createLocationXHR.addEventListener('load', (e) => {
				const xhr = e.srcElement;
				console.log(xhr);
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				console.log(xhr.response);

				res(JSON.parse(xhr.response));
			});
		})
			.then((response) => {
				console.log(response);
				const thisLocation = this.map.data.getFeatureById('currentLocation');

				const location = this.getLocationPointsByTopLeft(response);

				const locationNew = {
					type: 'Feature',
					id: response.locationId,
					properties: {
						color: 'green',
						info: {
						}
					},
					geometry: new google.maps.Data.Polygon([location])
					// geometry: thisFeature.getGeometry(),
				};
				this.map.data.add(locationNew);
				this.map.data.remove(thisLocation);
				this.occupyBtn.style.display = 'none';
			})
			.catch((err) => {
				console.log(err);
			});
	}
}


function initMap() {
	const game = new Game();
	game.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: { lat: 49.9891, lng: 36.2322 },
		clickableIcons: false
	});
	window.onload = function () {
		const lat0 = game.map.getBounds().getNorthEast().lat();
		const lng0 = game.map.getBounds().getNorthEast().lng();
		const lat1 = game.map.getBounds().getSouthWest().lat();
		const lng1 = game.map.getBounds().getSouthWest().lng();
		console.log(lat0, lng0, lat1, lng1);

		game.renderLocationsFromDB();

		game.map.addListener('click', (event) => {
			game.hilightEmptyLocation(event);
		});
	};

	game.usersLocContainer.addEventListener('click', (e) => {
		if (e.target.classList[0] === 'close') {
			game.usersLocContainer.classList.toggle('open');
		}
	});
	game.clickedInfo.addEventListener('click', (e) => {
		if (e.target.classList[0] === 'close') {
			game.clickedInfo.classList.toggle('open');
		}
	});
}
