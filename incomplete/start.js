
    // START
    if (commands.startcom.includes(cmd)) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: {
                    [Op.or]: ['pending', 'standby']
                },
                serverId: mgid
            }, 
            order: [['createdAt', 'ASC']] 
        })

		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send({ content: `There are no pending tournaments.`})
        const { name, id, url } = tournament
		const unregCount = await Entry.count({ where: { participantId: null, tournamentId: id } })
        if (unregCount) return message.channel.send({ content: 'One or more players is not registered with Challonge. Type **!purge** to remove them.'})
		const entryCount = await Entry.count({ where: { tournamentId: id } })
		if (!entryCount) return message.channel.send({ content: `Error: no entrants found.`})

        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
        
        if (data.tournament.state === 'underway') {
			await tournament.update({ state: 'underway' })
            message.channel.send({ content: `Let's go! Your tournament is starting now: https://challonge.com/${url} ${tournament.emoji}`})
            return sendPairings(client, server, tournament, false)
        } else {
            const toBeSeeded = await askIfSeeded(message, name)
            if (toBeSeeded) await seed(server, message, tournament)

            const { status } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/start.json?api_key=${server.challongeAPIKey}`
            })
    
            if (status === 200) { 
                await tournament.update({ state: 'underway' })
                message.channel.send({ content: `Let's go! Your tournament is starting now: https://challonge.com/${url} ${tournament.emoji}`})
                return sendPairings(client, server, tournament, false)
            } else {
                return message.channel.send({ content: `Error connecting to Challonge.`})
            }
        }
    }