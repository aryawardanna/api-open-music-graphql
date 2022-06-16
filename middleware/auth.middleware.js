const { AuthenticationError } = require('apollo-server-express');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

function getUser(token) {
  const tokenDecode = jwt.verify(
    token,
    process.env.JWT_SECRET_KEY || 'mysecretkey'
  );
  return tokenDecode;
}

const requireAuth = async (resolver, parent, args, context) => {
  let Authorization = context.req.get('Authorization');
  if (!Authorization) {
    throw new AuthenticationError('Authorization header is missing');
  }
  let token = Authorization.replace('Bearer ', '');
  token = token.replace(/"/g, '');

  let userId = getUser(token);

  let user = await User.findOne({ _id: userId }).select('_id, user_type');
  if (!user) {
    throw new AuthenticationError('UnAuthenticated');
  }

  context.userId = user._id;
  context.userType = user.user_type;

  return resolver();
};

let authMiddleware = {
  Query: {
    users: requireAuth,
    getAllSongs: requireAuth,
    getSongId: requireAuth,
    getAllPlaylist: requireAuth,
  },
  Mutation: {
    createUser: requireAuth,
    updateUser: requireAuth,
    createSong: requireAuth,
    updateSong: requireAuth,
    deleteSong: requireAuth,
    createPlaylist: requireAuth,
    addSongPlaylist: requireAuth,
    deleteSongPlaylist: requireAuth,
  },
};

module.exports = authMiddleware;
