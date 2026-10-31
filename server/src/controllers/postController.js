const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

const authorProjection = 'name email';
const maxInlineListImageBytes = 100000;
const postPopulation = [
  { path: 'author', select: authorProjection },
  { path: 'comments' }
];

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function searchFilter(query) {
  const filter = {};
  if (query.search) {
    const escaped = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ title: regex }, { content: regex }];
  }
  if (query.tag) filter.tags = String(query.tag);
  if (query.tags) {
    const tags = String(query.tags).split(',').map((tag) => tag.trim()).filter(Boolean);
    if (tags.length) filter.tags = { $in: tags };
  }
  return filter;
}

async function getPosts(req, res, next) {
  try {
    const posts = await Post.aggregate([
      { $match: searchFilter(req.query) },
      { $sort: { createdAt: -1 } },
      {
        $set: {
          id: { $toString: '$_id' },
          image: {
            $let: {
              vars: {
                imageValue: {
                  $convert: { input: '$image', to: 'string', onError: '', onNull: '' }
                }
              },
              in: {
                $cond: [
                  {
                    $and: [
                      { $gt: [{ $strLenBytes: '$$imageValue' }, maxInlineListImageBytes] },
                      { $regexMatch: { input: '$$imageValue', regex: '^data:image/', options: 'i' } }
                    ]
                  },
                  '',
                  '$$imageValue'
                ]
              }
            }
          }
        }
      }
    ]);
    await Post.populate(posts, postPopulation);
    return res.status(200).json(posts);
  } catch (error) {
    return next(error);
  }
}

async function getPost(req, res, next) {
  try {
    if (!validId(req.params.post_id)) return res.status(404).json({ message: 'Post not found' });
    const post = await Post.findById(req.params.post_id).populate(postPopulation);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const result = post.toObject();
    result.totalLikes = post.likes.length;
    result.likedByCurrentUser = Boolean(
      req.user && post.likes.some((id) => id.equals(req.user._id))
    );
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function createPost(req, res, next) {
  try {
    const { title, content, tags = [], image = '' } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    if (!Array.isArray(tags)) return res.status(400).json({ message: 'Tags must be an array' });
    const post = await Post.create({
      title,
      content,
      tags,
      image,
      author: req.user._id
    });
    return res.status(201).json(post);
  } catch (error) {
    return next(error);
  }
}

async function updatePost(req, res, next) {
  try {
    if (!validId(req.params.post_id)) return res.status(404).json({ message: 'Post not found' });
    const post = await Post.findById(req.params.post_id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You cannot modify this post' });
    }

    const allowed = ['title', 'content', 'image'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) post[field] = req.body[field];
    }
    if (req.body.tags !== undefined) {
      if (!Array.isArray(req.body.tags)) {
        return res.status(400).json({ message: 'Tags must be an array' });
      }
      post.tags = req.body.tags;
    }
    await post.save();
    return res.status(200).json(post);
  } catch (error) {
    return next(error);
  }
}

async function deletePost(req, res, next) {
  try {
    if (!validId(req.params.post_id)) return res.status(404).json({ message: 'Post not found' });
    const post = await Post.findById(req.params.post_id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You cannot delete this post' });
    }
    await Promise.all([Comment.deleteMany({ post: post._id }), post.deleteOne()]);
    return res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

async function toggleLike(req, res, next) {
  try {
    if (!validId(req.params.post_id)) return res.status(404).json({ message: 'Post not found' });
    const post = await Post.findById(req.params.post_id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const index = post.likes.findIndex((id) => id.equals(req.user._id));
    const liked = index === -1;
    if (liked) post.likes.push(req.user._id);
    else post.likes.splice(index, 1);
    await post.save();
    return res.status(200).json({
      message: liked ? 'Post liked' : 'Post unliked',
      totalLikes: post.likes.length
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getPosts, getPost, createPost, updatePost, deletePost, toggleLike, validId };
