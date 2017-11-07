module.exports.run = async (bot, message, args) => {
	let users = bot.users;

	let searchTerm = args[0];
	if(!searchTerm) return message.channel.send("Please provide a search term.");

	let matches = users.filter(u => u.tag.toLowerCase().includes(searchTerm.toLowerCase()));

	message.channel.send(matches.map(u => u.tag).join(", "));
}

module.exports.help = {
	name: "findusers"
}