const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { validId } = require('./postController');

async function profileResponse(user) {
  const postCount = await Post.countDocuments({ author: user._id });
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    postCount
  };
}

async function getProfile(req, res, next) {
  try {
    if (!validId(req.params.user_id)) return res.status(404).json({ message: 'User not found' });
    const user = await User.findById(req.params.user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json(await profileResponse(user));
  } catch (error) {
    return next(error);
  }
}

async function getMyProfile(req, res, next) {
  try {
    return res.status(200).json(await profileResponse(req.user));
  } catch (error) {
    return next(error);
  }
}

async function updateMyProfile(req, res, next) {
  try {
    const { name, avatar } = req.body;
    if (name !== undefined) req.user.name = name;
    if (avatar !== undefined) req.user.avatar = avatar;
    await req.user.save();
    return res.status(200).json({
      _id: req.user._id.toString(),
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar || ''
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyPosts(req, res, next) {
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate('likes', '_id')
      .sort({ createdAt: -1 });
    const withCounts = await Promise.all(
      posts.map(async (post) => {
        const result = post.toObject();
        result.commentCount = await Comment.countDocuments({ post: post._id });
        return result;
      })
    );
    return res.status(200).json(withCounts);
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProfile, getMyProfile, updateMyProfile, getMyPosts };
