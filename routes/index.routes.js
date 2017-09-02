const express = require('express');

const router = express.Router();
// const index = require('../views/index.ejs');

router.get('/', (req, res) => {
	// console.log(req.body);
	res.render('index');
	// console.log(req.decoded);
	// next();
});


module.exports = router;
