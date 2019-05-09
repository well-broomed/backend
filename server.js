// Dependencies
const express = require('express');
const server = express();

// Middleware
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

// server.use(logger('tiny'));
server.use(cors());
server.use(helmet());
server.use(express.json());

// Sanity check
server.get('/', (req, res) => {
	res.send(`It works.`);
});

// Routes
const usersRoutes = require('./routes/usersRoutes');
const propertiesRoutes = require('./routes/propertiesRoutes');

// Endpoints
server.use('/', usersRoutes);
server.use('/properties', propertiesRoutes);

module.exports = server;
