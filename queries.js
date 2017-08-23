const promise = require('bluebird');

const options = {
  promiseLib: promise,
};

const pgp = require('pg-promise')(options);

const dbCredentials = { host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
  port: 5432,
  database: 'detamp7dm7n5kt',
  user: 'smdtzebruscqxv',
  password: 'b988acabcae53edc03642deec8eabbbd891f2c549a02100e9f5b134c624ea4cd',
  ssl: true,
  sslfactory: 'org.postgresql.ssl.NonValidatingFactory',
};
const db = pgp(dbCredentials);

function getLocations(req, res, next) {
  db.any('select * from locations')
    .then((data) => {
      res.status(200)
        .json({
          status: 'success',
          data,
          message: 'all locations are received',
        });
    })
    .catch(err => next(err));
}

function getSingleLocation(req, res, next) {
  // need to update function
  const locId = req.params.id;
  db.one('select * from locations where loc_id = $1', locId)
    .then((data) => {
      res.status(200)
        .json({
          status: 'success',
          data,
          message: 'one location is received',
        });
    })
    .catch(err => next(err));
}

function createLocation(req, res, next) {
  // test update. need to get user from cookie and insert row to masters
  const locationLat = Math.floor(req.body.userLat * 100) / 100;
  const locationLng = Math.floor(req.body.userLng * 100) / 100;
  const locationId = `${locationLat * 100}${locationLng * 100}`;
  db.none(`insert into locations(loc_id, lat, lng, population, daily_bank)
           values('${locationId}', ${locationLat}, ${locationLng}, 10, 0)`)
    .then(() => {
      res.status(200)
        .json({
          message: 'added the location',
        });
    })
    .catch(err => next(err));
}


module.exports = {
  getLocations,
  getSingleLocation,
  createLocation,
};

