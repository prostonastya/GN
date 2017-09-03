'use strict';

class Game {
	constructor(options) {
		// use template for output
		options = options || {};

		this.locInfoContainer = options.locInfoContainer || document.getElementById('loc-info');
		this.clickedLocInfo = options.locInfoContainer || document.getElementById('clicked-loc-info');
		this.currentLocInfo = options.locInfoContainer || document.getElementById('current-loc-info');

		// this.usersGeocordsInfo = document.getElementById('users-geocords');
		// this.clickedInfo = document.getElementById('output');
		// this.clickedLocationHeading = document.getElementById('click-loc-heading');
		// this.clickedLocationInfo = document.getElementById('click-location');
		// this.usersLocContainer = document.getElementById('current-loc-info');
		// this.usersLocationInfo = document.getElementById('users-location');
		// // ---^

		this.occLocRenderedEvent = new CustomEvent('occloc-ready', {
			bubbles: true
		});
		this.occupyBtn = document.getElementById('occupy-btn');
		this.userMarker = null;
		this.map = options.map || null;
		this.mapBounds = options.mapBounds || null;
		this.userGeoData = null;
		this.currentLocation = null;
		this.currentLocationMapFeature = null;
		this.highlightedLocation = null;
		this.currentHighlightedMapFeature = null;
		this.occupiedLocationsArray = null;
		this.mapFeaturesArray = [];

		// this.occupyBtn.addEventListener('click', () => {
		// 	this.occupyLocation();
		// });
	}

	get mapFeaturesStyles() {
		return {
			defaultStyles: {
				strokeColor: 'gray',
				fillColor: 'transparent',
				fillOpacity: 0.2,
				strokeWeight: 1,
				strokeOpacity: 1
			},
			ownedLocation: {
				fillColor: 'green'
			},
			occupiedLocation: {
				fillColor: 'gray'
			},
			profitLocation: {
				strokeColor: 'orange',
				strokeWeight: 3
			},
			highlightedEmptyLocation: {
				strokeColor: 'blue'
			},
			currentLocation: {
				strokeColor: 'crimson'
			}
		};
	}

	updateMapBounds() {
		this.setMapBounds({
			northEast: {
				lat: this.map.getBounds().getNorthEast().lat(),
				lng: this.map.getBounds().getNorthEast().lng()
			},
			southWest: {
				lat: this.map.getBounds().getSouthWest().lat(),
				lng: this.map.getBounds().getSouthWest().lng()
			}
		});
	}

