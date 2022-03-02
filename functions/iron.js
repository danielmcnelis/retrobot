
const { Info, Iron, Player, Stats } = require('../db')
const { yescom } = require('../static/commands.json')
const { cavebob, iron, vincent } = require('../static/emojis.json')
const { ironRole } = require('../static/roles.json')
const { client } = require('../static/clients.js')

//CONFIRM IRON
const confirmIron = async (channel, format) => {
    const info = await Info.findOne({ where: { element: 'iron' }})
    info.status = 'confirming'
    await info.save()

    channel.send({ content: `Iron players, please check your DMs!`})
    const entries = await Iron.findAll({ 
        where: {
            format: format
        }
     })
    
    getIronConfirmation(entries[0], channel, format)
    getIronConfirmation(entries[1], channel, format)
    getIronConfirmation(entries[2], channel, format)
    getIronConfirmation(entries[3], channel, format)
    getIronConfirmation(entries[4], channel, format)
    getIronConfirmation(entries[5], channel, format)
    getIronConfirmation(entries[6], channel, format)
    getIronConfirmation(entries[7], channel, format)

    for (let i = 1; i < 12; i ++) {
        setTimeout(async () => {
            const count = await Iron.count({ where: {
                format: format,
                confirmed: true
            } })
    
            const active = await Info.count({ where: {
                element: 'iron',
                status: 'active'
            } })

            if (count === 8 && !active) {
                info.status = 'active'
                await info.save()
                assignIronRoles(entries)
                setTimeout(() => {
                    channel.send({ content: `<@&${ironRole}>, square-up gamers! The Iron starts in 10 seconds. ${cavebob}`})
                }, 1000)
                return setTimeout(() => assignCaptains(entries, channel, format), 11000)
            }
        }, i * 5000)
    }

    return setTimeout(async () => {
        const count = await Iron.count({ where: {
            format: format,
            confirmed: true
        } })

        const active = await Info.count({ where: {
            element: 'iron',
            status: 'active'
        } })

        if (count !== 8 && !active) {
            info.status = 'pending'
            await info.save()

            const missingEntries = await Iron.findAll({ 
                where: { 
                    format: format,
                    confirmed: false
                },
                include: Player
            })

            const missingNames = missingEntries.map((entry) => entry.player.name)
            await resetIron(info, entries)

            for (let i = 0; i < missingEntries.length; i++) {
                const entry = missingEntries[i]
                await entry.destroy()
            }

            return channel.send({ content: `Unfortunately, The Iron cannot begin without 8 players.\n\nThe following players have been removed from the queue:\n${missingNames.sort().join("\n")}`})
        } else if (count === 8 && !active) {
            info.status = 'active'
            await info.save()
            assignIronRoles(entries)
            setTimeout(() => {
                channel.send({ content: `<@&${ironRole}>, square-up gamers! The Iron starts in 10 seconds. ${cavebob}`})
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
	const message = await member.send({ content: `Do you still wish to play in the ${format} Iron?`}).catch((err) => console.log(err))
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
            return channel.send({ content: `${member.user.username} confirmed their participation in the Iron!`})
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
        member.roles.add(ironRole)
    })
}

//ASSIGN CAPTAINS
const assignCaptains = async (entries, channel, format) => {
    const statsArr = [] 
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const playerId = entry.playerId

        const stats = await Stats.findOne({ where: {
            format: format,
            playerId: playerId
        }})

        const elo = stats ? stats.elo : 500
        statsArr.push([playerId, elo])
    }

    statsArr.sort((a, b) => b[1] - a[1])
    console.log('statsArr', statsArr)
    const index = Math.floor(Math.random() * 6)
    const captains = statsArr.slice(index, index + 2).map((a) => a[0])
    console.log('captains', captains)

    const captainA = await Iron.findOne({ 
        where: {
            format: format,
            playerId: captains[0]
        }
    })

    captainA.captain = true
    await captainA.save()

    const captainB = await Iron.findOne({ 
        where: {
            format: format,
            playerId: captains[1]
        }
    })

    captainB.captain = true
    await captainB.save()

    channel.send({ content: `<@${captainA.playerId}> and <@${captainB.playerId}> are captains. You have 30 seconds to make each pick.`})
    draftTeams(1, captainA, captainB, channel, format)
}

//DRAFT TEAMS
const draftTeams = async (pick, captainA, captainB, channel, format) => {
    const captain = (pick === 1 || pick === 4 || pick === 5) ? captainB : captainA
    const team = captain === captainA ? 'A' : 'B'
    const filter = m => m.author.id === captain.playerId
    const players = [...await Iron.findAll({ where: {
        format: format,
        team: null
    }})].map((p) => p.name).sort().map((p, index) => `(${index + 1}) - ${p}`)

    if (!players.length) {
        chooseOrder(captainA, channel, format)
        chooseOrder(captainB, channel, format)
        return
    } 

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
            response.includes('5') ? 4 :
            response.includes('6') ? 5 :
            false

        if (!index || (index + 1) > players.length) {
            channel.send({ content: `Invalid selection.`})
            return setTimeout(() => draftTeams(pick, captainA, captainB, channel, format), 1000)
        } else {
            const selection = players[index]
            const name = selection.slice(selection.indexOf(`) - `) + 4)
            console.log('name', name)
            console.log('format', format)
            const ironPerson = await Iron.findOne({
                where: {
                    name: name,
                    format: format,
                    team: null
                }
            })

            console.log('!!ironPerson', !!ironPerson)
            ironPerson.team = team
            await ironPerson.save()
            channel.send({ content: `${captain.name} selected <@${ironPerson.playedId}>!`})
            return setTimeout(() => draftTeams(pick++, captainA, captainB, channel, format), 2000)
        }
	}).catch((err) => {
		console.log(err)
        channel.send({ content: `Sorry, time's up. Try again for beta testing.`})
        return setTimeout(() => draftTeams(pick, captainA, captainB, channel, format), 2000)
	})
}

