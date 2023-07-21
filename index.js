// Require the necessary discord.js classes
//Collection is used to store and efficiently retrieve commands for execution.
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { exec } = require('child_process');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });


// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);

//load commands files on startup
const fs = require('node:fs'); //fs is used to read the commands directory and identify our command files.
const path = require('node:path'); //path helps construct paths to access files and directories


exec('node ./webhook.js', (error) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
	console.log("executed webhook");
});


client.commands = new Collection();


//retrieve command files
const commandsPath = path.join(__dirname, 'commands'); //helps to construct a path to the commands directory
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')); 
//^reads the path to the directory and returns an array of all the file names it contains

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});