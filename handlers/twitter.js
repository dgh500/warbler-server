const axios = require('axios');

exports.getByLocation = async function(req, res, next) {
  try {
    const token = 'AAAAAAAAAAAAAAAAAAAAANLzBwEAAAAAwyaT6kFJytW8bU2V5alq8Vhuk4o%3D6kTCgZrfLuyZGTJCMYTFdV7qai9A6oGjgLywQErssXQyz9qovv';
    const instance = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    instance({
        method: 'get',
        url: `https://api.twitter.com/1.1/trends/place.json?id=${req.params.location}&grant_type=client_credentials`,
        withCredentials: true
      })
      .then(function(result) {
        let resultTags = result.data[0].trends.map((v,i) => {
          if(v.name[0] === '#') {
            return v.name;
          }
        });
        return res.status(200).json({resultTags});
//        console.log(resultTags);
      })
      .catch(function(error) {
        return next(error);
      });
  }
  catch(e) {
    return next(e);
  }
}

exports.getWoeid = async function(req, res, next) {
  try {
    const token = 'AAAAAAAAAAAAAAAAAAAAANLzBwEAAAAAwyaT6kFJytW8bU2V5alq8Vhuk4o%3D6kTCgZrfLuyZGTJCMYTFdV7qai9A6oGjgLywQErssXQyz9qovv';
    const instance = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    instance({
        method: 'get',
        url: `https://api.twitter.com/1.1/trends/closest.json?lat=${req.params.lat}&long=${req.params.long}`,
        withCredentials: true
      })
      .then(function(result) {
        let woeid = result.data[0].woeid;
        return res.status(200).json({woeid});
//        console.log(resultTags);
      })
      .catch(function(error) {
        return next(error);
      });
  } catch(e) {
    return next(e);
  }
}
