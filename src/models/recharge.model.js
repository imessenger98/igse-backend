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
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  redeemed: {
    type: Number,
    required: true,
    default: 0,
  },
  createdAt: {
    type: Date,
    required: true,
    default: () => Date.now(),
  },
});
autoIncrement.initialize(mongoose.connection);
evcCodeSchema.plugin(autoIncrement.plugin, {
  model: 'Recharge',
  field: 'key',
  startAt: 1,
});

const EVCCode = model('Recharge', evcCodeSchema);
module.exports = EVCCode;
