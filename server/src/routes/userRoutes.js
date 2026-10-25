const express = require('express');
const {
  getProfile,
  getMyProfile,
  updateMyProfile,
  getMyPosts
} = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticate, getMyProfile);
router.put('/me', authenticate, updateMyProfile);
router.get('/me/posts', authenticate, getMyPosts);
router.get('/:user_id', getProfile);

module.exports = router;
