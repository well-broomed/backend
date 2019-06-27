const db = require('../data/dbConfig');

module.exports = {
	getManagerIds,
};

function getManagerIds(cleaner_id){
    return db.select('manager_id').from('partners').where({cleaner_id});
}