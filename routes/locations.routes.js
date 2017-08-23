const express = require('express');
const Location = require('../models/location');

const router = express.Router();

router.get('/', (req, res, next) => {
  Location.getAllLocations()
    .then((locations) => {
      res.status(200)
        .json(locations);
    })
    .catch(err => next(err));
});
router.get('/:id', (req, res, next) => {
  Location.getLocationById(req.params.id)
    .then((location) => {
      res.status(200)
        .json(location);
    })
    .catch(err => next(err));
});
router.post('/', (req, res, next) => {
  const newLocation = new Location(req.body);
  newLocation.saveLocation()
    .then(() => {
      res.sendStatus(200);
    })
    .catch(err => next(err));
});


module.exports = router;
