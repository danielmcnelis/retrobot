

//RETROBOT - A RANKINGS BOT FOR FORMATLIBRARY.COM

//MODULE IMPORTS
const axios = require('axios')
const Discord = require('discord.js')
const { Op } = require('sequelize')

//DATABASE IMPORTS
const { Backups, Card, Losses, Player, Entry, Match, Matchup, Stats, Status, Tournament, Wins }  = require('./db/index.js')

//FUNCTION IMPORTS
const { checkDeckList, saveYDK } = require('./functions/deck.js')
const { uploadDeckFolder } = require('./functions/drive.js')
const { addSheet, makeSheet, writeToSheet } = require('./functions/sheets.js')
const { askForDBName, checkPairing, findNoShowOpponent, createSheetData, getDeckList, getDeckName, getDeckType, getTournamentFormat, getTournamentType, getMatches, processMatchResult, postParticipant, removeParticipant, seed, selectTournament } = require('./functions/tournament.js')
const { capitalize, createPlayer, getDeckCategory, getMedal, generateRandomString, getFormat, isAdmin, isMod, isNewUser, isProgrammer, isTourPlayer, isWCQ } = require('./functions/utility.js')

// STATIC IMPORTS
const { welcomeChannel, politicsChannel } = require('./static/channels.json')
const {
    botcom, bracketcom, dbcom, dropcom, flipcom, h2hcom, joincom, legalcom, banscom, losscom, manualcom,
    noshowcom, pfpcom, profcom, rankcom, recalccom, rolecom, signupcom, startcom, statscom, undocom, yescom
} = require('./static/commands.json')
const { FL, legend, lmfao, mad, mlady, sad, soldier } = require('./static/emojis.json')
const fldata = require('./static/fldata.json')
const formats = require('./static/formats.json')
const goat_matches = require('./static/goat_matches.json')
const old_matches = require('./static/matches.json')
const goat_players = require('./static/goat_players.json')
const old_players = require('./static/players.json')
const gfdata = require('./static/gfdata.json')
const { bfpRole, muteRole, tourRole, politicsRole } = require('./static/roles.json')
const { challongeAPIKey, discordBotToken } = require('./secrets.json')

const client = new Discord.Client()
client.login(discordBotToken)

//READY
client.on('ready', () => {
  console.log('RetroBot is online!')
})

//WELCOME
client.on('guildMemberAdd', async (member) => {
    const channel = client.channels.cache.get(welcomeChannel)
    if (await isNewUser(member.user.id)) {
        await createPlayer(member) 
        return channel.send(`${member}, Welcome to the FormatLibrary.com ${FL} discord server. ${legend}`)
    } else {
        const player = await Player.findOne({ where: { id: member.user.id }})
        if (player && player.muted) member.roles.add(muteRole)
        return channel.send(`${member}, Welcome back to the FormatLibrary.com ${FL} discord server! We missed you. ${soldier}`)
    }
})
    
//GOODBYE
client.on('guildMemberRemove', member => client.channels.cache.get(welcomeChannel).send(`Oh dear. ${member.user.username} has left the server. ${sad}`))

