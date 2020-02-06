const mongoose = require('mongoose');
const colors   = require('colors');
// mongoose.set('debug', true);
mongoose.set('debug', function (collectionName, method, query, doc) {
  console.log(
    'Mongoose: '.cyan +
    collectionName.red +
    '.' +
    method.green +
    ' (' +
    JSON.stringify(query, null, 2).green.bold +
    ')');
});
mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/warbler', {
  keepAlive: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

module.exports.User = require('./user');
module.exports.Message = require('./message');
