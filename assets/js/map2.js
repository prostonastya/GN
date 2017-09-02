'use strict';

class Game {
	constructor() {
		// use template for output		
		this.usersGeocordsInfo = document.getElementById('users-geocords');
		this.clickedInfo = document.getElementById('output');
		this.clickedLocationHeading = document.getElementById('click-loc-heading');
		this.clickedLocationInfo = document.getElementById('click-location');
		this.usersLocContainer = document.getElementById('current-loc-info');
		this.usersLocationInfo = document.getElementById('users-location');
		// ---^

		this.occupyBtn = document.getElementById('occupy-btn');
		this.userMarker = null;
		this.map = null;
		this.userGeoData = null;
		this.currentLocation = null;
		this.currentLocationMapFeature = null;
		this.currentHighlightedMapFeature = null;

		this.occupyBtn.addEventListener('click', () => {
			this.occupyLocation();
		});
	}

	get featuresPropertiesStyles() {
		return {
			currentEmptyLocation: {
				color: 'crimson',
				info: {
					name: 'Current location'
				}
			},
			highlightedEmptyLocation: {
				color: 'blue',
				info: {
					name: 'Highlighted location'
				}
			},
			newlyOccupiedLocation: {
				color: 'green',
				background: 'green'
			},
			ownedLocation: {
				color: 'green',
				background: 'green'
			},
			currentOwnedLocation: {
				color: 'crimson',
				background: 'green'
			}
		};
	}

	centerMapByUserGeoData() {
		const lat = this.userGeoData.latitude;
		const lng = this.userGeoData.longitude;
		this.map.setZoom(15);
		this.map.setCenter({ lat, lng });
	}

	addUserMarker() {
		const lat = this.userGeoData.latitude;
		const lng = this.userGeoData.longitude;
		this.userMarker = new google.maps.Marker({
			position: { lat, lng },
			map: this.map,
			title: 'You are there.'
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

	renderOccupiedLocations() {
		new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();

			xhr.open('GET', '/api/locations/geo-json');
			xhr.send();
			xhr.addEventListener('load', (e) => {
				const srcXHR = e.target;
				if (srcXHR.status === 200) {
					res(JSON.parse(srcXHR.response));
				} else {
					rej(srcXHR.response);
				}
			});
		})
			.then((geoJSON) => {
				geoJSON = this.modifyGeoJSON(geoJSON);

				this.map.data.addGeoJson(geoJSON);
				navigator.geolocation.watchPosition((position) => {
					const userCoords = position.coords;
					console.log(userCoords);
					this.setUserGeoData(userCoords);
					this.setCurrentLocationByUserCoords();
					this.centerMapByUserGeoData();
					console.log(this.userGeoData);
					this.addUserMarker();
				});
			})
			.catch((err) => {
				console.log(err);
			});

		this.map.data.setStyle(this.setStyleLocation);
	}

	// function for conditional GeoJSON modification

	modifyGeoJSON(geoJSON) {
		geoJSON.features.forEach((item) => {
			if (item.properties.info.isMaster) {
				item.properties.color = 'green';
				item.properties.background = 'green';
			}
			if (item.properties.info.dailyBank) {
				item.properties.background = 'orange';
			}
		});

		return geoJSON;
	}

	setCurrentLocationByUserCoords() {
		// /// remove to another method
		this.usersGeocordsInfo.textContent = `${this.userGeoData.latitude} 
											${this.userGeoData.longitude}
											${this.userGeoData.accuracy}`;

		this.usersLocContainer.classList.add('open');
		// /////

		new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();

			xhr.open('GET', `/api/locations/check-location?lat=${this.userGeoData.latitude}&lng=${this.userGeoData.longitude}`);
			xhr.send();
			xhr.addEventListener('load', (e) => {
				const getLocationInfoXHR = e.srcElement;

				if (getLocationInfoXHR.status !== 200) {
					rej(getLocationInfoXHR.response);
				}
				res(JSON.parse(getLocationInfoXHR.response));
			});
		})
			.then((locationData) => {
				console.dir(locationData);
				this.currentLocation = locationData;
				if (!locationData.masterId) {
					console.log(locationData);
					if (this.currentLocationMapFeature) {
						this.map.data.remove(this.currentLocationMapFeature);
						this.currentLocationMapFeature = null;
					}
					this.currentLocationMapFeature = this.createLocByFeatureCoords(
						locationData.mapFeatureCoords,
						'currentLocation',
						this.featuresPropertiesStyles.currentEmptyLocation
					);
					console.log(this.currentLocationMapFeature);
					// remove to separate method
					this.occupyBtn.style.display = 'block';
					// ///
				} else {
					const currentLocation = this.map.data.getFeatureById(locationData.locationId);
					currentLocation.setProperty('color', 'crimson');
				}
			})
			.catch((err) => {
				console.log(err);
			});
	}

	createLocByFeatureCoords(mapFeatureCoords, id, properties) {
		const locationGeoObj = {
			type: 'Feature',
			id,
			properties,
			geometry: new google.maps.Data.Polygon([mapFeatureCoords])
		};
		return this.map.data.add(locationGeoObj);
	}

	hilightEmptyLocation(event) {
		if (this.currentHighlightedMapFeature) {
			this.map.data.remove(this.currentHighlightedMapFeature);
		}

		new Promise((res, rej) => {
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
		})
			.then((clickedLocation) => {
				// /// remove to another method
				this.clickedInfo.style.display = 'block';
				this.clickedInfo.classList.add('open');
				this.usersLocContainer.classList.remove('open');
				this.clickedLocationInfo.textContent = `${clickedLocation.northWest.lat} ${clickedLocation.northWest.lng}`;
				this.clickedLocationHeading.textContent = 'Empty location';
				console.log(clickedLocation);
				// ///

				this.currentHighlightedMapFeature = this.createLocByFeatureCoords(
					clickedLocation.mapFeatureCoords,
					'clickedLocation',
					this.featuresPropertiesStyles.highlightedEmptyLocation
				);
				console.log(this.currentHighlightedMapFeature);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	occupyLocation() {
		new Promise((res, rej) => {
			const createLocationXHR = new XMLHttpRequest();
			createLocationXHR.open('POST', 'api/locations');
			createLocationXHR.setRequestHeader('Content-Type', 'application/json');
			createLocationXHR.send(JSON.stringify(this.currentLocation));
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
			.then((newLocation) => {
				console.log(newLocation);
				// const thisLocation = this.map.data.getFeatureById('currentLocation');

				const properties = Object.assign(
					{
						info: {
							name: newLocation.locationName,
							masterId: newLocation.masterId,
							population: newLocation.population,
							isMaster: true
						}
					},
					this.featuresPropertiesStyles.newlyOccupiedLocation
				);

				const newlyOwnedLoc = this.createLocByFeatureCoords(
					newLocation.mapFeatureCoords,
					newLocation.locationId,
					properties
				);

				console.log(newlyOwnedLoc);

				this.map.data.remove(this.currentLocationMapFeature);
				this.currentLocationMapFeature = null;
				// remove to separate method
				this.occupyBtn.style.display = 'none';
				//
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

		game.renderOccupiedLocations();

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
