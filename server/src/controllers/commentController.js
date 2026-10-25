const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { validId } = require('./postController');

async function addComment(req, res, next) {
  try {
    if (!validId(req.params.post_id)) return res.status(404).json({ message: 'Post not found' });
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    const post = await Post.findById(req.params.post_id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = await Comment.create({
      text,
      post: post._id,
      author: req.user._id
    });
    post.comments.push(comment._id);
    await post.save();
    return res.status(201).json(comment);
  } catch (error) {
    return next(error);
  }
}

async function getComments(req, res, next) {
  try {
    if (!validId(req.params.post_id)) return res.status(404).json({ message: 'Post not found' });
    const postExists = await Post.exists({ _id: req.params.post_id });
    if (!postExists) return res.status(404).json({ message: 'Post not found' });
    const comments = await Comment.find({ post: req.params.post_id })
      .populate('author', 'name email')
      .sort({ createdAt: 1 });
    return res.status(200).json(comments);
  } catch (error) {
    return next(error);
  }
}

async function deleteComment(req, res, next) {
  try {
    if (!validId(req.params.comment_id)) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    const comment = await Comment.findById(req.params.comment_id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You cannot delete this comment' });
    }
    await Promise.all([
      comment.deleteOne(),
      Post.updateOne({ _id: comment.post }, { $pull: { comments: comment._id } })
    ]);
    return res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { addComment, getComments, deleteComment };
