const db = require('../data/dbConfig');

module.exports = {
    getAll,
    getByProperty,
	getByManager,
	getByList,

    add,
    update,
    remove
}

function getAll(){ // turn off for production
    return db("tasks");
}

function getByProperty(property_id){
    return db.select("*").from("tasks").where({property_id});
}

function getByManager(manager_id){
    return db.select("*").from("tasks").where({manager_id});
}

function getByList(list_id){
	return db.select("*").from("tasks").where({list_id});
}

function add(task){
    return db("tasks").returning("task_id").insert(task).into("tasks");
}

/**
 * 
 * @param {the ID of the task} id 
 * @param {the desired changes} changes
 * @return {the updated task} 
 */

function update(task_id, changes){
    return db("tasks").returning("*").where({task_id}).update(changes);
}

/**
 * 
 * @param {the ID of the list to delete} id 
 * @return {returns 1 for successful deletion}
 */

function remove(task_id){
    return db("tasks").returning(1).where({task_id}).del();
}