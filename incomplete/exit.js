

    // EXIT
    if (commands.exitcom.includes(cmd)) {
        if (interaction.guildId) return message.channel.send(`Try using ${cmd} by DM'ing it to me.`)
        const player = await Player.findOne({ where: { discordId: maid } })
        if (!player) return message.channel.send(`You are not in the database. Please join the Format Library Discord server to register.`)
       
        const oldRatedPools = await RatedPool.findAll({ where: {  playerId: player.id } }) || []
        if (!oldRatedPools.length) return message.channel.send(`You are not in any Rated Pools.`)

        const pools = oldRatedPools.map((p) => p.format)

        const drops = await getDropFormats(message, pools)
        if (!drops || !drops.length) return message.channel.send(`Please specify a valid number.`)

        const results = []
        for (let i = 0; i < drops.length; i++) {
            try {
                const format = drops[i]
                const oldRatedPool = await RatedPool.findOne({ where: { format: format, playerId: player.id } })
                await oldRatedPool.destroy()
                results.push(format)
            } catch (err) {
                console.log(err)
            }
        }

        return message.channel.send({ content: `You left the Rated Pool for the following format(s):\n${results.join('\n').toString()}.`}).catch((err) => console.log(err))
    }
