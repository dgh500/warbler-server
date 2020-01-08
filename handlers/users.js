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

/**
 * Gets user statistics - requires req.params.id
 * Returns Obj.postCount
 */
exports.getUserStats = async function(req, res, next) {
  try {
    let postCount = await db.User.find({_id: req.params.id}, {messages: 1});
    let replyCountArr = await db.Message.find({},{replies: 1}).populate({
      path: 'replies',
      match: {"user": { "$in": [req.params.id] }},
      select: 'text -_id'
    });
    let replyCount = replyCountArr.reduce(function(acc,v) {
      if(v.replies.length !== 0) {
        acc+=v.replies.length;
      }
      return acc;
    }, 0);
    const userStats = {
      postCount: postCount[0].messages.length,
      replyCount: replyCount
    }

    return res.status(200).json(userStats);
  } catch(e) {
    return next(e);
  }
}

exports.deleteUser = () => null;
