const mongoose = require('mongoose');
const { Schema } = mongoose;

const songSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  genre: {
    type: String,
  },
  duration: {
    type: Number,
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

module.exports = mongoose.model('Song', songSchema);
