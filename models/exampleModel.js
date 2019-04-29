const db = require('../data/dbConfig');

module.exports = {
	getExamples
};

function getExamples() {
	return db('exampleTable');
}
