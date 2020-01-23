const axios = require('axios');

exports.reverseGeoLookup = async function(req, res, next) {
  try {
    // return res.status(200).json({'foo':'bar'});
    const key = '4d509ae7d11400';
    const instance = axios.create();
    instance({
      method: 'get',
      url: `https://eu1.locationiq.com/v1/reverse.php?key=${key}&lat=${req.params.lat}&lon=${req.params.long}&format=json`
    })
    .then(function(result) {
      let locationIqResult = result;
      // console.log(locationIqResult.data.address.city);
      return res.status(200).json({'city':locationIqResult.data.address.city});

    })
    .catch(function(error) {
      return next(error);
    });
  }
  catch(e) {
    return next(e);
  }
}
