const db = require('../data/config.js');

module.exports = {
    getAll,
    getByProperty,
    getByManager,

    add,
    update,
    remove
}

function getAll(){ // turn off for production
    return db("lists");
}

function getByProperty(property_id){
    return db.select("*").from("lists").where({property_id});
}

function getByManager(manager_id){
    return db.select("*").from("lists").where({manager_id});
}

function add(list){
    return db("lists").returning("list_id").insert(list).into("lists");
}

/**
 * 
 * @param {the ID of the list} id 
 * @param {the desired changes} changes
 * @return {the updated list} 
 */

function update(list_id, changes){
    return db("lists").returning("*").where({list_id}).update(changes);
}

/**
 * 
 * @param {the ID of the list to delete} id 
 * @return {returns 1 for successful deletion}
 */

function remove(list_id){
    return db("lists").returning(1).where({list_id}).del();
}