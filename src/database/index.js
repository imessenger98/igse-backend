const mongoose = require('mongoose');
const logger = require('../logger/logger');

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB database connection established successfully');
  } catch (error) {
    logger.error(`MongoDB connection error: ${error}`);
    process.exit(-1);
  }
};

module.exports = connectToDatabase;
