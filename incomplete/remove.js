
    // REMOVE
    if (cmd === `!remove`) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        const member = message.mentions.members.first()
        const discordId = member && member.user ? member.user.id : null
        if (!discordId) return message.channel.send({ content: `Please specify the player you wish to remove.`})
        const tournaments = [...await Entry.findAll({ where: { '$player.discordId$': discordId }, include: [Player, Tournament] })].map((e) => e.tournament).filter((t) => t.serverId === message.guild.id)
        if (!tournaments.length) return message.channel.send({ content: `That user is not in any tournaments.`})
        const tournament = await selectTournament(message, tournaments, maid)
        const entry = await Entry.findOne({ where: { '$player.discordId$': discordId, tournamentId: tournament.id }, include: Player })
        if (!entry) return message.channel.send({ content: `That user is not in any tournaments.`})
        return removeParticipant(server, message, member, entry, tournament, false)
    }