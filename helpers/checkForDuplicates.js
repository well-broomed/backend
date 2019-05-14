const checkForDuplicates = (properties, array, identifier, excluding) => {
	const notUnique = {};

	for (const [key, value] of Object.entries(properties)) {
		array.forEach(object => {
			if (
				!(excluding && object[excluding.key] == excluding.value) &&
				object[key] == value
			) {
				notUnique[key] = object[identifier];
			}
		});
	}

	return notUnique;
};

module.exports = checkForDuplicates;
