let express = require('express');
let router = express.Router();
let db = require('../queries');

/*router.get('/', (req, res) => {
	let htmlForm = '<form method="POST" action="/api/locations" id="form">Enter msg<input type="text" name="msg" id="msg"/><input type="submit" value="submit"/></form><script src="/javascripts/script.js"></script>';
	res.send(htmlForm);
})*/
router.get('/api/locations', db.getLocations);
router.get('/api/locations/:id', db.getSingleLocation);
router.post('/api/locations', db.createLocation);
router.delete('/api/locations/:id', db.deleteLocation);

module.exports = router;