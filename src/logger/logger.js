const { format, createLogger, transports } = require('winston');

const {
  combine, timestamp, label, prettyPrint,
} = format;
const CATEGORY = 'PRODUCTION';

const logger = createLogger({
  level: 'info',
  format: combine(
    format.errors({ stack: true }),
    label({ label: CATEGORY }),
    timestamp({
      format: 'MMM-DD-YYYY HH:mm:ss',
    }),
    prettyPrint(),
  ),
  transports: [
    new transports.File({
      level: 'error',
      filename: 'logger/error.log',
    }),
    new transports.Console(),
  ],
});

module.exports = logger;