//CHOOSE ORDER
const chooseOrder = async (captain = {}, channel, format) => {
    const team = captain.team
    const players = [...await Iron.findAll({ where: {
        format: format,
        team: team,
        position: null
    }})].map((p) => p.name).sort().map((p, index) => `(${index + 1}) - ${p}`)

    if (!players.length) return postPairing(channel, format)
    if (!players.length > 4) return channel.send({ content: `Error: too many players on ${captain.name}'s team.`})
    
    const word = players.length === 4 ? 'first' :
        players.length === 3 ? 'second' :
        players.length === 2 ? 'third' :
        'last'

    const position = players.length === 4 ? 1 :
        players.length === 3 ? 2 :
        players.length === 2 ? 3 :
        4

    const time = 15000 * players.length
    const guild = client.guilds.cache.get("414551319031054346")
    const playerId = captain.playerId
    const member = guild.members.cache.get(playerId)
    if (!member) return channel.send(`Unable to message ${captain.name}.`)
    const filter = m => m.author.id === playerId
	const message = await member.send({ content: `${captain.name}, You have ${time / 1000}s to choose who will go ${word} for Team ${team}:${players.join('\n')}`})
	return await message.channel.awaitMessages({ 
        filter,
		max: 1,
		time: time
	}).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const index = response.includes('1') ? 0 :
            response.includes('2') ? 1 :
            response.includes('3') ? 2 :
            response.includes('4') ? 3 :
            false

        if (!index || (index + 1) > players.length) {
            message.channel.send({ content: `Invalid selection.`})
            return setTimeout(() => chooseOrder(captain, channel, format), 1000)
        } else {
            const selection = players[index]
            const name = selection.slice(selection.indexOf(`(${index + 1}) - `))
            const ironPerson = await Iron.findOne({
                where: {
                    name: name,
                    format: format,
                    team: team
                }
            })

            ironPerson.position = position
            await ironPerson.save()
            channel.send({ content: `${captain.name} selected ${ironPerson.name} to go ${word}!`})
            return setTimeout(() => chooseOrder(captain, channel, format), 2000)
        }
	}).catch(async (err) => {
		console.log(err)
        const index = Math.floor(Math.random() * 4)
        const selection = players[index]
        const name = selection.slice(selection.indexOf(`(${index + 1}) - `))
        const ironPerson = await Iron.findOne({
            where: {
                name: name,
                format: format,
                team: team
            }
        })

        ironPerson.position = position
        await ironPerson.save()
        message.channel.send({ content: `Sorry, time's up. ${ironPerson.name} was randomly selected to go ${word}.`})
        return setTimeout(() => chooseOrder(captain, channel, format), 2000)
	})
}

//POST PAIRING
const postPairing = async (channel, format) => {
    const teamA = [...await Iron.findAll({ 
        where: {
            format: format,
            team: 'A',
            eliminated: false
        },
        order: ["position", "ASC"]
    })]

    const teamB = [...await Iron.findAll({ 
        where: {
            format: format,
            team: 'B',
            eliminated: false
        },
        order: ["position", "ASC"]
    })]
    
    if (!teamA.length) return channel.send({ content: `Team B has emerged victorious!!!`})
    if (!teamB.length) return channel.send({ content: `Team A has emerged victorious!!!`})

    const matchNo = 9 - (teamA.length + teamB.length)

    return channel.send({ content:
        `${iron} --- Iron Match #${matchNo} --- ${iron}` + 
        `<@${teamA[0].playerId}> vs <@${teamB[1].playerId}>`
    })
}

//POST STORY
const postStory = async (channel, format) => {
    const teamA = [...await Iron.findAll({ 
        where: {
            format: format,
            team: 'A'
        },
        order: ["position", "ASC"]
    })].map((p) =>  p.eliminated ? `~~${p.name}~~ ${vincent}` : `${p.name}`)

    const teamB = [...await Iron.findAll({ 
        where: {
            format: format,
            team: 'B'
        },
        order: ["position", "ASC"]
    })].map((p) =>  p.eliminated ? `~~${p.name}~~ ${vincent}` : `${p.name}`)

    channel.send({ content:
        `${iron} - Iron Summary - ${iron}` +
        `**Team A**` +
        `${teamA.join('\n')}` +
        `\n\n**Team B**` +
        `${teamB.join('\n')}`
    })

    return setTimeout(() => postPairing(channel, format), 5000)
}

//END IRON
const endIron = async () => {
}

//RESET IRON
const resetIron = async () => {
}

module.exports = {
    confirmIron,
    endIron,
    postStory,
    resetIron
}
