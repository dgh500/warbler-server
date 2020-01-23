require('dotenv').config();
const express        = require('express');
const app            = express();
const cors           = require('cors');
const bodyParser     = require('body-parser');
const db             = require('./models');
const errorHandler   = require('./handlers/error');
const authRoutes     = require('./routes/auth');
const userRoutes        = require('./routes/user');
const twitterRoutes     = require('./routes/twitter');
const locationIqRoutes  = require('./routes/locationIq');
const messagesRoutes    = require('./routes/messages');
const { loginRequired, ensureCorrectUser } = require('./middleware/auth');

const PORT = 8081;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

// Any requests to /api/auth (then anything) passed off to the authRoutes file
app.use('/api/auth', authRoutes);
app.use('/api/twitter',twitterRoutes);
app.use('/api/locationIq',locationIqRoutes);
app.use('/api/users/:id/messages', /* loginRequired, ensureCorrectUser, */ messagesRoutes);
app.use('/api/users/:id', loginRequired, ensureCorrectUser, userRoutes);

app.get('/api/messages/', loginRequired, async function(req, res, next) {
  try {
    let messages = await db.Message.find()
      .sort({createdAt: 'desc'})
      .populate('user', {
        username: true,
        profileImageUrl: true
      })
      .populate({
        path: 'replies',
        populate: {
          path: 'user',
          select: 'username profileImageUrl'
        }
      });
      return res.status(200).json(messages);
  } catch(e) {
    return next(e);
  }
});

// If no routes reached - run this function
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(errorHandler);

app.listen(PORT, function () {
  console.log(`Server is starting on port ${PORT}`);
});
