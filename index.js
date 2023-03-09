const dotenv = require('dotenv');
const logger = require('./src/logger/logger');
const connectToDatabase = require('./src/database/index');

dotenv.config();
(async () => {
  const app = require('./src/server');
  const PORT = process.env.PORT || 3001;
  await connectToDatabase();
  app.listen(PORT, () => {
    logger.info(`listening to port: http://127.0.0.1:${PORT}`);
  });
})();
