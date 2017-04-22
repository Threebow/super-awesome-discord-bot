const botSettings = require("./botsettings.json");
const Discord = require("discord.js");
const prefix = botSettings.prefix;

const bot = new Discord.Client({disableEveryone: true});

bot.on("ready", async () => {
	console.log(`Bot is ready! ${bot.user.username}`);

	try {
		let link = await bot.generateInvite(["ADMINISTRATOR"]);
		console.log(link);
	} catch(e) {
		console.log(e.stack);
	}
});

bot.on("message", async message => {
	if(message.author.bot) return;
	if(message.channel.type === "dm") return;

	let messageArray = message.content.split(" ");
	let command = messageArray[0];
	let args = messageArray.slice(1);

	if(!command.startsWith(prefix)) return;

	if(command === `${prefix}userinfo`) {
		let embed = new Discord.RichEmbed()
			.setAuthor(message.author.username)
			.setDescription("This is the user's info!")
			.setColor("#9B59B6")
			.addField("Full Username", `${message.author.username}#${message.author.discriminator}`)
			.addField("ID", message.author.id)
			.addField("Created At", message.author.createdAt);

		message.channel.sendEmbed(embed);

		return;
	}

	if(command === `${prefix}mute`) {
		if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.sendMessage("You do not have manage messages.");

		let toMute = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0]);
		if(!toMute) return message.channel.sendMessage("You did not specify a user mention or ID!");

		if(toMute.id === message.author.id) return message.channel.sendMessage("You cannot mute yourself.");
		if(toMute.highestRole.position >= message.member.highestRole.position) return message.channel.sendMessage("You cannot mute a member who is higher or has the same role as you.");

		let role = message.guild.roles.find(r => r.name === "SADB Muted");
		if(!role) {
			try {
				role = await message.guild.createRole({
					name: "SADB Muted",
					color: "#000000",
					permissions: []
				});

				message.guild.channels.forEach(async (channel, id) => {
					await channel.overwritePermissions(role, {
						SEND_MESSAGES: false,
						ADD_REACTIONS: false
					});
				});
			} catch(e) {
				console.log(e.stack);
			}
		}

		if(toMute.roles.has(role.id)) return message.channel.sendMessage("This user is already muted!");

		await toMute.addRole(role);
		message.channel.sendMessage("I have muted them.");

		return;
	}

	if(command === `${prefix}unmute`) {
		if(!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.sendMessage("You do not have manage messages.");

		let toMute = message.guild.member(message.mentions.users.first()) || message.guild.members.get(args[0]);
		if(!toMute) return message.channel.sendMessage("You did not specify a user mention or ID!");

		let role = message.guild.roles.find(r => r.name === "SADB Muted");

		if(!role || !toMute.roles.has(role.id)) return message.channel.sendMessage("This user is not muted!");

		await toMute.removeRole(role);
		message.channel.sendMessage("I have unmuted them.");

		return;
	}
});

bot.login(botSettings.token);