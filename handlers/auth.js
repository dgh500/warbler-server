const db = require('../models');
const jwt = require ('jsonwebtoken');

exports.signup = async function(req, res, next) {
  try {
    let newUser = {};
    if(req.file !== undefined) {
      let profileImageUrl = req.file.filename;
      newUser = {...req.body, profileImageUrl};
    } else {
      newUser = {...req.body};
    }
    let user = await db.User.create(newUser);
    let { id, username, profileImageUrl, email } = user;
    // create a token (signing a token)
    let token = jwt.sign({
      id,
      username,
      profileImageUrl,
      email,
      username
    },
    process.env.SECRET_KEY);
    return res.status(200).json({
      id,
      username,
      profileImageUrl,
      email,
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
    let { id, username, profileImageUrl, email } = user;
    let isMatch = await user.comparePassword(req.body.password);
    if(isMatch) {
      let token = jwt.sign({
        id,
        email,
        profileImageUrl,
        username
      },
      process.env.SECRET_KEY);
      return res.status(200).json({
        id,
        email,
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
