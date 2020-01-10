const db = require('../models'); // refers to /models/index.js


/**
  * Avoid duplication of code between reply-to and create message
  * @param {text} - String, message to create
  * @param {user} - The User's ID that is the message author
  * @return Object of type Message - pre-populated with user data
  */
createMessageHelper = async function(text,user) {
  try {
    let message = await db.Message.create({
      text,
      user
    });
    let foundUser = await db.User.findById(user);
    foundUser.messages.push(message.id);
    await foundUser.save();
    let foundMessage = await db.Message.findById(message._id).populate('user',{
      username: true,
      profileImageUrl: true
    });
    return foundMessage;
  } catch(e) {
    return e;
  }
}

/**
  * @param {req} - Request object, assumes the following and inserts the reply and associates it with the parent message
  * req.params.message_id - Parent message to reply to
  * req.body.text         - The new message
  * req.params.id         - User ID of logged in user (who will be doing the replying)
  * @return 200 status and JSON new message, or pass error to next
  */
exports.replyToMessage = async function(req, res, next) {
  try {
    // Create message
    let newMessage = await createMessageHelper(req.body.text,req.params.id);
    // Associate the new message with it's parent
    let parentMessage = await db.Message.findById(req.params.message_id);
    parentMessage.replies.push(newMessage._id);
    await parentMessage.save();
    // Return the new message
    return res.status(200).json(newMessage);
  } catch(e) {
    return next(e);
  }
}

/**
  * @param {req} - Request object, assumes the following and inserts message and returns it once added to database
  * req.body.text         - The new message
  * req.params.id         - User ID of logged in user (who will be doing the replying)
  * @return 200 status and JSON new message, or pass error to next
  */
exports.createMessage = async function(req, res, next) {
  try {
    let newMessage = createMessageHelper(req.body.text,req.params.id);
    return res.status(200).json(newMessage);
  } catch(e) {
    return next(e);
  }
};

// Assumes GET  -/api/users/:id/messages/:message_id
exports.getMessage = async function(req, res, next) {
  try {
    let message = await db.Message.findById(req.params.message_id)
    .populate('user', {
      username: true,
      profileImageUrl: true
    })
    .populate('replies');
    return res.status(200).json(message);
  } catch(e) {
    return next(e);
  }
};

exports.updateMessage = async function(req, res, next) {
  try {
    let message = await db.Message.findByIdAndUpdate(req.params.message_id,{ text: req.body.text },{new:true});
    return res.status(200).json(message);
  } catch(e) {
    return next(e);
  }
}

exports.deleteMessage = async function(req, res, next) {
  try {
    // Also need to check if it has replies, if so these need to be removed before the parent message is removed
    /*** not actually removing the messages...`` ***/
    let replies = await db.Message.find({_id:req.params.message_id},{replies:1});
    if(replies[0] !== undefined) {
      replies[0].replies.forEach(async function(v,i,a) {
        await db.Message.findByIdAndRemove(v,function() {
          console.log(v + 'Removed');
        });
      });
    }

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


// let message = await db.Message.create({
//   text: req.body.text,
//   /*
//   * When this is called, the user will be logged in - URL will be like /api/users/:id/messages
//   * so can somewhat speculatively assume it will be in request.params
//   */
//   user: req.params.id
// });
// // Find the user so we can push the message ID to the User's messages array, and save user
// let foundUser = await db.User.findById(req.params.id);
// foundUser.messages.push(message.id);
// await foundUser.save();
// /*
//  * This isn't strictly 'creating the message' it's populating the user field on the message document
//  * to contain the 2 fields you need to DISPLAY the message, as this is what the app will do next.
//  * Not convinced this shouldn't be in a separate func... but populate effectively swaps out the
//  * ID being held in the .user field, with the document OF THAT USER so that the return value of
//  * this function is the message complete with a username and profileImageUrl to be displayed
//  */
// let foundMessage = await db.Message.findById(message._id).populate('user', {
//   username: true,
//   profileImageUrl: true
// });
