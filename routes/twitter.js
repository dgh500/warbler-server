const express = require('express');
const router = express.Router({mergeParams: true});

const { getByLocation, getWoeid } = require('../handlers/twitter');

router.route('/lookup/:lat/:long')
  .get(getWoeid);

router.route('/:location')
  .get(getByLocation);

module.exports = router;
