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

// Sanity check
server.get('/', (req, res) => {
	res.send(`It works.`);
});

// Routes
const exampleRoutes = require('./routes/exampleRoutes');

const usersRouter = require('./routes/users/usersRouter');

// Endpoints
server.use('/api/exampleEndpoint', exampleRoutes);
server.use('/api/users', usersRouter); // /users endpoints

module.exports = server;
