const express = require('express');
const router = express.Router({mergeParams: true});

const { reverseGeoLookup } = require('../handlers/locationIq');

router.route('/:lat/:long')
  .get(reverseGeoLookup);

module.exports = router;
