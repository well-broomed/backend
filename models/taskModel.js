const db = require('../data/dbConfig');

module.exports = {
	getTasks,
	addTask,
	updateTask,
	removeTask
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

async function updateTask(user_id, task_id, description, deadline) {
	// Check for ownership of property
	const [task] = await db('tasks as t')
		.join('properties as p', 't.property_id', 'p.property_id')
		.where({ manager_id: user_id, task_id })
		.select('property_id');

	// This could probably be more explicit
	if (!task) {
		return {};
	}

	const { property_id } = task;

	// Check for uniqueness
	const [notUnique] = await db('tasks')
		.where({ property_id, description, deadline })
		.select('task_id');

	if (notUnique) {
		return { notUnique };
	}

	//Check for dependant guest_tasks
	const [guest_task] = await db('guest_tasks')
		.where({ task_id })
		.select('guest_id')
		.first();

	if (guest_task) {
		// Start a transaction
		return db.transaction(async trx => {
			// Make a new task to avoid changing records for previous guests
			const [newTask] = trx('tasks').insert(
				{
					property_id,
					description,
					deadline
				},
				'task_id'
			);

			if (!newTask) {
				trx.rollback();
			}

			// Remove the property_id from the old task
			const [oldTask] = trx('tasks')
				.where({ task_id })
				.update({ property_id: 0 }, 'task_id');

			if (!oldTask) {
				trx.rollback();
			}

			return { task_id: newTask.task_id };
		});
	} else {
		// Update the task
		return db('tasks')
			.where({ task_id })
			.update({ description, deadline }, 'task_id')
			.first();
	}
}

async function removeTask(user_id, task_id) {
	// Check for ownership of property
	const [task] = await db('tasks as t')
		.join('properties as p', 't.property_id', 'p.property_id')
		.where({ manager_id: user_id, task_id })
		.select('property_id');

	// This could probably be more explicit
	if (!task) {
		return {};
	}

	//Check for dependant guest_tasks
	const [guest_task] = await db('guest_tasks')
		.where({ task_id })
		.select('guest_id')
		.first();

	if (guest_task) {
		// Remove the property_id from the task
		const updated = await db('tasks')
			.where({ task_id })
			.update({ property_id: 0 }, 'task_id');

		return updated.length;
	} else {
		// Delete the task
		return db('tasks')
			.where({ task_id })
			.del();
	}
}
