let promise = require('bluebird');
let options = {
	promiseLib: promise
};

let pgp = require('pg-promise')(options);
let dbCredentials = { host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
	port: 5432,
	database: 'detamp7dm7n5kt',
	user: 'smdtzebruscqxv',
	password: 'b988acabcae53edc03642deec8eabbbd891f2c549a02100e9f5b134c624ea4cd',
	ssl: true,
	sslfactory: 'org.postgresql.ssl.NonValidatingFactory'
};
let db = pgp(dbCredentials);

function getLocations(req, res, next) {
	db.any('select * from locations')
		.then((data) => {
			res.status(200)
				.json({
					status:'success',
					data: data,
					message: 'all locations are received'
				});
		})
		.catch((err) => next(err));
}

function getSingleLocation(req, res, next) {
	let locId = parseInt(req.params.id);
	db.one('select * from locations where loc_id = $1', locId)
		.then((data) => {
			res.status(200)
				.json({
					status: 'success',
					data: data,
					message: 'one location is received'
				});
		})
		.catch((err) => next(err));
}

function createLocation(req, res, next) {
	db.none('insert into locations(lat, lng, population, daily_msg, master)' +
		'values(${coords.lat}, ${coords.lng}, ${population}, ${msg}, ${master})',
		req.body)
		.then(() => {
			res.status(200)
				.json({
					message: 'added the location'
				})
		})
		.catch((err) => next(err));
}


module.exports = {
	getLocations: getLocations,
	getSingleLocation: getSingleLocation,
	createLocation: createLocation
};

