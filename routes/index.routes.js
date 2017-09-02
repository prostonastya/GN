const express = require('express');

const router = express.Router();
// const index = require('../views/index.ejs');

router.get('/', (req, res) => {
	res.render('index');
});


module.exports = router;
