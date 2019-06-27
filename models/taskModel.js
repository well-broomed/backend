const db = require('../data/dbConfig');

const Promise = require('bluebird');

module.exports = {
	getTasks,
	addTask,
	updateTask,
	updateDeadline,
	removeTask
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
	const validTask = await db('tasks as t')
		.join('properties as p', 't.property_id', 'p.property_id')
		.where({ manager_id: user_id, task_id })
		.select('p.property_id')
		.first();

	// This could probably be more explicit
	if (!validTask) {
		return {};
	}

	const { property_id } = validTask;

	const notUnique = await db('tasks')
		.where({ property_id, text, deadline })
		.first();

	if (notUnique) {
		return { notUnique };
	}

	// Start a transaction
	return db.transaction(async trx => {
		// Check for dependent guest_tasks
		const guest_task = await trx('guest_tasks')
			.where({ task_id })
			.select('guest_id')
			.first();

		if (guest_task) {
			// Get current text and deadline
			const oldTask = await trx('tasks')
				.where({ task_id })
				.first();

			if (!oldTask) {
				return {};
			}

			// Check for existing orphan task
			const orphan_task = await trx('tasks')
				.where({ text: oldTask.text, deadline: oldTask.deadline }, 'task_id')
				.first();

			if (orphan_task) {
				// Update dependent guest_tasks
				const updated = await trx('guest_tasks')
					.where({ task_id })
					.update({ task_id: orphan_task.task_id });

				if (!updated) {
					trx.rollback();
				}
			} else {
				// Remove the property_id from the task
				const orphaned = await trx('tasks')
					.where({ task_id })
					.update({ property_id: null }, 'task_id');

				if (!orphaned) {
					trx.rollback();
				}

				// Create a new task
				const [newTask] = await trx('tasks').insert(
					{ property_id, text, deadline },
					['task_id', 'text', 'deadline']
				);

				if (!newTask) {
					trx.rollback();

					return { updatedTask: newTask };
				}
			}
		}

		// Update the task
		const [updatedTask] = await trx('tasks')
			.where({ task_id })
			.update({ text, deadline }, ['task_id', 'text', 'deadline']);

		if (!updatedTask) {
			trx.rollback();
		}

		return { updatedTask };
	});
}

async function updateDeadline(property_id, oldDeadline, newDeadline) {
	// Get tasks by deadline
	const tasks = await db('tasks')
		.where({ property_id, deadline: oldDeadline })
		.select('task_id', 'text');

	// No tasks?
	if (!tasks.length) return [];

	// Start a transaction
	return db.transaction(async trx => {
		const updated = await Promise.map(tasks, async ({ task_id, text }) => {
			// Check for dependent guest_tasks
			const guest_task = await trx('guest_tasks')
				.where({ task_id })
				.select('guest_id')
				.first();

			if (guest_task) {
				// Get current text and deadline
				const oldTask = await trx('tasks')
					.where({ task_id })
					.first();

				if (!oldTask) {
					return {};
				}

				// Check for existing orphan task
				const orphan_task = await trx('tasks')
					.where({ text: oldTask.text, deadline: oldTask.deadline }, 'task_id')
					.first();

				if (orphan_task) {
					// Update dependent guest_tasks
					const updated = await trx('guest_tasks')
						.where({ task_id })
						.update({ task_id: orphan_task.task_id });

					if (!updated) {
						trx.rollback();
					}
				}
			}

			// Check for collisions
			const notUnique = await trx('tasks')
				.where({ property_id, deadline: newDeadline, text })
				.first();

			if (notUnique) {
				if (guest_task) {
					// Remove the property_id from the task
					return trx('tasks')
						.where({ task_id })
						.update({ property_id: null }, 'task_id');
				} else {
					// Delete the task
					return trx('tasks')
						.where({ task_id })
						.del();
				}
			} else {
				// Update the deadline
				return trx('tasks')
					.where({ task_id })
					.update({ deadline: newDeadline }, 'task_id');
			}
		});

		if (updated.length !== tasks.length) {
			trx.rollback();
		}

		return trx('tasks').where({ property_id });
	});
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

	// Check for dependent guest_tasks
	const [guest_task] = await db('guest_tasks')
		.where({ task_id })
		.select('guest_id');

	if (guest_task) {
		// Get current text and deadline
		const oldTask = await db('tasks')
			.where({ task_id })
			.first();

		if (!oldTask) {
			return {};
		}

		// Start a transaction
		return db.transaction(async trx => {
			// Check for existing orphan task
			const orphan_task = await trx('tasks')
				.where({ text: oldTask.text, deadline: oldTask.deadline }, 'task_id')
				.first();

			if (orphan_task) {
				// Update dependent guest_tasks
				const updated = await trx('guest_tasks')
					.where({ task_id })
					.update({ task_id: orphan_task.task_id });

				if (!updated) {
					trx.rollback();
				}
			}

			// Remove the property_id from the task
			const deleted = await db('tasks')
				.where({ task_id })
				.update({ property_id: null }, 'task_id');

			return { deleted };
		});
	} else {
		// Delete the task
		const deleted = await db('tasks')
			.where({ task_id })
			.del();

		return { deleted };
	}
}
