const express = require('express');
const router = express.Router({mergeParams: true});

const { createUser, getUser, updateUser, deleteUser } = require('../handlers/users');

// Prefix - /api/users/:id
router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
