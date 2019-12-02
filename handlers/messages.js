const db = require('../models'); // refers to /models/index.js

exports.createMessage = async function(req, res, next) {
  try {
    let message = await db.Message.create({
      text: req.body.text,
      /*
      * When this is called, the user will be logged in - URL will be like /api/users/:id/messages
      * so can somewhat speculatively assume it will be in request.params
      */
      user: req.params.id
    });
    // Find the user so we can push the message ID to the User's messages array, and save user
    let foundUser = await db.User.findById(req.params.id);
    foundUser.messages.push(message.id);
    await foundUser.save();
    /*
     * This isn't strictly 'creating the message' it's populating the user field on the message document
     * to contain the 2 fields you need to DISPLAY the message, as this is what the app will do next.
     * Not convinced this shouldn't be in a separate func... but populate effectively swaps out the
     * ID being held in the .user field, with the document OF THAT USER so that the return value of
     * this function is the message complete with a username and profileImageUrl to be displayed
     */
    let foundMessage = await db.Message.findById(message._id).populate('user', {
      username: true,
      profileImageUrl: true
    });
    return res.status(200).json(foundMessage);
  } catch(e) {
    return next(e);
  }
};

// Assumes GET  -/api/users/:id/messages/:message_id
exports.getMessage = async function(req, res, next) {
  try {
    let message = await db.Message.find(req.params.message_id);
    return res.status(200).json(message);
  } catch(e) {
    return next(e);
  }
};


exports.deleteMessage = async function(req, res, next) {
  try {
    /*
     * Have to use this instead of findByIdAndRemove mongoose method, as that wouldn't work with
     * the .pre hook in the models/message.js file which is on the 'remove' method
     */
    let foundMessage = await db.Message.findById(req.params.message_id);
    await foundMessage.remove();
    // Return OK status and the message that was just removed
    return res.status(200).json(foundMessage);
  } catch(e) {
    return next(e);
  }
};
