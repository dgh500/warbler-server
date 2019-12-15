const db = require('../models'); // refers to /models/index.js

exports.createUser = () => null;
exports.getUser = () => null;

exports.updateUser = async function(req, res, next) {
  try {
    let inputUser = {...req.body};
    let updatedUser = await db.User.findByIdAndUpdate(req.params.id,inputUser)
    .then((updatedUser) => {
      return res.status(200).json(updatedUser);
    });
  } catch(e) {
    return next(e);
  }
}

exports.deleteUser = () => null;
