const User = require('./models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Song = require('./models/song');
const Playlist = require('./models/playlist');
const loadash = require('lodash');
const fs = require('fs');

//Loader
async function created_by(parent, args, context) {
  if (parent.created_by) {
    return await context.loaders.UserLoader.load(parent.created_by);
  }
  return null;
}
async function song_ids(parent, args, context) {
  if (parent.song_ids) {
    return await context.loaders.SongsLoader.loadMany(parent.song_ids);
  }
  return null;
}
async function collaborator_ids(parent, args, context) {
  if (parent.collaborator_ids) {
    return await context.loaders.UserLoader.loadMany(parent.collaborator_ids);
  }
  return null;
}

// USERS
async function createUser(_, { input }) {
  const user = await User.findOne({ email: input.email });
  if (user) {
    throw new Error('Email already use!');
  }
  const hashPass = await bcrypt.hash(input.password, 12);
  const result = await User.create({ ...input, password: hashPass });
  return result;
}

async function login(_, { input }) {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    throw new Error('User not found');
  }
  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) {
    throw new Error('Incorret Password');
  }

  const secret = process.env.JWT_SECRET_KEY || 'mysecretkey';
  const token = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      name: user.name,
      user_type: user.user_type,
    },
    secret,
    {
      expiresIn: '1d',
    }
  );
  return { token };
}

async function users(_, { pagination, filter, sorting }) {
  const query = {
    $and: [{}],
  };
  const aggregateQuery = [{ $match: query }];

  if (filter) {
    if (filter.name) {
      query.$and.push({
        name: { $regex: new RegExp(filter.name, 'i') },
      });
    }
    if (filter.user_type) {
      query.$and.push({
        user_type: filter.user_type,
      });
    }
  }
  if (sorting) {
    let sort = {};
    if (sorting.name) {
      sort.name = sorting.name === 'asc' ? 1 : -1;
    }
    aggregateQuery.push({
      $sort: loadash.isEmpty(sort) ? { createdAt: -1 } : sort,
    });
  }

  if (
    pagination &&
    (pagination.page || pagination.page === 0) &&
    pagination.limit
  ) {
    aggregateQuery.push({
      $facet: {
        data: [
          { $skip: pagination.limit * pagination.page },
          { $limit: pagination.limit },
        ],
        countData: [{ $group: { _id: null, count: { $sum: 1 } } }],
      },
    });

    let users = await User.aggregate(aggregateQuery);
    const count_document =
      users[0] && users[0].countData[0] && users[0].countData[0].count
        ? users[0].countData[0].count
        : 0;
    fs.writeFileSync('count.json', JSON.stringify(count_document));
    return users[0].data.map((data) => {
      return { ...data, count_document };
    });
  }
  return await User.aggregate(aggregateQuery);
}

async function getUserId(_, args) {
  return await User.findById(args._id);
}

async function updateUser(_, { user_input }, context) {
  const user = await User.findByIdAndUpdate(
    { _id: context.userId },
    { $set: user_input },
    { new: true }
  );
  return user;
}

//SONGS

async function createSong(_, { song_input }, context) {
  if (context.userType === 'Administrator') {
    const created_by = context.userId;
    return await Song.create({ ...song_input, created_by });
  }
  throw new Error('Only administrator can create song');
}

async function getAllSongs(_, { pagination, filter, sorting }) {
  const query = {
    $and: [{}],
  };
  const aggregateQuery = [{ $match: query }];

  if (filter) {
    if (filter.name) {
      query.$and.push({
        name: { $regex: new RegExp(filter.name, 'i') },
      });
    }
    if (filter.genre) {
      query.$and.push({
        genre: { $regex: new RegExp(filter.genre, 'i') },
      });
    }
    if (filter.creator_name) {
      aggregateQuery.push(
        {
          $lookup: {
            from: 'users',
            localField: 'created_by',
            foreignField: '_id',
            as: 'creator_name',
          },
        },
        {
          $match: {
            'creator_name.name': {
              $regex: new RegExp(filter.creator_name, 'i'),
            },
          },
        }
      );
    }
  }

  if (sorting) {
    let sort = {};

    if (sorting.creator_name) {
      aggregateQuery.push(
        {
          $lookup: {
            from: 'users',
            localField: 'created_by',
            foreignField: '_id',
            as: 'creator_name',
          },
        },
        {
          $set: {
            creator_name_lower: {
              $toLower: { $arrayElemAt: ['$creator_name.name', 0] },
            },
          },
        }
      );
      sort.creator_name_lower = sorting.creator_name === 'asc' ? 1 : -1;
    } else if (sorting.name) {
      aggregateQuery.push({
        $addFields: {
          name_lower: { $toLower: '$name' },
        },
      });
      sort.name_lower = sorting.name === 'asc' ? 1 : -1;
    } else if (sorting.genre) {
      aggregateQuery.push({
        $addFields: {
          genre_lower: { $toLower: '$genre' },
        },
      });
      sort.genre_lower = sorting.genre === 'asc' ? 1 : -1;
    }

    aggregateQuery.push({
      $sort: loadash.isEmpty(sort) ? { createdAt: -1 } : sort,
    });
  }
  if (
    pagination &&
    (pagination.page || pagination.page === 0) &&
    pagination.limit
  ) {
    aggregateQuery.push({
      $facet: {
        data: [
          { $skip: pagination.limit * pagination.page },
          { $limit: pagination.limit },
        ],
        countData: [{ $group: { _id: null, count: { $sum: 1 } } }],
      },
    });

    let songs = await Song.aggregate(aggregateQuery).allowDiskUse(true);
    const count_document =
      songs[0] && songs[0].countData[0] && songs[0].countData[0].count
        ? songs[0].countData[0].count
        : 0;
    return songs[0].data.map((data) => {
      return { ...data, count_document };
    });
  }

  return await Song.aggregate(aggregateQuery);
  console.log(a);
}

