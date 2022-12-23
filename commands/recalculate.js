

    const { SlashCommandBuilder } = require('discord.js')    
    const { isMod, hasAffiliateAccess, trackStats } = require('../functions/utility')
    const emojis = require('../static/emojis.json')
    const { Format, Match, Player, Server, Stats } = require('../db')
    const { Op } = require('sequelize')

    // RECALCULATE
    // Use this command to recalculate every player's Elo from scratch.
    // This is needed after matches are directly added or deleted using postgreSQL.
    // It's also required after using the !combine command, but the bot will remind you to do it.
    module.exports = {
        data: new SlashCommandBuilder()
            .setName('recalculate')
            .setDescription(`Recalculate player stats. 🧮`),
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
        
            if (!format) return interaction.reply({ content: `Try using **/recalculate** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            
            const serverId = server.internalLadder ? server.id : '414551319031054346'
            const count = await Match.count({ where: { format: format.name, serverId: serverId }})

            interaction.reply({ content: `Recalculating data from ${count} ${format.name} ${format.emoji} matches. Please wait...`})
            
            const allMatches = await Match.findAll({ 
                where: { format: format.name, serverId: serverId }, 
                attributes: ['id', 'winnerId', 'loserId', 'delta'], 
                order: [["createdAt", "ASC"]]
            })

            console.log('allMatches.length', allMatches.length)

            const allStats = await Stats.findAll({ where: { format: format.name, serverId: serverId } })
    
            for (let i = 0; i < allStats.length; i++) {
                const stats = allStats[i]
                await stats.update({
                    elo: 500.00,
                    testElo: 500.00,
                    backupElo: null,
                    wins: 0,
                    losses: 0,
                    games: 0
                })
            }

            for (let i = 0; i < allMatches.length; i++) {
                const match = allMatches[i]
                const winnerId = match.winnerId
                const loserId = match.loserId
                const winnerStats = await Stats.findOne({ where: { playerId: winnerId, format: format.name, serverId: serverId }, include: Player })
                const loserStats = await Stats.findOne({ where: { playerId: loserId, format: format.name, serverId: serverId }, include: Player })
    
                const prevVanq = await Match.count({
                    where: {
                        format: {[Op.iLike]: match.format},
                        winnerId: match.winnerId,
                        loserId: match.loserId,
                        createdAt: {[Op.lte]: match.createdAt}
                    }
                })

                if (!winnerStats) {
                    await trackStats(server, winnerId, format.name)
                    i--
                    continue
                }
    
                if (!loserStats) {
                    await trackStats(server, loserId, format.name)
                    i--
                    continue
                }
    
                const origEloWinner = winnerStats.elo || 500.00
                const origEloLoser = loserStats.elo || 500.00
                const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
                
                winnerStats.elo = origEloWinner + delta
                if (origEloWinner + delta > winnerStats.bestElo) winnerStats.bestElo = origEloWinner + delta
                winnerStats.backupElo = origEloWinner
                winnerStats.wins++
                winnerStats.games++
                winnerStats.streak++
                if (winnerStats.streak >= winnerStats.bestStreak) winnerStats.bestStreak++
                if (!prevVanq) winnerStats.vanquished++
                await winnerStats.save()
        
                loserStats.elo = origEloLoser - delta
                loserStats.backupElo = origEloLoser
                loserStats.losses++
                loserStats.games++
                loserStats.streak = 0
                await loserStats.save()
    
                match.delta = delta
                await match.save()
                console.log(`${format.name} Match ${i+1}: ${winnerStats.player.name} > ${loserStats.player.name}`)
            }
    
            return interaction.channel.send({ content: `Recalculation complete!`})	
    }
}

    