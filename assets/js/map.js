'use strict';


var map;
function initMap() {
	const usersGeocordsInfo = document.getElementById('users-geocords');

	const clickedInfo = document.getElementById('output');
	const clickedCordsInfo = document.getElementById('click-geocords');
	const clickedLocationInfo = document.getElementById('click-location');
	const usersLocContainer = document.getElementById('current-loc-info');
	const usersLocationInfo = document.getElementById('users-location');
	const occupyBtn = document.getElementById('occupy-btn');

	let currentLocationId = 0;


	occupyBtn.addEventListener('click', occupyLocation);

	






	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: {lat: 49.9891, lng: 36.2322}
	});


	let obj = {
		"type": "FeatureCollection",
		"features": [
		  {
			"type": "Feature",
			"id": "1",
			"properties": {
				"color": "green",
			  "info": {
				"name": "location01"
			  }
			},
			"geometry": {
			  "type": "Polygon",
			  "coordinates": [
				[
				   [36.24,49.99], [36.24,49.98], [36.23,49.98], [36.23,49.99], [36.24,49.99]
				]
			  ]
			}
		  }
		]
	  };
	
	map.data.addGeoJson(obj);


	map.data.setStyle(function(feature) {
		var color = 'gray';
		if (feature.getProperty('color')) {
		  color = feature.getProperty('color');
		}
		return /** @type {google.maps.Data.StyleOptions} */({
		  fillColor: color,
		  strokeColor: color,
		  strokeWeight: 2
		});
	  });



	

		window.onload = function() {
			var lat0 = map.getBounds().getNorthEast().lat();
			var lng0 = map.getBounds().getNorthEast().lng();
			var lat1 = map.getBounds().getSouthWest().lat();
			var lng1 = map.getBounds().getSouthWest().lng();
			console.log(lat0, lng0, lat1, lng1);

		};
	// Set mouseover event for each feature.
	map.data.addListener('click', function(event) {
		if(event.feature.getId() === 0) {
			occupyLocation(event.feature);
		}
		document.getElementById('info-box').textContent =
			event.feature.getProperty('info').name;
	});
	map.addListener('click', function( event ){
		let lat01 = Math.floor(event.latLng.lat()*100) / 100;
		let lng01 = Math.floor(event.latLng.lng()*100) / 100;
		
		clickedInfo.style.display = 'block';
		clickedCordsInfo.textContent = `${event.latLng.lat()} ${event.latLng.lng()}`;
		clickedLocationInfo.textContent = `${lat01} ${lng01}`;

		var location = [
			{lat: lat01, lng: lng01}, // north west
			{lat: (lat01*100 + 1)/100, lng: lng01}, // south west
			{lat: (lat01*100 + 1)/100, lng: (lng01*100 + 1)/100}, // south east
			{lat: lat01, lng: (lng01*100 + 1)/100}  // north east
		];
		let locationId = Math.floor(Math.random() * new Date() / 100000);
		var locationNew = {
			"type": "Feature",
			"id": locationId,
			"properties": {
				"color": "blue",
				"info": {
					"name": "location " + locationId
				}
			},
			"geometry": new google.maps.Data.Polygon([location])
		};
		console.log(locationNew);
		map.data.add(locationNew);
		setTimeout(function(){
			if (!confirm('Поставить поселение?')) {
				map.data.remove(map.data.getFeatureById(locationNew.id));
				console.log(map.data.getFeatureById(locationNew.id));
				
			}
		}, 1000);
	});


	getUserLocation();


	function getUserLocation() {
		navigator.geolocation.watchPosition((position) => {
		  usersGeocordsInfo.textContent = `${position.coords.latitude} 
										   ${position.coords.longitude}
										   ${position.coords.accuracy}`;
	
			usersLocContainer.style.display = 'block';
			let latCurrent = Math.floor(position.coords.latitude*100) / 100;
			let lngCurrent = Math.floor(position.coords.longitude*100) / 100;

			usersLocationInfo.textContent = `${latCurrent} 
											${lngCurrent}`;
			
			
			var location = [
				{lat: latCurrent, lng: lngCurrent}, // north west
				{lat: (latCurrent*100 + 1)/100, lng: lngCurrent}, // south west
				{lat: (latCurrent*100 + 1)/100, lng: (lngCurrent*100 + 1)/100}, // south east
				{lat: latCurrent, lng: (lngCurrent*100 + 1)/100}  // north east
			];
			let locationId = currentLocationId;
			
			var locationAddition = {
				"type": "Feature",
				"id": locationId,
				"properties": {
					"color": "crimson",
					"info": {
						"name": "location " + locationId
					}
				},
				"geometry": new google.maps.Data.Polygon([location])
			};
			map.data.add(locationAddition);
	
		
		});
	}


	function occupyLocation(feature) {
		alert('Congrats!');
		feature.setProperty("color", "blue");


		let locationId = Math.floor(Math.random() * new Date() / 100000);
		var locationNew = {
			"type": "Feature",
			"id": locationId,
			"properties": {
				"color": "blue",
				"info": {
					"name": "location " + locationId
				}
			},
			"geometry": feature.getGeometry()
		};

		map.data.add(locationNew);

		map.data.remove(feature);
	   };



	
}
