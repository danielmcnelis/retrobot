

const { SlashCommandBuilder } = require('discord.js')    
const { isMod, hasAffiliateAccess, selectMatch } = require('../functions/utility')
const emojis = require('../static/emojis.json')
const { Format, Match, Player, Server, Stats } = require('../db')
const { Op } = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('undo')
        .setDescription(`Undo a match result. ⏪`),                
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
    
        if (!hasAffiliateAccess(server)) return interaction.reply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        
        console.log('server.format', server.format)
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        console.log('format', format)
    
        if (!format) return interaction.reply({ content: `Try using **/undo** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        if (!hasAffiliateAccess(server)) return interaction.reply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const serverId = server.internalLadder ? server.id : '414551319031054346'
        
        const matches = await Match.findAll({ where: { format: format.name, serverId: serverId }, order: [['createdAt', 'DESC']]})
        console.log('!!matches', !!matches)
        console.log('matches.slice(0, 10).length', matches.slice(0, 10).length)
        const authorIsMod = isMod(server, interaction.member)
        console.log('authorIsMod', authorIsMod)

        const match = authorIsMod ? await selectMatch(interaction, matches.slice(0, 10)) :  matches[0]
        if (!match) return
    
        const winnerId = match.winnerId
        const loserId = match.loserId
        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const winnerStats = await Stats.findOne({ where: { playerId: winningPlayer.id, format: format.name, serverId: serverId } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const loserStats = await Stats.findOne({ where: { playerId: losingPlayer.id, format: format.name, serverId: serverId } })

        if (interaction.user.id !== losingPlayer.discordId) return interaction.reply({ content: `You did not participate in the last recorded match. Please get a Moderator to help you.`})
        if (!winnerStats.backupElo) return interaction.reply({ content: `Your last opponent, ${winningPlayer.name}, has no backup stats. Please get a Moderator to help you.`})
        if (!loserStats.backupElo) return interaction.reply({ content: `You have no backup stats. Please get a Moderator to help you.`})

        winnerStats.elo = winnerStats.backupElo
        winnerStats.backupElo = null
        winnerStats.wins--
        winnerStats.games--
        await winnerStats.save()

        loserStats.elo = loserStats.backupElo
        loserStats.backupElo = null
        loserStats.losses--
        loserStats.games--
        await loserStats.save()

        await match.destroy()
        return interaction.reply({ content: `The last ${server.internalLadder ? 'Internal ' : ''}${format.name} match in which ${winningPlayer.name} defeated ${losingPlayer.name} has been erased. ${server.emoji || format.emoji}`})	
    }
}
