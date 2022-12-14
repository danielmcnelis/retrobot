

    // IRON
    if(commands.ironcom.includes(cmd)) {
        if (!hasFullAccess(server)) return message.channel.send({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })
        
        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        
        const player = await Player.findOne({ where: { discordId: maid }})
        const alreadyIn = await Iron.count({ 
            where: { 
                format: format.name,
                playerId: player.id
            } 
        })

        const isPending = await Iron.count({ where: { format: format.name, status: 'pending' }})
        const isConfirming = await Iron.count({ where: { format: format.name, status: 'confirming' }})
        const isDrafting = await Iron.count({ where: { format: format.name, status: 'drafting' }})
        const isActive = await Iron.count({ where: { format: format.name, status: 'active' }})
        if (isDrafting && !alreadyIn) return message.channel.send({ content: 'Please wait until after the drafting process is complete to join the iron.' })
        if (!isPending && alreadyIn) return message.channel.send({ content: 'Sorry, you cannot leave the iron after it has started.' })
        
        if (!alreadyIn) {
            const count = await Iron.count({ where: { format: format.name }})
            if (count >= 10) {
                return message.channel.send({ content: `Sorry, ${message.author.username}, the ${format.name} ${server.emoji || format.emoji} Iron is full.`})
            } else if (count < 10 && count >= 6) {
                if (isConfirming) {
                    await Iron.create({ 
                        name: message.author.username,
                        playerId: player.id,
                        format: format.name,
                        confirmed: true
                    })
    
                    message.channel.send({ content: `You joined the Iron queue. ${emojis.iron}`})
                } else if (isActive) {
                    const teamACount = await Iron.count({ 
                        where: {
                            format: format.name,
                            team: 'A'
                        }
                    })

                    const teamAElim = await Iron.count({ 
                        where: {
                            format: format.name,
                            team: 'A',
                            eliminated: true
                        }
                    })

                    const teamBCount = await Iron.count({ 
                        where: {
                            format: format.name,
                            team: 'B'
                        }
                    })

                    const teamBElim = await Iron.count({ 
                        where: {
                            format: format.name,
                            team: 'B',
                            eliminated: true
                        }
                    })

                    if ((teamBCount === teamACount && teamBElim >= teamAElim) || teamBCount < teamACount) {
                        await Iron.create({ 
                            name: message.author.username,
                            playerId: player.id,
                            format: format.name,
                            team: 'B',
                            confirmed: true,
                            position: teamBCount + 1
                        })

                        //ADD FORMAT LIBRARY IRON ROLE
                        message.member.roles.add('948006324237643806')
                        return message.channel.send({ content: `You joined the Iron for Team B. ${emojis.iron}`})
                    } else {
                        await Iron.create({ 
                            name: message.author.username,
                            playerId: player.id,
                            format: format.name,
                            team: 'A',
                            confirmed: true,
                            position: teamACount + 1
                        })

                        // ADD FORMAT LIBRARY IRON ROLE
                        message.member.roles.add('948006324237643806')
                        return message.channel.send({ content: `You joined the Iron for Team A. ${emojis.iron}`})
                    }
                }
            } else {
                await Iron.create({ 
                    name: message.author.username,
                    playerId: player.id,
                    format: format.name
                })

                message.channel.send({ content: `You joined the Iron queue. ${emojis.iron}`})
                if (count === 5) return confirmIron(message.channel, format)
            }
        } else {
            const ironPerson = await Iron.findOne({ 
                where: {
                    name: message.author.username,
                    format: format.name,
                    playerId: player.id
                }
            })

            if (!ironPerson) return
            await ironPerson.destroy()
            return message.channel.send({ content: `You left the Iron queue. ${emojis.iron}`})
        }
    } 