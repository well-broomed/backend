const db = require('../data/dbConfig');

module.exports = {
    getAll,
    getByProperty,
    getByManager,
    getByList,
    getByInstance,

    add,
    update,
    remove
}

function getAll(){ // turn off for production
    return db("lists");
}

function getByProperty(property_id){
    return db.select("*").from("instances").where({property_id});
}

function getByManager(manager_id){
    return db.select("*").from("instances").where({manager_id});
}

function getByList(list_id){
    return db.select("*").from("instances").where({list_id});
}

function getByInstance(instance_uuid){
    return db.select("*").from("instances").where({instance_uuid});
}

function add(instance){
    return db("instances").returning("id").insert(instance).into("instances");
}

/**
 * 
 * @param {the ID of the list} id 
 * @param {the desired changes} changes
 * @return {the updated list} 
 */

function update(id, changes){
    return db("instances").returning("*").where({id}).update(changes);
}

/**
 * 
 * @param {the ID of the list to delete} id 
 * @return {returns 1 for successful deletion}
 */

function remove(id){
    return db("lists").returning(1).where({id}).del();
}