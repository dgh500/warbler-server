const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  profileImageUrl: {
    type: String
  },
  /*
   If using a reference need to use this type and the ref must be the MODEL with correct capitalisation
   (ie. Message not message)
   */
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message' // Must be caps M to refer to Message model
  }]
});

/*
 This code is called immediately before any save action on any model which uses the
 userSchema schema and must return next() as it is a middleware function.
 If next is called with a parameter it signifies an error - in the catch block
 */
userSchema.pre('save', async function (next) {
  try {
    /*
    If the password hasn't changed since it was retrieved from the database (?) then
    don't need to re-hash it so just continue with a save action
    */
    if (!this.isModified('password')) {
      return next();
    }
    /*
 	  Hash the password provided by the API call (generally frontend, or hacker..) before
    storing it in plain text which would be bad. Second parameter (10) is salt rounds, not
    really important in this instance but more is more secure / slower
     */
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword; // this refers to the instance (the current user)
    return next();
  } catch (err) {
    return next(err);
  }
});

/*
 The comparePassword function is defined on the userSchema.methods object so that all user instances have access to it.
 This is called 'instance methods' and analagous to prototype functions / class methods (probably implemented as such)
 More info: https://mongoosejs.com/docs/guide.html#methods
 NB. Can't use arrow functions or it will fuck with the value of THIS keyword
 */
userSchema.methods.comparePassword = async function (candidatePassword, next) {
  try {
    // This refers to the instance of user that it's called on at time of calling the comparePassword method
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  } catch (err) {
    return next(err);
  }
};

// Compile userSchema into User model (caps by convention)
const User = mongoose.model('User', userSchema);

module.exports = User;
