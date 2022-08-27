
const { Info, Iron, Player, Stats } = require('../db')
const { yescom } = require('../static/commands.json')
const emojis = require('../static/emojis.json')
const roles = require('../static/roles.json')
const { client } = require('../static/clients.js')
const { Op } = require('sequelize')

//CONFIRM IRON
const confirmIron = async (channel, format) => {
    const info = await Info.findOne({ where: { element: 'iron' }})
    info.status = 'confirming'
    await info.save()
    channel.send({ content: `Iron players, please check your DMs!`})
    const entries = await Iron.findAll({ where: { format: format.name }})
    getIronConfirmation(entries[0], channel, format)
    getIronConfirmation(entries[1], channel, format)
    getIronConfirmation(entries[2], channel, format)
    getIronConfirmation(entries[3], channel, format)
    getIronConfirmation(entries[4], channel, format)
    getIronConfirmation(entries[5], channel, format)

    for (let i = 1; i < 12; i ++) {
        setTimeout(async () => {
            const count = await Iron.count({ where: {
                format: format.name,
                confirmed: false
            } })
    
            const active = await Info.count({ where: {
                element: 'iron',
                status: {[Op.not]: 'confirming'}
            } })

            if (!count && !active) {
                info.status = 'drafting'
                await info.save()
                assignIronRoles(entries)
                setTimeout(() => {
                    channel.send({ content: `<@&${roles['Format Library'].ironRole}>, square-up gamers! The Iron starts in 10 seconds. ${emojis.cavebob}`})
                }, 1000)
                return setTimeout(() => assignCaptains(entries, channel, format), 11000)
            }
        }, i * 5000)
    }

    return setTimeout(async () => {
        const count = await Iron.count({ where: {
            format: format.name,
            confirmed: false
        } })

        const active = await Info.count({ where: {
            element: 'iron',
            status: {[Op.not]: 'confirming'}
        } })

        if (count && !active) {
            info.status = 'pending'
            await info.save()

            const missingEntries = await Iron.findAll({ 
                where: { 
                    format: format.name,
                    confirmed: false
                },
                include: Player
            })

            const missingNames = missingEntries.map((entry) => entry.player.name)
            for (let i = 0; i < missingEntries.length; i++) {
                const entry = missingEntries[i]
                await entry.destroy()
            }

            const remainingEntries = await Iron.findAll({ where: { format: format.name }})
            for (let i = 0; i < remainingEntries.length; i++) {
                const entry = remainingEntries[i]
                entry.confirmed = false
                await entry.save()
            }
            
            return channel.send({ content: `Unfortunately, The ${format.name} Iron cannot begin without 6f players. ${format.emoji} ${emojis.iron}\n\nThe following players have been removed from the queue:\n${missingNames.sort().join("\n")}`})
        } else if (!count && !active) {
            info.status = 'drafting'
            await info.save()
            assignIronRoles(entries)
            setTimeout(() => {
                channel.send({ content: `<@&${roles['Format Library'].ironRole}>, square-up gamers! The Iron starts in 10 seconds. ${emojis.cavebob}`})
            }, 1000)
            return setTimeout(() => assignCaptains(entries, channel, format), 11000)
        }
    }, 61000)
}

