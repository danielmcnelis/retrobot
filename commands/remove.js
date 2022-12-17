


const { SlashCommandBuilder } = require('discord.js')
const { Entry, Format, Match, Player, Server, Tournament } = require('../db')
const { removeParticipant, selectTournament } = require('../functions/tournament')
const { hasPartnerAccess } = require('../functions/utility')
const { Op } = require('sequelize')
const emojis = require('../static/emojis.json')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove')
		.setDescription('Remove a player from a tournament.')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user you want to remove.')
                .setRequired(true)
        ),
	async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })

        const user = interaction.options.getUser('user')
        const member = await interaction.guild.members.fetch(user.id)

        if (!hasPartnerAccess(server)) return interaction.reply({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, interaction.member)) return interaction.reply({ content: 'You do not have permission to do that.'})

        const player = await Player.findOne({ where: { discordId: user.id }})
        if (!player) return interaction.reply(`That player is not in the database.`)

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
                    playerId: player.id,
                    '$tournament.formatName$': format ? format.name : { [Op.not]: null },
                    '$tournament.serverId$': interaction.guild.id
                }, 
                include: [Player, Tournament] 
            })
        ].map((e) => e.tournament)

        if (!tournaments.length) return interaction.reply(`That user is not in an active ${format ? `${format.name} tournament` : 'tournament'}.`)
        const tournament = await selectTournament(interaction, tournaments)
        if (!tournament) return

        const entry = await Entry.findOne({ 
            where: { 
                playerId: player.id, 
                tournamentId: tournament.id 
            }, 
            include: Player 
        })

        return removeParticipant(server, interaction, member, entry, tournament, false)
    }
}




