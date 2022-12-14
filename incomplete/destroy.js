

    // DESTROY
    if (cmd === `!destroy`) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isAdmin(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        if (!args.length) return message.channel.send({ content: `Please specify the name of the tournament you wish to destroy.`})

        const input = args[0]
        const tournament = await Tournament.findOne({ where: { abbreviation: { [Op.iLike]: input } }, serverId: mgid })
        if (!tournament) return message.channel.send({ content: `Could not find tournament: "${input}".`})
        if (tournament.state === 'underway') return message.channel.send({ content: `This tournament is underway, therefore it may only be deleted by the database manager.`})
        if (tournament.state === 'complete') return message.channel.send({ content: `This tournament is complete, therefore it may only be deleted by the database manager.`})

        try {
            const { status } = await axios({
                method: 'delete',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`
            })
        
            if (status === 200) {
                const entries = await Entry.findAll({ where: { tournamentId: tournament.id }, include: Player })
                for (let i = 0; i < entries.length; i++) {
                    try {
                        const entry = entries[i]
                        const discordId = entry.player.discordId
                        const playerId = entry.player.id
                        await entry.destroy()
                        
                        const member = await message.guild.members.fetch(discordId)
                        if (!member) continue

                        const count = await Entry.count({ 
                            where: {
                                playerId: playerId,
                                '$tournament.serverId$': server.id
                            },
                            include: Tournament,
                        })

                        if (!count) member.roles.remove(server.tourRole).catch((err) => console.log(err))
                    } catch (err) {
                        console.log(err)
                    }
                }
        
                const content = `Yikes! You deleted ${tournament.name} ${tournament.logo} from your Challonge account.`
                await tournament.destroy()
                return message.channel.send({ content })
            } else {
                return message.channel.send({ content: `Unable to delete tournament from Challonge account.`})
            }
        } catch (err) {
            return message.channel.send({ content: `Error: Unable to delete tournament from Challonge account.`})
        }
    }