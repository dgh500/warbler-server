const express = require('express');
const router = express.Router({mergeParams: true});

const { getByLocation } = require('../handlers/twitter');

router.route('/:location')
  .get(getByLocation);

module.exports = router;
