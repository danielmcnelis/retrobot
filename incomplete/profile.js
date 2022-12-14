
    // PROFILE
    if (commands.profcom.includes(cmd)) {
        const discordId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
        const player = await Player.findOne({ where: { discordId: discordId } })
        const allStats = await Stats.findAll({ where: { playerId: player.id, internal: false } })
        if (!player || !allStats) return message.channel.send({ content: "That user is not in the database."})
        const results = []
        
        for (let i = 0; i < allStats.length; i++) {
            const stats = allStats[i]
            const format = await Format.findOne({ where: { name: {[Op.iLike]: stats.format } }})
            const medal = getMedal(stats.elo)
            results.push(`${format.emoji} ${format.name}: ${medal}`)
        }

        if (!results.length) {
            return message.channel.send({ content: `You have not played any ranked games.`})
        } else {
            results.unshift(`${emojis.FL} --- ${player.name}'s Player Profile --- ${emojis.FL}`)
            for (let i = 0; i < results.length; i += 20) message.channel.send({ content: results.slice(i, i+20).join('\n').toString()}).catch((err) => console.log(err))
            return
        }
    }