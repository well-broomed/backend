function checkForDuplicates(properties, array, identifier) {
	const notUnique = {};

	for (const [key, value] of Object.entries(properties)) {
		array.forEach(object => {
			if (object[key] === value) {
				notUnique[key] = object[identifier];
			}
		});
	}

	return notUnique;
}

module.exports = checkForDuplicates;
