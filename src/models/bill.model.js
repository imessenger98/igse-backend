const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const { Schema, model } = mongoose;

const billSchema = new Schema({
  key: {
    type: Number,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  electricity: {
    day: {
      type: Number,
      required: true,
    },
    night: {
      type: Number,
      required: true,
    },
  },
  gas: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: () => Date.now(),
  },
  paid: {
    type: String,
    default: 'Not Paid',
    enum: ['Not Paid', 'Paid', 'Not Required'],
  },
  amount: {
    type: Number,
  },
  averageElectricityPerDay: {
    type: Number,
  },
  averageGasPerDay: {
    type: Number,
  },
});
autoIncrement.initialize(mongoose.connection);
billSchema.plugin(autoIncrement.plugin, {
  model: 'Bill',
  field: 'key',
  startAt: 1,
});

const Bill = model('Bill', billSchema);

module.exports = Bill;
