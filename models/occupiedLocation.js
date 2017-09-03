const EmptyLocation = require('./emptyLocation');

class OccupiedLocation extends EmptyLocation {
	constructor(locationData) {
		super(locationData.northWest);
		this.masterId = locationData.userId;
		this.masterName = locationData.userName;
		this.locationId = locationData.locationId || null;
		this.population = locationData.population || 10;
		this.dailyBank = locationData.dailyBank || 0;
		this.loyalPopulation = locationData.loyalPopulation || 10;
		this.dailyCheckin = locationData.dailyCheckin || true;
		this.creationDate = locationData.creationDate || new Date().toISOString();
		this.locationName = locationData.locationName || null;
		this.dailyMessage = locationData.dailyMessage || null;
	}
	saveLocation() {
		return global.db.tx(t => t.batch([
			t.none(
				`insert into locations2 (
						lat, lng, population, daily_bank, 
						creation_date
					)
					values(
					${this.northWest.lat},
					${this.northWest.lng},
					${this.population},
					${this.dailyBank},
					'${this.creationDate}'
					)`
			),
			t.tx(t1 => t1.one(
				`select loc_id from locations2																			 
						where locations2.lat = ${this.northWest.lat} 
						and locations2.lng = ${this.northWest.lng}`
			)
				.then((data) => {
					this.locationId = data.loc_id;
					return t1.none(
						`insert into master_location2 (user_id, loc_id, loyal_popul, daily_checkin)
							values(
								${this.masterId},
								${this.locationId},
								${this.loyalPopulation},
								${this.dailyCheckin}
							)`
					);
				})
			)
		]));
	}

	editLocation() {
		return global.db(
			`update locations2
			 set loc_name = '${this.locationName}',
						daily_msg = '${this.dailyMessage}'
			 where loc_id = ${this.locationId}`
		);
	}

	doCheckin() {
		return global.db(
			`update master_locations
			 set daily_checkin = true
			 where loc_id = ${this.locationId}`
		);
	}

	takeDailyBank() {
		return global.db.tx(t => t.batch([
			t.none(
				`update users
				 set cash = cash + locations2.daily_bank
				 from locations2, master_location2
				 where locations2.loc_id = master_location2.loc_id and locations2.loc_id = ${this.locationId} and id = ${this.masterId}`
			),
			t.none(
				`update locations2
				 set daily_bank = 0
				 where loc_id = ${this.locationId}`
			)
		]));
	}

	deleteLocation() {
		return global.db.tx(t => t.batch([
			t.none(
				`delete from locations2
				 where loc_id = ${this.locationId}`
			),
			t.none(
				`delete from master_location2
				 where loc_id = ${this.locationId}`
			)
		]));
	}

	restoreLoyalPopulation() {
		return global.db.tx(t => t.batch([
			t.none(
				`update users
				 set cash = cash - (population - loyal_popul)
				 from locations2, master_location2
				 where locations2.loc_id = master_location2.loc_id and locations2.loc_id = ${this.locationId} and id = ${this.masterId}`
			),
			t.none(
				`update master_location2
				 set loyal_popul = population
				 from locations2
			   where locations2.loc_id = master_location2.loc_id
				 and locations2.loc_id = ${this.locationId}`
			)
		]));
	}

	static deleteAllLocations() {
		global.db.none('delete from locations2');
	}

	static getAllLocations() {
		return global.db.any(`select * from locations2
													 full join master_location2 ON locations2.loc_id = master_location2.loc_id;`)
			.then(locations => new Promise((res) => {
				const occupiedLocations = [];
				locations.forEach((item) => {
					occupiedLocations.push(new OccupiedLocation({
						northWest: {
							lat: item.lat,
							lng: item.lng
						},
						locationId: item.loc_id,
						locationName: item.loc_name,
						userId: item.user_id,
						population: item.population,
						dailyBank: item.daily_bank,
						dailyMessage: item.daily_msg,
						loyalPopulation: item.loyal_pop,
						dailyCheckin: item.daily_checkin,
						creationDate: item.creation_date
					}));
				});
				res(occupiedLocations);
			}));
	}

	static getAllLocationsGeoJSON() {
		return OccupiedLocation.getAllLocations()
			.then(locArray => new Promise((res) => {
				const geoObj = {
					type: 'FeatureCollection',
					features: []
				};
				locArray.forEach((item) => {
					geoObj.features.push({
						type: 'Feature',
						id: item.locationId,
						properties: {
							color: 'gray',
							background: 'gray',
							info: {
								masterId: item.masterId,
								dailyBank: item.dailyBank > 0,
								population: item.population
							}
						},
						geometry: {
							type: 'Polygon',
							coordinates: [
								item.mapFeatureGeometry
							]
						}
					});
				});
				res(geoObj);
			})

			);
	}

	static getLocationById(id) {
		return global.db.one(
			`select * from locations2
			full join master_location2 on locations2.loc_id = master_location2.loc_id
			full join users on master_location2.user_id = users.id
			where locations2.loc_id = $1`, id
		)
			.then(foundLocation => new Promise((res) => {
				res(new OccupiedLocation({
					northWest: {
						lat: foundLocation.lat,
						lng: foundLocation.lng
					},
					locationId: foundLocation.loc_id,
					userId: foundLocation.user_id,
					userName: foundLocation.name,
					population: foundLocation.population,
					dailyBank: foundLocation.daily_bank,
					loyalPopulation: foundLocation.loyal_popul,
					dailyCheckin: foundLocation.daily_checkin,
					creationDate: foundLocation.creation_date,
					dailyMessage: foundLocation.daily_msg,
					locationName: foundLocation.loc_name
				}));
			}));
	}

	static checkLocationOnCoords(coords) {
		const location = new EmptyLocation(coords);

		return global.db.oneOrNone(`select * from locations2
						full join master_location2 on locations2.loc_id = master_location2.loc_id
						full join users on master_location2.user_id = users.id
						where locations2.lat = ${location.northWest.lat} and locations2.lng = ${location.northWest.lng}`)
			.then(foundLocation => new Promise((res) => {
				if (!foundLocation) {
					res(location);
				} else {
					res(new OccupiedLocation({
						northWest: {
							lat: foundLocation.lat,
							lng: foundLocation.lng
						},
						locationId: foundLocation.loc_id,
						userId: foundLocation.user_id,
						userName: foundLocation.name,
						population: foundLocation.population,
						dailyBank: foundLocation.daily_bank,
						loyalPopulation: foundLocation.loyal_popul,
						dailyCheckin: foundLocation.daily_checkin,
						creationDate: foundLocation.creation_date,
						dailyMessage: foundLocation.daily_msg,
						locationName: foundLocation.loc_name
					}));
				}
			}));
	}

	static recalcLocationsLifecycle() {
		global.db.tx(t => t.batch([
			t.none(`delete from locations2
							where loc_id IN (
								select loc_id from master_location2
								where loyal_popul = 0
							);`),
			t.none(`delete from master_location2
							where loyal_popul = 0;`)
		]))
			.then(() => global.db.none(`update locations2
																	set daily_bank = loyal_popul
																	from master_location2
																	where locations2.loc_id = master_location2.loc_id;`))
			.then(() => global.db.none(`update master_location2 
																	set loyal_popul = loyal_popul - ceil(loyal_popul * 0.1)
																	where daily_checkin = false;`))
			.then(() => global.db.none('update master_location2 set daily_checkin = false;'))
			.then(() => {
				console.log('OK');
			})
			.catch((err) => {
				console.log(err.message);
			});
	}
}
module.exports = OccupiedLocation;
