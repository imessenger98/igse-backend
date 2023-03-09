const mongoose = require('mongoose');

const { Schema, model } = mongoose;
const autoIncrement = require('mongoose-auto-increment');

const evcCodeSchema = new Schema({
  key: {
    type: Number,
  },
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
  },
  price: {
    type: Number,
    default: 200,
  },
  expired: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => Date.now(),
  },
  // expiry
  expiredAt: {
    type: Date,
  },
});
autoIncrement.initialize(mongoose.connection);
evcCodeSchema.plugin(autoIncrement.plugin, {
  model: 'EVCode',
  field: 'key',
  startAt: 1,
});

const EVCCode = model('EVCode', evcCodeSchema);
module.exports = EVCCode;
