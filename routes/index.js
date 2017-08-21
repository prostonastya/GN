let express = require('express');
let router = express.Router();

let db = require('../queries');

router.get('/api/locations', db.getLocations);
router.get('/api/locations/:id', db.getSingleLocation);
/*router.get('/api/puppies', db.getAllPuppies);
router.get('/api/puppies/:id', db.getSinglePuppy);*/
/*router.post('/api/puppies', db.createPuppy);
router.put('/api/puppies/:id', db.updatePuppy);
router.delete('/api/puppies/:id', db.removePuppy);*/


module.exports = router;