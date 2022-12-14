
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('View the RetroBot user guide.'),
	async execute(interaction) {
        const botEmbed = new EmbedBuilder()
	        .setColor('#38C368')
        	.setTitle('RetroBot User Guide')
	        .setDescription('A Yu-Gi-Oh! Bot powered by FormatLibrary.com.\n' )
	        .setURL('https://discord.com/invite/formatlibrary')
	        .setAuthor({ name: 'Jazz#2704', iconURL: 'https://i.imgur.com/wz5TqmR.png', url: 'https://discord.com/invite/formatlibrary' })
            .setThumbnail('https://cdn.formatlibrary.com/images/logos/Format%20Library.png')
            .addFields(
                { name: 'How to Use This Bot', value: '\nThe following commands can be used for any format in the appropriate server, channels, or via DM.' },
        	    { name: 'Cards', value: '\n/search - Look up a card. \n'},
                { name: 'Rated Pools', value: '\n/rated - DM to join a rated pool. \n/exit - DM to leave a rated pool. \n/pools - DM to view your rated pools. \n'},
                { name: 'Ranked Play', value: '\n/stats - (blank or @user) - Post a player\'s stats. \n/loss - (@user) - Report a loss to another player. \n/top - (n) - Post the top rated players (100 max). \n/h2h - (@user + @user) - Post the H2H record between 2 players. \n/role - Add or remove a ranked play role. \n/undo - Undo the last report if you made a mistake. \n/hist - Post a graph of your Elo history. \n/act - Post a graph of dueling activity. \n'},
                { name: 'Format Info', value: '\n/legal - Privately check if your deck is legal. \n/list - View the Forbidden and Limited list. \n'},
                { name: 'Tournaments', value: '\n/join - Register for an upcoming tournament.\n/resubmit - Resubmit your deck list for a tournament. \n/drop - Drop from a tournament. \n/bracket - Post the bracket(s) for the current tournament(s).'},
                { name: 'Ironmans', value: '\n/iron - Join an ironman queue.\n/q - Check an ironman queue. \n'},
                { name: 'Miscellaneous', value: '\n/db - (name or @user) - Set or check a DuelingBook name. \n/prof - (blank or @user) - Post a player\'s profile. \n/medals - (blank or @user) - Post a player\'s best medals. \n/rng (X) - Random number from 1 to X. \n/flip - Flip a coin. \n/dice - Roll a 6-sided die. \n/bot - View the RetroBot User Guide. \n/mod - View the RetroBot Moderator Guide.'}
            )
            
        interaction.user.send({ embeds: [botEmbed] }).catch((err) => console.log(err))
        return interaction.reply({ content: "I messaged you the RetroBot User Guide."})
	}
}