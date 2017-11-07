const botSettings = require("./botsettings.json");
const Discord = require("discord.js");
const fs = require("fs");
const mysql = require("mysql");

const prefix = botSettings.prefix;

const bot = new Discord.Client({disableEveryone: true});
bot.commands = new Discord.Collection();
bot.ratelimits = new Discord.Collection();
bot.mutes = require("./mutes.json");

fs.readdir("./cmds/", (err, files) => {
	if(err) console.error(err);

	let jsfiles = files.filter(f => f.split(".").pop() === "js");
	if(jsfiles.length <= 0) {
		console.log("No commands to load!");
		return;
	}

	console.log(`Loading ${jsfiles.length} commands!`);

	jsfiles.forEach((f, i) => {
		let props = require(`./cmds/${f}`);
		console.log(`${i + 1}: ${f} loaded!`);
		bot.commands.set(props.help.name, props);
	});
});

bot.on("ready", () => {
	console.log(`Bot is ready! ${bot.user.username}`);

	bot.setInterval(() => {
		for(let i in bot.mutes) {
			let time = bot.mutes[i].time;
			let guildId = bot.mutes[i].guild;
			let guild = bot.guilds.get(guildId);
			let member = guild.members.get(i);
			let mutedRole = guild.roles.find(r => r.name === "SADB Muted");
			if(!mutedRole) continue;

			if(Date.now() > time) {
				console.log(`${i} is now able to be unmuted!`);

				member.removeRole(mutedRole);
				delete bot.mutes[i];

				fs.writeFile("./mutes.json", JSON.stringify(bot.mutes), err => {
					if(err) throw err;
					console.log(`I have unmuted ${member.user.tag}.`);
				});
			}
		}
	}, 5000)
});

var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "1234",
	database: "sadb"
});

con.connect(err => {
	if(err) throw err;
	console.log("Connected to database!");
});

function generateXp() {
	let min = 20;
	let max = 30;

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

bot.on("message", async message => {
	if(message.author.bot) return;
	if(message.channel.type === "dm") return;

	con.query(`SELECT * FROM xp WHERE id = '${message.author.id}'`, (err, rows) => {
		if(err) throw err;

		let sql;

		if(rows.length < 1) {
			sql = `INSERT INTO xp (id, xp) VALUES ('${message.author.id}', ${generateXp()})`;
		} else {
			let xp = rows[0].xp;
			sql = `UPDATE xp SET xp = ${xp + generateXp()} WHERE id = '${message.author.id}'`;
		}
		con.query(sql);
	});

	if(/(?:https?:\/)?discord(?:app.com\/invite|.gg)/gi.test(message.content)) {
		message.delete();
		return;
	}

	let messageArray = message.content.split(/\s+/g);
	let command = messageArray[0];
	let args = messageArray.slice(1);

	if(!command.startsWith(prefix)) return;

	let limit = bot.ratelimits.get(message.author.id);
	let now = Date.now();
	let timeLimit = 2000;

	if(limit != null) {
		if(limit >= now - timeLimit) {
			message.delete();
			return message.channel.send("You are being ratelimited. Try again in `" + (Math.abs((now - limit) - timeLimit) / 1000).toFixed(2) + "` seconds.").then(m => m.delete(2000));
		} else {
			bot.ratelimits.set(message.author.id, now);
		}
	} else {
		bot.ratelimits.set(message.author.id, now);
	}

	let cmd = bot.commands.get(command.slice(prefix.length));
	if(cmd) cmd.run(bot, message, args, con);
});

bot.login(botSettings.token);