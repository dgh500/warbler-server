const db = require('../models');
const jwt = require ('jsonwebtoken');

exports.signup = async function(req, res, next) {
  try {
    // create a user
    let profileImageUrl = req.file.filename;
    let newUser = {...req.body, profileImageUrl};
    let user = await db.User.create(newUser);
    let { id, username } = user;
    // create a token (signing a token)
    let token = jwt.sign({
      id,
      username,
      profileImageUrl
    },
    process.env.SECRET_KEY);
    return res.status(200).json({
      id,
      username,
      profileImageUrl,
      token
    });
  } catch(err) {
    // see what kind of error
    if(err.code === 11000) {
      err.message = 'Sorry, that username and/or email is taken';
    }
    return next({
      status: 400,
      message: err.message
    })
  }
}

exports.signin = async function(req, res, next) {
  try {
    let user = await db.User.findOne({
      email: req.body.email
    });
    let { id, username } = user;
    let isMatch = await user.comparePassword(req.body.password);
    if(isMatch) {
      let token = jwt.sign({
        id,
        username,
        profileImageUrl
      },
      process.env.SECRET_KEY);
      return res.status(200).json({
        id,
        username,
        profileImageUrl,
        token
      });
    } else {
      return next({
        status: 400,
        message: 'Invalid Email / Password'
      });
    }
  } catch(e) {
    return next({
      status: 400,
      message: 'Invalid Email / Password'
    });
  }
}
