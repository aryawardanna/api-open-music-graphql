const mongoose = require('mongoose');
const { Schema } = mongoose;

const playlistSchema = new mongoose.Schema({
  playlist_name: {
    type: String,
  },
  song_ids: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Song',
    },
  ],
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  collaborator_ids: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

module.exports = mongoose.model('Playlist', playlistSchema);
