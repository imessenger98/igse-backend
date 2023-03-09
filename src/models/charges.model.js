const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const chargesSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  electricity: {
    day: {
      type: mongoose.Types.Decimal128,
      required: true,
      default: 0.34,
    },
    night: {
      type: mongoose.Types.Decimal128,
      required: true,
      default: 0.2,
    },
  },
  gas: {
    type: mongoose.Types.Decimal128,
    default: 0.1,
    required: true,
  },
  standingCharge: {
    type: mongoose.Types.Decimal128,
    required: true,
    default: 0.74,
  },
});

const Charges = model('Charges', chargesSchema);
module.exports = Charges;
