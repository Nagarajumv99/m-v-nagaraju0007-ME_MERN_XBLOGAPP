const User = require('../models/User');
const { createToken, authUser } = require('../utils/auth');
const { verifyGoogleIdToken } = require('../utils/googleAuth');

async function register(req, res, next) {
  try {
    const { name, email, password, avatar = '' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email: normalizedEmail, password, avatar, role: 'user' });
    return res.status(201).json({ user: authUser(user), token: createToken(user) });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    return res.status(200).json({ user: authUser(user), token: createToken(user) });
  } catch (error) {
    return next(error);
  }
}

async function googleLogin(req, res, next) {
  try {
    const { googleIdToken } = req.body;
    if (!googleIdToken) {
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    const claims = await verifyGoogleIdToken(googleIdToken);
    const { name, email, picture: avatar, email_verified: emailVerified } = claims;
    if (!name || !email || !emailVerified) {
      return res.status(401).json({ message: 'Google account must provide a verified name and email' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        name,
        email: normalizedEmail,
        avatar: avatar || '',
        role: 'user'
      });
    }

    return res.status(200).json({ user: authUser(user, '_id'), token: createToken(user) });
  } catch (error) {
    return next(error);
  }
}

module.exports = { register, login, googleLogin };
