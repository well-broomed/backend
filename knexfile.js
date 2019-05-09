require('dotenv').config();

const pg = require('pg');

// pg.defaults.ssl = process.env.PG_SSL
// 	? !!JSON.parse(String(process.env.PG_SSL))
// 	: true;

module.exports = {
	development: {
		client: 'pg',
		connection: {
			host: 'localhost',
			user: process.env.PG_USER || 'postgres',
			database: 'well-broomed',
			password: process.env.PG_PASSWORD
		},
		useNullAsDefault: true,
		migrations: {
			directory: './data/migrations',
			tableName: 'migrations'
		},
		migrations: { directory: './data/migrations' },
		seeds: { directory: './data/seeds' }
	},

	production: {
		client: 'pg',
		connection: process.env.DATABASE_URL,
		pool: {
			min: 2,
			max: 10
		},
		useNullAsDefault: true,
		migrations: {
			directory: './data/migrations',
			tableName: 'migrations'
		},
		seeds: { directory: './data/seeds' }
	}
};
