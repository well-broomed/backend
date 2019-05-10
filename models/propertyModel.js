/**
 * Each property contains:
 * 
 *      property_id
 *      manager_id
 *      cleaner_id
 *      property_name
 *      address
 *      img_url
 *      guest_guide (url?)
 *      assistant_guide (url?)
 * 
 */

const db = require('../data/dbConfig');

module.exports = {
    getPropertiesByManager,
    // getPropertiesByCleaner,
    // getPropertyById,
    // getPropertyByAddress,

    addProperty,
    // updateProperty,
    // deleteProperty

};

function getPropertiesByManager(manager_id){
    return db.select('*')
    .from('properties')
    .where({manager_id});
}

function addProperty(property){
    return db('properties')
    .returning('id')
    .insert({property})
    .into('properties');
}