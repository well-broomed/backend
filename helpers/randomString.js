function randomString(stringLength) {
	let string = '';
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	while (stringLength--) {
		string += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return string;
}

module.exports = randomString;
