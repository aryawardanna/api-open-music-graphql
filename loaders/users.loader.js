const User = require('../models/user');
const DataLoader = require('dataloader');

const bacthUsers = async (userIds) => {
  const users = await User.find({
    _id: { $in: userIds },
  });

  const dataMap = new Map();
  users.forEach((el) => {
    dataMap.set(el._id.toString(), el);
  });

  return userIds.map((id) => dataMap.get(id.toString()));
};
exports.UserLoader = () => new DataLoader(bacthUsers);
