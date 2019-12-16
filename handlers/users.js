const db = require('../models'); // refers to /models/index.js

exports.createUser = () => null;
exports.getUser = () => null;

exports.updateUser = async function(req, res, next) {
  try {
    let inputUser = {};
    if(req.file !== undefined) {
      let profileImageUrl = req.file.filename;
      inputUser = {...req.body, profileImageUrl};
    } else {
      inputUser = {...req.body};
    }
    // The { new: true } option tells mongoose to return the new updated document - took a lot of debugging to realise this one...
    let updatedUser = await db.User.findByIdAndUpdate(req.params.id,inputUser,{new:true});
    // .then((updatedUser) => {
      return res.status(200).json(updatedUser);
    // });
  } catch(e) {
    return next(e);
  }
}

exports.deleteUser = () => null;
