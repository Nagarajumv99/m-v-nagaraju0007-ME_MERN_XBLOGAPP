const express = require('express');
const { deleteComment } = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.delete('/:comment_id', authenticate, deleteComment);

module.exports = router;
