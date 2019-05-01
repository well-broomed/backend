// Dependencies
const express = require('express');
const server = express();

// Middleware
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

server.use(logger('tiny'));
server.use(cors());
server.use(helmet());
server.use(express.json());

// Sanity checker!
server.get('/', (req, res) => {
	res.send(`It works.`);
});

// Routes
const exampleRoutes = require('./routes/exampleRoutes');

// Endpoints
server.use('/api/exampleEndpoint', exampleRoutes);

module.exports = server;
