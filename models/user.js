const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  user_type: {
    type: String,
    enum: ['Administrator', 'Creator', 'Enjoyer'],
    default: 'Creator',
  },
});

module.exports = mongoose.model('User', userSchema);
