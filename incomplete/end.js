
    // END
    if (cmd === `!end`) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        const input = args[0]

        const tournaments = await Tournament.findAll({ 
            where: { 
                state: 'underway',
                serverId: interaction.guildId
            }, 
            order: [['createdAt', 'ASC']] 
        })

        const tournament = await Tournament.findOne({ 
            where: { 
                [Op.or]: { 
                    name: { [Op.iLike]: input }, 
                    url: { [Op.iLike]: input }
                }, 
                serverId: interaction.guildId
            }
        }) || await selectTournament(message, tournaments, maid)
        
        if (!tournament) return message.channel.send({ content: `Could not find tournament: "${input}".`})
        if (tournament.state === 'pending' || tournament.state === 'standby') return message.channel.send({ content: `This tournament has not begun.`})
        if (tournament.state === 'complete') return message.channel.send({ content: `This tournament has already ended.`})

        try {
            const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
            if (data.tournament.state !== 'complete') {
                const { status } = await axios({
                    method: 'post',
                    url: `https://api.challonge.com/v1/tournaments/${tournament.id}/finalize.json?api_key=${server.challongeAPIKey}`
                })
    
                if (status === 200) {   
                    message.channel.send({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized on Challonge.com.`})
                } else {
                    message.channel.send({ content: `Unable to finalize ${tournament.name} ${tournament.logo} on Challonge.com.`})
                }
            }
        } catch (err) {
            console.log(err)
            message.channel.send({ content: `Unable to connect to Challonge.com.`})
        }

        let event = await Event.findOne({ where: { tournamentId: tournament.id }})

        if (!event) {
            event = await Event.create({
                name: tournament.name,
                abbreviation: tournament.abbreviation,
                formatName: tournament.formatName,
                formatId: tournament.formatId,
                referenceUrl: `https://challonge.com/${tournament.url}`,
                display: false,
                tournamentId: tournament.id,
                type: tournament.type,
                community: tournament.community,
                logo: tournament.logo,
                emoji: tournament.emoji
            })
        }

        if (event && !event.playerId) {
            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeAPIKey}`)
                let winnerParticipantId = null
                for (let i = 0; i < data.length; i++) {
                    const participant = data[i].participant
                    if (participant.final_rank === 1) {
                        winnerParticipantId = participant.id
                        break
                    }
                }
    
                const winningEntry = await Entry.findOne({ where: { participantId: parseInt(winnerParticipantId) }})

                await event.update({
                    winner: winningEntry.playerName,
                    playerId: winningEntry.playerId
                })

                console.log(`Marked ${winningEntry.playerName} as the winner of ${event.name}.`)
            } catch (err) {
                console.log(err)
            }
        }

        if (event && !event.size) {
            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${server.challongeAPIKey}`)
                const size = event.size || data.tournament.participants_count
                const startDate = `${data.tournament.started_at.slice(0, 10)} ${data.tournament.started_at.slice(11, 26)}`
                const endDate = `${data.tournament.completed_at.slice(0, 10)} ${data.tournament.completed_at.slice(11, 26)}`

                await event.update({
                    size,
                    startDate,
                    endDate
                })

                console.log(`Recorded size, start date, and end date for ${event.name}`)
            } catch (err) {
                console.log(err)
            }
        }

        let count = await Deck.count({ where: { eventId: event.id }})
        
        if (event && event.size > 0 && event.size !== count) {
            try {
                const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeAPIKey}`)
                const success = await createDecks(event, data)
                if (!success) {
                    return message.channel.send(`Failed to save all decks.`)
                } else {
                    count = event.size
                    await composeThumbnails(message, event.abbreviation)
                }
            } catch (err) {
                console.log(err)
                return message.channel.send(`Failed to save all decks.`)
            }
        }
        
        if (event && event.size > 0 && event.size === count) {
            const entries = await Entry.findAll({ where: { tournamentId: tournament.id }, include: Player })
    
            for (let i = 0; i < entries.length; i++) {
                try {            
                    const entry = entries[i]
                    const playerName = entry.playerName
                    const playerId = entry.playerId
                    const discordId = entry.player.discordId	
                    console.log(`Deleting ${entry.pilot}'s entry for ${event.name}.`)
                    await entry.destroy()

                    const count = await Entry.count({ 
                        where: {
                            playerId: playerId,
                            active: true,
                            '$tournament.serverId$': server.id
                        },
                        include: Tournament,
                    })

                    if (!count) {
                        const member = await message.guild.members.fetch(discordId)
                        if (!member) continue
                        console.log(`Removing ${playerName}'s tournament role on ${server.name}.`)
                        member.roles.remove(server.tourRole)
                    }
                } catch (err) {
                    console.log(err)
                }
            }

            await tournament.update({ state: 'complete' })
            return message.channel.send({ content: `Congrats! The results of ${tournament.name} ${tournament.logo} have been finalized.`})
        }
    }