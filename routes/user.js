const express = require('express');
const router = express.Router({mergeParams: true});
const { createUser, getUser, updateUser, deleteUser } = require('../handlers/users');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/images');
  },
  filename: (req, file, cb) => {
    let fileType = '';
    switch (file.mimetype) {
      case 'image/gif':
        fileType = 'gif';
      case 'image/png':
        fileType = 'png';
      case 'image/jpeg':
        fileType = 'jpg';
    }
    cb(null, `image-${Date.now()}.${fileType}`);
  }
});
const upload = multer({storage});

// Prefix - /api/users/:id
router.route('/')
  .get(getUser)
  .put(upload.single('profileImageUrl'),updateUser)
  .delete(deleteUser);

module.exports = router;
