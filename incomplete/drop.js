

    // DROP
    if(commands.dropcom.includes(cmd)) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const player = await Player.findOne({ where: { discordId: maid }})
        if (!player) return message.channel.send({ content: `You are not in the database.`})
        const tournaments = [...await Entry.findAll({ where: { '$player.discordId$': maid }, include: [Player, Tournament] })].map((e) => e.tournament).filter((t) => t.serverId === message.guild.id)
        if (!tournaments.length) return message.channel.send({ content: `You are not in an active tournament.`})
        const tournament = await selectTournament(message, tournaments, maid)
        let success = (tournament.state === 'pending' || tournament.state === 'standby')
        if (!success) {
            const matches = await Match.findAll({ 
                where: { 
                    tournament: true 
                }, 
                limit: 5,
                order: [["createdAt", "DESC"]] 
            })

            matches.forEach((match) => {
                if (match.winnerId === player.id || match.loserId === player.id) success = true 
            })

            if (!success) return message.channel.send({ content: `If you played a match, please report the result before dropping. Otherwise ask a Moderator to remove you.`})
        }

        const entry = await Entry.findOne({ where: { '$player.discordId$': maid, tournamentId: tournament.id }, include: Player })
        if (!entry) return message.channel.send({ content: `You are not in an active tournament.`})
        return removeParticipant(server, message, message.member, entry, tournament, true)
    }
