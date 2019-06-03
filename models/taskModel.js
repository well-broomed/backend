const db = require('../data/dbConfig');

module.exports = {
	getTasks,
	addTask,
	updateTask,
	removeTask,
};

function getTasks(user_id, property_id, role) {
	// This implementation doesn't support managers as assistants to other managers
	return role === 'manager'
		? db('tasks as t')
				.join('properties as p', 't.property_id', 'p.property_id')
				.where({ 'p.manager_id': user_id, 't.property_id': property_id })
				.select('t.task_id', 't.text', 't.deadline')
		: db('tasks as t')
				.join('properties as p', 't.property_id', 'p.property_id')
				.join('partners', 'p.manager_id', 'partners.manager_id')
				.where({
					'partners.cleaner_id': user_id,
					't.property_id': property_id
				})
				.select('t.task_id', 't.text', 't.deadline');
}

async function addTask(property_id, text, deadline) {
	const [notUnique] = await db('tasks')
		.where({ property_id, text, deadline })
		.select('task_id');

	if (notUnique) {
		return { notUnique };
	}

	const [task] = await db('tasks').insert({ property_id, text, deadline }, [
		'task_id',
		'text',
		'deadline'
	]);

	return { task };
}

async function updateTask(user_id, task_id, text, deadline) {
	// Check for ownership of property
	const [validTask] = await db('tasks as t')
		.join('properties as p', 't.property_id', 'p.property_id')
		.where({ manager_id: user_id, task_id })
		.select('p.property_id');

	// This could probably be more explicit
	if (!validTask) {
		return {};
	}

	const { property_id } = validTask;

	// Check for uniqueness
	const [notUnique] = await db('tasks')
		.where({ property_id, text, deadline })
		.select('task_id');

	if (notUnique && notUnique.task_id != task_id) {
		return { notUnique };
	}

	//Check for dependant guest_tasks
	const [guest_task] = await db('guest_tasks')
		.where({ task_id })
		.select('guest_id');

	if (guest_task) {
		// Start a transaction
		return db.transaction(async trx => {
			// Make a new task to avoid changing records for previous guests
			const [newTask] = trx('tasks').insert(
				{
					property_id,
					text,
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

			return { updated: newTask.task_id };
		});
	} else {
		// Update the task
		const [updated] = await db('tasks')
			.where({ task_id })
			.update({ text, deadline }, 'task_id');

		return { updated };
	}
}

async function removeTask(user_id, task_id) {
	// Check for ownership of property
	const [validTask] = await db('tasks as t')
		.join('properties as p', 't.property_id', 'p.property_id')
		.where({ manager_id: user_id, task_id })
		.select('p.property_id');

	// This could probably be more explicit
	if (!validTask) {
		return {};
	}

	//Check for dependant guest_tasks
	const [guest_task] = await db('guest_tasks')
		.where({ task_id })
		.select('guest_id');

	if (guest_task) {
		// Remove the property_id from the task
		const deleted = await db('tasks')
			.where({ task_id })
			.update({ property_id: 0 }, 'task_id');

		return { deleted };
	} else {
		// Delete the task
		const deleted = await db('tasks')
			.where({ task_id })
			.del();

		return { deleted };
	}
}