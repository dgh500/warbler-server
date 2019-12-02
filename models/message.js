const mongoose = require('mongoose');
const User = require('./user');

const messageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      maxLength: 160
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // This refers to the User model - must be caps U to match
    }
  },
  {
    timestamps: true
  }
);

/*
 Before a message is removed, remove that message from the user's messages array as well
 */
messageSchema.pre('remove', async function(next) {
  try {
    let user = await User.findById(this.user);
    /*
     * This .remove is on the Mongoose subdoc document model ( https://mongoosejs.com/docs/subdocs.html )
     * It does the obvious - remove from array - but isn't a JavaScript array method
     */
    user.messages.remove(this.id);
    await user.save();
    return next();
  } catch(e) {
    return next(e);
  }
});

const Message = mongoose.model('Message',messageSchema);

module.exports = Message;
