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
const propertyRoutes = require('./routes/propertyRoutes');
const taskRoutes = require('./routes/taskRoutes');
const guestRoutes = require('./routes/guestRoutes');
const cleanerRoutes = require('./routes/cleanerRoutes');

// Endpoints
server.use('/api/users', userRoutes);
server.use('/api/invites', inviteRoutes);
server.use('/api/properties', propertyRoutes);
server.use('/api/tasks', taskRoutes);
server.use('/api/guests', guestRoutes);
server.use('/api/cleaners', cleanerRoutes);

module.exports = server;
