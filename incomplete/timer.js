


    // TIMER
    if (cmd === `!timer`) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})

        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
        
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: {[Op.or]: ['pending', 'standby', 'underway']}, 
                formatName: format ? format.name : {[Op.not]: null},
                serverId: interaction.guildId
            }, 
            order: [['createdAt', 'ASC']] 
        })

        const tournament = await selectTournament(message, tournaments, maid)
        if (!tournament) return message.channel.send(`Could not find tournament.`)

        if (!args[0] || isNaN(parseInt(args[0]))) {
            const now = new Date()
            const difference = tournament.deadline - now

            if (difference < 0) return message.channel.send(`The deadline has passed.`)
            if (difference < 60 * 1000) return message.channel.send(`Remaining time: less than 1 minute.`)

            let hours = Math.floor(difference / (1000 * 60 * 60))
            const word1 = hours === 1 ? 'hour' : 'hours'
            let minutes = Math.round((difference - (hours * (1000 * 60 * 60))) / (1000 * 60))
            
            if (minutes === 60) {
                hours++
                minutes = 0
            }

            if (hours < 0) {
                const word2 = minutes === 59 ? 'minute' : 'minutes'
                message.channel.send(`Remaining time: ${60 - minutes} ${word2}.`)
            } else if (hours === 0) {
                const word2 = minutes === 1 ? 'minute' : 'minutes'
                return message.channel.send(`Remaining time: ${minutes} ${word2}.`)
            } else {
                const word2 = minutes === 1 ? 'minute' : 'minutes'
                return message.channel.send(`Remaining time: ${hours} ${word1} and ${minutes} ${word2}.`)
            }
        } else {
            if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
            
            const multiplier = message.content.includes('d') ? 60 * 24 :
                message.content.includes('h') ? 60 :
                1

            const timestamp = Date.now()
            const timeRemaining = parseInt(args[0]) * multiplier * 60 * 1000
            const deadline = new Date(timestamp + timeRemaining)
            await tournament.update({ deadline })
            const now = new Date()
            const difference = tournament.deadline - now
            let hours = Math.floor(difference / (1000 * 60 * 60))
            const word1 = hours === 1 ? 'hour' : 'hours'
            let minutes = Math.round((difference - (hours * (1000 * 60 * 60))) / (1000 * 60))
            
            if (minutes === 60) {
                hours++
                minutes = 0
            }

            if (hours < 0) {
                const word2 = minutes === 59 ? 'minute' : 'minutes'
                message.channel.send(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} The next round begins now! You have ${60 - minutes} ${word2} to complete your match. ${emojis.thinkygo}`)
            } else if (hours === 0) {
                const word2 = minutes === 1 ? 'minute' : 'minutes'
                message.channel.send(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} The next round begins now! You have ${minutes} ${word2} to complete your match. ${emojis.thinkygo}`)
            } else {
                const word2 = minutes === 1 ? 'minute' : 'minutes'
                message.channel.send(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} The next round begins now! You have ${hours} ${word1} and ${minutes} ${word2} to complete your match. ${emojis.thinkygo}`)
            }

            sendPairings(client, server, tournament, true)
            return setTimeout(() => {
                return message.channel.send(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} Time is up in the round! ${emojis.vince}`)
            }, timeRemaining)
        }
    }