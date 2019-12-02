const express = require('express');
const router = express.Router({mergeParams: true});

const { createMessage, getMessage, deleteMessage } = require('../handlers/messages');

// prefix all routes with /api/users/:id/messages
router.route('/').post(createMessage);


// Prefix - /api/users/:id/messages/:message_id
router.route('/:message_id')
  .get(getMessage)
  .delete(deleteMessage);


module.exports = router;
