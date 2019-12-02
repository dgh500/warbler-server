require('dotenv').config();
const jwt = require('jsonwebtoken');

// Make sure the user is logged - Authentication
exports.loginRequired = function(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    // verify checks that the token hasn't been tampered with
    jwt.verify(token, process.env.SECRET_KEY, function(err, decoded) {
      if(decoded) {
        // If the token is successfully verified then move on - this function just
        return next();
      } else {
        // Token has been tampered with or otherwise made invalid
        return next({
          status: 401,
          message: "Please log in first"
        });
      }
    });
  } catch(e) {
    // This will typically be if req.headers.authorisation is undefined
    return next({
      status: 401,
      message: "Please log in first"
    });
  }
};

// Make sure we get the correct user - Authorization
exports.ensureCorrectUser = function(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    jwt.verify(token, process.env.SECRET_KEY, function(err, decoded) {
      /*
       * The URL will contain the User's ID - for req.params.id - while the token
       * payload will contain the ID of the user when they logged in - making sure they match
       * stops a logged in user changing the user ID in the URL to another user's ID
       */
      if(decoded && decoded.id === req.params.id) {
        return next();
      } else {
        return next({
          status: 401,
          message: "Unauthorised"
        });
      }
    });
  } catch(e) {
    return next({
      status: 401,
      message: "Unauthorised"
    });
  }
};
