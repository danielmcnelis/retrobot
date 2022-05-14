
// RETROBOT - A RANKINGS & TOURNAMENT MANAGEMENT DISCORD BOT FOR FORMATLIBRARY.COM, GOATFORMAT.COM, & EDISONFORMAT.COM

// MODULE IMPORTS
const axios = require('axios')
const Discord = require('discord.js')
const fs = require('fs')
const FuzzySet = require('fuzzyset')
const QuickChart = require('quickchart-js')
const { Op } = require('sequelize')
 
// DATABASE IMPORTS
const { Card, Entry, Format, Info, Iron, Match, Matchup, Membership, Player, RatedDeck, RatedPool, Role, Server, Stats, Status, Tournament } = require('./db/index.js')

// FUNCTION IMPORTS
const { conductCensus, downloadNewCards, getMidnightCountdown, updateAvatars, updateSets, purgeEntries } = require('./functions/chron.js')
const { createDecks, composeBlogPost, composeThumbnails, selectCoverage } = require('./functions/coverage.js')
const { checkDeckList, getDeckFormat, getIssues } = require( './functions/deck.js')
const { checkExpiryDate, uploadDeckFolder } = require('./functions/drive.js')
const { confirmIron, postStory, resetIron } = require('./functions/iron.js')
const { getDropFormats, getNewRatedDeck, getPreviousRatedDeck, getRatedFormat, getPotentialPairConfirmation } = require('./functions/rated.js')
const { addSheet, connectToSheets, makeSheet, writeToSheet } = require('./functions/sheets.js')
const { askForDBName, checkPairing, findNoShowOpponent, createSheetData, getDeckList, getTournamentChannel, getTournamentFormat, getTournamentType, getMatches, processMatchResult, postParticipant, removeParticipant, seed, selectTournament } = require('./functions/tournament.js')
const { assignRoles, capitalize, createMembership, createPlayer, fetchCardNames, getMedal, generateRandomString, hasAffiliateAccess, hasPartnerAccess, hasFullAccess, isAdmin, isIronPlayer, isMod, isNewMember, isNewUser, isProgrammer, isTourPlayer, search, trackStats, drawDeck } = require('./functions/utility.js')

// STATIC IMPORTS
const channels = require('./static/channels.json')
const { client } = require('./static/clients.js')
const commands = require('./static/commands.json')
const emojis = require('./static/emojis.json')
const roles = require('./static/roles.json')
const { challongeAPIKeys } = require('./secrets.json')

// GLOBAL VARIABLES
const fuzzyCards = FuzzySet([], false)

// READY
client.on('ready', async() => {
    console.log('RetroBot is online!')
    try {
        const names = await fetchCardNames()
        names.forEach((card) => fuzzyCards.add(card))
    } catch (err) {
        console.log(err)
    }

    const midnightCountdown = getMidnightCountdown()
	setTimeout(() => purgeEntries(), midnightCountdown)
	setTimeout(() => conductCensus(client), midnightCountdown + (1 * 60 * 1000))
	setTimeout(() => updateAvatars(client), midnightCountdown + (6 * 60 * 1000))
    setTimeout(() => downloadNewCards(), midnightCountdown + (11 * 60 * 1000))
    setTimeout(() => updateSets(), midnightCountdown + (16 * 60 * 1000))
})

// WELCOME
client.on('guildMemberAdd', async (member) => {    
    try {
        const guild = member.guild
        const server = await Server.findOne({ where: { id: guild.id }})
        if (!server || !hasPartnerAccess(server)) return
        const format = await Format.findOne({ where: { name: {[Op.iLike]: server.format }}})
        const channel = guild.channels.cache.get(channels[guild.name].welcomeChannel)
        if (await isNewUser(server, member.user.id)) await createPlayer(member) 
        if (await isNewMember(server, guild.id, member.user.id)) {
            await createMembership(guild, member)
            return channel.send({ content: `${member}, Welcome to the ${guild.name} ${emojis[guild.name]} Discord server. ${server.formatEmoji ? server.formatEmoji : format ? format.emoji : emojis.legend}`})
        } else {
            await assignRoles(guild, member)
            return channel.send({ content: `${member}, Welcome back to the ${guild.name} ${emojis[guild.name]} Discord server! We missed you. ${emojis.soldier}`})
        }
    } catch (err) {
        console.log(err)
    }
})
    
// GOODBYE
client.on('guildMemberRemove', async (member) => {
    try {
        const guild = member.guild
        const server = await Server.findOne({ where: { id: guild.id }})
        if (!server || !hasPartnerAccess(server)) return
        const channel = guild.channels.cache.get(channels[guild.name].welcomeChannel)
        channel.send({ content: `Oh dear. ${member.user.username} has left the server. ${emojis.sad}`})
        const membership = await Membership.findOne({ where: { playerId: member.user.id, serverId: guild.id }})
        membership.active = false
        await membership.save()
    } catch (err) {
        console.log(err)
    }
})
 
