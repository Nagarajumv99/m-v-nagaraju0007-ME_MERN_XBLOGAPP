const express = require('express');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  toggleLike
} = require('../controllers/postController');
const { addComment, getComments } = require('../controllers/commentController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', getPosts);
router.post('/', authenticate, createPost);
router.get('/:post_id', optionalAuthenticate, getPost);
router.post('/:post_id', authenticate, updatePost);
router.delete('/:post_id', authenticate, deletePost);
router.post('/:post_id/like', authenticate, toggleLike);
router.get('/:post_id/comments', getComments);
router.post('/:post_id/comments', authenticate, addComment);

module.exports = router;
