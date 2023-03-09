const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const { Schema, model } = mongoose;

const userSchema = new Schema({
  key: {
    type: Number,
  },
  username: {
    type: String,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    select: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  status: {
    type: Boolean,
    default: true,
  },
  address: {
    type: String,
  },
  bedRooms: {
    type: Number,
  },
  propertyType: {
    type: String,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  evcCodes: [{
    type: mongoose.Schema.Types.ObjectId,
  }],
  createdAt: {
    type: Date,
    immutable: true,
    default: () => Date.now(),
  },
});
autoIncrement.initialize(mongoose.connection);
userSchema.plugin(autoIncrement.plugin, {
  model: 'User',
  field: 'key',
  startAt: 4,
});
const User = model('User', userSchema);

module.exports = User;