// COMMANDS
client.on('messageCreate', async (message) => {
try {
    if (
		//no commands in DMs except !rated
		(!message.guild && !message.content.startsWith("!exit") && !message.content.startsWith("!leave") && !message.content.startsWith("!out") && !message.content.startsWith("!ranked") && !message.content.startsWith("!rated")) || 
		//no commands from bots
		message.author.bot ||
		//do not allow users to parrot @everyone or @here with the bot
		message.content.includes('@everyone') || message.content.includes('@here') ||
		//only allow commands starting with ! or including {}
		(!message.content.startsWith("!") && !message.content.includes("{"))
	) return

    const marr = message.content.split(" ")
	for(let i = 0; i < marr.length; i++) {
		if (marr[i] === '') { 
			marr.splice(i, 1)
			i--
		}
	}
    
    const cmd = marr[0] ? marr[0].toLowerCase() : ''
    const args = marr[1] ? marr.slice(1) : ''
    const maid = message.author.id
    const mcid = message.channel.id
    const mgid = message.guild ? message.guild.id : null
    
    const server = (!mgid || mgid === '110373943822540800' || mgid === '333949691962195969') ? {} : await Server.findOne({ where: { id: mgid }}) || await Server.create({ id: mgid, name: message.guild.name })
    if (hasAffiliateAccess(server) && await isNewUser(server, maid)) await createPlayer(message.member)
    if (hasAffiliateAccess(server) && await isNewMember(server, mgid, maid)) await createMembership(message.guild, message.member)

    // CARD SEARCH USING CURLY BRACKETS
    if (!message.content.startsWith("!") && message.content.includes(`{`) && message.content.includes(`}`)) { 
        const query = message.content.slice(message.content.indexOf('{') + 1, message.content.indexOf('}'))
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })

        const { cardEmbed, attachment } = await search(query, fuzzyCards, format)
        if (!cardEmbed) return message.channel.send({ content: `Could not find card: "${query}".`})
        if (attachment) {
            return message.channel.send({ embeds: [cardEmbed], files: [attachment] })
        } else {
            return message.channel.send({ embeds: [cardEmbed] })
        }
    }

    // PING 
    if (cmd === `!ping`) return message.channel.send({ content: '🏓'})

    // SEED 
    if (cmd === `!seed`) return message.channel.send({ content: '🌱'})

    // TEST 
    if (cmd === `!test`) {
        if (isProgrammer(message.member)) {
            setTimeout(() => updateSets())
            return message.channel.send({ content: `${emojis.yellow}`})
        } else {
            return message.channel.send({ content: `🧪`})
        }
    }
 
    // FIX
    if (cmd === `!fix`) {
        if (isProgrammer(message.member)) {
            const tournaments = await Tournament.findAll({
                where: {
                    guildId: mgid,
                    updatedAt: { [Op.gte]: "2021-12-06 03:20:04.198+00" },
                },
                order: [["createdAt", "ASC"]],
            })

            const tournament = await selectTournament(message, tournaments, maid)
            if (!tournament) return message.channel.send({ content: `There are no tournaments.` })
            const { name } = tournament

            try {
                const token = await checkExpiryDate()
                await uploadDeckFolder(name, token)
                return message.channel.send({ content: `Your tournament files have been uploaded! ${FL}` })
            } catch (err) {
                console.log(err)
                const programmer = message.guild.members.cache.get('194147938786738176')
                programmer.send({ content: `Error uploading data for ${name} on Google Drive.` })
                return message.channel.send({ content: `Error. Check programmer's DMs.` })
            }
        } else {
            return message.channel.send({ content: `🛠️` })
        }
    }

    // AVATAR
    if (commands.pfpcom.includes(cmd)) {
        const user = message.mentions.users.first() || message.author
        return message.channel.send({ content: user.displayAvatarURL() })
    }

    // RNG
    if(cmd === `!rng`) {
        const num = parseInt(args[0])
        if(isNaN(num) || num < 1) return message.channel.send({ content: `Please specify an upper limit.`})
        const result = Math.floor((Math.random() * num) + 1)
        return message.channel.send({ content: `You rolled a **${result}** with a ${num}-sided die.`})
    }

    // DICE
    if(cmd === `!dice`) {
        const result = Math.floor((Math.random() * 6) + 1)
        return message.channel.send({ content: `You rolled a **${result}** with a 6-sided die.`})
    }

    // FLIP
    if(cmd === `!flip`) {
        const coin = Math.floor((Math.random() * 2)) === 0 ? 'Heads' : 'Tails'
        return message.channel.send({ content: `Your coin flip landed on: **${coin}**!`})
    }

    // DUELINGBOOK NAME
    if (commands.dbcom.includes(cmd)) {
        const query = marr.length > 1 ? marr.slice(1, marr.length).join(' ') : null
        const member = message.mentions.members.first() || null
        const id = member ? member.user.id : null
        const players = [...await Player.findAll({ 
            where: { 
                [Op.or]: {
                    id: id,
                    name: { [Op.iLike]: query }
                }
            },
            order: [['updatedAt', 'DESC']]
        })]

        const queriedPlayer = players[0]

        const queryIsAuthor = queriedPlayer && queriedPlayer.id === maid
        if (!queryIsAuthor && queriedPlayer && queriedPlayer.duelingBook) return message.channel.send({ content: `${queriedPlayer.name}'s DuelingBook username is: ${queriedPlayer.duelingBook}.`})
        if (!queryIsAuthor && queriedPlayer && !queriedPlayer.duelingBook) return message.channel.send({ content: `${queriedPlayer.name} does not have a DuelingBook username in our database.`})

        const player = queryIsAuthor ? queriedPlayer : await Player.findOne({ where: { id: maid } })

        if (query) {
            player.duelingBook = query
            await player.save()
            return message.channel.send({ content: `Your DuelingBook username has been set to: ${player.duelingBook}.`})
        } else if (player && player.duelingBook) {
            return message.channel.send({ content: `Your DuelingBook username is: ${player.duelingBook}.`})
        } else {
            return message.channel.send({ content: `You do not have a DuelingBook username in our database. You can type **!db** followed by your username to save it.`})
        }
    }
        
    // CREATE 
    if (cmd === `!create`) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
        if (!args.length) return message.channel.send({ content: `Please provide a name for the new tournament.`})
        const format = await getTournamentFormat(server, message)
        if (!format) return message.channel.send({ content: `Please specify a valid format.`})
        const tournament_type = await getTournamentType(message)
        if (!tournament_type) return message.channel.send({ content: `Please select a valid tournament type.`})
        const channelId = await getTournamentChannel(server, format, message)
        if (!message.guild.channels.cache.get(channelId)) return message.channel.send({ content: `Please specify a valid tournament channel.`})

        const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')
        const name = args[0].replace(/[^\ws]/gi, "_").replace(/ /g,'')
        const emoji = name.includes('FLC') ? emojis.FL :
            name.includes('RBET') ? emojis.subs :
            name.includes('YRS') ? emojis.mlady :
            name.includes('DLC') ? emojis.lmfao :
            name.includes('DDS') ? emojis.stoned :
            name.includes('ETC') ? emojis.lipton :
            name.includes('ACS') ? emojis.toad :
            name.includes('KGP') ? emojis.UredU :
            emojis[server.name] || emojis.legend

        try {
            const { status, data } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments.json?api_key=${challongeAPIKeys[server.name]}`,
                data: {
                    tournament: {
                        name: name,
                        url: name,
                        tournament_type: tournament_type,
                        gameName: 'Yu-Gi-Oh!'
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
                    format: format.name,
                    emoji: emoji,
                    formatEmoji: format.emoji,
                    url: data.tournament.url,
                    channelId: channelId,
                    guildId: mgid,
                    community: server.name
                })
            
                fs.mkdir(`./decks/${server.name}/${name}`, (err) => {
                    if (err) {
                        return console.error(err)
                    }
                    console.log(`made new directory: ./decks/${server.name}/${name}`)
                })

                return message.channel.send({ content: 
                    `You created a new tournament:` + 
                    `\nName: ${data.tournament.name} ${emoji}` + 
                    `\nFormat: ${format.name} ${format.emoji}` + 
                    `\nType: ${capitalize(data.tournament.tournament_type, true)}` +
                    `\nBracket: https://challonge.com/${data.tournament.url}`
                })
            } 
        } catch (err) {
            console.log(err)
            try {
                const { status, data } = await axios({
                    method: 'post',
                    url: `https://api.challonge.com/v1/tournaments.json?api_key=${challongeAPIKeys[server.name]}`,
                    data: {
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
                        format: format.name,
                        emoji: emoji,
                        formatEmoji: format.emoji,
                        url: data.tournament.url,
                        channelId: channelId,
                        guildId: mgid,
                        community: server.name
                    })
                    
                    fs.mkdir(`./decks/${server.name}/${name}`, (err) => {
                        if (err) {
                            return console.error(err)
                        }
                        console.log(`made new directory: ./decks/${server.name}/${name}`)
                    })
                    
                    return message.channel.send({ content: 
                        `You created a new tournament:` + 
                        `\nName: ${data.tournament.name} ${emoji}` + 
                        `\nFormat: ${format.name} ${format.emoji}` + 
                        `\nType: ${capitalize(data.tournament.tournament_type, true)}` +
                        `\nBracket: https://challonge.com/${data.tournament.url}`
                    })
                } 
            } catch (err) {
                console.log(err)
                return message.channel.send({ content: `Unable to connect to Challonge account.`})
            }
        }
    }

    // DESTROY
    if (cmd === `!destroy`) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isAdmin(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        if (!args.length) return message.channel.send({ content: `Please specify the name of the tournament you wish to destroy.`})

        const name = args[0]
        const tournament = await Tournament.findOne({ where: { name: { [Op.iLike]: name } }, guildId: mgid })
        if (!tournament) return message.channel.send({ content: `Could not find tournament: "${name}".`})
        if (tournament.state === 'underway') return message.channel.send({ content: `This tournament is underway, therefore it may only be deleted by the database manager.`})
        if (tournament.state === 'complete') return message.channel.send({ content: `This tournament is complete, therefore it may only be deleted by the database manager.`})

        try {
            const { status } = await axios({
                method: 'delete',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${challongeAPIKeys[server.name]}`
            })
        
            if (status && status === 200) {
                const entries = await Entry.findAll({ where: { tournamentId: tournament.id }})
                for (let i = 0; i < entries.length; i++) {
                    try {
                        const entry = entries[i]
                        const playerId = entry.playerId	
                        await entry.destroy()
                        const member = await message.guild.members.fetch(playerId)
                        if (!member) continue
                        member.roles.remove(roles[server.name].tourRole)
                    } catch (err) {
                        console.log(err)
                    }
                }
        
                const content = `Yikes! You deleted ${tournament.name} ${tournament.emoji} from your Challonge account.`
                await tournament.destroy()
                return message.channel.send({ content })
            } else {
                return message.channel.send({ content: `Unable to delete tournament from Challonge account.`})
            }
        } catch (err) {
            return message.channel.send({ content: `Error: Unable to delete tournament from Challonge account.`})
        }
    }

    // START
    if (commands.startcom.includes(cmd)) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: {
                    [Op.or]: ['pending', 'standby']
                },
                guildId: mgid
            }, 
            order: [['createdAt', 'ASC']] 
        })

		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send({ content: `There are no pending tournaments.`})
        const { name, id, url } = tournament
		const unregCount = await Entry.count({ where: { participantId: null, tournamentId: id } })
        if (unregCount) return message.channel.send({ content: 'One of more players has not been signed up. Please check the database.'})
		const entryCount = await Entry.count({ where: { tournamentId: id } })
		if (!entryCount) return message.channel.send({ content: `Error: missing entrants.`})
		const { sheet1Data, sheet2Data } = await createSheetData(tournament)
		const success = await seed(server, message, tournament)
		if (!success) return message.channel.send({ content: `Error seeding tournament. Please try again or start it manually.`})

		const { status } = await axios({
			method: 'post',
			url: `https://api.challonge.com/v1/tournaments/${tournament.id}/start.json?api_key=${challongeAPIKeys[server.name]}`
		})

		if (status && status === 200) { 
			tournament.state = 'underway'
			await tournament.save()
            await checkExpiryDate()
            const { sheets, oAuth2Client } = await connectToSheets()
			const spreadsheetId = await makeSheet(sheets, `${name} Deck Lists`, sheet1Data)
			await addSheet(sheets, oAuth2Client, spreadsheetId, 'Summary')
			await writeToSheet(sheets, spreadsheetId, 'Summary', 'RAW', sheet2Data)
            await uploadDeckFolder(server, name)
			return message.channel.send({ content: `Let's go! Your tournament is starting now: https://challonge.com/${url} ${tournament.emoji}`})
		} else {
			return message.channel.send({ content: `Error connecting to Challonge account.`})
		}
    }

    // TIMER
    if (cmd === `!timer`) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        const minutes = parseInt(args[0])
        if (!args[0] || isNaN(minutes)) return message.channel.send(`Please specify the number of minutes to set the timer.`)
        message.channel.send(`<@&${roles[server.name].tourRole}> The next round begins now! You have ${minutes} minutes to complete your match.`)
        
        return setTimeout(() => {
            return message.channel.send(`<@&${roles[server.name].tourRole}> Time is up in the round!`)
        }, minutes * 60 * 1000)
    }

    // END
    if (cmd === `!end`) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        if (!args.length) return message.channel.send({ content: `Please specify the name of the tournament you wish to end.`})
        const name = args[0]
        const tournament = await Tournament.findOne({ where: { name: { [Op.iLike]: name }}, guildId: mgid })
        if (!tournament) return message.channel.send({ content: `Could not find tournament: "${name}".`})
        if (tournament.state === 'pending' || tournament.state === 'standby') return message.channel.send({ content: `This tournament has not begun.`})
        if (tournament.state === 'complete') return message.channel.send({ content: `This tournament has already ended.`})

        try {
            const { status } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/finalize.json?api_key=${challongeAPIKeys[server.name]}`
            })
    
            if (status && status === 200) {
                const entries = await Entry.findAll({ where: { tournamentId: tournament.id }})
                for (let i = 0; i < entries.length; i++) {
                    try {
                        const entry = entries[i]
                        const playerId = entry.playerId	
                        await entry.destroy()
                        const member = await message.guild.members.fetch(playerId)
                        if (!member) continue
                        member.roles.remove(roles[server.name].tourRole)
                    } catch (err) {
                        console.log(err)
                    }
                }
    
                await tournament.update({
                    state: 'complete'
                })
                
                return message.channel.send({ content: `Congrats! The results of ${tournament.name} ${tournament.emoji} have been finalized.`})
            } else {
                return message.channel.send({ content: `Unable to finalize ${tournament.name} ${tournament.emoji} on Challonge.com.`})
            }
        } catch (err) {
            console.log(err)
            return message.channel.send({ content: `Unable to finalize ${tournament.name} ${tournament.emoji} on Challonge.com.`})
        }
    }

    // BRACKET
    if (commands.bracketcom.includes(cmd)) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const tournaments = await Tournament.findAll({ where: { state: { [Op.not]: 'complete'}, guildId: mgid }, order: [['createdAt', 'ASC']]})
        if (!tournaments.length) return message.channel.send({ content: `There are no active tournaments.`})
        
        const results = []
        for (let i = 0; i < tournaments.length; i++) {
            const tournament = tournaments[i]
            results.push(`Name: ${tournament.name} ${tournament.emoji}` +
                `\nType: ${capitalize(tournament.type, true)}` +
                `\nFormat: ${tournament.format} ${tournament.formatEmoji}` + 
                `\nBracket: <https://challonge.com/${tournament.url}>`
            )
        }

        return message.channel.send({ content: results.join('\n\n').toString() })
    }
    
    // OPEN
    if (cmd === '!open') {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: 'standby',
                guildId: mgid
            }, 
            order: [['createdAt', 'ASC']] 
        })
        
		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send({ content: `There are no closed tournaments.`})
        tournament.state = 'pending'
        await tournament.save()
        return message.channel.send({ content: `Registration for ${tournament.name} ${tournament.emoji} is now open.`})
    }

    // CLOSE
    if (cmd === '!close') {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        const tournaments = await Tournament.findAll({ 
            where: { 
                state: 'pending',
                guildId: mgid
            }, 
            order: [['createdAt', 'ASC']] 
        })

		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send({ content: `There are no pending tournaments.`})
        tournament.state = 'standby'
        await tournament.save()
        return message.channel.send({ content: `Registration for ${tournament.name} ${tournament.emoji} is now closed.`})
    }

    // JOIN
    if(commands.joincom.includes(cmd)) {        
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const mention = message.mentions.members.first()
        if (isMod(server, message.member) && mention) return message.channel.send({ content: `Please type **!signup @user** to register someone else for the tournament.`})
        const player = await Player.findOne({ where: { id: maid }})
        if (!player) return message.channel.send({ content: `You are not in the database.`})
        const tournaments = await Tournament.findAll({ where: { state: {[Op.or]: ['pending', 'standby']}, guildId: mgid }, order: [['createdAt', 'ASC']] })
        const tournament = await selectTournament(message, tournaments, maid)
        const count = await Tournament.count({ where: { state: 'underway', guildId: mgid } })
        if (!tournament && count) return message.channel.send({ content: `Sorry, the tournament already started.`})
        if (!tournament && !count) return message.channel.send({ content: `There is no pending tournament.`})
        const entry = await Entry.findOne({ where: { playerId: maid, tournamentId: tournament.id } })
        if (tournament.state === 'standby' && !entry) return message.channel.send({ content: `Sorry, registration for ${tournament.name} ${tournament.emoji} is currently closed.`})
        const format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.format } }})
        if (!format) return message.channel.send(`Unable to determine what format is being played in ${tournament.name}. Please contact the database manager.`)
        message.channel.send({ content: `Please check your DMs.` })
        
        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(message.member, player)
        if (!dbName) return
        const deckListUrl = await getDeckList(server, message.member, player, format, tournament.name)
        if (!deckListUrl) return

        if (!entry) {  
            try {                                
                const { participant } = await postParticipant(server, tournament, player)
                if (!participant) return message.channel.send({ content: `Error: Unable to register on Challonge for ${tournament.name} ${tournament.emoji}.`})
                
                await Entry.create({
                    pilot: player.name,
                    url: deckListUrl,
                    participantId: participant.id,
                    playerId: player.id,
                    tournamentId: tournament.id
                })
            } catch (err) {
                console.log(err)
                return message.author.send({ content: `Error: Could not access database.`})
            } finally {
                message.member.roles.add(roles[server.name].tourRole).catch((err) => console.log(err))
                message.author.send({ content: `Thanks! I have all the information we need from you. Good luck in the tournament!`}).catch((err) => console.log(err))
                return client.channels.cache.get(tournament.channelId).send({ content: `<@${player.id}> is now registered for ${tournament.name} ${tournament.emoji}!`}).catch((err) => console.log(err))
            }
        } else {
            try {
                await entry.update({ url: deckListUrl })
            } catch (err) {
                console.log(err)
                return message.author.send({ content: `Error: Could not access database.`}).catch((err) => console.log(err))
            } finally {
                message.author.send({ content: `Thanks! I have your updated deck list for the tournament.`}).catch((err) => console.log(err))
                return client.channels.cache.get(tournament.channelId).send({ content: `<@${player.id}> resubmitted their deck list for ${tournament.name} ${tournament.emoji}!`}).catch((err) => console.log(err))
            }
        }
    }

    // SIGN UP
    if (commands.signupcom.includes(cmd)) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that. Please type **!join** instead.'})   
        const mentioned = message.mentions.members.first()
        if (!mentioned) return message.channel.send({ content: `Could not find user in the server.`})
        const player = await Player.findOne({ where: { id: mentioned.user.id }})
        if (!player) return message.channel.send({ content: `${mentioned.user.username} is not in the database.`})
        const tournaments = await Tournament.findAll({ where: { state: {[Op.or]: ['pending', 'standby']}, guildId: mgid }, order: [['createdAt', 'ASC']] })
        const tournament = await selectTournament(message, tournaments, maid)
        const count = await Tournament.count({ where: { state: 'underway', guildId: mgid } })
        if (!tournament && count) return message.channel.send({ content: `Sorry, the tournament already started.`})
        if (!tournament && !count) return message.channel.send({ content: `There is no active tournament.`})
        const entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id } })
        const format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.format } }})
        if (!format) return message.channel.send(`Unable to determine what format is being played in ${tournament.name}. Please contact the database manager.`)
        
        if (entry) {
            message.channel.send({ content: `Please check your DMs.\n\n(FYI: ${player.name} is already registered for ${tournament.name} ${tournament.emoji})`})
        } else {
            message.channel.send({ content: `Please check your DMs.`})
        }

        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(message.member, player, true)
        if (!dbName) return
        const deckListUrl = await getDeckList(server, message.member, player, format, tournament.name, true)
        if (!deckListUrl) return         

        if (!entry) {       
            try {                   
                const { participant } = await postParticipant(server, tournament, player)
                if (!participant) return message.author.send({ content: `Error: Could not access tournament: ${tournament.name}`}).catch((err) => console.log(err))
                
                await Entry.create({
                    pilot: player.name,
                    url: deckListUrl,
                    participantId: participant.id,
                    playerId: player.id,
                    tournamentId: tournament.id
                })
            } catch (err) {
                console.log(err)
                return message.author.send({ content: `Error: Could not access database.`}).catch((err) => console.log(err))
            } 

            mentioned.roles.add(roles[server.name].tourRole).catch((err) => console.log(err))
            message.author.send({ content: `Thanks! I have all the information we need for ${player.name}!`}).catch((err) => console.log(err))
            return client.channels.cache.get(tournament.channelId).send({ content: `<@${player.id}> is now registered for ${tournament.name} ${tournament.emoji}!`}).catch((err) => console.log(err))
        } else {
            try {
                await entry.update({ url: deckListUrl })
            } catch (err) {
                console.log(err)
                return message.author.send({ content: `Error: Could not access database.`}).catch((err) => console.log(err))
            } finally {
                message.author.send({ content: `Thanks! I have ${player.name}'s updated deck list for the tournament.`}).catch((err) => console.log(err))
                return client.channels.cache.get(tournament.channelId).send({ content: `A moderator resubmitted <@${player.id}>'s deck list for ${tournament.name} ${tournament.emoji}!`})
            }
        }
    }

    // DROP
    if(commands.dropcom.includes(cmd)) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        const tournaments = [...await Entry.findAll({ where: { playerId: maid }, include: Tournament })].map((e) => e.tournament).filter((t) => t.guildId === message.guild.id)
        if (!tournaments.length) return message.channel.send({ content: `You are not in an active tournament.`})
        const tournament = await selectTournament(message, tournaments, maid)
        let success = (tournament.state === 'pending' || tournament.state === 'standby')
        if (!success) {
            const matches = await Match.findAll({ 
                where: { 
                    tournament: true 
                }, 
                limit: 5,
                order: [["createdAt", "DESC"]] 
            })

            matches.forEach((match) => {
                if (match.winnerId === maid || match.loserId === maid) success = true 
            })

            if (!success) return message.channel.send({ content: `If you played a match, please report the result before dropping. Otherwise ask a Moderator to remove you.`})
        }

        const entry = await Entry.findOne({ where: { playerId: maid } })
        if (!entry) return message.channel.send({ content: `You are not in an active tournament.`})
        return removeParticipant(server, message, message.member, entry, tournament, true)
    }

    // REMOVE
    if (cmd === `!remove`) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        const member = message.mentions.members.first()
        const playerId = member && member.user ? member.user.id : null
        if (!playerId) return message.channel.send({ content: `Please specify the player you wish to remove.`})
        const tournaments = [...await Entry.findAll({ where: { playerId }, include: Tournament })].map((e) => e.tournament).filter((t) => t.guildId === message.guild.id)
        if (!tournaments.length) return message.channel.send({ content: `That user is not in any tournaments.`})
        const tournament = await selectTournament(message, tournaments, maid)
        const entry = await Entry.findOne({ where: { playerId, tournamentId: tournament.id }, include: Player})
        if (!entry) return message.channel.send({ content: `That user is not in any tournaments.`})
        return removeParticipant(server, message, member, entry, tournament, false)
    }

    // DECK
    if (commands.deckcom.includes(cmd)) {
        const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid
        const isAuthor = playerId === maid
        if (!isMod(server, message.member) && !isAuthor) return message.channel.send({ content: `You do not have permission to do that.` })

        const player = await Player.findOne({ where: { id: playerId } })
        if (!player) return message.channel.send({ content: `${isAuthor ? "You are" : "That player is"} not in the database.`})
        
        const tournaments = await Tournament.findAll({
            where: { 
                state: "pending", 
                guildId: mgid 
            },
            order: [["createdAt", "ASC"]]
        })
        
        const count = await Tournament.count({ where: { state: "underway", guildId: mgid } })
        const tournament = await selectTournament(message, tournaments, maid);
        if (!tournament && count) return message.channel.send({ content: `Sorry, the tournament already started.` })
        if (!tournament && !count) return message.channel.send({ content: `There is no active tournament.` })
        const entry = await Entry.findOne({ where: { playerId, tournamentId: tournament.id } })
        if (!entry) return message.channel.send({ content: `${isAuthor ? "You are" : "That player is"} not registered for ${tournament.name}.`})

        message.channel.send({ content: `Please check your DMs.` })
        return message.author.send({ content: `${isAuthor ? `${player.name}\'s` : 'Your'} deck link for ${tournament.name} is: ${entry.url}`}).catch((err) => console.log(err))
    }

    // ROLE
    if (commands.rolecom.includes(cmd)) {
        if (!hasAffiliateAccess(server)) return message.channel.send({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })

        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const roleId = hasFullAccess(server) ? format.role : roles[server.name].rankedRole
        if (!roleId) return
        const roleName = hasFullAccess(server) ? `${format.name} Players` : 
            server.name === 'GoatFormat.com' ? 'Ranked Players' :
            server.name === 'EdisonFormat.com' ? 'Dueling Book' :
            server.name === 'Lab' ? 'Ranked Players' :
            server.name === 'Crows Nest' ? 'Crows' :
            server.name === 'Goat Format War League' ? 'Warheads' :
            server.name === 'Vegas (April 2014) Format' ? 'Duelist' :
            ''

        const membership = await Membership.findOne({ where: { playerId: maid, serverId: mgid } })
        if (!membership) return message.channel.send({ content: `You are not in the database.`})
        if (!message.member.roles.cache.some(role => role.id === roleId)) {
            try {
                await message.member.roles.add(roleId)
                const count = await Role.count({ where: { membershipId: membership.id, roleId: roleId } })
                if (!count) {
                    await Role.create({ 
                        membershipId: membership.id,
                        roleId: roleId,
                        roleName: roleName
                    })
                }
                return message.channel.send({ content: `You now have the ${roleName} role.`})
            } catch (err) {
                console.log(err)
                return message.channel.send({ content: `Error: Unable to add ${roleName} role.`})
            }
        } else {
            try {
                await message.member.roles.remove(roleId)
                const role = await Role.findOne({ where: { membershipId: membership.id, roleId: roleId } })
                await role.destroy()
                return message.channel.send({ content: `You no longer have the ${roleName} role.`})
            } catch (err) {
                console.log(err)
                return message.channel.send({ content: `Error: Unable to remove ${roleName} role.`})
            }
        }
    }

    // LEGAL
    if (commands.legalcom.includes(cmd)) {
        const format = await getDeckFormat(server, message, mcid)
        if (!format) return
        message.channel.send(`Please check your DMs.`)
        const issues = await checkDeckList(message.member, format)
        if (!issues) return

        const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
        if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {      
            let response = [`I'm sorry, ${message.member.user.username}, your deck is not legal for ${format.name} Format. ${format.emoji}`]
            if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
            if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
            if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
            if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
            
            for (let i = 0; i < response.length; i += 50) {
                if (response[i+50] && response[i+50].startsWith("\n")) {
                    message.author.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                    i++
                } else {
                    message.author.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                }
            }
        } else if (unrecognizedCards.length) {
            let response = `I'm sorry, ${member.user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
            response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
            return message.author.send({ content: response.toString() }).catch((err) => console.log(err))
        } else {
            return message.author.send({ content: `Congrats, your ${format.name} Format deck is perfectly legal! ${format.emoji}`}).catch((err) => console.log(err))
        }
    }

    // BANLIST
    if (commands.banscom.includes(cmd)) {
        const format = await getDeckFormat(server, message, mcid)
        if (!format) return
        const forbidden = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'forbidden' }, include: Card, order: [[Card, 'sortPriority', 'ASC'], ['name', 'ASC']]})].map((s) => s.name) || []
        const limited = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'limited' }, include: Card, order: [[Card, 'sortPriority', 'ASC'], ['name', 'ASC']]})].map((s) => s.name) || []
        const semilimited = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'semi-limited' }, include: Card, order: [[Card, 'sortPriority', 'ASC'], ['name', 'ASC']]})].map((s) => s.name) || []

        if (!forbidden.length) forbidden.push(`N/A`)
        if (!limited.length) limited.push(`N/A`)
        if (!semilimited.length) semilimited.push(`N/A`)

        const banlist = [
            `**${format.name.toUpperCase()} FORMAT ${format.emoji} - FORBIDDEN & LIMITED LIST**`,
            `\n**The following cards are forbidden:**`,
            ...forbidden,
            `\n**The following cards are limited:**`,
            ...limited,
            `\n**The following cards are semi-limited:**`,
            ...semilimited,
            `\nhttps://formatlibrary.com/banlists/${format.banlist}`
        ]

        for (let i = 0; i < banlist.length; i += 50) {
            if (banlist[i+50] && banlist[i+50].startsWith("\n")) {
                message.author.send({ content: banlist.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                i++
            } else {
                message.author.send({ content: banlist.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
            }
        }

        return message.channel.send({ content: `I messaged you the Forbidden & Limited list for ${format.name} Format. ${format.emoji}`})
    }

    // USER GUIDE
    if (commands.botcom.includes(cmd)) {
        const botEmbed = new Discord.MessageEmbed()
	        .setColor('#38C368')
        	.setTitle('RetroBot User Guide')
	        .setDescription('A Yu-Gi-Oh! Bot powered by FormatLibrary.com.\n' )
	        .setURL('https://discord.com/invite/formatlibrary')
	        .setAuthor({ name: 'Jazz#2704', iconURL: 'https://i.imgur.com/wz5TqmR.png', url: 'https://discord.com/invite/formatlibrary' })
            .setThumbnail('https://formatlibrary.com/images/logos/FL.png')
            .addField('How to Use This Bot', '\nThe following commands can be used for any format in the appropriate server or channels.')
        	.addField('Cards', '\n{ Card Name } - Look up a card. For example, { Dark Magician }. \n')
        	.addField('Ranked Play', '\n!stats - (blank or @user) - Post a player\'s stats. \n!loss - (@user) - Report a loss to another player. \n!top - (n) - Post the top rated players (100 max). \n!h2h - (@user + @user) - Post the H2H record between 2 players. \n!role - Add or remove a ranked play role. \n!undo - Undo the last report if you made a mistake. \n!hist - Post a graph of your Elo history. \n!act - Post a graph of dueling activity. \n')
        	.addField('Format Info', '\n!legal - Privately check if your deck is legal. \n!list - View the Forbidden and Limited list. \n')
        	.addField('Tournaments', '\n!join - Register for an upcoming tournament.\n!resubmit - Resubmit your deck list for a tournament. \n!drop - Drop from a tournament. \n!bracket - Post the bracket(s) for the current tournament(s).')
        	.addField('Ironmans', '\n!iron - Join an ironman queue.\n!q - Check an ironman queue. \n')
        	.addField('Miscellaneous', '\n!db - (name or @user) - Set or check a DuelingBook name. \n!prof - (blank or @user) - Post a player\'s profile. \n!medals - (blank or @user) - Post a player\'s best medals. \n!rng (X) - Random number from 1 to X. \n!flip - Flip a coin. \n!dice - Roll a 6-sided die. \n!bot - View the RetroBot User Guide. \n!mod - View the RetroBot Moderator Guide.')

        message.author.send({ embeds: [botEmbed] }).catch((err) => console.log(err))
        return message.channel.send({ content: "I messaged you the RetroBot User Guide."})
    }

    // MODERATOR GUIDE
    if (cmd === `!mod`) {
        if (!hasAffiliateAccess(server)) return message.channel.send({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: "You do not have permission to do that."})

        const botEmbed = new Discord.MessageEmbed()
	        .setColor('#38C368')
        	.setTitle('RetroBot Moderator Guide')
	        .setDescription('A Rankings and Tournament Bot powered by FormatLibrary.com.\n' )
	        .setURL('https://discord.com/invite/formatlibrary')
	        .setAuthor({ name: 'Jazz#2704', iconURL: 'https://i.imgur.com/wz5TqmR.png', url: 'https://discord.com/invite/formatlibrary' })
        	.setThumbnail('https://formatlibrary.com/images/logos/FL.png')
        	.addField('Ranked Play', '\n!manual - (@winner + @loser) - Manually record a match result. \n!undo - Undo the most recent loss, even if you did not report it.')
            .addField('Tournaments', '\n!create - (tournament name) - Create a new tournament.  \n!signup - (@user) - Directly add a player to a bracket. \n!noshow - (@user) - Report a no-show. \n!deck - (@user) - Check a player\'s tournament deck. \n!remove - (@user) - Remove a player from a bracket. \n!start - Start a tournament. \n!end - (tournament name) - End a tournament. \n!timer - (x) - Start a timer for X minutes.')

        message.author.send({ embeds: [botEmbed] }).catch((err) => console.log(err))
        return message.channel.send({ content: "I messaged you the RetroBot Moderator Guide."})
    }

    if (cmd === '!resources') {
        const resources = [
            '**Resources**',
            'Card Database: https://formatlibrary.com/cards',
            'Deck Database: https://formatlibrary.com/decks',
            'Event Database: https://formatlibrary.com/events',
            'Goat Format Ruleset: https://bit.ly/2VUB3Yx',
            '\n**Discord Servers**',
            'GoatFormat: https://discord.gg/kVeKDwm',
            'EdisonFormat: https://discord.com/invite/rceESCvNkf',
            'Yu-Gi-Oh! Legacy: https://discord.gg/XUpSqjY',
            'OCG Archives: https://discord.gg/nKDPdxh',
            '\n**YouTube**',
            'FormatLibrary: https://bit.ly/2viVkv3',
            'GoatFormat: https://bit.ly/2GzTdK9',
            'GCI: https://bit.ly/36YPeBc',
            'YGOLegacy: https://bit.ly/2SRuLJo',
            'Jazz: https://bit.ly/2Gbr9Pv',
            'Ed Edd and Edison: https://bit.ly/38sHric',
            'Mascis: https://bit.ly/2Dld65q',
            'Kris Perovic: https://youtube.com/user/yugioverdose',
            '\n**Twitch**',
            'FormatLibrary: https://twitch.tv/formatlibrary/',
            'GoatFormat: https://twitch.tv/goatformat',
            'AJTBLS: https://twitch.tv/AJTBLS',
            'Mascis: https://twitch.tv/mascis',
            'MMF: https://twitch.tv/emem_eff',
            '\n**Websites**',
            'Format Library: https://formatlibrary.com/',
            'GoatFormat: https://goatformat.com/',
            'EdisonFormat: https://edisontformat.com/',
            'GoatStats: https://goatstats.weebly.com/',
            'WGM\'s Blog: https://worldgonemaad.wordpress.com/',
            '\n**Tournament Reports**',
            'Noelle FLC8 2019: https://bit.ly/2VUa0N6',
            'Siwski Colosseum 2019: https://bit.ly/2PiiOK9',
            'Me. Berlin 2018: https://bit.ly/2XteqLb',
            'WGM FLC2 2018: https://bit.ly/2vbx6my',
            'Jazz FLC1 2018: https://bit.ly/2Dm42xi',
            'MMF War League 2017: https://bit.ly/2UIvrnL',
            'Perovic War League 2014: https://bit.ly/2ZnfO3J',
            'Nolan Toy Wiz 2014: https://bit.ly/2Zok439',
            'Bonacini Goat Controller 2014: https://bit.ly/2Gz62nX',
            '\n**Articles**',
            'Intro to Goat Format by Bonacini: https://bit.ly/2vbxGke',
            'Goat Manifesto by ACP: https://bit.ly/2UwcdfX',
            'A Brief History of Chaos Control by MMF: https://bit.ly/2VUD1Z5',
            'Anteaus\'s YPD Articles: https://bit.ly/2IwJpCx ',
        ]
        
        return message.author.send(resources.join('\n'))
    }

    // PROFILE
    if (commands.profcom.includes(cmd)) {
        const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
        const player = await Player.findOne({ where: { id: playerId } })
        const all_stats = await Stats.findAll({ where: { playerId } })
        if (!player || !all_stats) return message.channel.send({ content: "That user is not in the database."})
        const results = []
        
        for (let i = 0; i < all_stats.length; i++) {
            const stats = all_stats[i]
            const format = await Format.findOne({ where: { name: {[Op.iLike]: stats.format } }})
            const medal = getMedal(stats.elo)
            results.push(`${format.emoji} ${format.name}: ${medal}`)
        }

        if (!results.length) {
            return message.channel.send({ content: `You have not played any ranked games.`})
        } else {
            results.unshift(`${emojis.FL} --- ${player.name}'s Player Profile --- ${emojis.FL}`)
            for (let i = 0; i < results.length; i += 20) message.channel.send({ content: results.slice(i, i+20).join('\n').toString()}).catch((err) => console.log(err))
            return
        }
    }

    // MEDALS
    if (commands.medalscom.includes(cmd)) {
        const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
        const player = await Player.findOne({ where: { id: playerId } })
        const all_stats = await Stats.findAll({ 
            where: { 
                playerId, 
                elo: { 
                    [Op.gte]: 530 
                }
            }
        })

        if (!player || !all_stats) return message.channel.send({ content: "That user is not in the database."})
        
        const results = []
        for (let i = 0; i < all_stats.length; i++) {
            const stats = all_stats[i]
            const format = await Format.findOne({ where: { name: {[Op.iLike]: stats.format } }})
            const medal = getMedal(stats.elo)
            results.push(`${format.emoji} ${format.name}: ${medal}`)
        }

        if (!results.length) {
            return message.channel.send({ content: `You have not earned any prestigious medals. ${emojis.mad}`})
        } else {
            results.unshift(`${emojis.FL} --- ${player.name}'s Best Medals --- ${emojis.FL}`)
            for (let i = 0; i < results.length; i += 20) message.channel.send({ content: results.slice(i, i+20).join('\n').toString()}).catch((err) => console.log(err))
            return
        }
    }


    // STATS
    if (commands.statscom.includes(cmd)) {
        if (!hasAffiliateAccess(server)) return message.channel.send({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })

        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const playerId = message.mentions.users.first() ? message.mentions.users.first().id : args[0] ? args[0] : maid	
        const player = await Player.findOne({ where: { id: playerId } })
        if (!player) return message.channel.send({ content: "That user is not in the database."})
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        const stats = await Stats.findOne({ 
            where: { 
                playerId, 
                format: {[Op.iLike]: format.name}, 
                [Op.or]: [
                    { wins: { [Op.not]: null } }, 
                    { losses: { [Op.not]: null } }, 
                ],
                serverId: serverId
            } 
        })

        const all_stats = await Stats.findAll({ 
            where: {
                format: { [Op.iLike]: format.name }, 
                games: { [Op.gte]: 3 },
                serverId: serverId,
                '$player.blacklisted$': false
            },
            include: [Player],
            order: [['elo', 'DESC']] 
        })

        const index = all_stats.length ? all_stats.findIndex((s) => s.playerId === playerId) : null
        const rank = stats && index >= 0 ? `#${index + 1} out of ${all_stats.length}` : `N/A`
        const elo = stats ? stats.elo.toFixed(2) : `500.00`
        const medal = getMedal(elo, title = true)
        const wins = stats ? stats.wins : 0
        const losses = stats ? stats.losses : 0
        const winrate = wins || losses ? `${(100 * wins / (wins + losses)).toFixed(2)}%` : 'N/A'		

        return message.channel.send({ content: 
            `${server.formatEmoji || format.emoji} --- ${format.name} Stats --- ${server.formatEmoji || format.emoji}`
            + `${server.internalLadder ? `\nServer: ${server.name}` : ''}`
            + `\nName: ${player.name}`
            + `\nMedal: ${medal}`
            + `\nRanking: ${rank}`
            + `\nElo Rating: ${elo}`
            + `\nWins: ${wins}, Losses: ${losses}`
            + `\nWin Rate: ${winrate}`
        })
    }

    // HISTORY
    if (commands.histcom.includes(cmd)) {
        if (!hasAffiliateAccess(server)) return message.channel.send({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })

        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        let x = message.mentions.users.first() ? parseInt(args[1]) || 250 : parseInt(args[0]) || 250
        if (x < 1) return message.channel.send({ content: "Please provide a number greater than 0."})
        if (x > 2500 || isNaN(x)) return message.channel.send({ content: "Please provide a number less than or equal to 2500."})
        const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
        const player = await Player.findOne({ where: { id: playerId } })
        if (!player) return message.channel.send({ content: "That user is not in the database."})
        let eloHistory = [500]
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        const matches = await Match.findAll({
            where: {
                format: format.name,
                [Op.or]: [
                    { winnerId: playerId }, 
                    { loserId: playerId }
                ],
                serverId: serverId
            },
            order: [['createdAt', 'ASC']]
        })

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]
            const delta = match.delta
            const sign = match.winnerId === playerId ? 1 : -1
            const prevElo = eloHistory.slice(-1)[0] 
            const nextElo = prevElo + (sign * delta)
            eloHistory.push(nextElo)
        }

        if (eloHistory.length < x) x = eloHistory.length

        if (x <= 250) {
            const data = eloHistory.slice(-x)
            const suggestedMin = Math.round(Math.min(...data) / 25) * 25 - 25
            const suggestedMax = Math.round(Math.max(...data) / 25) * 25 + 25
            const matchNumbers = Array.from({length: x}, (_, k) => x - k)
            const radius = x <= 10 ? 3 : x <= 50 ? 2 : 1
            const chart = new QuickChart()
            chart.setConfig({
                type: 'line',
                data: {
                    labels: matchNumbers,
                    datasets: [
                        {
                            label: 'Elo',
                            backgroundColor: 'rgb(10, 54, 138)',
                            borderColor: 'rgb(10, 54, 138)',
                            data: data,
                            pointRadius: radius,
                            fill: false,
                        },
                        {
                            label: '500',
                            backgroundColor: 'rgb(186, 186, 186)',
                            borderColor: 'rgb(186, 186, 186)',
                            data: new Array(x).fill(500),
                            pointRadius: 0,
                            fill: false,
                        },
                    ],
                },
                options: {
                    title: {
                        display: true,
                        text: `${player.name}'s ${format.name} Elo History - Last ${x} Matches`,
                    },
                    legend: {
                        display: false
                    },
                    xAxes: [{
                        display: false,
                        gridLines: {
                            display: true,
                        },
                    }],
                    scales: {
                        yAxes: [
                            {
                                ticks: {
                                    suggestedMin: suggestedMin,
                                    suggestedMax: suggestedMax,
                                }
                            }
                        ]
                    },
                },
            })
    
            const url = await chart.getShortUrl()
            message.channel.send({ content: `${url}` })
        } else {
            for (let i = 0; i < x; i += 250) {
                let xAxisLength = x - i >= 250 ? 250 : x - i
                const data = eloHistory.slice(i, i + 250)
                const suggestedMin = Math.round(Math.min(...eloHistory) / 25) * 25 - 25
                const suggestedMax = Math.round(Math.max(...eloHistory) / 25) * 25 + 25
                const matchNumbers = Array.from({length: xAxisLength}, (_, k) => i + k)
                const radius = xAxisLength <= 10 ? 3 : xAxisLength <= 50 ? 2 : 1
                const chart = new QuickChart()
                chart.setConfig({
                    type: 'line',
                    data: {
                        labels: matchNumbers,
                        datasets: [
                            {
                                label: 'Elo',
                                backgroundColor: 'rgb(10, 54, 138)',
                                borderColor: 'rgb(10, 54, 138)',
                                data: data,
                                pointRadius: radius,
                                fill: false,
                            },
                            {
                                label: '500',
                                backgroundColor: 'rgb(186, 186, 186)',
                                borderColor: 'rgb(186, 186, 186)',
                                data: new Array(xAxisLength).fill(500),
                                pointRadius: 0,
                                fill: false,
                            },
                        ],
                    },
                    options: {
                        title: {
                            display: true,
                            text: `${player.name}'s ${server.internalLadder ? 'Internal ' : ''}${capitalize(format, true)} Elo History - Matches ${i} - ${i + xAxisLength}`,
                        },
                        legend: {
                            display: false
                        },
                        xAxes: [{
                            display: false,
                            gridLines: {
                                display: true,
                            },
                        }],
                        scales: {
                            yAxes: [
                                {
                                    ticks: {
                                        suggestedMin: suggestedMin,
                                        suggestedMax: suggestedMax,
                                    }
                                }
                            ]
                        },
                    },
                })
                
                const url = await chart.getShortUrl()
                const channel = client.channels.cache.get(channels[server.name].botSpamChannel)
                if (!channel) {
                    return message.channel.send({ content: `Error: could not find bot-spam channel.`})
                } else if (i === 0) {
                    message.channel.send({ content: `The chart(s) you requested will appear in <#${botSpamChannel}>.`})
                }

                channel.send({ content: `${url}` })
            }
        }
    }

    // ACTIVITY
    if (commands.activitycom.includes(cmd)) {
        if (!hasAffiliateAccess(server)) return message.channel.send({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })
        
        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})  
        const today = new Date()
        const cutoff = new Date(
            today.getMonth() === 11 ? today.getFullYear() : today.getFullYear() - 1,
            today.getMonth() === 11 ? 1 : today.getMonth() + 1,
            1
        )

        const matches = await Match.findAll({
            where: { 
                format: format.name,
                createdAt: {
                    [Op.gte]: cutoff
                }
            },
            order: [['createdAt', 'ASC']]
        })

        const summary = {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
            '8': 0,
            '9': 0,
            '10': 0,
            '11': 0,
        }
        
        for (let i = 0; i < matches.length; i++) {
            const match = matches[i]
            const month = match.createdAt.getMonth()
            summary[month] ? summary[month]++ : summary[month] = 1
        }

        const month = new Date().getMonth()
        const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ]

        const labels = []
        const data = []
        for (let i = month + 1; i <= 11; i++) {
            labels.push(months[i])
            data.push(summary[i])
        }
        for (let i = 0; i <= month; i++) {
            labels.push(months[i])
            data.push(summary[i])
        }
        
        const chart = new QuickChart()
        chart.setConfig({
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Activity',
                        backgroundColor: 'rgb(10, 54, 138)',
                        borderColor: 'rgb(10, 54, 138)',
                        data: data,
                        fill: false,
                    }
                ],
            },
            options: {
                title: {
                    display: true,
                    text: `${format.name} Activity Chart`,
                },
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [
                        {
                            ticks: {
                                suggestedMax: 100
                            }
                        }
                    ]
                },
            },
        })

        const url = await chart.getShortUrl()
        message.channel.send({ content: `${url}` })
    }

    // RANK
    if (commands.rankcom.includes(cmd)) {
        if (!hasAffiliateAccess(server)) return message.channel.send({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })
        
        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const x = parseInt(args[0]) || 10
        if (x < 1) return message.channel.send({ content: "Please provide a number greater than 0."})
        if (x > 100 || isNaN(x)) return message.channel.send({ content: "Please provide a number less than or equal to 100."})
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        const all_stats = await Stats.findAll({ 
            where: {
                format: {[Op.iLike]: format.name}, 
                games: { [Op.gte]: 3 },
                serverId: serverId,
                '$player.blacklisted$': false
            },
            include: Player,
            order: [['elo', 'DESC']] 
        })
        
        const top_stats = all_stats.slice(0, x)
        if (!top_stats.length) return message.channel.send({ content: `I'm sorry, we don't have any ${format.name} players.`})
        const results = []
        top_stats.length === 1 ? results[0] = `${server.formatEmoji || format.emoji} --- The Best ${server.internalLadder ? 'Internal ' : ''}${format.name} Player --- ${server.formatEmoji || format.emoji}`
        : results[0] = `${server.formatEmoji || format.emoji} --- Top ${top_stats.length} ${server.internalLadder ? 'Internal ' : ''}${format.name} Players --- ${server.formatEmoji || format.emoji}`
        for (let i = 0; i < top_stats.length; i++) results[i+1] = `${(i+1)}. ${getMedal(top_stats[i].elo)} ${top_stats[i].player.name}`
        if (!server.internalLadder) results.push(`\nFull Leaderboard: https://formatlibrary.com/leaderboards/${format.name}`)
        for (let i = 0; i < results.length; i += 30) message.channel.send({ content: results.slice(i, i+30).join('\n').toString() })
        return
    }

    // LOSS
    if (commands.losscom.includes(cmd)) {
        if (!hasAffiliateAccess(server)) return message.channel.send({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })
        
        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const opid = message.mentions.users.first() ? message.mentions.users.first().id : null
        if (!opid) return message.channel.send({ content: `No player specified.`})
        if (opid === maid) return message.channel.send({ content: `You cannot lose a match to yourself.`})
        if (await isNewUser(server, opid)) await createPlayer(message.mentions.members.first())
        const winner = await message.guild.members.fetch(opid)
        const winningPlayer = await Player.findOne({ where: { id: opid } })
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        const wCount = await Stats.count({ where: { playerId: opid, format: format.name, serverId: serverId } })
        if (!wCount) await Stats.create({ playerId: opid, format: format.name, serverId: serverId })
        const winnerStats = await Stats.findOne({ where: { playerId: opid, format: format.name, serverId: serverId } })
        const losingPlayer = await Player.findOne({ where: { id: maid } })
        const lCount = await Stats.count({ where: { playerId: maid, format: format.name, serverId: serverId } })
        if (!lCount) await Stats.create({ playerId: maid, format: format.name, serverId: serverId })
        const loserStats = await Stats.findOne({ where: { playerId: maid, format: format.name, serverId: serverId } })

        if (winner && winner.user.bot) return message.channel.send({ content: `Sorry, Bots do not play ${format.name} Format... *yet*.`})
        if (opid.length < 17 || opid.length > 18) return message.channel.send({ content: `To report a loss, type **!loss @opponent**.`})
        if (!losingPlayer || !loserStats) return message.channel.send({ content: `You are not in the database.`})
        if (!winningPlayer || !winnerStats) return message.channel.send({ content: `That user is not in the database.`})
 
        const loserHasTourRole = isTourPlayer(server, message.member)
        const winnerHasTourRole = isTourPlayer(server, winner)
        const activeTournament = await Tournament.count({ where: { state: 'underway', guildId: mgid } }) 
        let isTournamentMatch
        let winningEntry
        let losingEntry
        let tournament

        const loserHasIronRole = isIronPlayer(server, message.member)
        const winnerHasIronRole = isIronPlayer(server, winner)
        const activeIron = await Info.count({ where: { element: 'iron', status: 'active' }})
        let isIronMatch
        
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
                        tournament = await Tournament.findOne({ where: { id: id, guildId: mgid }})
                        if (!tournament) continue
                        losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id } })
                        winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id } })
                        if (!losingEntry || !winningEntry) continue
                        const matches = await getMatches(server, tournament.id)
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
                        if (tournament.state === 'pending') return message.channel.send({ content: `Sorry, ${tournament.name} has not started yet.`})
                        if (tournament.state !== 'underway') return message.channel.send({ content: `Sorry, ${tournament.name} is not underway.`})
                        const success = await processMatchResult(server, message, winningPlayer, losingPlayer, tournament)
                        if (!success) return
                    } else {
                        return
                    }
                }
            }
        } else if (loserHasIronRole && winnerHasIronRole && activeIron) {
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
                    
            const ironPersonA = teamA[0]
            const ironPersonB = teamB[0]

            if (winningPlayer.id === ironPersonA.playerId && losingPlayer.id === ironPersonB.playerId) {
                isIronMatch = true
                ironPersonB.eliminated = true
                await ironPersonB.save()
                setTimeout(() => postStory(message.channel, format.name), 5000)
            } else if (winningPlayer.id === ironPersonB.playerId && losingPlayer.id === ironPersonA.playerId) {
                isIronMatch = true
                ironPersonA.eliminated = true
                await ironPersonA.save()
                setTimeout(() => postStory(message.channel, format.name), 5000)
            } else {
                return message.channel.send({ content: `Sorry, ${winningPlayer.name} is not your ${format.name} Iron opponent. ${format.emoji} ${emojis.iron}`})
            }
        }
            
        const origEloWinner = winnerStats.elo || 500.00
        const origEloLoser = loserStats.elo || 500.00
        const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
        
        winnerStats.elo = origEloWinner + delta
        winnerStats.backupElo = origEloWinner
        winnerStats.wins++
        winnerStats.games++
        await winnerStats.save()

        loserStats.elo = origEloLoser - delta
        loserStats.backupElo = origEloLoser
        loserStats.losses++
        loserStats.games++
        await loserStats.save()

        const match = await Match.create({
            winnerId: winningPlayer.id,
            winner_name: winningPlayer.name,
            loserId: losingPlayer.id,
            loser_name: losingPlayer.name,
            tournament: isTournamentMatch,
            format: format.name,
            delta: delta,
            serverId: serverId
        })

        if (isTournamentMatch && winningEntry && losingEntry && tournament && match) {
            await Matchup.create({
                winning_deck_name: '',
                winning_deck_type: '',
                winning_deck_category: '',
                losing_deck_name: '',
                losing_deck_type: '',
                losing_deck_category: '',
                matchId: match.id,
                format: format.name,
                tournamentId: tournament.id
            })
        }

        return message.channel.send({ content: `${losingPlayer.name}, your ${server.internalLadder ? 'Internal ' : ''}${format.name} Format ${server.formatEmoji || format.emoji} ${isTournamentMatch ? 'Tournament ' : isIronMatch ? `Iron ${emojis.iron}` : ''}loss to ${winningPlayer.name} has been recorded.`})
    }

    // MANUAL
    if (commands.manualcom.includes(cmd)) {
        if (!hasAffiliateAccess(server)) return message.channel.send({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })
        
        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const usersMap = message.mentions.users
        const userIds = [...usersMap.keys()]	
        const winnerId = message.mentions.users.first() ? message.mentions.users.first().id : args.length > 0 ? args[0] : null
        const loserId = userIds.length > 1 ? userIds[1] : args.length > 1 ? args[1] : null	
        if (!winnerId || !loserId) return message.channel.send({ content: `Please specify 2 players.`})
        if (winnerId === loserId) return message.channel.send({ content: `Please specify 2 different players.`})

        const winner = await message.guild.members.fetch(winnerId)
        const loser = await message.guild.members.fetch(loserId)
        if ((winner && winner.user.bot) ||  (loser && loser.user.bot)  ) return message.channel.send({ content: `Sorry, Bots do not play ${format.name} Format... *yet*.`})

        if (winner && await isNewUser(server, winnerId)) await createPlayer(winner)
        if (loser && await isNewUser(server, loserId)) await createPlayer(loser)

        if (!winner && await isNewUser(server, winnerId)) return message.channel.send(`Sorry, unable to add user ${winnerId} to the database.`)
        if (!loser && await isNewUser(server, loserId)) return message.channel.send(`Sorry, unable to add user ${loserId} to the database.`)
        
        const serverId = server.internalLadder ? server.id : '414551319031054346'
        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const wCount = await Stats.count({ where: { playerId: winnerId, format: format.name, serverId: serverId } })
        if (!wCount) await Stats.create({ playerId: winnerId, format: format.name, serverId: serverId })
        const winnerStats = await Stats.findOne({ where: { playerId: winnerId, format: format.name, serverId: serverId } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const lCount = await Stats.count({ where: { playerId: loserId, format: format.name, serverId: serverId } })
        if (!lCount) await Stats.create({ playerId: loserId, format: format.name, serverId: serverId })
        const loserStats = await Stats.findOne({ where: { playerId: loserId, format: format.name, serverId: serverId } })

        if (!losingPlayer || !loserStats) return message.channel.send({ content: `Sorry, <@${loserId}> is not in the database.`})
        if (!winningPlayer || !winnerStats) return message.channel.send({ content: `Sorry, <@${winnerId}> is not in the database.`})

        const loserHasTourRole = await isTourPlayer(server, loser)
        const winnerHasTourRole = await isTourPlayer(server, winner)
        const activeTournament = await Tournament.count({ where: { state: 'underway', guildId: mgid } }) 
        let isTournamentMatch
        let winningEntry
        let losingEntry
        let tournament

        const loserHasIronRole = isIronPlayer(server, message.member)
        const winnerHasIronRole = isIronPlayer(server, winner)
        const activeIron = await Info.count({ where: { element: 'iron', status: 'active' }})
        let isIronMatch

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
                        tournament = await Tournament.findOne({ where: { id: id, guildId: mgid }})
                        if (!tournament) continue
                        losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id } })
                        winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id } })
                        if (!losingEntry || !winningEntry) continue
                        const matches = await getMatches(server, tournament.id)
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
                        if (tournament.state === 'pending' || tournament.state === 'standby') return message.channel.send({ content: `Sorry, ${tournament.name} has not started yet.`})
                        if (tournament.state !== 'underway') return message.channel.send({ content: `Sorry, ${tournament.name} is not underway.`})
                        const success = await processMatchResult(server, message, winningPlayer, losingPlayer, tournament)
                        if (!success) return
                    } else {
                        return
                    }
                }
            }
        } else if (loserHasIronRole && winnerHasIronRole && activeIron) {
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
                    
            const ironPersonA = teamA[0]
            const ironPersonB = teamB[0]

            if (winningPlayer.id === ironPersonA.playerId && losingPlayer.id === ironPersonB.playerId) {
                isIronMatch = true
                ironPersonB.eliminated = true
                await ironPersonB.save()
                setTimeout(() => postStory(message.channel, format.name), 5000)
            } else if (winningPlayer.id === ironPersonB.playerId && losingPlayer.id === ironPersonA.playerId) {
                isIronMatch = true
                ironPersonA.eliminated = true
                await ironPersonA.save()
                setTimeout(() => postStory(message.channel, format.name), 5000)
            } else {
                return message.channel.send({ content: `Sorry, ${winningPlayer.name} is not ${losingPlayer.name}'s ${format.name} Iron opponent. ${format.emoji} ${emojis.iron}`})
            }
        }
            
        const origEloWinner = winnerStats.elo || 500.00
        const origEloLoser = loserStats.elo || 500.00
        const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
        
        winnerStats.elo = origEloWinner + delta
        winnerStats.backupElo = origEloWinner
        winnerStats.wins++
        winnerStats.games++
        await winnerStats.save()

        loserStats.elo = origEloLoser - delta
        loserStats.backupElo = origEloLoser
        loserStats.losses++
        loserStats.games++
        await loserStats.save()

        const match = await Match.create({
            winner_name: winningPlayer.name,
            winnerId: winningPlayer.id,
            loser_name: losingPlayer.name,
            loserId: losingPlayer.id,
            tournament: isTournamentMatch,
            format: format.name,
            delta: delta,
            serverId: serverId
        })

        if (isTournamentMatch && winningEntry && losingEntry && tournament && match) {
            await Matchup.create({
                winning_deck_name: '',
                winning_deck_type: '',
                winning_deck_category: '',
                losing_deck_name: '',
                losing_deck_type: '',
                losing_deck_category: '',
                matchId: match.id,
                format: format.name,
                tournamentId: tournament.id
            })
        }

        return message.channel.send({ content: `A manual ${server.internalLadder ? 'Internal ' : ''}${format.name} Format ${server.formatEmoji || format.emoji} ${isTournamentMatch ? 'Tournament ' : isIronMatch ? `Iron ${emojis.iron}` : ''}loss by ${losingPlayer.name} to ${winningPlayer.name} has been recorded.`})		
    }

    // NO SHOW
    if (commands.noshowcom.includes(cmd)) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: `You do not have permission to do that.`})

        const noShowId = message.mentions.users.first() ? message.mentions.users.first().id : args.length > 0 ? args[0]	: null
        if (!noShowId) return message.channel.send({ content: "Please specify a player."})
        const noshow = await message.guild.members.fetch(noShowId)
        if ((noshow && noshow.user.bot)) return message.channel.send({ content: `Sorry, Bots do not play Goat Format... *yet*.`})
        if (noshow && await isNewUser(server, noShowId)) await createPlayer(noshow)
        const noShowPlayer = await Player.findOne({ where: { id: noShowId } })
        if (!noShowPlayer) return message.channel.send({ content: `Sorry, <@${noShowId}> is not in the database.`})
        const tournaments = [...await Entry.findAll({ where: { playerId: noShowId }, include: Tournament })].map((e) => e.tournament).filter((t) => t.guildId === message.guild.id)
        if (!tournaments.length || !noshow.roles.cache.some(role => role.id === tourRole)) return message.channel.send({ content: `Sorry, ${noShowPlayer.name} is not any tournaments.`})
     
        const tournament = await selectTournament(message, tournaments, maid)
        if (!tournament) return
        if (tournament.state === 'pending' || tournament.state === 'standby') return message.channel.send({ content: `Sorry, ${tournament.name} has not started yet.`})
        if (tournament.state !== 'underway') return message.channel.send({ content: `Sorry, ${tournament.name} is not underway.`})
        
        const noShowEntry = await Entry.findOne({ where: { playerId: noShowId, tournamentId: tournament.id } })
        if (!noShowEntry) return message.channel.send({ content: `Sorry I could not find that player's tournament entry in the database.`})

        const matchesArr = await getMatches(server, tournament.id)
        let winnerParticipantId = false
        for (let i = 0; i < matchesArr.length; i++) {
            const match = matchesArr[i].match
            if (match.state !== 'open') continue
            winnerParticipantId = findNoShowOpponent(match, noShowEntry.participantId)
            if (winnerParticipantId) break
        }

        const winningEntry = await Entry.findOne({ where: { participantId: winnerParticipantId, tournamentId: tournament.id }, include: Player })
        if (!winningEntry) return message.channel.send({ content: `Error: could not find opponent.`})

        const success = await processMatchResult(server, message, winningEntry.player, noShowPlayer, tournament, true)
        if (!success) return

        return message.channel.send({ content: `${noShowPlayer.name}, your Tournament loss to <@${winningEntry.playerId}> has been recorded as a no-show.`})
    }

    // H2H
    if (commands.h2hcom.includes(cmd)) {
        if (!hasAffiliateAccess(server)) return message.channel.send({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })
        
        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const usersMap = message.mentions.users
        const userIds = [...usersMap.keys()]
        const player1Id = message.mentions.users.first() ? message.mentions.users.first().id : null	
        const player2Id = userIds.length > 1 ? userIds[1] : maid	

        if (!player1Id) return message.channel.send({ content: "Please specify at least 1 other player."})
        if (player1Id === player2Id) return message.channel.send({ content: `Please specify 2 different players.`})

        const player1 = await Player.findOne({ where: { id: player1Id } })
        const player2 = await Player.findOne({ where: { id: player2Id } })
        
        if (!player1 && player2Id === maid) return message.channel.send({ content: `That user is not in the database.`})
        if (!player1 && player2Id !== maid) return message.channel.send({ content: `The first user is not in the database.`})
        if (!player2 && player2Id === maid) return message.channel.send({ content: `You are not in the database.`})
        if (!player2 && player2Id !== maid) return message.channel.send({ content: `The second user is not in the database.`})

        const p1Wins = await Match.count({ where: { winnerId: player1Id, loserId: player2Id, format: format.name } })
        const p2Wins = await Match.count({ where: { winnerId: player2Id, loserId: player1Id, format: format.name } })
        
        return message.channel.send({ content: 
            `${server.formatEmoji || format.emoji} --- H2H ${format.name} Results --- ${server.formatEmoji || format.emoji}`+
            `\n${player1.name} has won ${p1Wins}x`+
            `\n${player2.name} has won ${p2Wins}x`
        })
    }

    // UNDO
    if (commands.undocom.includes(cmd)) {
        if (!hasAffiliateAccess(server)) return message.channel.send({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })

        const serverId = server.internalLadder ? server.id : '414551319031054346'
        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const allMatches = await Match.findAll({ where: { format: format.name, serverId: serverId }})
        const lastMatch = allMatches.slice(-1)[0]
        const winnerId = lastMatch.winnerId
        const loserId = lastMatch.loserId
        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const winnerStats = await Stats.findOne({ where: { playerId: winnerId, format: format.name, serverId: serverId } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const loserStats = await Stats.findOne({ where: { playerId: loserId, format: format.name, serverId: serverId } })
        
        const prompt = (isMod(server, message.member) ? '' : ' Please get a Moderator to help you.')
        if (maid !== loserId && !isMod(server, message.member)) return message.channel.send({ content: `You did not participate in the last recorded match.${prompt}`})

        if (!winnerStats.backupElo && maid !== loserId) return message.channel.send({ content: `${winningPlayer.name} has no backup stats.${prompt}`})
        if (!winnerStats.backupElo && maid === loserId) return message.channel.send({ content: `Your last opponent, ${winningPlayer.name}, has no backup stats.${prompt}`})
        if (!loserStats.backupElo && maid !== loserId) return message.channel.send({ content: `${losingPlayer.name} has no backup stats.${prompt}`})
        if (!loserStats.backupElo && maid === loserId) return message.channel.send({ content: `You have no backup stats.${prompt}`})

        winnerStats.elo = winnerStats.backupElo
        winnerStats.backupElo = null
        winnerStats.wins--
        winnerStats.games--
        await winnerStats.save()

        loserStats.elo = loserStats.backupElo
        loserStats.backupElo = null
        loserStats.losses--
        loserStats.games--
        await loserStats.save()

        await lastMatch.destroy()
        return message.channel.send({ content: `The last ${server.internalLadder ? 'Internal ' : ''}${format.name} match in which ${winningPlayer.name} defeated ${losingPlayer.name} has been erased. ${server.formatEmoji || format.emoji}`})
    }

    // RATED PLAY
    if (commands.ratedcom.includes(cmd)) {
        if (mgid) return message.channel.send(`Try using ${cmd} by DM'ing it to me.`)
        const player = await Player.findOne({ where: { id: maid } })
        if (!player) return message.channel.send(`You are not in the database. Please join the Format Library Discord server to register.`)
        const format = await getRatedFormat(message)
        if (!format) return message.channel.send({ content: `Please specify a valid format.`})
        
        const yourGuildIds = [...await Membership.findAll({ 
            where: { 
                playerId: maid,
                active: true,
                '$server.access$': {[Op.or]: ['full', 'partner', 'affiliate']},
                '$server.internalLadder$': false,
                '$server.format$': {[Op.or]: [format.name, null]}
            }, 
            include: Server,
            order: [[Server, 'createdAt', 'ASC']] 
        })].map((m) => m.serverId) || []

        if (!yourGuildIds.length) return message.channel.send(`Sorry, you are not a member of a server that supports rated play for ${format.name} Format. ${format.emoji}`)
        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(message.author, player)
        if (!dbName) return

        const yourRatedDecks = await RatedDeck.findAll({
            where: {
                format: format.name,
                playerId: maid
            },
            order: [['updatedAt', 'DESC']]
        }) || []

        let ratedDeck = await getPreviousRatedDeck(message.author, yourRatedDecks, format)
        if (ratedDeck) {
            try {
                const id = ratedDeck.url.slice(ratedDeck.url.indexOf('?id=') + 4)
                const {data} = await axios.get(`https://www.duelingbook.com/php-scripts/load-deck.php/deck?id=${id}`)
                if (data) {
                    const main = data.main.map((e) => e.serial_number)
                    const side = data.side.map((e) => e.serial_number)
                    const extra = data.extra.map((e) => e.serial_number)
                    const deckArr = [...main, ...side, ...extra]
                    const issues = await getIssues(deckArr, format)
                    const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
                    if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {      
                        let response = [`I'm sorry, ${message.author.username}, your deck is not legal for ${format.name} Format. ${format.emoji}`]
                        if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
                        if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
                        if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
                        if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
                        
                        for (let i = 0; i < response.length; i += 50) {
                            if (response[i+50] && response[i+50].startsWith("\n")) {
                                message.author.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                                i++
                            } else {
                                message.author.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                            }
                        }
                    } else if (unrecognizedCards.length) {
                        let response = `I'm sorry, ${message.author.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
                        response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                        return message.author.send({ content: response.toString() }).catch((err) => console.log(err))
                    } else {
                        const ydk = ['created by...', '#main', ...main, '#extra', ...extra, '!side', ...side, ''].join('\n')
                        ratedDeck.ydk = ydk
                        await ratedDeck.save()
                        console.log(`${player.name}'s rated deck was updated!`)
                    }
                }
            } catch (err) {
                console.log(err)
                return message.channel.send(`Unable to process deck list. Please try again.`)
            }
        } else {
            ratedDeck = await getNewRatedDeck(message.author, player, format)
        }
        
        if (!ratedDeck || !ratedDeck.ydk) return
        const deckAttachments = await drawDeck(ratedDeck.ydk) || []
        message.channel.send({content: `Okay, ${player.name}, you will be using this deck if you are paired:` , files: [...deckAttachments] })
        
        const oldRatedPool = await RatedPool.findOne({
            where: {
                name: player.name,
                format: format.name,
                playerId: maid
            }
        })

        if (oldRatedPool) await oldRatedPool.destroy()

        const newRatedPool = await RatedPool.create({
            name: player.name,
            format: format.name,
            status: 'pending',
            playerId: maid
        })

        if (!newRatedPool) return

        try {
            const potentialPairs = await RatedPool.findAll({ 
                where: { 
                    playerId: {[Op.not]: maid },
                    status: 'pending',
                    format: format.name
                },
                order: [['createdAt', 'ASC']]
            }) || []
    
            if (!potentialPairs.length) {
                for (let y = 0; y < yourGuildIds.length; y++) {
                    try {
                        const yGId = yourGuildIds[y]
                        const guild = client.guilds.cache.get(yGId)
                        const channelId = guild.id === '414551319031054346' ? format.channel : channels[guild.name].ratedChannel
                        const roleId = guild.id === '414551319031054346' ? format.role : roles[guild.name].rankedRole
                        const channel = guild.channels.cache.get(channelId)
                        channel.send(`<@&${roleId}> Somebody joined the ${format.name} Format ${format.emoji} Rated Pool! ${emojis.megaphone}`)
                    } catch (err) {
                        console.log(err)
                    }
                }

                return message.channel.send(`You've joined the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired.`)
            }

            let messageSent = false
    
            for (let i = 0; i < potentialPairs.length; i++) {
                const potentialPair = potentialPairs[i]
                const ppid = potentialPair.playerId
                const opponentsGuildIds = [...await Membership.findAll({ 
                    where: { 
                        playerId: ppid,
                        active: true,
                        '$server.access$': {[Op.or]: ['full', 'partner', 'affiliate']},
                        '$server.internalLadder$': false,
                        '$server.format$': {[Op.or]: [format.name, null]}
                    },
                    include: Server,
                    order: [[Server, 'createdAt', 'ASC']]
                })].map((m) => m.serverId) || []
    
                let commonGuildId
                for (let j = 0; j < opponentsGuildIds.length; j++) {
                    const guildId = opponentsGuildIds[j]
                    if (yourGuildIds.includes(guildId)) {
                        commonGuildId = guildId
                        break
                    }
                }
    
                if (!commonGuildId) continue
                const now = new Date()
                const tenMinutesAgo = new Date(now - (10 * 60 * 1000))
                const threeHoursAgo = new Date(now - (3 * 60 * 60 * 1000))
    
                const yourRecentOpponents = [...await Match.findAll({
                    where: {
                        [Op.or]: {
                            winnerId: maid,
                            loserId: maid
                        },
                        format: format.name,
                        createdAt: {[Op.gte]: threeHoursAgo }
                    }
                })].map((m) => {
                    if (maid === m.winnerId) {
                        return m.loserId
                    } else {
                        return m.winnerId
                    }
                }) || []
    
                if (yourRecentOpponents.includes(potentialPair.playerId)) continue
    
                if (potentialPair.createdAt < tenMinutesAgo) {
                    getPotentialPairConfirmation(client, format, potentialPair, newRatedPool, commonGuildId)
                    continue
                } else {
                    const commonServer = await Server.findOne({ where: { id: commonGuildId }})
                    if (!commonServer) continue
                    const channelId = commonServer.format ? channels[commonServer.name].ratedChannel : format.channel
                    const guild = client.guilds.cache.get(commonGuildId)
                    const channel = guild.channels.cache.get(channelId)
                    const opponent = await Player.findOne({ where: { id: potentialPair.playerId }})
                    const member = await guild.members.fetch(opponent.id)
                    member.user.send(`New pairing for Rated ${format.name} Format ${commonServer.formatEmoji || format.emoji}!\nServer: ${commonServer.name} ${emojis[commonServer.name]}\nDiscord:${player.tag} \nDuelingBook: ${player.duelingBook}`)
                    message.channel.send(`New pairing for Rated ${format.name} Format ${commonServer.formatEmoji || format.emoji}!\nServer: ${commonServer.name} ${emojis[commonServer.name]}\nDiscord: ${opponent.tag}\nDuelingBook: ${opponent.duelingBook}`)
                    
                    const ratedPoolsToDestroy = await RatedPool.findAll({
                        where: {
                            playerId: {[Op.or]: [player.id, opponent.id]}
                        }
                    }) || []
    
                    for (let d = 0; d < ratedPoolsToDestroy.length; d++) {
                        const rPTD = ratedPoolsToDestroy[d]
                        await rPTD.destroy()
                    }

                    return channel.send({ content: `New Rated ${format.name} Format ${commonServer.formatEmoji || format.emoji} Match: <@${opponent.id}> (DB: ${opponent.duelingBook}) vs. <@${player.id}> (DB: ${player.duelingBook}). Good luck to both duelists.`})
                }
            }
        } catch (err) {
            console.log(err)            
        }

        for (let y = 0; y < yourGuildIds.length; y++) {
            try {
                const yGId = yourGuildIds[y]
                const guild = client.guilds.cache.get(yGId)
                const channelId = guild.id === '414551319031054346' ? format.channel : channels[guild.name].ratedChannel
                const roleId = guild.id === '414551319031054346' ? format.role : roles[guild.name].rankedRole
                const channel = guild.channels.cache.get(channelId)
                channel.send(`<@&${roleId}> Somebody joined the ${format.name} Format ${format.emoji} Rated Pool! ${emojis.megaphone}`)
            } catch (err) {
                console.log(err)
            }
        }
        
        return message.channel.send(`You've joined the ${format.name} Rated Pool. ${format.emoji} You'll receive a DM when you're paired.`)
    }

    // EXIT
    if (commands.exitcom.includes(cmd)) {
        if (mgid) return message.channel.send(`Try using ${cmd} by DM'ing it to me.`)
        const player = await Player.findOne({ where: { id: maid } })
        if (!player) return message.channel.send(`You are not in the database. Please join the Format Library Discord server to register.`)
       
        const oldRatedPools = await RatedPool.findAll({ where: {  playerId: maid } }) || []
        if (!oldRatedPools.length) return message.channel.send(`You were not in any Rated Pools.`)

        const pools = oldRatedPools.map((p) => p.format)

        const drops = await getDropFormats(message, pools)
        if (!drops || !drops.length) return message.channel.send(`Please specify a valid number.`)

        let b = 0
        const results = []
        for (let i = 0; i < drops.length; i++) {
            try {
                const format = drops[i]
                const oldRatedPool = await RatedPool.findOne({ where: { format: format, playerId: maid } })
                await oldRatedPool.destroy()
                results.push(format)
                b++
            } catch (err) {
                console.log(err)
            }
        }

        return message.channel.send({ content: `You left the Rated Pool for the following format(s):\n${results.join('\n').toString()}.`}).catch((err) => console.log(err))
    }

    // RESET
    if (cmd === `!reset`) {
        if (!hasFullAccess(server)) return message.channel.send({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: "You do not have permission to do that."})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })
        
        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        return resetIron(message.channel, format.name)
    }

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
        const hasStarted = await Iron.count({ 
            where: {
                format: format.name,
                paired: true
            }
        })

        if (hasStarted) return message.channel.send({ content: `Sorry, the ${format.name} ${format.emoji} Iron already started. ${emojis.iron}`})

        const alreadyIn = await Iron.count({ 
            where: { 
                format: format.name,
                playerId: maid
            } 
        })
        
        if (!alreadyIn) {
            const count = await Iron.count({ where: { format: format.name }})
            if (count >= 8) return message.channel.send({ content: `Sorry, ${message.author.username}, the ${format.name} ${format.emoji} Iron is full.`})

            await Iron.create({ 
                name: message.author.username,
                playerId: maid,
                format: format.name
            })
            message.channel.send({ content: `You joined the Iron queue. ${emojis.iron}`})
            
            if (count === 7) return confirmIron(message.channel, format.name)
        } else {
            const ironPerson = await Iron.findOne({ 
                where: {
                    name: message.author.username,
                    format: format.name,
                    playerId: maid
                }
            })

            if (!ironPerson) return
            await ironPerson.destroy()
            return message.channel.send({ content: `You left the Iron queue. ${emojis.iron}`})
        }
    } 

    // QUEUE
    if(commands.queuecom.includes(cmd)) {
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
        const queue = [...await Iron.findAll({ where: { format: format.name }})].map((i) => i.name)
        if (!queue.length) return message.channel.send({ content: `The ${format.name} ${format.emoji} Iron queue is empty. ${emojis.iron}`})
        return message.channel.send({ content: `${format.name} ${format.emoji} Iron Queue:\n` + queue.join('\n').toString() })
    }

    //COVERAGE
    if (cmd === `!coverage`) {
        if (!isProgrammer(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
        const event = args[0]
        const tournament = await Tournament.findOne({ where: { shortName: event }})
        if (!tournament) return message.channel.send(`No tournament found.`)
        const coverageType = await selectCoverage(message)
        if (!coverageType) return
        if (coverageType.includes('Create Deck')) return createDecks(message, tournament)
        if (coverageType.includes('Thumbnail')) return composeThumbnails(message, event)
        if (coverageType.includes('BlogPost')) return composeBlogPost(message, event)
    }

    // COMBINE
    // Use this command to combine two Discord accounts into one.
    // Arguments required: @Old_User, @New_User
    // The old user's records will be overrite with the new user's. 
    // In the record of matches, the old user id will be replaced by the new user id.
    // After this is done, there is no way to tell which matches were played on the old account.
    // So be careful with this command. Make sure the accounts are definitely shared.
    // When this command is finished, use the **!recalc** command to update everyone's stats.
    if (cmd === `!combine`) {
        if (!hasFullAccess(server)) return message.channel.send({ content: `This feature is only available in Format Library. ${emojis.FL}`}) 
        if (!isMod(server, message.member)) return message.channel.send({ content: "You do not have permission to do that."})
        const oldId = marr[1].replace(/[\\<>@#&!]/g, "")
        const newId = marr[2].replace(/[\\<>@#&!]/g, "")
        const oldPlayer = await Player.findOne({ where: { id: oldId } })
        const newPlayer = await Player.findOne({ where: { id: newId } })

        if (!oldId || !newId) return message.channel.send({ content: "Please specify 2 players."})
        if (oldId === newId) return message.channel.send({ content: "Please specify 2 different players."})
        if (!oldPlayer) return message.channel.send({ content: `<@${oldId}> is not in the database.`})
        if (!newPlayer) return message.channel.send({ content: `<@${newId}> is not in the database.`})

        const filter = m => m.author.id === message.author.id
        message.channel.send({ content: `Are you sure you want to combine ${oldPlayer.name}'s stats with ${newPlayer.name}'s stats?\n\n⚠️ **WARNING** ⚠️\nThis cannot be undone. ${oldPlayer.name}'s stats will be forever lost.`})
        return await message.channel.awaitMessages({
        filter,
            max: 1,
            time: 15000
        }).then(async collected => {
            if (commands.yescom.includes(collected.first().content.toLowerCase())) {
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

                return message.channel.send({ content: 
                    `${oldPlayer.name}'s ID was replaced with ${newPlayer.name}'s ID in ${count} match records.` +
                    ` ${violations} boosting violation(s) occurred.` +
                    `\n\nStats in the following formats need to be recalculated:\n${formats.join("\n")}`
                })  
            } else {
                return message.channel.send({ content: `Ok then. ${oldPlayer.name}'s stats were not combined with ${newPlayer.name}'s stats.`})
            }
        }).catch(err => {
            console.log(err)
            return message.channel.send({ content: `Sorry, time's up.`})
        })
    }

    // RECALCULATE
    // Use this command to recalculate every player's Elo from scratch.
    // This is needed after matches are directly added or deleted using postgreSQL.
    // It's also required after using the !combine command, but the bot will remind you to do it.
    if (commands.recalccom.includes(cmd)) { 
        if (!hasFullAccess(server)) return message.channel.send({ content: `This feature is only available in Format Library. ${emojis.FL}`}) 
        if (!isMod(server, message.member)) return message.channel.send({ content: "You do not have permission to do that."})
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: mcid
                }
            }
        })
        
        if (!format) return message.channel.send({ content: `Try using **${cmd}** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        const all_stats = await Stats.findAll({ where: { format: format.name, serverId: '414551319031054346' } })

        for (let i = 0; i < all_stats.length; i++) {
            const stats = all_stats[i]
            stats.elo = 500.00
            stats.backupElo = null
            stats.wins = 0
            stats.losses = 0
            stats.games = 0
            await stats.save()
        }
        
        const allMatches = await Match.findAll({ where: { format: format.name, serverId: '414551319031054346' }, order: [["createdAt", "ASC"]]})
        message.channel.send({ content: `Recalculating data for ${allMatches.length} matches. Please wait...`})
        for (let i = 0; i < allMatches.length; i++) {
            const match = allMatches[i]
            const winnerId = match.winnerId
            const loserId = match.loserId
            const winningPlayer = await Player.findOne({ where: { id: winnerId }})
            const winnerStats = await Stats.findOne({ where: { playerId: winnerId, format: format.name, serverId: '414551319031054346' } })
            const losingPlayer = await Player.findOne({ where: { id: loserId }})
            const loserStats = await Stats.findOne({ where: { playerId: loserId, format: format.name, serverId: '414551319031054346' } })

            if (!winningPlayer || !winnerStats) {
                await trackStats(server, winnerId, format.name)
                i--
                continue
            }

            if (!losingPlayer || !loserStats) {
                await trackStats(server, loserId, format.name)
                i--
                continue
            }

            const origEloWinner = winnerStats.elo || 500.00
            const origEloLoser = loserStats.elo || 500.00
            const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
            
            winnerStats.elo = origEloWinner + delta
            winnerStats.backupElo = origEloWinner
            winnerStats.wins++
            winnerStats.games++
            await winnerStats.save()
    
            loserStats.elo = origEloLoser - delta
            loserStats.backupElo = origEloLoser
            loserStats.losses++
            loserStats.games++
            await loserStats.save()

            match.delta = delta
            await match.save()
            console.log(`${format.name} Match ${i+1}: ${winningPlayer.name} > ${losingPlayer.name}`)
        }

        return message.channel.send({ content: `Recalculation complete!`})
    }
} catch (err) {
    console.log(err)
}})