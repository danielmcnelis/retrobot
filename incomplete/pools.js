
    // POOLS
    if (cmd === `!pools`) {
        if (mgid) return message.channel.send(`Try using ${cmd} by DM'ing it to me.`)
        const player = await Player.findOne({ where: { discordId: maid } })
        if (!player) return message.channel.send(`You are not in the database. Please join the Format Library Discord server to register.`)
        const pools = [...await RatedPool.findAll({ where: { playerId: player.id }, order: [['format', 'ASC']] })].map((p) => p.format)
        if (!pools.length) return message.channel.send(`You are not in any Rated Pools.`)
        return message.channel.send({ content: `You are in the following pools:\n${pools.join('\n')}`})
    }