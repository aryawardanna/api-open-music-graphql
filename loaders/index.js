const { UserLoader } = require('../loaders/users.loader');
const { SongsLoader } = require('./songs.loader');

module.exports = {
  loaders: () => {
    return {
      UserLoader: UserLoader(),
      SongsLoader: SongsLoader(),
    };
  },
};
