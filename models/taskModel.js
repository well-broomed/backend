const db = require('../data/dbConfig');

module.exports = {
	getTasks,
	addTask
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

async function addTask(property_id, description, deadline) {
	const [notUnique] = await db('tasks')
		.where({ property_id, description, deadline })
		.select('task_id');

	if (notUnique) {
		return { notUnique };
	}

	return db('tasks')
		.insert(
			{
				property_id,
				description,
				deadline
			},
			'task_id'
		)
		.first();
}
