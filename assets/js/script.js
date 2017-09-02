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

		this.occupyBtn = document.getElementById('occupy-btn');
		this.userMarker = null;
		this.map = options.map || null;
		this.mapBounds = options.mapBounds || null;
		this.userGeoData = null;
		this.currentLocation = null;
		this.currentLocationMapFeature = null;
		this.currentHighlightedMapFeature = null;
		this.mapFeaturesArray = [];

		this.occupyBtn.addEventListener('click', () => {
			this.occupyLocation();
		});
	}

	get mapFeaturesStyles() {
		return {
			ownedLocation: {
				strokeColor: 'green',
				fillColor: 'green'
			},
			occupiedLocation: {
				strokeColor: 'gray',
				fillColor: 'gray'
			},
			profitLocation: {
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

	setMapBounds(mapBounds) {
		this.mapBounds = mapBounds;
	}

	renderOccupiedLocations() {
		new Promise((res, rej) => {
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
			.then((locArray) => {
				// geoJSON = this.modifyGeoJSON(geoJSON);
				locArray.forEach((location) => {
					const mapFeature = this.getAndRenderLocByFeatureCoords(location);
					console.log(mapFeature);
					this.mapFeaturesArray.push(mapFeature);
				});

				// this.map.data.addGeoJson(geoJSON);
				navigator.geolocation.watchPosition((position) => {
					const userCoords = position.coords;
					console.log(userCoords);
					// this.setUserGeoData(userCoords);
					// this.setCurrentLocationByUserCoords();
					// this.centerMapByUserGeoData();
					// console.log(this.userGeoData);
					// this.addUserMarker();
				});
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
		let featureProperties = {};
		featureProperties.info = {};
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
		game.map.data.setStyle((feature) => {
			const strokeColor = feature.getProperty('strokeColor') || 'gray';
			const fillColor = feature.getProperty('fillColor') || 'white';
			const fillOpacity = feature.getProperty('fillOpacity') || 0.2;
			const strokeWeight = feature.getProperty('strokeWeight') || 1;
			const strokeOpacity = feature.getProperty('strokeOpacity') || 0.5;
			return /** @type {google.maps.Data.StyleOptions} */({
				fillColor,
				fillOpacity,
				strokeColor,
				strokeWeight,
				strokeOpacity
			});
		});

		game.renderOccupiedLocations();

		game.map.addListener('click', (event) => {
			game.hilightEmptyLocation(event);
		});
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