//GET IRON CONFIRMATION
const getIronConfirmation = async (entry, channel, format) => {
    const guild = client.guilds.cache.get("414551319031054346")
    const playerId = entry.playerId
    const member = guild.members.cache.get(playerId)
    if (!member || playerId !== member.user.id) return channel.send({ content: `${entry.name} cannot be sent DMs.` })
    const filter = m => m.author.id === playerId
	const message = await member.send({ content: `Do you still wish to play in the ${format.name} Iron? ${format.emoji} ${emojis.iron}`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
	await message.channel.awaitMessages({ 
        filter,
        max: 1,
		time: 60000
	}).then(async (collected) => {
        const response = collected.first().content.toLowerCase()

        const count = await Info.count({ where: {
            element: 'iron',
            status: 'confirming'
        } })

        if (!count) return member.send({ content: `Sorry, time expired.`})

        if (yescom.includes(response)) {
            entry.confirmed = true
            await entry.save()
            member.send({ content: `Thanks! Please wait to see if everyone confirms.`})
            return channel.send({ content: `${member.user.username} confirmed their participation in the ${format.name} Iron ${format.emoji} ${emojis.iron}!`})
        }
	}).catch((err) => {
		console.log(err)
        return member.send({ content: `Sorry, time's up.`})
	})
}

//ASSIGN IRON ROLES
const assignIronRoles = (entries) => {
    const guild = client.guilds.cache.get("414551319031054346")
    entries.forEach((entry) => {
        const member = guild.members.cache.get(entry.playerId)
        member.roles.add(roles['Format Library'].ironRole)
    })
}

//ASSIGN CAPTAINS
const assignCaptains = async (entries, channel, format) => {
    const statsArr = [] 
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const playerId = entry.playerId

        const stats = await Stats.findOne({ where: {
            format: format.name,
            playerId: playerId,
            serverId: '414551319031054346'
        }})

        const elo = stats ? stats.elo : 500
        statsArr.push([playerId, elo])
    }

    statsArr.sort((a, b) => b[1] - a[1])
    const index = Math.floor(Math.random() * 4)
    const captains = statsArr.slice(index, index + 2).map((a) => a[0])

    const captainA = await Iron.findOne({ 
        where: {
            format: format.name,
            playerId: captains[0]
        }
    })

    captainA.captain = true
    captainA.team = 'A'
    await captainA.save()

    const captainB = await Iron.findOne({ 
        where: {
            format: format.name,
            playerId: captains[1]
        }
    })

    captainB.captain = true
    captainB.team = 'B'
    await captainB.save()

    channel.send({ content: `<@${captainA.playerId}> and <@${captainB.playerId}> are captains. You have 30 seconds to make each pick.`})
    draftTeams(1, captainA, captainB, channel, format)
}

//DRAFT TEAMS
const draftTeams = async (pick, captainA, captainB, channel, format) => {
    const captain = (pick === 1 || pick === 4 || pick === 5 || pick === 8) ? captainB : captainA
    const team = captain === captainA ? 'A' : 'B'

    const filter = m => m.author.id === captain.playerId
    const ironPeople = [...await Iron.findAll({ 
        where: {
            format: format.name,
            captain: false,
            team: null
        }
    })]

    const players = ironPeople.map((p) => p.name).sort().map((p, index) => `(${index + 1}) - ${p}`)

    if (ironPeople.length === 1) {
        const ironPerson = ironPeople[0]
        ironPerson.team = team
        await ironPerson.save()
        channel.send({ content: `<@${ironPerson.playerId}> has been assigned to ${captain.name}'s Team!`})
        chooseOrder(captainA, 'A', channel, format)
        chooseOrder(captainB, 'B', channel, format)
        return
    } else {
        channel.send({ content: `<@${captain.playerId}>, Please select a player:\n${players.join('\n')}`})
        return await channel.awaitMessages({ 
            filter,
            max: 1,
            time: 30000
        }).then(async (collected) => {
            const response = collected.first().content.toLowerCase()
            const index = response.includes('1') ? 0 :
                response.includes('2') ? 1 :
                response.includes('3') ? 2 :
                response.includes('4') ? 3 :
                false
    
            if (index === false || (index + 1) > players.length) {
                channel.send({ content: `Invalid selection.`})
                return setTimeout(() => draftTeams(pick, captainA, captainB, channel, format), 1000)
            } else {
                const selection = players[index]
                const name = selection.slice(selection.indexOf(`) - `) + 4)
                const ironPerson = await Iron.findOne({
                    where: {
                        name: name,
                        format: format.name,
                        team: null
                    }
                })
    
                ironPerson.team = team
                await ironPerson.save()
                channel.send({ content: `${captain.name} selected <@${ironPerson.playerId}>!`})
                return setTimeout(() => draftTeams(pick + 1, captainA, captainB, channel, format), 2000)
            }
        }).catch(async (err) => {
            console.log(err)
            channel.send({ content: `Sorry, time's up.`})
            const index = Math.floor(Math.random() * players.length)
            const selection = players[index]
            const name = selection.slice(selection.indexOf(`) - `) + 4)
            const ironPerson = await Iron.findOne({
                where: {
                    name: name,
                    format: format.name,
                    team: null
                }
            })
    
            ironPerson.team = team
            await ironPerson.save()
            channel.send({ content: `<@${ironPerson.playerId}> was randomly assigned to ${captain.name}'s Team!`})
            return setTimeout(() => draftTeams(pick + 1, captainA, captainB, channel, format), 2000)
        })
    }	
}

//CHOOSE ORDER
const chooseOrder = async (captain = {}, team, channel, format) => {
    const guild = client.guilds.cache.get("414551319031054346")
    const playerId = captain.playerId
    const member = guild.members.cache.get(playerId)
    if (!member) return channel.send(`Unable to message ${captain.name}.`)
    
    const ironPeople = [...await Iron.findAll({ where: {
        format: format.name,
        team: team,
        position: null
    }})]

    const count = await Iron.findAll({ where: {
        format: format.name,
        team: team,
        position: {[Op.not]: null}
    }})
    
    const players = ironPeople.map((p) => p.name).sort().map((p, index) => `(${index + 1}) - ${p}`)
    
    const word = count === 0 ? 'first' :
        count === 1 ? 'second' :
        count === 2 ? 'third' :
        count === 3 ? 'fourth' :
        'fifth'

    const position = count + 1
    console.log('position', position)
        
    if (ironPeople.length === 1) {
        const ironPerson = ironPeople[0]
        ironPerson.position = position
        await ironPerson.save()
        member.send({ content: `${ironPerson.name} will go ${word}.`})
        const count = await Iron.count({ 
            where: {
                format: format.name,
                position: null
            }
        })

        if (!count) {
            const info = await Info.findOne({ where: { element: 'iron' }})
            info.status = 'active'
            await info.save()
            return postStory(channel, format)
        } else {
            return
        }
    }

    const time = 20000 * players.length
    const filter = m => m.author.id === playerId
	const message = await member.send({ content: `${captain.name}, You have ${time / 1000}s to choose who will go ${word} for Team ${team}:\n${players.join('\n')}`})
	return await message.channel.awaitMessages({ 
        filter,
		max: 1,
		time: time
	}).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const index = response.includes('1') ? 0 :
            response.includes('2') ? 1 :
            response.includes('3') ? 2 :
            false

        if (index === false || (index + 1) > players.length) {
            message.channel.send({ content: `Invalid selection.`})
            return setTimeout(() => chooseOrder(captain, team, channel, format), 1000)
        } else {
            const selection = players[index]
            const name = selection.slice(selection.indexOf(`) - `) + 4)
            const ironPerson = await Iron.findOne({
                where: {
                    name: name,
                    format: format.name,
                    team: team
                }
            })

            ironPerson.position = position
            await ironPerson.save()
            message.channel.send({ content: `You selected ${ironPerson.name} to go ${word}!`})
            return setTimeout(() => chooseOrder(captain, team, channel, format), 2000)
        }
	}).catch(async (err) => {
		console.log(err)
        const ironPerson = await Iron.findOne({
            where: {
                format: format.name,
                position: null,
                team: team
            }
        })

        ironPerson.position = position
        await ironPerson.save()
        message.channel.send({ content: `Sorry, time's up. ${ironPerson.name} was randomly selected to go ${word}.`})
        return setTimeout(() => chooseOrder(captain, team, channel, format), 2000)
	})
}

