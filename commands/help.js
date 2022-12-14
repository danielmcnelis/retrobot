
const { MessageEmbed, SlashCommandBuilder } = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('View the RetroBot user guide.'),
	async execute(interaction) {
        const botEmbed = new MessageEmbed()
	        .setColor('#38C368')
        	.setTitle('RetroBot User Guide')
	        .setDescription('A Yu-Gi-Oh! Bot powered by FormatLibrary.com.\n' )
	        .setURL('https://discord.com/invite/formatlibrary')
	        .setAuthor({ name: 'Jazz#2704', iconURL: 'https://i.imgur.com/wz5TqmR.png', url: 'https://discord.com/invite/formatlibrary' })
            .setThumbnail('https://cdn.formatlibrary.com/images/logos/Format%20Library.png')
            .addField('How to Use This Bot', '\nThe following commands can be used for any format in the appropriate server, channels, or via DM.')
        	.addField('Cards', '\n{ Card Name } - Look up a card. For example, { Dark Magician }. \n')
        	.addField('Rated Pools', '\n!rated - DM to join a rated pool. \n!exit - DM to leave a rated pool. \n!pools - DM to view your rated pools. \n')
        	.addField('Ranked Play', '\n!stats - (blank or @user) - Post a player\'s stats. \n!loss - (@user) - Report a loss to another player. \n!top - (n) - Post the top rated players (100 max). \n!h2h - (@user + @user) - Post the H2H record between 2 players. \n!role - Add or remove a ranked play role. \n!undo - Undo the last report if you made a mistake. \n!hist - Post a graph of your Elo history. \n!act - Post a graph of dueling activity. \n')
        	.addField('Format Info', '\n!legal - Privately check if your deck is legal. \n!list - View the Forbidden and Limited list. \n')
        	.addField('Tournaments', '\n!join - Register for an upcoming tournament.\n!resubmit - Resubmit your deck list for a tournament. \n!drop - Drop from a tournament. \n!bracket - Post the bracket(s) for the current tournament(s).')
        	.addField('Ironmans', '\n!iron - Join an ironman queue.\n!q - Check an ironman queue. \n')
        	.addField('Miscellaneous', '\n!db - (name or @user) - Set or check a DuelingBook name. \n!prof - (blank or @user) - Post a player\'s profile. \n!medals - (blank or @user) - Post a player\'s best medals. \n!rng (X) - Random number from 1 to X. \n!flip - Flip a coin. \n!dice - Roll a 6-sided die. \n!bot - View the RetroBot User Guide. \n!mod - View the RetroBot Moderator Guide.')

        interaction.user.send({ embeds: [botEmbed] }).catch((err) => console.log(err))
        return interaction.reply({ content: "I messaged you the RetroBot User Guide."})
	}
}