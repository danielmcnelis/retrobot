


    const { SlashCommandBuilder } = require('discord.js')    
    const { isMod, isNewUser, hasAffiliateAccess } = require('../functions/utility')
    const { findNoShowOpponent, getMatches, processMatchResult, selectTournament } = require('../functions/tournament')
    const emojis = require('../static/emojis.json')
    const { Entry, Format, Player, Server, Tournament } = require('../db')
    const { Op } = require('sequelize')

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('noshow')
            .setDescription(`Record a tournament no-show. 🙈`)
            .addUserOption(option =>
                option
                    .setName('no-show')
                    .setDescription('The player who no-showed.')
                    .setRequired(true)
            ),
        async execute(interaction) {
            const server = !interaction.guildId ? {} : 
                await Server.findOne({ where: { id: interaction.guildId }}) || 
                await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
            if (!hasAffiliateAccess(server)) return interaction.reply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
            if (!isMod(server, interaction.member)) return interaction.reply({ content: `You do not have permission to do that.`})
            
            const format = await Format.findOne({
                where: {
                    [Op.or]: {
                        name: { [Op.iLike]: server.format },
                        channel: interaction.channelId
                    }
                }
            })
        
            if (!format) return interaction.reply({ content: `Try using **/noShow** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        
            const noShow = interaction.options.getUser('no-show')
            const noShowMember = await interaction.guild.members.fetch(noShow.id)
            if ((noShowMember && noShow.bot)) return interaction.reply({ content: `Sorry, Bots do not play ${format.name} Format... *yet*.`})
            if (noShowMember && await isNewUser(noShow.id)) await createPlayer(noShow)

            const noShowPlayer = await Player.findOne({ where: { discordId: noShow.id } })
            if (!noShowPlayer) return interaction.reply({ content: `Sorry, <@${noShow.id}> is not in the database.`})
            const tournaments = [...await Entry.findAll({ where: { playerId: noShowPlayer.id }, include: Tournament })].map((e) => e.tournament).filter((t) => t.serverId === interaction.guildId)
            if (!tournaments.length || !noShowMember.roles.cache.some(role => role.id === server.tourRole)) return interaction.reply({ content: `Sorry, ${noShowPlayer.name} is not any tournaments.`})
         
            const tournament = await selectTournament(interaction, tournaments)
            if (!tournament) return
            if (tournament.state === 'pending' || tournament.state === 'standby') return interaction.reply({ content: `Sorry, ${tournament.name} has not started yet.`})
            if (tournament.state !== 'underway') return interaction.reply({ content: `Sorry, ${tournament.name} is not underway.`})
            
            const noShowEntry = await Entry.findOne({ where: { playerId: noShowPlayer.id, tournamentId: tournament.id } })
            if (!noShowEntry) return interaction.reply({ content: `Sorry I could not find that player's tournament entry in the database.`})
    
            const matchesArr = await getMatches(server, tournament.id)
            let winnerParticipantId = false
            for (let i = 0; i < matchesArr.length; i++) {
                const match = matchesArr[i].match
                if (match.state !== 'open') continue
                winnerParticipantId = findNoShowOpponent(match, noShowEntry.participantId)
                if (winnerParticipantId) break
            }
    
            const winningEntry = await Entry.findOne({ where: { participantId: winnerParticipantId, tournamentId: tournament.id }, include: Player })
            if (!winningEntry) return interaction.reply({ content: `Error: could not find opponent.`})
            const winningPlayer = winningEntry.player
            const winner = await interaction.guild.members.fetch(winningPlayer.discordId)
            const success = await processMatchResult(server, interaction, winner, winningPlayer, noShow, noShowPlayer, tournament, true)
            if (!success) return
    
            return interaction.reply({ content: `<@${noShowPlayer.discordId}>, your Tournament loss to <@${winningPlayer.discordId}> has been recorded as a no-show.`})	
    }
}
