const express     = require('express');
const router      = express.Router();
const { signup, signin }  = require('../handlers/auth');
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


router.post('/signup', upload.single('profileImageUrl'), signup);
router.post('/signin', signin);

module.exports = router;