async function getSongId(_, args) {
  const user = await Song.findById(args._id);
  return user;
}

async function updateSong(_, { _id, input_song }, context) {
  const ctx = context.userId;
  const song = await Song.findById({ _id: _id });

  song.name = input_song.name;
  song.genre = input_song.genre;
  song.duration = input_song.duration;

  if (ctx._id.toString() === song.created_by.toString()) {
    await song.save();
    return song;
  }

  throw new Error('only user created this song can update');
}

async function deleteSong(_, { _id }, context) {
  const ctx = context.userId;
  const song = await Song.findById({ _id: _id });

  if (ctx._id.toString() === song.created_by.toString()) {
    await Song.findOneAndRemove({ _id: _id });
    return true;
  }
  throw new Error('only user create this song can delete');
}

// PLAYLIST
async function createPlaylist(_, { playlist_input }, context) {
  if (context.userType === 'Creator') {
    const created_by = context.userId;
    return await Playlist.create({ ...playlist_input, created_by });
  }
  throw new Error('Only creator can create song');
}

async function getAllPlaylist(_, { filter, sorting }) {
  const query = {
    $and: [{}],
  };
  const aggregateQuery = [{ $match: query }];
  if (filter) {
    if (filter.playlist_name) {
      query.$and.push({
        playlist_name: { $regex: new RegExp(filter.playlist_name, 'i') },
      });
    }
    if (filter.creator_name) {
      aggregateQuery.push(
        {
          $lookup: {
            from: 'users',
            localField: 'created_by',
            foreignField: '_id',
            as: 'creator_name',
          },
        },
        {
          $match: {
            'creator_name.name': {
              $regex: new RegExp(filter.creator_name, 'i'),
            },
          },
        }
      );
    }
    if (filter.song_name) {
      aggregateQuery.push(
        {
          $lookup: {
            from: 'users',
            localField: 'created_by',
            foreignField: '_id',
            as: 'song_name',
          },
        },
        {
          $match: {
            'song_name.name': {
              $regex: new RegExp(filter.song_name, 'i'),
            },
          },
        }
      );
    }
  }

  if (sorting) {
    let sort = {};

    if (sorting.creator_name) {
      aggregateQuery.push(
        {
          $lookup: {
            from: 'users',
            localField: 'created_by',
            foreignField: '_id',
            as: 'creator_name',
          },
        },
        {
          $set: {
            creator_name_lower: {
              $toLower: {
                $arrayElemAt: ['$creator_name.name', 0],
              },
            },
          },
        }
      );
      sort.creator_name_lower = sorting.creator_name === 'asc' ? 1 : -1;
    } else if (sorting.playlist_name) {
      sort.playlist_name = sorting.playlist_name === 'asc' ? 1 : -1;
    }
    aggregateQuery.push({
      $sort: loadash.isEmpty(sort) ? { createdAt: -1 } : sort,
    });
  }

  //   fs.writeFileSync('file.json', JSON.stringify(aggregateQuery));
  return await Playlist.aggregate(aggregateQuery);
}

async function addSongPlaylist(_, { _id, song_ids }, context) {
  const check = await Playlist.findOne({
    $or: [{ created_by: context.userId }, { collaborator_ids: context.userId }],
  });
  if (check) {
    const playlist = await Playlist.findByIdAndUpdate(
      { _id },
      { $push: { song_ids } },
      {
        new: true,
      }
    );
    return playlist;
  }

  throw new Error('Creator / Collaborator can add song to playlist');
}

async function addCollabPlaylist(_, { _id, collaborator_ids, created_by }) {
  const collab = await Playlist.findOne({ _id, created_by: created_by });
  if (collab) {
    const playlist = await Playlist.findByIdAndUpdate(
      _id,
      { $push: { collaborator_ids } },
      {
        new: true,
      }
    );
    return playlist;
  } else if (!collab) {
    throw new Error('Creator can add / remove collaborator to playlist');
  }
}

async function getOnePlaylist(_, { _id }) {
  return await Playlist.findById(_id);
}

async function deleteSongPlaylist(_, { _id, song_ids }, context) {
  const check = await Playlist.findOne({
    created_by: context.userId,
  });
  if (check) {
    const playlist = await Playlist.findByIdAndUpdate(
      { _id },
      {
        $pull: { song_ids: { $in: song_ids } },
      },
      { new: true }
    );
    return playlist;
  }
}

async function deleteCollabPlaylist(
  _,
  { _id, collaborator_ids, created_by },
  context
) {
  const collab = await Playlist.findOne({ created_by: created_by });
  if (collab) {
    const playlist = await Playlist.findByIdAndUpdate(
      _id,
      { $pull: { collaborator_ids: { $in: collaborator_ids } } },
      { new: true }
    );
    return playlist;
  } else if (!collab) {
    throw new Error('Creator can add / remove collaborator to playlist');
  }
}

module.exports = {
  Query: {
    users,
    getUserId,
    getAllSongs,
    getSongId,
    getAllPlaylist,
    getOnePlaylist,
  },
  Mutation: {
    createUser,
    login,
    updateUser,
    createSong,
    updateSong,
    deleteSong,
    createPlaylist,
    addSongPlaylist,
    addCollabPlaylist,
    deleteSongPlaylist,
    deleteCollabPlaylist,
  },
  Song: {
    created_by,
  },
  Playlist: {
    song_ids,
    collaborator_ids,
    created_by,
  },
};
