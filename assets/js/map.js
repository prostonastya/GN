'use strict';

let map;

function initMap() {
  const usersGeocordsInfo = document.getElementById('users-geocords');
  const clickedInfo = document.getElementById('output');
  // const clickedCordsInfo = document.getElementById('click-geocords');
  const clickedLocationHeading = document.getElementById('click-loc-heading');
  const clickedLocationInfo = document.getElementById('click-location');
  const usersLocContainer = document.getElementById('current-loc-info');
  const usersLocationInfo = document.getElementById('users-location');
  const occupyBtn = document.getElementById('occupy-btn');

  const currentLocationId = null;

  occupyBtn.addEventListener('click', occupyLocation);

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: { lat: 49.9891, lng: 36.2322 },
    clickableIcons: false,
  });

  // getting locations for rendering on map
  window.onload = function () {
    const lat0 = map.getBounds().getNorthEast().lat();
    const lng0 = map.getBounds().getNorthEast().lng();
    const lat1 = map.getBounds().getSouthWest().lat();
    const lng1 = map.getBounds().getSouthWest().lng();
    console.log(lat0, lng0, lat1, lng1);

    const getLocationPromise = new Promise((res, rej) => {
      const xhr = new XMLHttpRequest();

      xhr.open('GET', '/api/locations');
      xhr.send();
      xhr.addEventListener('load', (e) => {
        const srcXHR = e.target;
        if (srcXHR.status === 200) {
          res(JSON.parse(srcXHR.response).data);
        } else {
          rej(srcXHR.response);
        }
      });
    });

    getLocationPromise.then((locArray) => {
      const geoObj = {
        type: 'FeatureCollection',
        features: [],
      };

      // creating geoJSON Object from recieved data

      locArray.forEach((item) => {
        geoObj.features.push({
          type: 'Feature',
          id: item.loc_id,
          properties: {
            color: 'green',
            info: {
              master: item.master,
            },
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[
              +item.lng, +item.lat,
            ], [
              +item.lng, ((item.lat * 100) - 1) / 100,
            ], [
              ((item.lng * 100) - 1) / 100, ((item.lat * 100) - 1) / 100,
            ], [
              ((item.lng * 100) - 1) / 100, +item.lat,
            ], [
              +item.lng, +item.lat,
            ]]],
          },
        });
      });

      map.data.addGeoJson(geoObj);
    })
      .catch((err) => {
        console.log(err);
      });
  };

  map.data.setStyle((feature) => {
    let color = 'gray';
    if (feature.getProperty('color')) {
      color = feature.getProperty('color');
    }
    return /** @type {google.maps.Data.StyleOptions} */({
      fillColor: color,
      strokeColor: color,
      strokeWeight: 2,
    });
  });

  map.data.addListener('click', (event) => {
    // if (event.feature.getId() === 0) {
    // occupyLocation(event.feature);

    // get short location info
    if (event.feature.getId() === 'highlight') return;

    const getLocationInfoPromise = new Promise((res, rej) => {
      const xhr = new XMLHttpRequest();

      xhr.open('GET', `/api/locations/${event.feature.getId()}`);
      xhr.send();
      xhr.addEventListener('load', (e) => {
        const getLocationInfoXHR = e.srcElement;

        if (getLocationInfoXHR !== 200) {
          rej(getLocationInfoXHR.response);
        }
        res(getLocationInfoXHR.response);
      });
    });

    // need another SQL-query on server to get valid info (JOIN masters)

    getLocationInfoPromise
      .then((locationData) => {
        console.dir(JSON.parse(locationData));
      })
      .catch((err) => {
        console.log(err);
      });
    // }

    // create custom popup+ get request for info
  //   document.getElementById('info-box').textContent =
  //  event.feature.getProperty('info').name;
  });

  // click on empty location highlights location and shows info about it

  map.addListener('click', (event) => {
    if (map.data.getFeatureById('highlight')) {
      map.data.remove(map.data.getFeatureById('highlight'));
    }

    const lat01 = Math.floor(event.latLng.lat() * 100) / 100;
    const lng01 = Math.floor(event.latLng.lng() * 100) / 100;

    clickedInfo.style.display = 'block';
    // clickedCordsInfo.textContent = `${event.latLng.lat()} ${event.latLng.lng()}`;
    clickedLocationInfo.textContent = `${lat01} ${lng01}`;

    const location = [
      { lat: lat01, lng: lng01 }, // north west
      { lat: ((lat01 * 100) + 1) / 100, lng: lng01 }, // south west
      { lat: ((lat01 * 100) + 1) / 100, lng: ((lng01 * 100) + 1) / 100 }, // south east
      { lat: lat01, lng: ((lng01 * 100) + 1) / 100 }, // north east
    ];

    const locationNew = {
      type: 'Feature',
      id: 'highlight',
      properties: {
        color: 'blue',
        // info: {
        //   name: 'Empty location',
        // },
      },
      geometry: new google.maps.Data.Polygon([location]),
    };
    console.log(locationNew);
    map.data.add(locationNew);
    clickedLocationHeading.textContent = 'Empty location';
    // setTimeout(() => {
    //   if (!confirm('Поставить поселение?')) {
    //     map.data.remove(map.data.getFeatureById(locationNew.id));
    //     console.log(map.data.getFeatureById(locationNew.id));
    //   }
    //   // here post request for create location
    // }, 1000);
  });


  getUserLocation();


  function getUserLocation() {
    navigator.geolocation.watchPosition((position) => {
      usersGeocordsInfo.textContent = `${position.coords.latitude} 
                                     ${position.coords.longitude}
                                     ${position.coords.accuracy}`;

      usersLocContainer.style.display = 'block';
      const latCurrent = Math.floor(position.coords.latitude * 100) / 100;
      const lngCurrent = Math.floor(position.coords.longitude * 100) / 100;

      usersLocationInfo.textContent = `${latCurrent} 
                                     ${lngCurrent}`;

      // if location is already created - change bg color only
      // if user go out from location - delete location

      const location = [
        { lat: latCurrent, lng: lngCurrent }, // north west
        { lat: ((latCurrent * 100) + 1) / 100, lng: lngCurrent }, // south west
        { lat: ((latCurrent * 100) + 1) / 100, lng: ((lngCurrent * 100) + 1) / 100 }, // south east
        { lat: latCurrent, lng: ((lngCurrent * 100) + 1) / 100 }, // north east
      ];
      const locationId = currentLocationId;

      const locationAddition = {
        type: 'Feature',
        id: locationId,
        properties: {
          color: 'crimson',
          info: {
            name: `location ${locationId}`,
          },
        },
        geometry: new google.maps.Data.Polygon([location]),
      };
      map.data.add(locationAddition);
    });
  }


  function occupyLocation() {
    const createLocatonPromise = new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition((position) => {
        res(position.coords);
      }, (err) => {
        rej(err);
      }, {
        enableHighAccuracy: true,
        maximumAge: 0,
      });
    });
    createLocatonPromise
      .then((userCoords) => {
        console.log(userCoords);
        return new Promise((res, rej) => {
          const createLocationXHR = new XMLHttpRequest();
          createLocationXHR.open('POST', 'api/locations');
          createLocationXHR.setRequestHeader('Content-Type', 'application/json');
          createLocationXHR.send(JSON.stringify({
            userLat: userCoords.latitude,
            userLng: userCoords.longitude,
            accuracy: userCoords.accuracy,
          }));
          createLocationXHR.addEventListener('load', (e) => {
            const xhr = e.srcElement;

            if (xhr !== 200) {
              rej(xhr.response);
            }

            res(xhr.response);
          });
        });
      })
      .then((response) => {
        console.log(response);
      })
      .catch((err) => {
        console.log(err);
      });

    // const locationId = Math.floor((Math.random() * new Date()) / 100000);
    // const locationNew = {
    //   type: 'Feature',
    //   id: locationId,
    //   properties: {
    //     color: 'blue',
    //     info: {
    //       name: `location ${locationId}`,
    //     },
    //   },
    //   geometry: feature.getGeometry(),
    // };
    // map.data.add(locationNew);
    // map.data.remove(feature);
  }
}
