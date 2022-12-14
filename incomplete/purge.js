
    // PURGE
    if (cmd === `!purge`) {
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
        const { id } = tournament
		const unregistered = await Entry.findAll({ where: { participantId: null, tournamentId: id } })
        for (let i = 0; i < unregistered.length; i++) {
            const entry = unregistered[i]
            message.channel.send(`${entry.playerName} was not properly registered and has been purged from the entrants list.`)
            await entry.destroy()
        }		
    }