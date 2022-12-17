



const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js')
const { Entry, Format, Server, Tournament } = require('../db')
const { selectTournament, sendPairings } = require('../functions/tournament')
const { isMod, hasPartnerAccess } = require('../functions/utility')
const { Op } = require('sequelize')
const axios = require('axios')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Start a tournament.'),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return interaction.reply({ content: 'You do not have permission to do that. Please type **/join** instead.'})   

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
        
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: {[Op.or]: ['pending', 'standby']},
                formatName: format ? format.name : {[Op.not]: null},
                serverId: interaction.guildId
            }, 
            order: [['createdAt', 'ASC']] 
        })

		const tournament = await selectTournament(interaction, tournaments)
		if (!tournament) return
        
        const { id, url } = tournament

		const unregCount = await Entry.count({ where: { participantId: null, tournamentId: id } })
        if (unregCount) return interaction.reply({ content: 'One or more players is not registered with Challonge. Type **/purge** to remove them.'})

		const entryCount = await Entry.count({ where: { tournamentId: id } })
		if (!entryCount) return interaction.reply({ content: `Error: no entrants found.`})

        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
        
        if (data.tournament.state === 'underway') {
			await tournament.update({ state: 'underway' })
            message.channel.send({ content: `Let's go! Your tournament is starting now: https://challonge.com/${url} ${tournament.emoji}`})
            return sendPairings(interaction.guild, server, tournament, false)
        } else {
		    const row = new ActionRowBuilder()
                .addComponents(new ButtonBuilder()
                    .setCustomId('yes')
                    .setLabel('Yes')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId('no')
                    .setLabel('No')
                    .setStyle(ButtonStyle.Primary)
                )

                .addComponents(new ButtonBuilder()
                    .setCustomId('shuffle')
                    .setLabel('Shuffle')
                    .setStyle(ButtonStyle.Primary)
                )

            await interaction.reply({ content: 'Should this tournament be seeded by Format Library rankings?', components: [row] })
        }
    }
}