//COMMANDS
client.on('message', async (message) => {
    if (
		//no commands in DMs
		!message.guild || 
		//no commands from bots
		message.author.bot || 
		//do not allow users to parrot @everyone or @here with the bot
		message.content.includes('@everyone') || message.content.includes('@here') ||
		//only allow commands starting with !
		(!message.content.startsWith("!"))
	) return

    const marr = message.content.split(" ")
	for(let i = 0; i < marr.length; i++) {
		if (marr[i] === '') { 
			marr.splice(i, 1)
			i--
		}
	}
    
    const cmd = marr[0].toLowerCase()
    const args = marr.slice(1)
    const maid = message.author.id
    const mcid = message.channel.id
    const format = getFormat(mcid)
    const formatName = formats[format] ? formats[format].name : null
    const formatRole = formats[format] ? formats[format].role : null
    const formatEmoji = formats[format] ? formats[format].emoji : null
    const formatDate = formats[format] ? formats[format].date : null
    const formatList = formats[format] ? formats[format].list : null
    if (await isNewUser(maid)) await createPlayer(message.member)

    //PING 
    if (cmd === `!ping`) return message.channel.send('🏓')

    // TEST 
    if (cmd === `!test`) {
        if (isProgrammer(message.member)) {
            const url = args[0]
            if (!url) return
            const player = await Player.findOne({ where: { id: maid } })
            if (!player) return
            await saveYDK(player, url, formatDate, formatList)
            const deckType = await getDeckType(player)
            return message.channel.send(deckType)
        } else {
            return message.channel.send(`🧪`)
        }
    }

    // FIX 
    if (cmd === `!fix`) {
        if (isProgrammer(message.member)) {

            const all_players = await Player.findAll()
            for (let i = 0; i < all_players.length; i++) {
                const p = all_players[i]
                console.log(`checking ${p.id, p.name}`)
                const b = await Backups.count({ playerId: p.id })
                if (!b) {
                    console.log(`create Backups for ${p.id, p.name}`)
                    await Backups.create({ playerId: p.id })
                }
                const s = await Stats.count({ playerId: p.id })
                if (!s) {
                    console.log(`create Stats for ${p.id, p.name}`)
                    await Backups.create({ playerId: p.id })
                }
                const l = await Losses.count({ playerId: p.id })
                if (!l) {
                    console.log(`create Losses for ${p.id, p.name}`)
                    await Losses.create({ playerId: p.id })
                }
                const w = await Wins.count({ playerId: p.id })
                if (!w) {
                    console.log(`create Wins for ${p.id, p.name}`)
                    await Wins.create({ playerId: p.id })
                }
            }
        }
    }

    // PLAYERS 
    if (cmd === `!players`) {
        if (isProgrammer(message.member)) {
            console.log('old_players.length', old_players.length)
            let c = 0
            for (let i = 0; i < old_players.length; i++) {
                const p = old_players[i]
                if (!p.id || !p.name) {
                    console.log('missing info:', p)
                    continue
                }
                const count = await Player.count({ where: { id: p.id } })
                if (!count) {
                    console.log('creating', p.name)
                    await Player.create({
                        id: p.id,
                        name: p.name,
                        tag: p.tag
                    })
    
                    await Backups.create({ playerId: p.id })
                    await Losses.create({ playerId: p.id })
                    await Stats.create({ playerId: p.id })
                    await Wins.create({ playerId: p.id })
                    c++
                }
            } 
            return message.channel.send(`Added ${c} old players.`)
        } else {
            return message.channel.send(lmfao)
        }
    }


    // GOAT PLAYERS 
    if (cmd === `!goatplayers`) {
        if (isProgrammer(message.member)) {
            console.log('goat_players.length', goat_players.length)
            let c = 0
            for (let i = 0; i < goat_players.length; i++) {
                const p = goat_players[i]
                if (!p.id || !p.name) {
                    console.log('missing info:', p)
                    continue
                }
                const count = await Player.count({ where: { id: p.id } })
                if (!count) {
                    console.log('creating', p.name)
                    await Player.create({
                        id: p.id,
                        name: p.name,
                        tag: p.tag
                    })
    
                    await Backups.create({ playerId: p.id })
                    await Losses.create({ playerId: p.id })
                    await Stats.create({ playerId: p.id })
                    await Wins.create({ playerId: p.id })
                    c++
                }
            } 
            return message.channel.send(`Added ${c} old players.`)
        } else {
            return message.channel.send(lmfao)
        }
    }



    // MATCHES 
    if (cmd === `!matches`) {
        if (isProgrammer(message.member)) {
            message.channel.send(`Adding ${old_matches.length} matches, please wait.`)
            let c = 0
            for (let i = 0; i < old_matches.length; i++) {
                const m = old_matches[i]
                if (!m.winner || !m.loser || !m.format) {
                    console.log('Bad Match.')
                    continue
                }

                const w = await Player.findOne({ where: { id: m.winner }})
                if (!w || !w.name) {
                    const winner = {
                        user: {
                            bot: false,
                            id: m.winner,
                            name: null,
                            tag: null
                        }
                    }
                    await createPlayer(winner)
                    i--
                    continue
                }

                const l = await Player.findOne({ where: { id: m.loser }})
                if (!l || !l.name) {
                    const loser = {
                        user: {
                            bot: false,
                            id: m.loser,
                            name: null,
                            tag: null
                        }
                    }
                    await createPlayer(loser)
                    i--
                    continue
                }
                console.log(w.name, '>', l.name, '-', m.format)
                const nm = await Match.create({ 
                    format: m.format.toLowerCase(),
                    winnerId: m.winner,
                    winner_name: w.name,
                    loserId: m.loser,
                    loser_name: l.name,
                    delta: m.delta,
                    createdAt: m.createdAt,
                    updatedAt: m.updatedAt
                })

                if (nm) c++
            } 

            return message.channel.send(`Added ${c} matches to the database.`)
        } else {
            return message.channel.send(mlady)
        }
    }

    // GOAT MATCHES 
    if (cmd === `!goatmatches`) {
        if (isProgrammer(message.member)) {
            message.channel.send(`Adding ${goat_matches.length} matches, please wait.`)
            let c = 0
            for (let i = 0; i < goat_matches.length; i++) {
                const m = goat_matches[i]
                if (!m.winner || !m.loser) {
                    console.log('Bad Match.')
                    continue
                }

                const w = await Player.findOne({ where: { id: m.winner }})
                if (!w || !w.name) {
                    const winner = {
                        user: {
                            bot: false,
                            id: m.winner,
                            name: null,
                            tag: null
                        }
                    }
                    await createPlayer(winner)
                    i--
                    continue
                }

                const l = await Player.findOne({ where: { id: m.loser }})
                if (!l || !l.name) {
                    const loser = {
                        user: {
                            bot: false,
                            id: m.loser,
                            name: null,
                            tag: null
                        }
                    }
                    await createPlayer(loser)
                    i--
                    continue
                }
                console.log(w.name, '>', l.name, '-', m.format)
                const nm = await Match.create({ 
                    format: "goat",
                    winnerId: m.winner,
                    winner_name: w.name,
                    loserId: m.loser,
                    loser_name: l.name,
                    delta: m.delta,
                    createdAt: m.createdAt,
                    updatedAt: m.updatedAt
                })

                if (nm) c++
            } 

            return message.channel.send(`Added ${c} matches to the database.`)
        } else {
            return message.channel.send(mlady)
        }
    }

    // FL DATA 
    if (cmd === `!fldata`) {
        if (isProgrammer(message.member)) {
            const keys = Object.keys(fldata)
            message.channel.send(`Adding ${keys.length} dates, please wait.`)
            let c = 0
            const make_times = (b) => {
                if (b >= 180) {
                    console.log('bad b value')
                    return false
                }
                const time = b < 10 ? `00:0${b}:00.000+00` :
                    b >= 10 && b < 60 ? `00:${b}:00.000+00` :
                    b >= 60 && b < 70 ? `01:0${b-60}:00.000+00` :
                    b >= 70 && b < 120 ? `01:${b-60}:00.000+00` :
                    b >= 120 && b < 130 ? `02:0${b-120}:00.000+00` :
                    b >= 130 && b < 180 ? `02:${b-120}:00.000+00` :
                    null
            }

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                const arr = fldata[key]

                for (let j = 0; j < arr.length; j++) {
                    const minutes = make_times(j)
                    if (!minutes) {
                        console.log('NO MINUTES...')
                        continue
                    }

                    const date = `${key} ${minutes}`
                    const m = arr[j]
                    const wId = m.indexOf('>') ? m.slice(0, m.indexOf('>')) :
                        m.indexOf('<') ? m.slice(m.indexOf('<')) :
                        null
                    
                    const lId = m.indexOf('>') ? m.slice(m.indexOf('>')) :
                        m.indexOf('<') ? m.slice(0, m.indexOf('<')) :
                        null

                    console.log('wId', wId)
                    console.log('lId', lId)
                    if (!wId || !lId) {
                        console.log('BAD MATCH')
                        continue
                    }

                    const w = await Player.findOne({ where: { id: wId }})
                    if (!w) {
                        const winner = {
                            user: {
                                bot: false,
                                id: wId,
                                name: null,
                                tag: null
                            }
                        }
                        await createPlayer(winner)
                        i--
                        continue
                    }
                    
                    const l = await Player.findOne({ where: { id: lId }})
                    if (!l) {
                        const loser = {
                            user: {
                                bot: false,
                                id: lId,
                                name: null,
                                tag: null
                            }
                        }
                        await createPlayer(loser)
                        i--
                        continue
                    }

                    console.log(w.name, '>', l.name, '-', date)
                    const nm = await Match.create({ 
                        format: "goat",
                        winnerId: wId,
                        winner_name: w.name,
                        loserId: lId,
                        loser_name: l.name,
                        delta: 10,
                        createdAt: date,
                        updatedAt: date
                    })
    
                    if (nm) c++
                }
            } 

            return message.channel.send(`Added ${c} matches to the database.`)
        } else {
            return message.channel.send(mlady)
        }
    }

    // GF DATA 
    if (cmd === `!gfdata`) {
        if (isProgrammer(message.member)) {
            const keys = Object.keys(gfdata)
            message.channel.send(`Adding ${keys.length} dates, please wait.`)
            let c = 0
            const make_times = (b) => {
                if (b >= 180) {
                    console.log('bad b value')
                    return false
                }
                const time = b < 10 ? `00:0${b}:00.000+00` :
                    b >= 10 && b < 60 ? `00:${b}:00.000+00` :
                    b >= 60 && b < 70 ? `01:0${b-60}:00.000+00` :
                    b >= 70 && b < 120 ? `01:${b-60}:00.000+00` :
                    b >= 120 && b < 130 ? `02:0${b-120}:00.000+00` :
                    b >= 130 && b < 180 ? `02:${b-120}:00.000+00` :
                    null
            }

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i]
                const arr = fldata[key]

                for (let j = 0; j < arr.length; j++) {
                    const minutes = make_times(j)
                    if (!minutes) {
                        console.log('NO MINUTES...')
                        continue
                    }

                    const date = `${key} ${minutes}`
                    const m = arr[j]
                    const wId = m.indexOf('>') ? m.slice(0, m.indexOf('>')) :
                        m.indexOf('<') ? m.slice(m.indexOf('<')) :
                        null
                    
                    const lId = m.indexOf('>') ? m.slice(m.indexOf('>')) :
                        m.indexOf('<') ? m.slice(0, m.indexOf('<')) :
                        null

                    console.log('wId', wId)
                    console.log('lId', lId)
                    if (!wId || !lId) {
                        console.log('BAD MATCH')
                        continue
                    }

                    const w = await Player.findOne({ where: { id: wId }})
                    if (!w) {
                        const winner = {
                            user: {
                                bot: false,
                                id: wId,
                                name: null,
                                tag: null
                            }
                        }
                        await createPlayer(winner)
                        i--
                        continue
                    }
                    
                    const l = await Player.findOne({ where: { id: lId }})
                    if (!l) {
                        const loser = {
                            user: {
                                bot: false,
                                id: lId,
                                name: null,
                                tag: null
                            }
                        }
                        await createPlayer(loser)
                        i--
                        continue
                    }

                    console.log(w.name, '>', l.name, '-', date)
                    const nm = await Match.create({ 
                        format: "goat",
                        winnerId: wId,
                        winner_name: w.name,
                        loserId: lId,
                        loser_name: l.name,
                        delta: 10,
                        createdAt: date,
                        updatedAt: date
                    })
    
                    if (nm) c++
                }
            } 

            return message.channel.send(`Added ${c} matches to the database.`)
        } else {
            return message.channel.send(mlady)
        }
    }
    //AVATAR
    if (pfpcom.includes(cmd)) {
        const user = message.mentions.users.first() || message.author
        return message.channel.send(user.displayAvatarURL())
    }

    //DUELINGBOOK NAME
    if (dbcom.includes(cmd)) {
        const member = message.mentions.members.first() || null
        const id = member ? member.user.id : maid
        const player = await Player.findOne({ where: { id } })
        if (!player) return
        if (member && player.duelingBook) return message.channel.send(`${player.name}'s DuelingBook username is: ${player.duelingBook}.`)
        if (member && !player.duelingBook) return message.channel.send(`${player.name} does not have a DuelingBook username in our the database.`)

        if (marr.length > 1) {
            player.duelingBook = marr.slice(1, marr.length).join(' ')
            await player.save()
            return message.channel.send(`Your DuelingBook username has been set to: ${player.duelingBook}.`)
        } else if (player.duelingBook) {
            return message.channel.send(`Your DuelingBook username is: ${player.duelingBook}.`)
        } else {
            return message.channel.send(`You do not have a DuelingBook username in our database. You can type **!db** followed by your username to save it.`)
        }
    }

    //POLITICS
    if (cmd === `!politics`) {
        if(message.member.roles.cache.some(role => role.id === bfpRole)) {
            return message.channel.send(`You do not have permission to do that.`)
        } else if (!message.member.roles.cache.some(role => role.id === goatRole)) {
			message.member.roles.add(politicsRole)
            return message.channel.send(`You now have the Politics role.`)
        } else {
            message.member.roles.remove(politicsRole)
            return message.channel.send(`You no longer have the Politics role.`)
        }
    }

    //MUTE 
    if(cmd === `!mute`) {
        if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
        const member = message.mentions.members.first()
        if (!member) return message.channel.send(`Please tag the user you wish to mute.`)
        const player = await Player.findOne({ where: { id: member.user.id }})
        if (!player) return createPlayer(member)

        if (!member.roles.cache.some(role => role.id === muteRole)) {
            player.muted = true
            await player.save()
            member.roles.add(muteRole)
            member.roles.remove(politicsRole)   
            return message.channel.send(`${member.user.username} now has the Mute role.`)
        } else {
            return message.channel.send(`That user is already muted.`)
        }
    }

    //UNMUTE 
    if(cmd === `!unmute`) {
        if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
        const member = message.mentions.members.first()
        if (!member) return message.channel.send(`Please tag the user you wish to mute.`)
        const player = await Player.findOne({ where: { id: member.user.id }})

        if (member.roles.cache.some(role => role.id === muteRole)) {
            if (player) {
                player.muted = false
                await player.save()
            }

            member.roles.remove(muteRole)
            return message.channel.send(`${member.user.username} no longer has the Mute role.`)
        } else {
            return message.channel.send(`That user was not muted.`)
        }
    }
        
    //CREATE 
    if (cmd === `!create`) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        if (!args.length) return message.channel.send(`Please provide a name for the new tournament.`)
        const tournament_format = await getTournamentFormat(message)
        if (!tournament_format) return message.channel.send(`Please specify a valid format.`)
        const tournament_type = await getTournamentType(message)
        if (!tournament_type) return message.channel.send(`Please select a valid tournament type.`)
        const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')
        const name = args[0]
        const emoji = name.includes('FLC') ? FL :
            name.includes('YRS') ? mlady :
            name.includes('DLC') ? lmfao :
            FL

        try {
            const { status, data } = await axios({
                method: 'post',
                url: 'https://api.challonge.com/v1/tournaments.json',
                data: {
                    api_key: challongeAPIKey,
                    tournament: {
                        name: name,
                        url: name,
                        tournament_type: tournament_type,
                        gameName: 'Yu-Gi-Oh!',
                    }
                }
            })
            
            if (status && data && status === 200) {
                await Tournament.create({ 
                    id: data.tournament.id,
                    name: data.tournament.name,
                    state: data.tournament.state,
                    rounds: data.tournament.swiss_rounds, 
                    type: data.tournament.tournament_type,
                    format: tournament_format,
                    url: data.tournament.url
                })
            
                return message.channel.send(
                    `You created a new tournament:` + 
                    `\nName: ${data.tournament.name} ${emoji}` + 
                    `\nFormat: ${formats[tournament_format].name} ${formats[tournament_format].emoji}` + 
                    `\nType: ${capitalize(data.tournament.tournament_type)}` +
                    `\nBracket: https://challonge.com/${data.tournament.url}`
                )
            } 
        } catch (err) {
            console.log(err)
            try {
                const { status, data } = await axios({
                    method: 'post',
                    url: 'https://api.challonge.com/v1/tournaments.json',
                    data: {
                        api_key: challongeAPIKey,
                        tournament: {
                            name: name,
                            url: str,
                            tournament_type: tournament_type,
                            gameName: 'Yu-Gi-Oh!',
                        }
                    }
                })
                
                if (status && data && status === 200) {
                    await Tournament.create({ 
                        id: data.tournament.id,
                        name: data.tournament.name,
                        state: data.tournament.state,
                        rounds: data.tournament.swiss_rounds, 
                        type: data.tournament.tournament_type,
                        format: tournament_format,
                        url: data.tournament.url
                    })
                
                    return message.channel.send(
                        `You created a new tournament:` + 
                        `\nName: ${data.tournament.name} ${emoji}` + 
                        `\nFormat: ${formats[tournament_format].name} ${formats[tournament_format].emoji}` + 
                        `\nType: ${capitalize(data.tournament.tournament_type)}` +
                        `\nBracket: https://challonge.com/${data.tournament.url}`
                    )
                } 
            } catch (err) {
                console.log(err)
                return message.channel.send(`Unable to create tournament on Challonge.com.`)
            }
        }
    }

    //DESTROY
    if (cmd === `!destroy`) {
        if (!isAdmin(message.member)) return message.channel.send('You do not have permission to do that.')
        if (!args.length) return message.channel.send(`Please specify the name of the tournament you wish to destroy.`)

        const name = args[0]
        const tournament = await Tournament.findOne({ where: { name: { [Op.iLike]: name } } })
        if (!tournament) return message.channel.send(`Could not find tournament: "${name}".`)
        if (tournament.state === 'underway') return message.channel.send(`This tournament is underway, meaning it can only be deleted manually.`)
        if (tournament.state === 'complete') return message.channel.send(`This tournament is archived, meaning it can only be deleted manually.`)
        const tournamentId = tournament.id
        const tournament_name = tournament.name

        try {
            const { status } = await axios({
                method: 'delete',
                url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}.json`
            })
        
            if (status && status === 200) {
                const entries = await Entry.findAll({ where: { tournamentId: tournamentId }})
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i]
                    const playerId = entry.playerId	
                    await entry.destroy()
                    const count = await Entry.count({ where: { playerId: playerId } })
                    if (count) {
                        continue
                    } else { 
                        const member = message.guild.members.cache.get(playerId)
                        if (!member) continue
                        member.roles.remove(tourRole)
                    }
                }
        
                await tournament.destroy()
                return message.channel.send(`Yikes! You deleted ${tournament_name} ${formats[tournament.format].emoji} from your Challonge account.`)
            } else {
                return message.channel.send(`Unable to delete tournament from Challonge account.`)
            }
        } catch (err) {
            return message.channel.send(`Error: Unable to delete tournament from Challonge account.`)
        }
    }

    //START
    if (startcom.includes(cmd)) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        const tournaments = await Tournament.findAll({ where: { state: 'pending' }, order: [['createdAt', 'ASC']] })
		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send(`There are no pending tournaments.`)
        const { name, id, url } = tournament
		const unregistered = await Entry.findAll({ where: { participantId: null, tournamentId: id } })
        if (unregistered.length) return message.channel.send('One of more players has not been signed up. Please check the Database.')
		const entries = await Entry.findAll({ where: { tournamentId: id } })
		if (!entries.length) return message.channel.send(`Error: missing entrants.`)
		const { sheet1Data, sheet2Data } = await createSheetData()
		const success = await seed(message, tournament)
		if (!success) return message.channel.send(`Error seeding tournament. Please try again or start it manually.`)

		const { status } = await axios({
			method: 'post',
			url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/start.json`
		})

		if (status === 200) { 
			tournament.state = 'underway'
			await tournament.save()
			//const spreadsheetId = await makeSheet(`${name} Deck Lists`, sheet1Data)
			//await addSheet(spreadsheetId, 'Summary')
			//await writeToSheet(spreadsheetId, 'Summary', 'RAW', sheet2Data)
			//await uploadDeckFolder(name)
			return message.channel.send(`Let's go! Your tournament is starting now: https://challonge.com/${url} ${formats[tournament.format].emoji}`)
		} else {
			return message.channel.send(`Error: could not access Challonge.com.`)
		}
    }

    //END
    if (cmd === `!end`) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        if (!args.length) return message.channel.send(`Please specify the name of the tournament you wish to end.`)
        const name = args[0]
        const tournament = await Tournament.findOne({ where: { name: { [Op.iLike]: name } } })
        if (tournament.state === 'complete') return message.channel.send(`This tournament has already ended.`)
        if (!tournament) return message.channel.send(`Could not find tournament: "${name}".`)
        const tournament_name = tournament.name

        const { status } = await axios({
            method: 'post',
            url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/finalize.json`
        })

        if (status && status === 200) {
            const entries = await Entry.findAll({ where: { tournamentId: tournament.id }})
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i]
                const playerId = entry.playerId	
                await entry.destroy()
                const count = await Entry.count({ where: { playerId: playerId } })
                if (count) {
                    continue
                } else { 
                    const member = message.guild.members.cache.get(playerId)
                    if (!member) continue
                    member.roles.remove(tourRole)
                }
            }

            await tournament.update({
                state: 'complete'
            })
            
            return message.channel.send(`Congrats! The results of ${tournament_name} ${formats[tournament.format].emoji} have been finalized.`)
        } else {
            return message.channel.send(`Unable to finalize ${tournament.name} ${formats[tournament.format].emoji} on Challonge.com.`)
        }
    }

    //BRACKET
    if (bracketcom.includes(cmd)) {
        const tournaments = await Tournament.findAll({ where: { state: { [Op.not]: 'complete'} }, order: [['createdAt', 'ASC']]})
        if (!tournaments.length) return message.channel.send(`There are no active tournaments.`)
        
        const results = []
        for (let i = 0; i < tournaments.length; i++) {
            const tournament = tournaments[i]
            const emoji = tournament.name.includes('FLC') ? FL :
                tournament.name.includes('YRS') ? mlady :
                tournament.name.includes('DLC') ? lmfao :
                FL
            results.push(`Name: ${tournament.name} ${emoji}` +
                `\nType: ${capitalize(tournament.type)}` +
                `\nFormat: ${formats[tournament.format].name} ${formats[tournament.format].emoji}` + 
                `\nBracket: <https://challonge.com/${tournament.url}>`
            )
        }

        return message.channel.send(results.join('\n\n'))
    }

    //JOIN
    if(joincom.includes(cmd)) {        
        const mention = message.mentions.members.first()
        if (isMod(message.member) && mention) return message.channel.send(`Please type **!signup @user** to register someone else for the tournament.`)
        const player = await Player.findOne({ where: { id: maid }})
        if (!player) return message.channel.send(`You are not in the database.`)
        const tournaments = await Tournament.findAll({ where: { state: 'pending' }, order: [['createdAt', 'ASC']] })
        const count = await Tournament.count({ where: { state: 'underway' } })
        const tournament = await selectTournament(message, tournaments, maid)
        if (!tournament && count) return message.channel.send(`Sorry, the tournament already started.`)
        if (!tournament && !count) return message.channel.send(`There is no active tournament.`)
        const entry = await Entry.findOne({ where: { playerId: maid, tournamentId: tournament.id } })
        
        message.channel.send(`Please check your DMs.`)
        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(message.member, player)
        if (!dbName) return
        const deckListUrl = await getDeckList(message.member, player, formats[tournament.format].date, formats[tournament.format].list)
        if (!deckListUrl) return
        const deckName = await getDeckName(message.member, player)
        const deckType = await getDeckType(player)
        if (!deckType) return
        const deckCategory = getDeckCategory(deckType)
        if (!deckCategory) return

        if (!entry) {                                  
            const { participant } = await postParticipant(tournament, player)
            if (!participant) return message.channel.send(`Error: Could not access tournament: ${tournament.name}`)
            
            const new_entry = await Entry.create({
                pilot: player.name,
                url: deckListUrl,
                deck_name: deckName || deckType,
                deck_type: deckType,
                deck_category: deckCategory,
                participantId: participant.id,
                playerId: player.id,
                tournamentId: tournament.id
            })

            if (!new_entry) return message.channel.send(`Error: Could not access database.`)
            message.member.roles.add(tourRole)
            message.author.send(`Thanks! I have all the information we need from you. Good luck in the tournament!`)
            return client.channels.cache.get(formats[tournament.format].channel).send(`<@${player.id}> is now registered for the tournament!`)
        } else {
            await entry.update({
                url: deckListUrl,
                deck_name: deckName || deckType,
                deck_type: deckType,
                deck_category: deckCategory
            })
    
            message.author.send(`Thanks! I have your updated deck list for the tournament.`)
            return client.channels.cache.get(formats[tournament.format].channel).send(`<@${player.id}> resubmitted their deck list for the tournament!`)
        }
    }

    //SIGN UP
    if (signupcom.includes(cmd)) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that. Please type **!join** instead.')   
        const member = message.mentions.members.first()
        if (!member) return message.channel.send(`Could not find user in the server.`)
        const player = await Player.findOne({ where: { id: member.user.id }})
        if (!player) return message.channel.send(`${member.user.username} is not in the database.`)
        const tournaments = await Tournament.findAll({ where: { state: 'pending' }, order: [['createdAt', 'ASC']] })
        const tournament = await selectTournament(message, tournaments, maid)
        const count = await Tournament.count({ where: { state: 'underway' } })
        if (!tournament && count) return message.channel.send(`Sorry, the tournament already started.`)
        if (!tournament && !count) return message.channel.send(`There is no active tournament.`)
        const entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id } })
        
        if (entry) {
            message.channel.send(`Please check your DMs.\n\n(FYI: ${player.name} is already registered for ${tournament.name} ${formats[tournament.format].emoji})`)
        } else {
            message.channel.send(`Please check your DMs.`)
        }

        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(message.member, player, override = true)
        if (!dbName) return
        const deckListUrl = await getDeckList(message.member, player, formats[tournament.format].date, formats[tournament.format].list, override = true)
        if (!deckListUrl) return
        const deckName = await getDeckName(message.member, player, override = true)
        const deckType = await getDeckType(player)
        if (!deckType) return
        const deckCategory = getDeckCategory(deckType)
        if (!deckCategory) return

        if (!entry) {                                  
            const { participant } = await postParticipant(tournament, player)
            if (!participant) return message.channel.send(`Error: Could not access tournament: ${tournament.name}`)
            
            const new_entry = await Entry.create({
                pilot: player.name,
                url: deckListUrl,
                deck_name: deckName || deckType,
                deck_type: deckType,
                deck_category: deckCategory,
                participantId: participant.id,
                playerId: player.id,
                tournamentId: tournament.id
            })

            if (!new_entry) return message.channel.send(`Error: Could not access database.`)
            member.roles.add(tourRole)
            message.author.send(`Thanks! I have all the information we need for ${player.name}!`)
            return client.channels.cache.get(formats[tournament.format].channel).send(`<@${player.id}> is now registered for the tournament!`)
        } else {
            await entry.update({
                url: deckListUrl,
                deck_name: deckName || deckType,
                deck_type: deckType,
                deck_category: deckCategory
            })
    
            message.author.send(`Thanks! I have ${player.name}'s updated deck list for the tournament.`)
            return client.channels.cache.get(formats[tournament.format].channel).send(`A moderator resubmitted <@${player.id}>'s deck list for the tournament!`)
        }
    }

    //DROP
    if(dropcom.includes(cmd)) {
        const tournaments = await Entry.findAll({ where: { playerId: maid }, include: Tournament }).map((e) => e.tournament)
        if (!tournaments.length) return message.channel.send(`You are not in an active tournament.`)
        const tournament = await selectTournament(message, tournaments, maid)
        let success = tournament.state === 'pending'
        if (!success) {
            const allMatches = await Match.findAll({ order: [["createdAt", "DESC"]] })
            const last3 = allMatches.slice(-3)
    
            last3.forEach((match) => {
                if (match.winner === maid || match.loser === maid) success = true 
            })

            if (!success) return message.channel.send(`If you played a match, please report the result before dropping. Otherwise ask a Moderator to remove you.`)
        }

        const entry = await Entry.findOne({ where: { playerId: maid } })
        if (!entry) return message.channel.send(`You are not in an active tournament.`)
        return removeParticipant(message, message.member, entry, tournament, true)
    }

    //REMOVE
    if (cmd.toLowerCase() === `!remove`) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        const member = message.mentions.members.first()
        const playerId = member && member.user ? member.user.id : null
        if (!playerId) return message.channel.send(`Please specify the player you wish to remove.`)
    
        const entry = await Entry.findOne({ where: { playerId }, include: [Player, Tournament]})
        if (!entry) return message.channel.send(`That user is not in any tournaments.`)
        const tournament = entry.tournament

        return removeParticipant(message, member, entry, tournament, false)
    }

    //ROLE
    if (rolecom.includes(cmd)) {
        if (!message.member.roles.cache.some(role => role.id === formatRole)) {
			message.member.roles.add(formatRole)
            return message.channel.send(`You now have the ${formatName} Players role.`)
        } else {
            message.member.roles.remove(formatRole)
            return message.channel.send(`You no longer have the ${formatName} Players role.`)
        }
    }

    //LEGAL
    if (legalcom.includes(cmd)) {
        const player = await Player.findOne({ where: { id: maid } })
        if (!player) return message.channel.send(`Sorry.`)
        message.channel.send("Please check your DMs.")
        const issues = await checkDeckList(message.member, player, formatDate, formatEmoji, formatList, formatName)
        if (!issues) return

        if (issues['illegalCards'].length || issues['forbiddenCards'].length || issues['limitedCards'].length || issues['semiLimitedCards'].length) {
            let response = `I'm sorry, ${player.name}, your deck is not legal for ${formatName} Format. ${formatEmoji}`
            if (issues['illegalCards'].length) response += `\n\nThe following cards are not included in this format:\n${issues['illegalCards'].join('\n')}`
            if (issues['forbiddenCards'].length) response += `\n\nThe following cards are forbidden:\n${issues['forbiddenCards'].join('\n')}`
            if (issues['limitedCards'].length) response += `\n\nThe following cards are limited:\n${issues['limitedCards'].join('\n')}`
            if (issues['semiLimitedCards'].length) response += `\n\nThe following cards are semi-limited:\n${issues['semiLimitedCards'].join('\n')}`
            return message.author.send(response)
        } else {
            return message.author.send(`Congrats, your ${formatName} Format deck is perfectly legal! ${formatEmoji}`)
        }
    }

    //BANLIST
    if (banscom.includes(cmd)) {
        const forbidden = await Status.findAll({ where: { [formatList]: 'forbidden' }, order: [["name", "ASC"]] }).map((s) => s.name)
        const limited = await Status.findAll({ where: { [formatList]: 'limited' }, order: [["name", "ASC"]] }).map((s) => s.name)
        const semilimited = await Status.findAll({ where: { [formatList]: 'semi-limited' }, order: [["name", "ASC"]] }).map((s) => s.name)

        if (!forbidden.length) forbidden.push(`N/A`)
        if (!limited.length) limited.push(`N/A`)
        if (!semilimited.length) semilimited.push(`N/A`)

        const banlist = `**${formatName.toUpperCase()} FORMAT ${formatEmoji} - FORBIDDEN & LIMITED LIST**` +
        `\n\n**The following cards are forbidden:**` +
        `\n${forbidden.join("\n")}` +
        `\n\n**The following cards are limited:**` +
        `\n${limited.join("\n")}` +
        `\n\n**The following cards are semi-limited:**` +
        `\n${semilimited.join("\n")}`

        message.channel.send(`I messaged you the Forbidden & Limited list for ${formatName} Format. ${formatEmoji}`)
        return message.author.send(banlist)
    }

    //BOT USER GUIDE
    if (botcom.includes(cmd.toLowerCase())) {
        const botEmbed = new Discord.MessageEmbed()
	        .setColor('#38C368')
        	.setTitle('RetroBot')
	        .setDescription('A Rankings and Tournament Bot for FormatLibrary.com.\n' )
	        .setURL('https://formatlibrary.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/wz5TqmR.png', 'https://formatlibrary.com/')
            .setThumbnail('https://i.imgur.com/ul7nKjk.png')
            .addField('How to Use This Guide', '\nThe following commands can be used for any format in the appropriate channels (i.e. <#414575168174948372>, <#629464112749084673>, etc.). Commands require arguments as follows: (blank) no argument, (@user) mention a user, (n) a number, (link) a URL.')
        	.addField('Ranked Play Commands', '\n!loss - (@user) - Report a loss to another player. \n!stats - (blank or @user) - Post a player’s stats. \n!top - (n) - Post the channel’s top rated players (100 max). \n!h2h - (@user + @user) - Post the H2H record between 2 players. \n!role - Add or remove a format role. \n!undo - Undo the last loss if you reported it. \n')
        	.addField('Format Info Commands', '\n!legal - Privately check if your deck is legal. \n!list - View the Forbidden and Limited list. \n')
        	.addField('Tournament Commands', '\n!join - Register for the upcoming tournament.\n!resubmit - Resubmit your deck list for the tournament. \n!drop - Drop from the current tournament. \n!show - Post the Challonge link for the current tournament.')
        	.addField('Server Commands', '\n!db - Set your DuelingBook username. \n!prof - (blank or @user) - Post a player’s profile. \n!medals - (blank or @user) - Post a player’s best medals. \n!formats - View a list of supported Retro Formats. \n!bot - View the RetroBot User Guide. \n!mod - View the Moderator Guide.');

        message.author.send(botEmbed);
        return message.channel.send("I messaged you the RetroBot User Guide.")
    }


    //MOD USER GUIDE
    if (cmd.toLowerCase() === `!mod`) {
        if (!isMod(message.member)) {
            return message.channel.send("You do not have permission to do that.")
        } 

        const botEmbed = new Discord.MessageEmbed()
	        .setColor('#38C368')
        	.setTitle('RetroBot')
	        .setDescription('A Rankings and Tournament Bot for FormatLibrary.com.\n' )
	        .setURL('https://formatlibrary.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/wz5TqmR.png', 'https://formatlibrary.com/')
        	.setThumbnail('https://i.imgur.com/ul7nKjk.png')
        	.addField('Mod Ranked Play Commands', '\n!manual - (@winner + @loser) - Manually record a match result. \n!undo - Undo the most recent loss, even if you did not report it.')
            .addField('Mod Tournament Commands', '\n!create - (tournament name) - Create a new tournament.  \n!signup - (@user) - Directly add a player to the bracket. \n!noshow - (@user) - Report a no-show. \n!remove - (@user) - Remove a player from the bracket. \n!seed - Assign seeds to participants based on rankings. \n!start - Start the next tournament. \n!end - End the current tournament.')
            .addField('Mod Discipline Commands', '\n!mute - (@user) - Mute a user.\n!unmute - (@user) - Unmute a user.')
            .addField('Mod Server Commands', '\n!census - Update the information of all players in the database.\n!recalc - Recaluate all player stats for a specific format if needed.');

        message.author.send(botEmbed);
        return message.channel.send("I messaged you the Mod-Only Guide.")
    }

    //FORMATS
    if(cmd.toLowerCase() === `!formats`) {
        const formatsEmbed = new Discord.MessageEmbed()
            .setColor('#38C368')
            .setURL('https://formatlibrary.com/')
            .setThumbnail('https://i.imgur.com/ul7nKjk.png')
            .addField('DM Formats', 'Yugi-Kaiba - May 2002 \nCritter - July 2002 \nAndroid - May 2003 \nYata - August 2003 \nVampire - Dec 2003 \nTrad Chaos - June 2004 \nChaos Warrior - February 2005 \nGoat - August 2005')
            .addField('GX Formats', 'CRV Goat - September 2005 \nReaper - February 2006 \nChaos Return - August 2006 \nStein - December 2006 \nTroop Dup - August 2007 \nPerfect Circle - January 2008 \nDAD Return - April 2008 \nGlad Beast - July 2008')
            .addField('5D’s Formats', 'TeleDAD - January 2009 \nDark Strike - July 2009 \nLightsworn - February 2010 \nEdison - April 2010 \nFrog - August 2010 \nSix Samurai - February 2011')
            .addField('Zexal Formats', 'Providence - June 2011 \n Tengu Plant - October 2011 \nMeadowlands - March 2012 \nDino Rabbit - June 2012 \nWind-Up - February 2013 \nMeadowlands - May 2013 \nBaby Ruler - July 2013 \nRavine Ruler - October 2013 \nFire-Water - March 2014 \nHAT - July 2014')
            .addField('ARC-V Formats', 'Shaddoll - September 2014 \n London - October 2014 \nBurning Abyss - December 2014  \nCharleston - February 2015 \nNekroz - June 2015 \nClown Nekroz - October 2015 \nPePe - January 2016 \nDracoPal - April 2016 \nMonarch - July 2016 \nABC - January 2017 \nGrass Zoo - April 2017 \nDraco Zoo - July 2017')
            .addField('VRAINS Formats', 'Link Zoo - August 2017 \nQuick-Fix - November 2017 \nTough - January 2018 \nMagician - April 2018 \nGouki - June 2018 \nDanger - November 2018 \nSky Striker - March 2019 \nThunder Dragon - June 2019 \nLunalight Orcust - October 2019 \nStriker Orcust - January 2020')
            .addField('Current Formats', 'Current \nTraditional \nNova - by Jazz \nRebirth - by MMF')
        
        message.author.send(formatsEmbed)
        return message.channel.send("I messaged you the list of suppported Yu-Gi-Oh! Formats.")
    }

    //PROFILE
    if (profcom.includes(cmd.toLowerCase())) {
        const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
        const player = await Player.findOne({ where: { id: playerId } })
        const stats = await Stats.findOne({ where: { playerId } })
        if (!player || !stats) return message.channel.send("That user is not in the database.")
        const results = []
        const keys = Object.keys(stats.dataValues)
            .filter((k) => formats[k])
            .sort((a, b) => {
                if (formats[a].date > formats[b].date) {
                    return 1
                } else if (formats[a].date < formats[b].date) {
                    return -1
                } else {
                    return 0
                } 
            })

        console.log('keys', keys)

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            if (stats[key] && formats[key]) {
                const medal = getMedal(stats[key])
                results.push(`${formats[key].emoji} ${formats[key].name}: ${medal}`)
            }
        }

        if (!results.length) {
            return message.channel.send(`You have not played any ranked games.`)
        } else {
            results.unshift(`${FL} --- ${player.name}'s Player Profile --- ${FL}`)
            return message.channel.send(results.join("\n"))
        }
    }


    //MEDALS
    if (cmd === `!medals`) {
        const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
        const player = await Player.findOne({ where: { id: playerId } })
        const stats = await Stats.findOne({ where: { playerId } })
        if (!player || !stats) return message.channel.send("That user is not in the database.")
        const results = []
        const keys = Object.keys(stats.dataValues)
            .filter((k) => formats[k])
            .sort((a, b) => {
                if (formats[a].date > formats[b].date) {
                    return 1
                } else if (formats[a].date < formats[b].date) {
                    return -1
                } else {
                    return 0
                } 
            })

        console.log('keys', keys)

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            if (stats[key] >= 530 && formats[key]) {
                const medal = getMedal(stats[key])
                results.push(`${formats[key].emoji} ${formats[key].name}: ${medal}`)
            }
        }

        if (!results.length) {
            return message.channel.send(`You have not earned any prestigious medals. ${mad}`)
        } else {
            results.unshift(`${FL} --- ${player.name}'s Best Medals --- ${FL}`)
            return message.channel.send(results.join("\n"))
        }
    }


    //STATS
    if (statscom.includes(cmd)) {
        const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
        const player = await Player.findOne({ where: { id: playerId } })
        const stats = await Stats.findOne({ where: { playerId } })
        const wins = await Wins.findOne({ where: { playerId } })
        const losses = await Losses.findOne({ where: { playerId } })
        if (!player || !stats || !wins || !losses) return message.channel.send("That user is not in the database.")

        const all_stats = await Stats.findAll({ where: { [format]: { [Op.not]: null } }, order: [[format, 'DESC']] })
        const bans_map = await message.guild.fetchBans()
        const banned_players = [...bans_map.keys()]
        const filtered_stats = all_stats.filter((s) => !banned_players.includes(s.playerId))
        const index = filtered_stats.length ? filtered_stats.findIndex((s) => s.playerId === playerId) : null
        const rank = stats[format] ? `#${index + 1} out of ${filtered_stats.length}` : `N/A`
        const elo = stats[format] ? stats[format].toFixed(2) : `500.00`
        const medal = getMedal(stats[format], title = true)
        const winrate = wins[format] || losses[format] ? `${(100 * wins[format] / (wins[format] + losses[format])).toFixed(2)}%` : 'N/A'		
        
        return message.channel.send(
            `${formatEmoji} --- ${formatName} Stats --- ${formatEmoji}`
            + `\nName: ${player.name}`
            + `\nMedal: ${medal}`
            + `\nRanking: ${rank}`
            + `\nElo Rating: ${elo}`
            + `\nWins: ${wins[format]}, Losses: ${losses[format]}`
            + `\nWin Rate: ${winrate}`
        )
    }

    //RANK
    if (rankcom.includes(cmd)) {
        const x = parseInt(args[0]) || 10
        if (x < 1) return message.channel.send("Please provide a number greater than 0.")
        if (x > 100 || isNaN(x)) return message.channel.send("Please provide a number less than or equal to 100.")

        const all_stats = await Stats.findAll({ where: { [format]: { [Op.not]: null } }, include: Player, order: [[format, 'DESC']] })
        const bans_map = await message.guild.fetchBans()
        const banned_players = [...bans_map.keys()]
        const filtered_stats = all_stats.filter((s) => !banned_players.includes(s.playerId))
        const top_stats = filtered_stats.slice(0, x)
        if (!top_stats.length) return message.channel.send(`I'm sorry, we don't have any ${formatName} players.`)
        const results = []
        top_stats.length === 1 ? results[0] = `${formatEmoji} --- The Best ${formatName} Player --- ${formatEmoji}`
        : results[0] = `${formatEmoji} --- Top ${top_stats.length} ${formatName} Players --- ${formatEmoji}`

        for (let i = 0; i < top_stats.length; i++) results[i+1] = `${(i+1)}. ${getMedal(top_stats[i][format])} ${top_stats[i].player.name}`
        for (let i = 0; i < results.length; i += 30) message.channel.send(results.slice(i, i+30))
        return
    }

    //LOSS
    if (losscom.includes(cmd)) {
        const opid = message.mentions.users.first() ? message.mentions.users.first().id : null	
        if (!opid) return message.channel.send(`No player specified.`)
        if (opid === maid) return message.channel.send(`You cannot lose a match to yourself.`)
        if (await isNewUser(opid)) await createPlayer(message.mentions.members.first())
        const winner = message.guild.members.cache.get(opid)
        const winningPlayer = await Player.findOne({ where: { id: opid } })
        const winnerBackups = await Backups.findOne({ where: { playerId: opid } })
        const winnerLosses = await Losses.findOne({ where: { playerId: opid } })
        const winnerStats = await Stats.findOne({ where: { playerId: opid } })
        const winnerWins = await Wins.findOne({ where: { playerId: opid } })
        const losingPlayer = await Player.findOne({ where: { id: maid } })
        const loserBackups = await Backups.findOne({ where: { playerId: maid } })
        const loserLosses = await Losses.findOne({ where: { playerId: maid } })
        const loserStats = await Stats.findOne({ where: { playerId: maid } })
        const loserWins = await Wins.findOne({ where: { playerId: maid } })
        
        if (winner && winner.user.bot) return message.channel.send(`Sorry, Bots do not play Goat Format... *yet*.`)
        if (opid.length < 17 || opid.length > 18) return message.channel.send(`To report a loss, type **!loss @opponent**.`)
        if (!losingPlayer || !loserBackups || !loserLosses || !loserStats || !loserWins) return message.channel.send(`You are not in the database.`)
        if (!winningPlayer || !winnerBackups || !winnerLosses || !winnerStats || !winnerWins) return message.channel.send(`That user is not in the database.`)
 
        const loserHasTourRole = isTourPlayer(message.member)
        const winnerHasTourRole = isTourPlayer(winner)
        const activeTournament = await Tournament.count({ where: { state: 'underway' } }) 
        let isTournamentMatch
        let winningEntry
        let losingEntry
        let tournament

        if (loserHasTourRole && winnerHasTourRole && activeTournament) {
            const loserEntries = await Entry.findAll({ where: { playerId: losingPlayer.id }, include: Tournament })
            const winnerEntries = await Entry.findAll({ where: { playerId: winningPlayer.id }, include: Tournament })
            if (loserEntries.length && winnerEntries.length) {
                const loser_tournament_ids = []
                const winner_tournament_ids = []
                const common_tournament_ids = []
                const tournaments = []

                for (let i = 0; i < loserEntries.length; i++) {
                    const entry = loserEntries[i]
                    loser_tournament_ids.push(entry.tournament.id)
                }

                for (let i = 0; i < winnerEntries.length; i++) {
                    const entry = winnerEntries[i]
                    winner_tournament_ids.push(entry.tournament.id)
                }

                for (let i = 0; i < loser_tournament_ids.length; i++) {
                    const tournament_id = loser_tournament_ids[i]
                    if (winner_tournament_ids.includes(tournament_id)) {
                        common_tournament_ids.push(tournament_id)
                    }
                }

                if (common_tournament_ids.length) {
                    for (let i = 0; i < common_tournament_ids.length; i++) {
                        const id = common_tournament_ids[i]
                        tournament = await Tournament.findOne({ where: { id: id }})
                        losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id } })
                        winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id } })
                        if (!losingEntry || !winningEntry) continue
                        const matches = await getMatches(tournament.id)
                        if (!matches) continue
                        for (let i = 0; i < matches.length; i++) {
                            const match = matches[i].match
                            if (match.state !== 'open') continue
                            if (checkPairing(match, losingEntry.participantId, winningEntry.participantId)) {
                                tournaments.push(tournament)
                                break
                            }
                        }
                    }
                }
    
                if (tournaments.length) {
                    const tournament = await selectTournament(message, tournaments, message.member.user.id)
                    if (tournament) {
                        isTournamentMatch = true
                        if (tournament.state === 'pending') return message.channel.send(`Sorry, ${tournament.name} has not started yet.`)
                        if (tournament.state !== 'underway') return message.channel.send(`Sorry, ${tournament.name} is not underway.`)
                        const success = await processMatchResult(message, winningPlayer, losingPlayer, tournament)
                        if (!success) return
                    } else {
                        return
                    }
                }
            }
        }
            
        const origStatsWinner = winnerStats[format] || 500.00
        const origStatsLoser = loserStats[format] || 500.00
        const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
        
        winnerStats[format] ? winnerStats[format] += delta : winnerStats[format] = 500.00 + delta
        await winnerStats.save()
        winnerBackups[format] = origStatsWinner
        await winnerBackups.save()
        winnerWins[format]++
        await winnerWins.save()

        loserStats[format] ? loserStats[format] -= delta : loserStats[format] = 500.00 - delta
        await loserStats.save()
        loserBackups[format] = origStatsLoser
        await loserBackups.save()
        loserLosses[format]++
        await loserLosses.save()

        const match = await Match.create({
            winnerId: winningPlayer.id,
            winner_name: winningPlayer.name,
            loserId: losingPlayer.id,
            loser_name: losingPlayer.name,
            tournament: isTournamentMatch,
            format: format,
            delta: delta
        })

        if (isTournamentMatch && winningEntry && losingEntry && tournament && match) {
            await Matchup.create({
                winning_deck_name: winningEntry.deck_name,
                winning_deck_type: winningEntry.deck_type,
                winning_deck_category: winningEntry.deck_category,
                losing_deck_name: losingEntry.deck_name,
                losing_deck_type: losingEntry.deck_type,
                losing_deck_category: losingEntry.deck_category,
                matchId: match.id,
                format: format,
                tournamentId: tournament.id
            })
        }

        return message.channel.send(`${losingPlayer.name}, your ${formatName} Format ${formatEmoji} ${isTournamentMatch ? 'Tournament ' : ''}loss to ${winningPlayer.name} has been recorded.`)
    }

    //MANUAL
    if (manualcom.includes(cmd)) {
        if (!isMod(message.member)) return message.channel.send(`You do not have permission to do that.`)

        const usersMap = message.mentions.users
        const userIds = [...usersMap.keys()]	
        const winnerId = message.mentions.users.first() ? message.mentions.users.first().id : args.length > 0 ? args[0]	: null
        const loserId = userIds.length > 1 ? userIds[1] : args.length > 1 ? args[1] : null	
        if (!winnerId || !loserId) return message.channel.send(`Please specify 2 players.`)
        if (winnerId === loserId) return message.channel.send(`Please specify 2 different players.`)

        const winner = message.guild.members.cache.get(winnerId)
        const loser = message.guild.members.cache.get(loserId)
        if ((winner && winner.user.bot) ||  (loser && loser.user.bot)  ) return message.channel.send(`Sorry, Bots do not play Goat Format... *yet*.`)

        if (winner && await isNewUser(winnerId)) await createPlayer(winner)
        if (loser && await isNewUser(loserId)) await createPlayer(loser)

        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const winnerBackups = await Backups.findOne({ where: { playerId: winnerId } })
        const winnerLosses = await Losses.findOne({ where: { playerId: winnerId } })
        const winnerStats = await Stats.findOne({ where: { playerId: winnerId } })
        const winnerWins = await Wins.findOne({ where: { playerId: winnerId } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const loserBackups = await Backups.findOne({ where: { playerId: loserId } })
        const loserLosses = await Losses.findOne({ where: { playerId: loserId } })
        const loserStats = await Stats.findOne({ where: { playerId: loserId } })
        const loserWins = await Wins.findOne({ where: { playerId: loserId } })

        if (!losingPlayer || !loserBackups || !loserLosses || !loserStats || !loserWins) return message.channel.send(`Sorry, <@${loserId}> is not in the database.`)
        if (!winningPlayer || !winnerBackups || !winnerLosses || !winnerStats || !winnerWins) return message.channel.send(`Sorry, <@${winnerId}> is not in the database.`)

        const loserHasTourRole = await isTourPlayer(loser)
        const winnerHasTourRole = await isTourPlayer(winner)
        const activeTournament = await Tournament.count({ where: { state: 'underway' } }) 
        let isTournamentMatch
        let winningEntry
        let losingEntry
        let tournament

        if (loserHasTourRole && winnerHasTourRole && activeTournament) {
            const loserEntries = await Entry.findAll({ where: { playerId: losingPlayer.id }, include: Tournament })
            const winnerEntries = await Entry.findAll({ where: { playerId: winningPlayer.id }, include: Tournament })
            if (loserEntries.length && winnerEntries.length) {
                const loser_tournament_ids = []
                const winner_tournament_ids = []
                const common_tournament_ids = []
                const tournaments = []

                for (let i = 0; i < loserEntries.length; i++) {
                    const entry = loserEntries[i]
                    loser_tournament_ids.push(entry.tournament.id)
                }

                for (let i = 0; i < winnerEntries.length; i++) {
                    const entry = winnerEntries[i]
                    winner_tournament_ids.push(entry.tournament.id)
                }

                for (let i = 0; i < loser_tournament_ids.length; i++) {
                    const tournament_id = loser_tournament_ids[i]
                    if (winner_tournament_ids.includes(tournament_id)) {
                        common_tournament_ids.push(tournament_id)
                    }
                }
                
                if (common_tournament_ids.length) {
                    for (let i = 0; i < common_tournament_ids.length; i++) {
                        const id = common_tournament_ids[i]
                        tournament = await Tournament.findOne({ where: { id: id }})
                        losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id } })
                        winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id } })
                        if (!losingEntry || !winningEntry) continue
                        const matches = await getMatches(tournament.id)
                        if (!matches) continue
                        for (let i = 0; i < matches.length; i++) {
                            const match = matches[i].match
                            if (match.state !== 'open') continue
                            if (checkPairing(match, losingEntry.participantId, winningEntry.participantId)) {
                                tournaments.push(tournament)
                                break
                            }
                        }
                    }
                }
                    
                if (tournaments.length) {
                    const tournament = await selectTournament(message, tournaments, message.member.user.id)
                    if (tournament) {
                        isTournamentMatch = true
                        if (tournament.state === 'pending') return message.channel.send(`Sorry, ${tournament.name} has not started yet.`)
                        if (tournament.state !== 'underway') return message.channel.send(`Sorry, ${tournament.name} is not underway.`)
                        const success = await processMatchResult(message, winningPlayer, losingPlayer, tournament)
                        if (!success) return
                    } else {
                        return
                    }
                }
            }
        }
            
        const origStatsWinner = winnerStats[format] || 500.00
        const origStatsLoser = loserStats[format] || 500.00
        const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
        
        winnerStats[format] ? winnerStats[format] += delta : winnerStats[format] = 500.00 + delta
        await winnerStats.save()
        winnerBackups[format] = origStatsWinner
        await winnerBackups.save()
        winnerWins[format]++
        await winnerWins.save()

        loserStats[format] ? loserStats[format] -= delta : loserStats[format] = 500.00 - delta
        await loserStats.save()
        loserBackups[format] = origStatsLoser
        await loserBackups.save()
        loserLosses[format]++
        await loserLosses.save()

        const match = await Match.create({
            winner_name: winningPlayer.name,
            winnerId: winningPlayer.id,
            loser_name: losingPlayer.name,
            loserId: losingPlayer.id,
            tournament: isTournamentMatch,
            format: format,
            delta: delta
        })

        if (isTournamentMatch && winningEntry && losingEntry && tournament && match) {
            await Matchup.create({
                winning_deck_name: winningEntry.deck_name,
                winning_deck_type: winningEntry.deck_type,
                winning_deck_category: winningEntry.deck_category,
                losing_deck_name: losingEntry.deck_name,
                losing_deck_type: losingEntry.deck_type,
                losing_deck_category: losingEntry.deck_category,
                matchId: match.id,
                format: format,
                tournamentId: tournament.id
            })
        }

        return message.channel.send(`A manual ${formatName} Format ${formatEmoji} ${isTournamentMatch ? 'Tournament ' : ''}loss by ${losingPlayer.name} to ${winningPlayer.name} has been recorded.`)		
    }

    //NO SHOW
    if (noshowcom.includes(cmd)) {
        if (!isMod(message.member)) return message.channel.send(`You do not have permission to do that.`)

        const noShowId = message.mentions.users.first() ? message.mentions.users.first().id : args.length > 0 ? args[0]	: null
        if (!noShowId) return message.channel.send("Please specify a player.")
        const noshow = message.guild.members.cache.get(noShowId)
        if ((noshow && noshow.user.bot)) return message.channel.send(`Sorry, Bots do not play Goat Format... *yet*.`)
        if (noshow && await isNewUser(noShowId)) await createPlayer(noshow)
        const noShowPlayer = await Player.findOne({ where: { id: noShowId } })
        if (!noShowPlayer) return message.channel.send(`Sorry, <@${noShowId}> is not in the database.`)
        const tournaments = await Entry.findAll({ where: { playerId: noShowId }, include: Tournament }).map((e) => e.tournament)
        if (!tournaments.length || !noshow.roles.cache.some(role => role.id === tourRole)) return message.channel.send(`Sorry, ${noShowPlayer.name} is not any tournaments.`)
     
        const tournament = await selectTournament(message, tournaments, maid)
        if (!tournament) return
        if (tournament.state === 'pending') return message.channel.send(`Sorry, ${tournament.name} has not started yet.`)
        if (tournament.state !== 'underway') return message.channel.send(`Sorry, ${tournament.name} is not underway.`)
        
        const noShowEntry = await Entry.findOne({ where: { playerId: noShowId, tournamentId: tournament.id } })
        if (!noShowEntry) return message.channel.send(`Sorry I could not find that player's tournament entry in the database.`)

        const matchesArr = await getMatches(tournament.id)
        let winnerParticipantId = false
        for (let i = 0; i < matchesArr.length; i++) {
            const match = matchesArr[i].match
            if (match.state !== 'open') continue
            winnerParticipantId = findNoShowOpponent(match, noShowEntry.participantId)
            if (winnerParticipantId) break
        }

        const winningEntry = await Entry.findOne({ where: { participantId: winnerParticipantId, tournamentId: tournament.id }, include: Player })
        if (!winningEntry) return message.channel.send(`Error: could not find opponent.`)

        const success = await processMatchResult(message, winningEntry.player, noShowPlayer, tournament, true)
        if (!success) return

        return message.channel.send(`${noShowPlayer.name}, your Goat Format Tournament loss to <@${winningEntry.playerId}> has been recorded as a no-show.`)
    }

    //H2H
    if (h2hcom.includes(cmd)) {
        const usersMap = message.mentions.users
        const userIds = [...usersMap.keys()]
        const player1Id = message.mentions.users.first() ? message.mentions.users.first().id : null	
        const player2Id = userIds.length > 1 ? userIds[1] : maid	

        if (!player1Id) return message.channel.send("Please specify at least 1 other player.")
        if (player1Id === player2Id) return message.channel.send(`Please specify 2 different players.`)

        const player1 = await Player.findOne({ where: { id: player1Id } })
        const player2 = await Player.findOne({ where: { id: player2Id } })
        
        if (!player1 && player2Id === maid) return message.channel.send(`That user is not in the database.`)
        if (!player1 && player2Id !== maid) return message.channel.send(`The first user is not in the database.`)
        if (!player2 && player2Id === maid) return message.channel.send(`You are not in the database.`)
        if (!player2 && player2Id !== maid) return message.channel.send(`The second user is not in the database.`)

        const p1Wins = await Match.count({ where: { winnerId: player1Id, loserId: player2Id, format: format } })
        const p2Wins = await Match.count({ where: { winnerId: player2Id, loserId: player1Id, format: format } })
        
        return message.channel.send(
            `${formatEmoji} --- H2H ${formatName} Results --- ${formatEmoji}`+
            `\n${player1.name} has won ${p1Wins}x`+
            `\n${player2.name} has won ${p2Wins}x`
        )
    }

    //UNDO
    if (undocom.includes(cmd)) {
        const allMatches = await Match.findAll({ where: { format: format }})
        const lastMatch = allMatches.slice(-1)[0]
        const winnerId = lastMatch.winnerId
        const loserId = lastMatch.loserId
        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const winnerBackups = await Backups.findOne({ where: { playerId: winnerId } })
        const loserBackups = await Backups.findOne({ where: { playerId: loserId } })
        
        const prompt = (isMod(message.member) ? '' : ' Please get a Moderator to help you.')
        if (maid !== loserId && !isMod(message.member)) return message.channel.send(`You did not participate in the last recorded match.${prompt}`)

        if (!winnerBackups[format] && maid !== loserId) return message.channel.send(`${winningPlayer.name} has no backup stats.${prompt}`)
        if (!winnerBackups[format] && maid === loserId) return message.channel.send(`Your last opponent, ${winningPlayer.name}, has no backup stats.${prompt}`)
        if (!loserBackups[format] && maid !== loserId) return message.channel.send(`${losingPlayer.name} has no backup stats.${prompt}`)
        if (!loserBackups[format] && maid === loserId) return message.channel.send(`You have no backup stats.${prompt}`)

        const winnerStats = await Stats.findOne({ where: { playerId: winnerId } })
        const winnerWins = await Wins.findOne({ where: { playerId: winnerId } })
        const loserLosses = await Losses.findOne({ where: { playerId: loserId } })
        const loserStats = await Stats.findOne({ where: { playerId: loserId } })

        winnerStats[format] = winnerBackups[format]
        await winnerStats.save()
        winnerBackups[format] = null
        await winnerBackups.save()
        winnerWins[format]--
        await winnerWins.save()

        loserStats[format] = loserBackups[format]
        await loserStats.save()
        loserBackups[format] = null
        await loserBackups.save()
        loserLosses[format]--
        await loserLosses.save()

        await lastMatch.destroy()
        return message.channel.send(`The last ${formatName} match in which ${winningPlayer.name} defeated ${losingPlayer.name} has been erased. ${formatEmoji}`)
    }

    //COMBINE
    // Use this command to combine two Discord accounts into one.
    // Arguments required: @Old_User, @New_User
    // The old user's records will be overrite with the new user's. 
    // In the record of matches, the old user id will be replaced by the new user id.
    // After this is done, there is no way to tell which matches were played on the old account.
    // So be careful with this command. Make sure the accounts are definitely shared.
    // When this command is finished, use the **!recalc** command to update everyone's stats.
    if (cmd.toLowerCase() === `!combine`) { 
        if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
        const oldId = marr[1].replace(/[\\<>@#&!]/g, "")
        const newId = marr[2].replace(/[\\<>@#&!]/g, "")
        const oldPlayer = await Player.findOne({ where: { id: oldId } })
        const newPlayer = await Player.findOne({ where: { id: newId } })

        if (!oldId || !newId) return message.channel.send("Please specify 2 players.")
        if (oldId === newId) return message.channel.send("Please specify 2 different players.")
        if (!oldPlayer) return message.channel.send(`<@${oldId}> is not in the database.`)
        if (!newPlayer) return message.channel.send(`<@${newId}> is not in the database.`)

        const filter = m => m.author.id === message.author.id
        const msg = await message.channel.send(`Are you sure you want to combine ${oldPlayer.name}'s stats with ${newPlayer.name}'s stats?\n\n⚠️ **WARNING** ⚠️\nThis cannot be undone. ${oldPlayer.name}'s stats will be forever lost.`)
        const collected = await msg.channel.awaitMessages(filter, {
            max: 1,
            time: 15000
        }).then(async collected => {
            if (yescom.includes(collected.first().content.toLowerCase())) {
                const matches = await Match.findAll({
                    where: {
                        [Op.or]: [
                            { winnerId: oldId },
                            { loserId: oldId }
                          ]
                    }
                })
        
                let violations = 0
                let count = 0
                let formats = []

                for (let i = 0; i < matches.length; i++) {
                    const match = matches[i]
                    const format = match.format
                    if (!formats.includes(format)) formats.push(format)
                    
                    if (
                        (match.winnerId === oldId && match.loserId === newId) || 
                        (match.loserId === oldId && match.winnerId === newId)
                    ) {
                        violations++
                        await match.destroy()
                    } else if (match.winnerId === oldId) {     
                        await match.update({
                            winnerId: newPlayer.id,
                            winner_name: newPlayer.name
                        })
                        count++
                    } else if (match.loserId === oldId) {
                        await match.update({
                            loserId: newPlayer.id,
                            loser_name: newPlayer.name
                        })
                        count++
                    }
                }

                return message.channel.send(
                    `${oldPlayer.name}'s ID was replaced with ${newPlayer.name}'s ID in ${count} match records.` +
                    ` ${violations} boosting violation(s) occurred.` +
                    `\n\nStats in the following formats need to be recalculated:\n${formats.join("\n")}`
                )  
            } else {
                return message.channel.send(`Ok then. ${oldPlayer.name}'s stats were not combined with ${newPlayer.name}'s stats.`)
            }
        }).catch(err => {
            console.log(err)
            return message.channel.send(`Sorry, time's up.`)
        })
    }

    //CENSUS
    // Use this command to update every player's username and tag to match their Discord account.
    // It also creates new players if they are not in the database (i.e. they joined while bot was down).
    if (cmd === `!census`) { 
        if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
        const members_map = await message.guild.members.fetch()
        const members = [...members_map.values()]
        let updateCount = 0
        let createCount = 0

        for (let i = 0; i < members.length; i++) {
            const member = members[i]
            const player = await Player.findOne({ where: { id: member.user.id } })
            if (player && ( player.name !== member.user.username || player.tag !== member.user.tag )) {
                updateCount++
                await player.update({
                    name: member.user.username,
                    tag: member.user.tag
                })
            } else if (!player && !member.user.bot) {
                createCount++
                await createPlayer(member)
            }
        }

        return message.channel.send(`You added ${createCount} player(s) to the database and updated ${updateCount} other(s).`)
    }

    //RECALCULATE
    // Use this command to recalculate every player's Elo from scratch.
    // This is needed after matches are directly added or deleted using postgreSQL.
    // It's also required after using the !combine command, but the bot will remind you to do it.
    if (recalccom.includes(cmd)) { 
        if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
        const stats = await Stats.findAll()
        const backups = await Backups.findAll()
        const wins = await Wins.findAll()
        const losses = await Losses.findAll()

        for (let i = 0; i < stats.length; i++) {
            const s = stats[i]
            s[format] = null
            await s.save()
        }

        for (let i = 0; i < backups.length; i++) {
            const b = backups[i]
            b[format] = null
            await b.save()
        }

        for (let i = 0; i < wins.length; i++) {
            const w = wins[i]
            w[format] = 0
            await w.save()
        }

        for (let i = 0; i < losses.length; i++) {
            const l = losses[i]
            l[format] = 0
            await l.save()
        }
        
        const allMatches = await Match.findAll({ where: { format: format }, order: [["createdAt", "ASC"]]})
        message.channel.send(`Recalculating data for ${allMatches.length} matches. Please wait...`)
        for (let i = 0; i < allMatches.length; i++) {
            const match = allMatches[i]
            const winnerId = match.winnerId
            const loserId = match.loserId
            const winningPlayer = await Player.findOne({ where: { id: winnerId }})
            const winnerBackups = await Backups.findOne({ where: { playerId: winnerId } })
            const winnerStats = await Stats.findOne({ where: { playerId: winnerId } })
            const winnerWins = await Wins.findOne({ where: { playerId: winnerId } })
            const losingPlayer = await Player.findOne({ where: { id: loserId }})
            const loserBackups = await Backups.findOne({ where: { playerId: loserId } })
            const loserLosses = await Losses.findOne({ where: { playerId: loserId } })
            const loserStats = await Stats.findOne({ where: { playerId: loserId } })
            
            const origStatsWinner = winnerStats[format] || 500.00
            const origStatsLoser = loserStats[format] || 500.00
            const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origStatsWinner - origStatsLoser) / 400))))))
            
            winnerStats[format] ? winnerStats[format] += delta : winnerStats[format] = 500.00 + delta
            await winnerStats.save()
            winnerBackups[format] = origStatsWinner
            await winnerBackups.save()
            winnerWins[format]++
            await winnerWins.save()

            loserStats[format] ? loserStats[format] -= delta : loserStats[format] = 500.00 - delta
            await loserStats.save()
            loserBackups[format] = origStatsLoser
            await loserBackups.save()
            loserLosses[format]++
            await loserLosses.save()

            match.delta = delta
            await match.save()
            console.log(`${format} Match ${i+1}: ${winningPlayer.name} > ${losingPlayer.name}`)
        }

        return message.channel.send(`Recalculation complete!`)
    }

    //INITIATE
    // These are the steps required to add a new format to the rankings database:
    // 1. Create a channel, a role, and an emoji for the format on Discord. 
    // 2. Create a new format element in static/formats.json and give it the IDs of the above variables.
    // 3. Create a new model file for the format in db/models.
    // 4. Define the relationships for the model in db/index.js.
    // 5. Export and import the model in all files where format models are required: bot.js, functions/tournament.js, and functions/utility.js.
    // 6. Use this command in the format channel to add the datatable for the new format to the postgreSQL database. 
    if (cmd.toLowerCase() === `!initiate` || cmd.toLowerCase() === `!init`) { 
        if (!isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")
        if (!formatName) return message.channel.send(`Sorry, this command is only valid in specific format channels, like <#414575168174948372> or <#629464112749084673>.`)
        const allFormatLibraryPlayers = await YugiKaiba.findAll()

        allFormatLibraryPlayers.forEach(async function (player) {
            console.log('playerId', player.playerId)
            await eval(formatDatabase).create({ playerId: player.playerId })
        })

        return message.channel.send(`The ${formatName} database is ready to go! ${formatEmoji}`)
    }


})