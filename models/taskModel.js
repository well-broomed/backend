const db = require('../data/dbConfig');

module.exports = {
	getTasks
};

function getTasks(user_id, property_id, role) {
	// This implementation doesn't support managers as assistants to other managers
	return role === 'manager'
		? db('tasks as t')
				.join('properties as p', 't.property_id', 'p.property_id')
				.where({ 'p.manager_id': user_id, 't.property_id': property_id })
				.select('t.task_id', 't.description', 't.deadline')
		: db('tasks as t')
				.join('properties as p', 't.property_id', 'p.property_id')
				.join('partners', 'p.manager_id', 'partners.manager_id')
				.where({
					'partners.cleaner_id': user_id,
					't.property_id': property_id
				})
				.select('t.task_id', 't.description', 't.deadline');
}
