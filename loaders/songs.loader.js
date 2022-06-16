const Song = require('../models/song');
const DataLoader = require('dataloader');

const bacthSong = async (songIds) => {
  const playlist = await Song.find({
    _id: { $in: songIds },
  });

  const dataMap = new Map();
  playlist.forEach((el) => {
    dataMap.set(el._id.toString(), el);
  });

  return songIds.map((id) => dataMap.get(id.toString()));
};
exports.SongsLoader = () => new DataLoader(bacthSong);
