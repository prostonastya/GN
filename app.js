'use strict';

const EventEmitter = require('events').EventEmitter;
const express = require('express');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
const path = require('path');
const auth = require('./middleware/auth');
const cookieParser = require('cookie-parser');
const favicon = require('serve-favicon');
const logger = require('morgan');
const locationsRoutes = require('./routes/locations.routes');
const userRoutes = require('./routes/user.routes');
const indexRoutes = require('./routes/index.routes');
const schedule = require('node-schedule');
require('dotenv').config();

const app = express();
// const port = process.env.PORT || 8080;
const eventEmitter = new EventEmitter();

global.db = pgp({
	host: 'ec2-23-21-85-76.compute-1.amazonaws.com',
	port: 5432,
	database: 'detamp7dm7n5kt',
	user: process.env.SERVICE_DB_USER || 'smdtzebruscqxv',
	password: process.env.SERVICE_DB_PASS || 'b988acabcae53edc03642deec8eabbbd891f2c549a02100e9f5b134c624ea4cd',
	ssl: true,
	sslfactory: 'org.postgresql.ssl.NonValidatingFactory'
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// middlewares
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static('assets'));
app.use(favicon('./assets/favicon.png'));


app.use('/user', userRoutes);
app.use('/', auth);
app.all('/', indexRoutes);
app.use('/api/locations', locationsRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use((err, req, res) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.send(err.message);
	// res.render('error');
});

// function createNewUser(user) {
// 	global.db.none('insert into users(email, password, reg_date, cash, name)' +
// `values('${user.email}', '${user.pass}', '${new Date().toISOString()}', 150, '${user.name}')`)
// 		.then(() => console.log('New user was added to db'))
// 		.catch(error => console.log('error:', error));
// }

// function createLetter(userEmail) {
// 	return {
// 		from: '"Game team" <gamekh009@gmail.com>', // sender address
// 		to: userEmail, // receivers
// 		subject: 'Hello! new user! ✔', // Subject line
// 		text: 'Hello! We are glad that you joined our game', // plain text body
// 		html: '<b>Hello! We are glad that you joined our game!</b>', // html body
// 	};
// }

// function sendMail(letter) {
// 	transporter.sendMail(letter, (error, info) => {
// 		if (error) {
// 			console.log(error.message);
// 		} else {
// 			console.log(`Email sent: ${info.response}`);
// 		}
// 	});
// }


// schedule.scheduleJob('*/300 * * * * *', () => {
// 	console.log('daily event!');
// 	Location.recalcLocationsLifecycle();
// 	eventEmitter.emit('daily-event');
// });

eventEmitter.on('daily-event', () => {
	console.log('daily event handled!');
});

// global.db.none('delete from locations');

// app.listen(port, () => {
// 	console.log(`Listen on port: ${port}`);
// });
module.exports = app;
