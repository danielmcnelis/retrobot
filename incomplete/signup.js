

    // SIGN UP
    if (commands.signupcom.includes(cmd)) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that. Please type **!join** instead.'})   
        const mentioned = message.mentions.members.first()
        if (!mentioned) return message.channel.send({ content: `Could not find user in the server.`})
        const player = await Player.findOne({ where: { discordId: mentioned.user.id }})
        if (!player) return message.channel.send({ content: `${mentioned.user.username} is not in the database.`})
        const tournaments = await Tournament.findAll({ where: { state: {[Op.or]: ['pending', 'standby']}, serverId: interaction.guildId }, order: [['createdAt', 'ASC']] })
        const tournament = await selectTournament(message, tournaments, maid)
        const count = await Tournament.count({ where: { state: 'underway', serverId: interaction.guildId } })
        if (!tournament && count) return message.channel.send({ content: `Sorry, the tournament already started.`})
        if (!tournament && !count) return message.channel.send({ content: `There is no active tournament.`})
        const entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id } })
        const format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.formatName } }})
        if (!format) return message.channel.send(`Unable to determine what format is being played in ${tournament.name}. Please contact the database manager.`)
        
        if (entry) {
            message.channel.send({ content: `Please check your DMs.\n\n(FYI: ${player.name} is already registered for ${tournament.name} ${tournament.logo})`})
        } else {
            message.channel.send({ content: `Please check your DMs.`})
        }

        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(message.member, player, true)
        if (!dbName) return
        const {url, ydk} = await getDeckList(server, message.member, player, format, tournament.name, true)
        if (!url) return         

        if (!entry) {       
            try {                   
              const { participant } = await postParticipant(server, tournament, player)
              if (!participant) return message.author.send({ content: `Error: Could not access tournament: ${tournament.name}`}).catch((err) => console.log(err))
              
              await Entry.create({
                playerName: player.name,
                url: url,
                ydk: ydk,
                participantId: participant.id,
                playerId: player.id,
                tournamentId: tournament.id
              })
            } catch (err) {
              console.log(err)
              return message.author.send({ content: `Error: Could not access database.`}).catch((err) => console.log(err))
            } 

            mentioned.roles.add(server.tourRole).catch((err) => console.log(err))
            const deckAttachments = await drawDeck(ydk) || []                
            message.author.send({ content: `Thanks! I have all the information we need for ${player.name}! FYI, here is their deck list:`, files: [...deckAttachments] }).catch((err) => console.log(err))
            return client.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
        } else {
          try {
              await entry.update({ url: url, ydk: ydk })
          } catch (err) {
              console.log(err)
              return message.author.send({ content: `Error: Could not access database.`}).catch((err) => console.log(err))
          } finally {
              const deckAttachments = await drawDeck(ydk) || []                
              message.author.send({ content: `Thanks! I have ${player.name}'s updated deck list for the tournament:`, files: [...deckAttachments] }).catch((err) => console.log(err))
              return client.channels.cache.get(tournament.channelId).send({ content: `A moderator resubmitted <@${player.discordId}>'s deck list for ${tournament.name} ${tournament.logo}!`})
          }
        }
    }