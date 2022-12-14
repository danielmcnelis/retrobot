

    // DECK
    if (commands.deckcom.includes(cmd)) {
        const discordId = message.mentions.users.first() ? message.mentions.users.first().id : maid
        const isAuthor = discordId === maid
        if (!isMod(server, message.member) && !isAuthor) return message.channel.send({ content: `You do not have permission to do that.` })

        const player = await Player.findOne({ where: { discordId: discordId } })
        if (!player) return message.channel.send({ content: `${isAuthor ? "You are" : "That player is"} not in the database.`})
        
        const tournaments = await Tournament.findAll({
            where: { 
                state: {[Op.or]: ["pending", "underway"]}, 
                serverId: interaction.guildId 
            },
            order: [["createdAt", "ASC"]]
        })
        
        const tournament = await selectTournament(message, tournaments, maid);
        if (!tournament) return message.channel.send({ content: `There is no active tournament.` })
        const entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id } })
        if (!entry) return message.channel.send({ content: `${isAuthor ? "You are" : "That player is"} not registered for ${tournament.name}.`})

        message.channel.send({ content: `Please check your DMs.` })
        const deckAttachments = await drawDeck(entry.ydk) || []
        return message.author.send({ content: `${isAuthor ? `${player.name}\'s` : 'Your'} deck for ${tournament.name} is:\n<${entry.url}>`, files: [...deckAttachments]}).catch((err) => console.log(err))
    }