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
const userRoutes = require('./routes/userRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
// const propertyRoutes = require('./routes/propertyRoutes');
// const guestRoutes = require('./routes/guestRoutes');
// const taskRoutes = require('./routes/taskRoutes');

// Endpoints
server.use('/api/users', userRoutes);
server.use('/api/invites', inviteRoutes);
// server.use('/properties', propertyRoutes);
// server.use('/guests', guestRoutes);
// server.use('/tasks', taskRoutes);

module.exports = server;
