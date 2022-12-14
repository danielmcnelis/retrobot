

    // JOIN
    if(commands.joincom.includes(cmd)) {        
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const mention = message.mentions.members.first()
        if (isMod(server, message.member) && mention) return message.channel.send({ content: `Please type **!signup @user** to register someone else for the tournament.`})
        const player = await Player.findOne({ where: { discordId: maid }})
        if (!player) return message.channel.send({ content: `You are not in the database.`})
        
        let format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
        
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: {[Op.or]: ['pending', 'standby']}, 
                formatName: format ? format.name : {[Op.not]: null},
                serverId: interaction.guildId
            }, 
            order: [['createdAt', 'ASC']] 
        })

        const tournament = await selectTournament(message, tournaments, maid)

        const event = await Event.findOne({
            where: {
                tournamentId: tournament.id
            }
        })

        const count = await Tournament.count({ 
            where: { 
                state: 'underway', 
                formatName: format ? format.name : {[Op.not]: null},
                serverId: interaction.guildId
            }
        })

        if (!tournament && format && count) return message.channel.send({ content: `Sorry, the ${format.name} ${server.emoji || format.emoji} tournament already started.`})
        if (!tournament && !format && count) return message.channel.send({ content: `Sorry, the tournament already started.`})
        if (!tournament && format && !count) return message.channel.send({ content: `There is no pending ${format.name} ${server.emoji || format.emoji} tournament.`})
        if (!tournament && !format && !count) return message.channel.send({ content: `There is no pending tournament.`})
        if (tournament.state === 'standby') return message.channel.send({ content: `Sorry, registration for ${tournament.name} ${tournament.logo} is currently closed.`})
        const entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id }})
        if (!format) format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.formatName } }})
        if (!format) return message.channel.send(`Unable to determine what format is being played in ${tournament.name}. Please contact the database manager.`)
        message.channel.send({ content: `Please check your DMs.` })
        
        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(message.member, player)
        if (!dbName) return
        const { url, ydk } = await getDeckList(server, message.member, player, format, tournament.name, event)
        if (!url) return

        if (!entry) {
            try {                                
              const { participant } = await postParticipant(server, tournament, player)
              if (!participant) return message.channel.send({ content: `Error: Unable to register on Challonge for ${tournament.name} ${tournament.logo}.`})
              
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
              return message.author.send({ content: `Error: Could not access database.`})
            } finally {
              const deckAttachments = await drawDeck(ydk) || []
              message.member.roles.add(server.tourRole).catch((err) => console.log(err))
              message.author.send({ content: `Thanks! I have all the information we need from you. Good luck in the tournament! FYI, this is the deck you submitted:`, files: [...deckAttachments] }).catch((err) => console.log(err))
              return client.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
            }
        } else if (entry.active === false) {
            try {                                
                const { participant } = await postParticipant(server, tournament, player)
                if (!participant) return message.channel.send({ content: `Error: Unable to register on Challonge for ${tournament.name} ${tournament.logo}.`})
                
                await entry.update({
                    url: url,
                    ydk: ydk,
                    participantId: participant.id,
                    active: true
                })
            } catch (err) {
                console.log(err)
                return message.author.send({ content: `Error: Could not access database.`})
            } finally {
                const deckAttachments = await drawDeck(ydk) || []
                message.member.roles.add(server.tourRole).catch((err) => console.log(err))
                message.author.send({ content: `Thanks! I have all the information we need from you. Good luck in the tournament! FYI, this is the deck you submitted:`, files: [...deckAttachments] }).catch((err) => console.log(err))
                return client.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
            }
        } else {
            try {
                await entry.update({ url: url, ydk: ydk })
            } catch (err) {
                console.log(err)
                return message.author.send({ content: `Error: Could not access database.`}).catch((err) => console.log(err))
            } finally {
                const deckAttachments = await drawDeck(ydk) || []
                message.author.send({ content: `Thanks! I have your updated deck list for the tournament:`, files: [...deckAttachments] }).catch((err) => console.log(err))
                return client.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> resubmitted their deck list for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
            }
        }
    }