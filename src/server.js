/* eslint-disable no-unused-vars */
const express = require('express');
const cors = require('cors');

const logger = require('./logger/logger');
const apiRoutes = require('./routes');
const openRoutes = require('./routes/open');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);
app.use('/igse', openRoutes);
app.get('/', (req, res) => {
  res
    .status(200)
    .json({ message: 'success' });
});

app.use((err, req, res, next) => {
  logger.error(err.message);
  res
    .status(err?.code || 500)
    .json({ message: err?.message || 'something went wrong' });
});

module.exports = app;
