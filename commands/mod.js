
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js')
const { Server } = require('../../formatlibrary/libs/models/src/lib/index.js')
const { hasAffiliateAccess, isMod } = require('../functions/utility')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mod')
		.setDescription('View the RetroBot Moderator guide. 👮'),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
    
        if (!hasAffiliateAccess(server)) return interaction.reply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return interaction.reply({ content: "You do not have permission to do that."})

        const botEmbed = new EmbedBuilder()
	        .setColor('#38C368')
        	.setTitle('RetroBot Moderator Guide')
	        .setDescription('A Rankings and Tournament Bot powered by FormatLibrary.com.\n' )
	        .setURL('https://discord.com/invite/formatlibrary')
	        .setAuthor({ name: 'Jazz#2704', iconURL: 'https://i.imgur.com/wz5TqmR.png', url: 'https://discord.com/invite/formatlibrary' })
            .setThumbnail('https://cdn.formatlibrary.com/images/logos/Format%20Library.png')
        	.addFields(
                { name: 'Ranked Play', value: '\n!manual - (@winner + @loser) - Manually record a match result. \n!undo - Undo the most recent loss, even if you did not report it.'},
                { name: 'Tournaments', value: '\n!create - (tournament name) - Create a new tournament.  \n!signup - (@user) - Directly add a player to a bracket. \n!noshow - (@user) - Report a no-show. \n!deck - (@user) - Check a player\'s tournament deck. \n!remove - (@user) - Remove a player from a bracket. \n!start - Start a tournament. \n!end - (tournament name) - End a tournament. \n!timer - (x) - Start a timer for X minutes.'},
            )

        interaction.user.send({ embeds: [botEmbed] }).catch((err) => console.log(err))
        return interaction.reply({ content: "I messaged you the RetroBot Moderator Guide."})
	}
}