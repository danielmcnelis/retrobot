



const { SlashCommandBuilder } = require('discord.js')
const { Server, Tournament } = require('../db')
const { selectTournament } = require('../functions/tournament')
const { isMod, hasPartnerAccess } = require('../functions/utility')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('open')
		.setDescription('Open tournament registration.'),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
        await Server.findOne({ where: { id: interaction.guildId }}) || 
        await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return interaction.reply({ content: 'You do not have permission to do that.'})
        
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: 'standby',
                serverId: interaction.guildId
            }, 
            order: [['createdAt', 'ASC']] 
        })
          
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return
        await tournament.update({ state: 'pending'})
        return interaction.reply({ content: `Registration for ${tournament.name} ${tournament.logo} is now open.`})
	}
}