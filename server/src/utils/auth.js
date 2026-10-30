const jwt = require('jsonwebtoken');

function createToken(user) {
  return jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function authUser(user, idField = 'id') {
  const result = {
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    role: user.role
  };
  result[idField] = user._id.toString();
  return result;
}

module.exports = { createToken, authUser };
