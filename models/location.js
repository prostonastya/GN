const pgp = require('pg-promise')();

const db = pgp({
  host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
  port: 5432,
  database: 'detamp7dm7n5kt',
  user: 'smdtzebruscqxv',
  password: 'b988acabcae53edc03642deec8eabbbd891f2c549a02100e9f5b134c624ea4cd',
  ssl: true,
  sslfactory: 'org.postgresql.ssl.NonValidatingFactory',
});

module.exports = class Location {
  constructor(userData) {
    this.lat = Math.floor(userData.userLat * 100) / 100;
    this.lng = Math.floor(userData.userLng * 100) / 100;
    this.locationId = `${Math.round(this.lat * 100)}${Math.round(this.lng * 100)}`;
    this.masterId = 1; // get from req when auth will be ready
    this.population = 10;
    this.dailyBank = 0;
    this.loyalPopulation = 1;
    this.dailyCheckin = true;
    this.creationDate = new Date();
  }

  saveLocation() {
    return db.none(`insert into locations (loc_id, lat, lng, population, daily_bank, creation_date)
                    values(
                      '${this.locationId}', 
                      ${this.lat}, 
                      ${this.lng}, 
                      ${this.population}, 
                      ${this.dailyBank}, 
                      '${this.creationDate.toISOString()}'
                    )`);

    // need to make transaction with master-location

    // return db.tx((transaction) => {
    //   const createLocationQuery = transaction.none(
    //     `insert into locations (loc_id, lat, lng, population, daily_bank, creation_date)
    //      values(
    //        '${this.locationId}', 
    //        ${this.lat}, 
    //        ${this.lng}, 
    //        ${this.population}, 
    //        ${this.dailyBank}, 
    //        '${this.creationDate.toISOString()}'
    //     )`);
    //   const createMasterQuery = transaction.one(
    //     `insert into master_location (user_id, loc_id, loyal_popul, daily_checkin)
    //      values(
    //        ${this.masterId}, 
    //        '${this.locationId}', 
    //        ${this.loyalPopulation}, 
    //        ${this.dailyCheckin}
    //      )`);

    //   return transaction.batch([createLocationQuery, createMasterQuery]);
    // });
  }

  static getAllLocations() {
    return db.any(`select locations.loc_id AS loc_id, lat, lng, user_id from locations
                   full join master_location ON locations.loc_id = master_location.loc_id;`);
  }

  static getLocationById(id) {
    return db.one(`select locations.loc_id AS loc_id, lat, lng, user_id from locations
            full join master_location on locations.loc_id = master_location.loc_id 
            where locations.loc_id = $1`, id);
  }
};
