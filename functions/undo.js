
const { Match, Player, Stats } = require('../db/index.js')

const undoMatch = async (channel, id) => {
    try {
        const match = await Match.findOne({ where: { id }})
        const winnerId = match.winnerId
        const loserId = match.loserId
        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const winnerStats = await Stats.findOne({ where: { playerId: winningPlayer.id, format: format.name, serverId: match.serverId } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const loserStats = await Stats.findOne({ where: { playerId: losingPlayer.id, format: format.name, serverId: match.serverId } })
    
        if (!winnerStats.backupElo) channel.send({ content: `${winningPlayer.name} has no backup stats: Remember to **/recalculate** when finished.`})
        if (!loserStats.backupElo) channel.send({ content: `${losingPlayer.name} has no backup stats: Remember to **/recalculate** when finished.`})

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
        return channel.send({ content: `The last ${match.format} match in which ${winningPlayer.name} defeated ${losingPlayer.name} has been erased.`})	
    } catch (err) {
        console.log(err)
    }
} 



module.exports = {
    undoMatch
}
