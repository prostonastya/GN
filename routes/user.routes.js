const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const nodemailer = require('nodemailer');

const router = express.Router();

const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.SERVICE_EMAIL,
		pass: process.env.SERVICE_EMAIL_PASS
	}
});

router.route('/login')
	.get((req, res) => {
		res.render('login');
	})
	.post((req, res) => {
		const email = req.body['log-email'];
		const password = req.body['log-pass'];

		// business-login in controller!

		global.db.one(`SELECT * FROM users
		WHERE email = '${email}';`)
			.then((data) => {
				if (!data.password) {
					res.redirect('/login');
				}
				if (data.password === password) {
				// create a token
					const payload = {
						id: data.id,
						email: data.email,
						name: data.name,
						isAdmin: data.is_admin
					};
					const token = jwt.sign(payload, 'secret', {
						expiresIn: 60 * 60 * 24
					});
					res.cookie('auth', token);
					res.redirect('../');
				} else {
					res.redirect('/login');
				}
			}).catch((err) => {
				console.log(err);
				res.redirect('/login');
			});
	});

router.post('/register', (req, res) => {
	const name = req.body['reg-name'];
	const email = req.body['reg-email'];
	const pass = req.body['reg-pass'];
	const passCheck = req.body['reg-pass-repeat'];
	if (pass !== passCheck) {
		res.send('Passwords didn\'t match.');
	}
	const userData = {
		name,
		email,
		pass
	};
	const newUser = new User(userData);
	newUser.saveNewUser();
	const letter = newUser.createLetter(newUser.email);
	newUser.sendMail(letter, transporter);
	res.redirect('../');
});

router.post('/logout', (req, res) => {
	res.clearCookie('auth');
	res.redirect('/login');
});

module.exports = router;
