


const { SlashCommandBuilder } = require('discord.js')
const { Entry, Format, Match, Player, Server, Tournament } = require('.././db/index.js')
const { removeParticipant, selectTournament } = require('../functions/tournament')
const { hasPartnerAccess } = require('../functions/utility')
const { Op } = require('sequelize')
const emojis = require('../static/emojis.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('drop')
		.setDescription('Drop from a tournament. 💧'),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})

        const player = await Player.findOne({ where: { discordId: interaction.user.id }})
        if (!player) return interaction.reply({ content: `You are not in the database.`})

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
                
        const tournaments = [
            ...await Entry.findAll({ 
                where: { 
                    '$player.discordId$': interaction.user.id,
                    '$tournament.formatName$': format ? format.name : { [Op.not]: null },
                    '$tournament.serverId$': interaction.guild.id
                }, 
                include: [Player, Tournament] 
            })
        ].map((e) => e.tournament)

        if (!tournaments.length) return interaction.reply({ content: `You are not in an active ${format ? `${format.name} tournament` : 'tournament'}.`})
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        let success = (tournament.state === 'pending' || tournament.state === 'standby')
        if (!success) {
            const matches = await Match.findAll({ 
                where: { 
                    tournament: true
                },
                limit: 5,
                order: [["createdAt", "DESC"]] 
            })

            matches.forEach((match) => {
                if (match.winnerId === player.id || match.loserId === player.id) success = true 
            })

            if (!success) return interaction.reply({ content: `If you played a match, please report the result before dropping. Otherwise ask a Moderator to remove you.`})
        }

        const entry = await Entry.findOne({ 
            where: { 
                '$player.discordId$': interaction.user.id, 
                tournamentId: tournament.id
            },
            include: Player
        })

        return removeParticipant(server, interaction, interaction.member, entry, tournament, true)
    }
}


