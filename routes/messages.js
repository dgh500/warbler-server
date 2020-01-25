const express = require('express');
const router = express.Router({mergeParams: true});

const { createMessage, getMessage, updateMessage, deleteMessage, replyToMessage, getHashtags, loadMessages, filterByUser } = require('../handlers/messages');

// prefix all routes with /api/users/:id/messages
router.route('/')
  .get(loadMessages)
  .post(createMessage);

router.route('/hashtags')
  .get(getHashtags);

// Prefix - /api/users/:id/messages/:message_id
router.route('/:message_id')
  .get(getMessage)
  .put(updateMessage)
  .delete(deleteMessage);

router.route('/:message_id/reply')
  .post(replyToMessage);


router.route('/mode/user/:username')
  .get(filterByUser);

module.exports = router;