	getLocationInfoById(id) {
		return new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();

			xhr.open('GET', `/api/locations/${id}`);
			xhr.send();
			xhr.addEventListener('load', (e) => {
				const getLocationInfoXHR = e.srcElement;

				if (getLocationInfoXHR.status !== 200) {
					rej(getLocationInfoXHR.response);
				}
				res(JSON.parse(getLocationInfoXHR.response));
			});
		});
	}

	renderCurrentLocationInfo() {
		this.getCurrentLocation()
			.then((currentLocation) => {
				this.currentLocation = currentLocation;
				console.log(currentLocation);
				if (!currentLocation.masterId) {
					this.renderCurrentEmptyLocationInfo(currentLocation);
				} else {
					this.renderCurrentOccupiedLocationInfo(currentLocation);
				}
			});
	}

	getCurrentLocation() {
		const geoCoords = {
			lat: this.userGeoData.latitude,
			lng: this.userGeoData.longitude
		};
		return new Promise((res, rej) => {
			const gridXHR = new XMLHttpRequest();
			gridXHR.open('GET', `/api/locations/check-location?lat=${geoCoords.lat}&lng=${geoCoords.lng}`);
			gridXHR.send();
			gridXHR.onload = (e) => {
				const xhr = e.srcElement;
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(JSON.parse(xhr.response));
			};
		});
	}

	renderCurrentEmptyLocationInfo(currentLocation) {
		currentLocation.isCurrent = true;
		this.currentLocationMapFeature = this.getAndRenderLocByFeatureCoords(
			currentLocation
		);
	}

	renderOccupiedLocationInfo(targetFeatureId) {
		this.getLocationInfoById(targetFeatureId)
			.then((clickedLocation) => {
				console.log(clickedLocation);
				this.highlightOccupiedLocation(clickedLocation);
			});
	}

	renderEmptyLocationInfo(event) {
		this.getGridByGeoCoords({
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		})
			.then((clickedLocation) => {
				console.log(clickedLocation);
				this.highlightEmptyLocation(clickedLocation);
			});
	}

	removeHighlight() {
		if (this.currentHighlightedMapFeature) {
			const highlightedLocId = this.currentHighlightedMapFeature.getId();
			if (highlightedLocId || this.currentHighlightedMapFeature.getProperty('info').isCurrent) {
				this.highlightedLocation.isHighlighted = undefined;
				this.map.data.overrideStyle(
					this.currentHighlightedMapFeature,
					this.getMapFeatureProperties(this.highlightedLocation)
				);
			} else {
				this.map.data.remove(this.currentHighlightedMapFeature);
			}
		}
	}

	highlightOccupiedLocation(clickedLocation) {
		this.removeHighlight();

		const locId = clickedLocation.locationId;

		this.currentHighlightedMapFeature = this.map.data.getFeatureById(locId);
		this.highlightedLocation = this.getLoadedLocationById(locId);
		this.highlightedLocation.isHighlighted = true;
		this.map.data.overrideStyle(
			this.currentHighlightedMapFeature,
			this.getMapFeatureProperties(this.highlightedLocation)
		);
	}

	getLoadedLocationById(id) {
		let location;
		this.occupiedLocationsArray.forEach((item) => {
			if (item.locationId === id) {
				location = item;
			}
		});
		return location;
	}

	highlightEmptyLocation(clickedLocation) {
		this.removeHighlight();
		clickedLocation.isHighlighted = true;
		this.currentHighlightedMapFeature = this.getAndRenderLocByFeatureCoords(
			clickedLocation
		);
	}

	hightlightCurrentEmptyLocation() {
		this.removeHighlight();
		this.currentLocation.isHighlighted = true;
		this.highlightedLocation = this.currentLocation;
		this.currentHighlightedMapFeature = this.currentLocationMapFeature;
		this.map.data.overrideStyle(
			this.currentLocationMapFeature,
			this.getMapFeatureProperties(this.currentLocation)
		);
	}

	getGridByGeoCoords(geoCoords) {
		return new Promise((res, rej) => {
			const gridXHR = new XMLHttpRequest();
			gridXHR.open('GET', `/api/locations/grid?lat=${geoCoords.lat}&lng=${geoCoords.lng}`);
			gridXHR.send();
			gridXHR.onload = (e) => {
				const xhr = e.srcElement;
				if (xhr.status !== 200) {
					rej(xhr.response);
				}
				res(JSON.parse(xhr.response));
			};
		});
	}

	setUserGeoData(userCoord) {
		this.userGeoData = userCoord;
	}

	setMapBounds(mapBounds) {
		this.mapBounds = mapBounds;
	}

	getOccupiedLocations() {
		return new Promise((res, rej) => {
			const xhr = new XMLHttpRequest();

			xhr.open('GET', '/api/locations/');
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
			.then(locArray => new Promise((res) => {
				this.occupiedLocationsArray = locArray;
				res();
			}));
	}

	renderOccupiedLocations() {
		this.getOccupiedLocations()
			.then(() => {
				this.occupiedLocationsArray.forEach((location) => {
					const mapFeature = this.getAndRenderLocByFeatureCoords(location);
					this.mapFeaturesArray.push(mapFeature);
				});

				document.dispatchEvent(this.occLocRenderedEvent);
			})
			.catch((err) => {
				console.log(err);
			});
	}

	getAndRenderLocByFeatureCoords(location) {
		const properties = this.getMapFeatureProperties(location);

		const locationGeoObj = {
			type: 'Feature',
			id: location.locationId,
			properties,
			geometry: new google.maps.Data.Polygon([location.mapFeatureCoords])
		};
		return this.map.data.add(locationGeoObj);
	}

	getMapFeatureProperties(location) {
		let featureProperties = this.mapFeaturesStyles.defaultStyles;
		featureProperties.info = {};
		featureProperties.info.isHighlighted = location.isHighlighted;
		featureProperties.info.isCurrent = location.isCurrent;

		if (location.masterId) {
			if (location.isMaster) {
				featureProperties = Object.assign(
					featureProperties,
					this.mapFeaturesStyles.ownedLocation
				);
				if (location.dailyBank !== 0) {
					featureProperties = Object.assign(
						featureProperties,
						this.mapFeaturesStyles.profitLocation
					);
				}
			} else {
				featureProperties = Object.assign(
					featureProperties,
					this.mapFeaturesStyles.occupiedLocation
				);
			}
			featureProperties.info.name = location.locationName;
			featureProperties.info.population = location.population;
			featureProperties.info.masterId = location.masterId;
		} else {
			featureProperties.info.name = 'Empty location';
		}

		if (location.isCurrent) {
			featureProperties = Object.assign(
				featureProperties,
				this.mapFeaturesStyles.currentLocation
			);
		}
		if (location.isHighlighted) {
			featureProperties = Object.assign(
				featureProperties,
				this.mapFeaturesStyles.highlightedEmptyLocation
			);
		}

		return featureProperties;
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

	getLocInfoHTML(location) {
		return `<a href="#" class="close">close</a>
            <div>
              <h2 class="info-heading">${location.locationName}</h2>
              <p>Location coords: ${location.northWest.lat} ${location.northWest.lng}</p>
            </div>
            <button class="occupy-btn" id="occupy-btn" style="display: none">Occupy</button>
            `;
	}
}

function initMap() {
	// const game = new Game();
	const map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: { lat: 49.9891, lng: 36.2322 },
		clickableIcons: false
	});


	window.onload = function () {
		const game = new Game({
			map,
			mapBounds: {
				northEast: {
					lat: map.getBounds().getNorthEast().lat(),
					lng: map.getBounds().getNorthEast().lng()
				},
				southWest: {
					lat: map.getBounds().getSouthWest().lat(),
					lng: map.getBounds().getSouthWest().lng()
				}
			}
		});


		map.data.setStyle((feature) => {
			const defaultStyles = game.mapFeaturesStyles.defaultStyles;
			const strokeColor = feature.getProperty('strokeColor') || defaultStyles.strokeColor;
			const fillColor = feature.getProperty('fillColor') || defaultStyles.fillColor;
			const fillOpacity = feature.getProperty('fillOpacity') || defaultStyles.fillOpacity;
			const strokeWeight = feature.getProperty('strokeWeight') || defaultStyles.strokeWeight;
			const strokeOpacity = feature.getProperty('strokeOpacity') || defaultStyles.strokeOpacity;
			return /** @type {google.maps.Data.StyleOptions} */({
				fillColor,
				fillOpacity,
				strokeColor,
				strokeWeight,
				strokeOpacity
			});
		});

		document.addEventListener('occloc-ready', initMapInteraction);

		game.renderOccupiedLocations();

		function initMapInteraction() {
			navigator.geolocation.watchPosition((position) => {
				game.setUserGeoData(position.coords);
				game.renderCurrentLocationInfo();
			});

			map.addListener('click', (event) => {
				game.renderEmptyLocationInfo(event);
			});

			map.data.addListener('click', (event) => {
				const targetFeatureId = event.feature.getId();
				if (targetFeatureId) {
					game.renderOccupiedLocationInfo(targetFeatureId);
				}
				if (!targetFeatureId && event.feature.getProperty('info').isCurrent) {
					game.hightlightCurrentEmptyLocation();
				}
			});

			document.removeEventListener('occloc-ready', initMapInteraction);
		}
	};
	// game.usersLocContainer.addEventListener('click', (e) => {
	// 	if (e.target.classList[0] === 'close') {
	// 		game.usersLocContainer.classList.toggle('open');
	// 	}
	// });
	// game.clickedInfo.addEventListener('click', (e) => {
	// 	if (e.target.classList[0] === 'close') {
	// 		game.clickedInfo.classList.toggle('open');
	// 	}
	// });
}