//POST PAIRING
const postPairing = async (channel, format) => {
    const matchNo = await Iron.count({ where: {
        format: format.name,
        eliminated: true
    }}) + 1

    const teamA = [...await Iron.findAll({ 
        where: {
            format: format.name,
            team: 'A',
            eliminated: false
        },
        order: [["position", "ASC"]]
    })]

    const teamB = [...await Iron.findAll({ 
        where: {
            format: format.name,
            team: 'B',
            eliminated: false
        },
        order: [["position", "ASC"]]
    })]
    
    if (!teamA.length) {
        const participants = await Iron.findAll({ where: { format: format.name }}) || []
        for (let i = 0; i < participants.length; i++) {
            const participant = participants[i]
            const member = channel.guild.members.cache.get(participant.playerId)
            try {
                await participant.destroy()
                member.roles.remove(roles['Format Library'].ironRole)
            } catch (err) {
                console.log(err)
            }
        }

        channel.send({ content: `Team B has emerged victorious!!!`})
        return channel.send({ content: `${emojis.dimmadome} ${emojis.keith} ${emojis.aight} ${emojis.chadward}`})
    }

    if (!teamB.length) {
        const participants = await Iron.findAll({ where: { format: format.name }}) || []
        for (let i = 0; i < participants.length; i++) {
            const participant = participants[i]
            const member = channel.guild.members.cache.get(participant.playerId)
            try {
                await participant.destroy()
                member.roles.remove(roles['Format Library'].ironRole)
            } catch (err) {
                console.log(err)
            }
        }

        channel.send({ content: `Team A has emerged victorious!!!`})
        return channel.send({ content: `${emojis.dimmadome} ${emojis.keith} ${emojis.aight} ${emojis.chadward}`})
    }

    return channel.send({ content:
        `${emojis.iron} --- Iron Match #${matchNo} --- ${emojis.iron}` + 
        `\n<@${teamA[0].playerId}> vs <@${teamB[0].playerId}>`
    })
}

//POST STORY
const postStory = async (channel, format) => {
    const teamA = [...await Iron.findAll({ 
        where: {
            format: format.name,
            team: 'A'
        },
        order: [["position", "ASC"]]
    })].map((p) =>  p.eliminated ? `~~${p.name}~~ ${emojis.vincent}` : `${p.name}`)

    const teamB = [...await Iron.findAll({ 
        where: {
            format: format.name,
            team: 'B'
        },
        order: [["position", "ASC"]]
    })].map((p) =>  p.eliminated ? `~~${p.name}~~ ${emojis.vincent}` : `${p.name}`)

    channel.send({ content:
        `${emojis.iron}  ${format.emoji} - ${format.name} Iron Story -  ${format.emoji} ${emojis.iron}` +
        `\n**Team A**` +
        `\n${teamA.join('\n')}` +
        `\n\n**Team B**` +
        `\n${teamB.join('\n')}`
    })

    return setTimeout(() => postPairing(channel, format), 5000)
}

//RESET IRON
const resetIron = async (channel, format) => {
    const entries = await Iron.findAll({ where: { format: format.name }})
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        await entry.destroy()
    }

    const info = await Info.findOne({ where: { element: 'iron' }})
    info.status = 'pending'
    await info.save()
    return channel.send({ content: `The ${format.name} Iron has been reset. ${format.emoji} ${emojis.iron}` })
}

module.exports = {
    confirmIron,
    postStory,
    resetIron,
    draftTeams
}
