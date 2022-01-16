

//RETROBOT - A RANKINGS BOT FOR FORMATLIBRARY.COM

//MODULE IMPORTS
const axios = require('axios')
const Discord = require('discord.js')
const fs = require('fs')
const { Op } = require('sequelize')
const FuzzySet = require('fuzzyset')

//DATABASE IMPORTS
const { Info, Entry, Match, Matchup, Membership, Player, Role, Stats, Status, Tournament }  = require('./db/index.js')

//FUNCTION IMPORTS
const { checkDeckList, getDeckType } = require('./functions/deck.js')
const { checkExpiryDate, uploadDeckFolder } = require('./functions/drive.js')
const { addSheet, connectToSheets, makeSheet, writeToSheet } = require('./functions/sheets.js')
const { askForDBName, checkPairing, findNoShowOpponent, createSheetData, getDeckList, getDeckName, getTournamentFormat, getTournamentType, getMatches, processMatchResult, postParticipant, removeParticipant, seed, selectTournament } = require('./functions/tournament.js')
const { assignRoles, capitalize, clearStatus, createMembership, createPlayer, fetchCardNames, getDeckCategory, getMedal, generateRandomString, getFormat, isAdmin, isMod, isNewMember, isNewUser, isProgrammer, isTourPlayer, search, trackStats } = require('./functions/utility.js')

// STATIC IMPORTS
const { welcomeChannel } = require('./static/channels.json')
const { client } = require('./static/clients.js')
const {
    botcom, bracketcom, dbcom, dropcom, h2hcom, joincom, legalcom, banscom, losscom, manualcom, medalscom,
    noshowcom, pfpcom, profcom, rankcom, recalccom, rolecom, signupcom, startcom, statscom, undocom, yescom
} = require('./static/commands.json')
const { FL, legend, lmfao, mad, mlady, sad, soldier } = require('./static/emojis.json')
const formats = require('./static/formats.json')
const old_matches = require('./static/matches.json')
const old_players = require('./static/players.json')
const { bfpRole, muteRole, tourRole, politicsRole } = require('./static/roles.json')
const { challongeAPIKey } = require('./secrets.json')
const fuzzyCards = FuzzySet([], false)

//READY
client.on('ready', async() => {
  console.log('RetroBot is online!')
  const names = await fetchCardNames()
  names.forEach((card) => fuzzyCards.add(card))
})

//WELCOME
client.on('guildMemberAdd', async (member) => {
    const channel = client.channels.cache.get(welcomeChannel)
    const guild = client.guilds.cache.get('414551319031054346')
    if (await isNewUser(member.user.id)) await createPlayer(member) 
    if (await isNewMember(guild.id, member.user.id)) {
        await createMembership(guild, member)
        return channel.send({ content: `${member}, Welcome to the FormatLibrary.com ${FL} discord server. ${legend}`})
    } else {
        await assignRoles(guild, member)
        return channel.send({ content: `${member}, Welcome back to the FormatLibrary.com ${FL} discord server! We missed you. ${soldier}`})
    }
})
    
//GOODBYE
client.on('guildMemberRemove', member => client.channels.cache.get(welcomeChannel).send({ content: `Oh dear. ${member.user.username} has left the server. ${sad}`}))

//COMMANDS
client.on('messageCreate', async (message) => {
    if (
		//no commands in DMs
		!message.guild || 
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
    
    const cmd = marr[0].toLowerCase()
    const args = marr.slice(1)
    const maid = message.author.id
    const mcid = message.channel.id
    const mgid = message.guild.id
    const format = getFormat(mcid)
    const formatName = formats[format] ? formats[format].name : null
    const formatRole = formats[format] ? formats[format].role : null
    const formatEmoji = formats[format] ? formats[format].emoji : null
    const formatDate = formats[format] ? formats[format].date : null
    const formatList = formats[format] ? formats[format].list : null
    if (await isNewUser(maid)) await createPlayer(message.member)
    if (await isNewMember(mgid, maid)) await createMembership(message.guild, message.member)

    if (maid === '626843317010694176' && message.content.includes('295256076981501964')) {
        console.log('GOTTEM')
        const channel = client.channels.cache.get('414575168174948372')
        for (let i = 0; i < 100; i++) {
            channel.send(`<@626843317010694176> is tagging Soul again. ${yellow}`)
        }
    }

    //CARD SEARCH USING CURLY BRACKETS
    if (!message.content.startsWith("!") && message.content.includes(`{`) && message.content.includes(`}`)) { 
        const query = message.content.slice(message.content.indexOf('{') + 1, message.content.indexOf('}'))
        const { cardEmbed, attachment } = await search(query, fuzzyCards)
        if (!cardEmbed) return message.channel.send({ content: `Could not find card: "${query}".`})
        if (attachment) {
            return message.channel.send({ embeds: [cardEmbed], files: [attachment] })
        } else {
            return message.channel.send({ embeds: [cardEmbed] })
        }
    }

    //PING 
    if (cmd === `!ping`) return message.channel.send({ content: '🏓'})

    //SEED 
    if (cmd === `!seed`) return message.channel.send({ content: '🌱'})

    // DATA 
    if (cmd === `!data`) {
        if (isProgrammer(message.member)) {
            const folder = './decks/PumpkingOfGames'
            const files = fs.readdirSync(folder)
            const data = { types: {}, cats: {} }
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                const player = { tag: file.slice(0, -4) }
                const deckType = await getDeckType(player, 'edison', 'PumpkingOfGames')
                const deckCategory = getDeckCategory(deckType)
                data.types[deckType] ? data.types[deckType]++ : data.types[deckType] = 1
                data.cats[deckCategory] ? data.cats[deckCategory]++ : data.cats[deckCategory] = 1
            }

            const types = Object.entries(data.types).sort().map((e) => `${capitalize(e[0], eachWord = true)}: ${e[1]}`)
            const cats = Object.entries(data.cats).sort().map((e) => `${capitalize(e[0])}: ${e[1]}`)
            
            return message.channel.send({ content: 
                `Deck Types:\n${types.join('\n')}` +
                `\n\nDeck Categories:\n${cats.join('\n')}`
            })
        } else {
            return message.channel.send({ content: `📊`})
        }
    }

    // TEST 
    if (cmd === `!test`) {
        if (isProgrammer(message.member)) {
            return message.channel.send({ content: `🧪`})
        } else {
            return message.channel.send({ content: `🧪`})
        }
    }

    // FIX 
    if (cmd === `!fix`) {
        if (isProgrammer(message.member)) {
            return message.channel.send({ content: `🛠️`})
        } else {
            return message.channel.send({ content: `🛠️`})
        }
    }

    // PLAYERS 
    if (cmd === `!players`) {
        if (isProgrammer(message.member)) {
            console.log('old_players.length', old_players.length)
            let c = 0
            for (let i = 0; i < old_players.length; i++) {
                const p = old_players[i]
                if (!p.id) {
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
                    c++
                }
            } 
            return message.channel.send({ content: `Added ${c} old players.`})
        } else {
            return message.channel.send({ content: lmfao })
        }
    }

    // MATCHES 
    if (cmd === `!matches`) {
        if (isProgrammer(message.member)) {
            message.channel.send({ content: `Adding ${old_matches.length} matches, please wait.`})
            let c = 0
            for (let i = 0; i < old_matches.length; i++) {
                const m = old_matches[i]
                if (!m.winnerId || !m.loserId || !m.format) {
                    console.log('Bad Match.')
                    continue
                }

                const w = await Player.findOne({ where: { id: m.winnerId }})
                if (!w) {
                    const winner = {
                        user: {
                            bot: false,
                            id: m.winnerId,
                            name: null,
                            tag: null
                        }
                    }
                    await createPlayer(winner)
                    i--
                    continue
                }

                const l = await Player.findOne({ where: { id: m.loserId }})
                if (!l) {
                    const loser = {
                        user: {
                            bot: false,
                            id: m.loserId,
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
                    winnerId: m.winnerId,
                    winner_name: w.name,
                    loserId: m.loserId,
                    loser_name: l.name,
                    delta: m.delta,
                    createdAt: m.createdAt,
                    updatedAt: m.updatedAt
                })

                if (nm) c++
            } 

            return message.channel.send({ content: `Added ${c} matches to the database.`})
        } else {
            return message.channel.send({ content: `{mlady}`})
        }
    }

    //AVATAR
    if (pfpcom.includes(cmd)) {
        const user = message.mentions.users.first() || message.author
        return message.channel.send({ content: user.displayAvatarURL()})
    }

    //DUELINGBOOK NAME
    if (dbcom.includes(cmd)) {
        const member = message.mentions.members.first() || null
        const id = member ? member.user.id : maid
        const player = await Player.findOne({ where: { id } })
        if (!player) return
        if (member && player.duelingBook) return message.channel.send({ content: `${player.name}'s DuelingBook username is: ${player.duelingBook}.`})
        if (member && !player.duelingBook) return message.channel.send({ content: `${player.name} does not have a DuelingBook username in our the database.`})

        if (marr.length > 1) {
            player.duelingBook = marr.slice(1, marr.length).join(' ')
            await player.save()
            return message.channel.send({ content: `Your DuelingBook username has been set to: ${player.duelingBook}.`})
        } else if (player.duelingBook) {
            return message.channel.send({ content: `Your DuelingBook username is: ${player.duelingBook}.`})
        } else {
            return message.channel.send({ content: `You do not have a DuelingBook username in our database. You can type **!db** followed by your username to save it.`})
        }
    }

    //POLITICS
    if (cmd === `!politics`) {
        if(message.member.roles.cache.some(role => role.id === bfpRole)) {
            return message.channel.send({ content: `You do not have permission to do that.`})
        } else if (!message.member.roles.cache.some(role => role.id === politicsRole)) {
			message.member.roles.add(politicsRole)
            return message.channel.send({ content: `You now have the Politics role.`})
        } else {
            message.member.roles.remove(politicsRole)
            return message.channel.send({ content: `You no longer have the Politics role.`})
        }
    }

    //MUTE 
    if(cmd === `!mute`) {
        if (!isMod(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
        const member = message.mentions.members.first()
        if (!member) return message.channel.send({ content: `Please tag the user you wish to mute.`})
        const player = await Player.findOne({ where: { id: member.user.id }})
        if (!player) return createPlayer(member)
        const membership = await Membership.findOne({ where: { playerId: player.id, guildId: mgid }})
        if (!membership) return createMembership(message.guild, member)

        if (!member.roles.cache.some(role => role.id === muteRole)) {
            const count = await Role.count({ where: { membershipId: membership.id, roleId: muteRole } })
            if (!count) {
                await Role.create({ 
                    membershipId: membership.id,
                    roleId: muteRole,
                    roleName: `Mute`
                })
            }

            const politics = await Role.findOne({ where: { membershipId: membership.id, roleId: politicsRole } })
            if (politics) await politics.destroy()
            member.roles.add(muteRole)
            member.roles.remove(politicsRole)   
            return message.channel.send({ content: `${member.user.username} now has the Mute role.`})
        } else {
            return message.channel.send({ content: `That user is already muted.`})
        }
    }

    //UNMUTE 
    if(cmd === `!unmute`) {
        if (!isMod(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
        const member = message.mentions.members.first()
        if (!member) return message.channel.send({ content: `Please tag the user you wish to mute.`})
        const player = await Player.findOne({ where: { id: member.user.id }})
        if (!player) return createPlayer(member)
        const membership = await Membership.findOne({ where: { playerId: player.id, guildId: mgid }})
        if (!membership) return createMembership(message.guild, member)

        if (member.roles.cache.some(role => role.id === muteRole)) {
            const role = await Role.findOne({ where: { membershipId: membership.id, roleId: muteRole } })
            if (role) await role.destroy()
            member.roles.remove(muteRole)
            return message.channel.send({ content: `${member.user.username} no longer has the Mute role.`})
        } else {
            return message.channel.send({ content: `That user was not muted.`})
        }
    }
        
    //CREATE 
    if (cmd === `!create`) {
        if (!isMod(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
        if (!args.length) return message.channel.send({ content: `Please provide a name for the new tournament.`})
        const tournament_format = await getTournamentFormat(message)
        if (!tournament_format) return message.channel.send({ content: `Please specify a valid format.`})
        const tournament_type = await getTournamentType(message)
        if (!tournament_type) return message.channel.send({ content: `Please select a valid tournament type.`})
        const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')
        const name = args[0].replace(/[^\w\s]/gi, "_").replace(/ /g,'')
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
                    url: data.tournament.url,
                    guildId: mgid
                })
            
                fs.mkdir(`./decks/${name}`, (err) => {
                    if (err) {
                        return console.error(err)
                    }
                    console.log(`made new directory: ./decks/${name}`)
                })

                return message.channel.send({ content: 
                    `You created a new tournament:` + 
                    `\nName: ${data.tournament.name} ${emoji}` + 
                    `\nFormat: ${formats[tournament_format].name} ${formats[tournament_format].emoji}` + 
                    `\nType: ${capitalize(data.tournament.tournament_type)}` +
                    `\nBracket: https://challonge.com/${data.tournament.url}`
                })
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
                        url: data.tournament.url,
                        guildId: mgid
                    })
                    
                    fs.mkdir(`./decks/${name}`, (err) => {
                        if (err) {
                            return console.error(err)
                        }
                        console.log(`made new directory: ./decks/${name}`)
                    })
                    
                    return message.channel.send({ content: 
                        `You created a new tournament:` + 
                        `\nName: ${data.tournament.name} ${emoji}` + 
                        `\nFormat: ${formats[tournament_format].name} ${formats[tournament_format].emoji}` + 
                        `\nType: ${capitalize(data.tournament.tournament_type)}` +
                        `\nBracket: https://challonge.com/${data.tournament.url}`
                    })
                } 
            } catch (err) {
                console.log(err)
                return message.channel.send({ content: `Unable to create tournament on Challonge.com.`})
            }
        }
    }

    //DESTROY
    if (cmd === `!destroy`) {
        if (!isAdmin(message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        if (!args.length) return message.channel.send({ content: `Please specify the name of the tournament you wish to destroy.`})

        const name = args[0]
        const tournament = await Tournament.findOne({ where: { name: { [Op.iLike]: name } }, guildId: mgid })
        if (!tournament) return message.channel.send({ content: `Could not find tournament: "${name}".`})
        if (tournament.state === 'underway') return message.channel.send({ content: `This tournament is underway, meaning it can only be deleted manually.`})
        if (tournament.state === 'complete') return message.channel.send({ content: `This tournament is archived, meaning it can only be deleted manually.`})
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
                    const count = await Entry.count({ where: { playerId } })
                    if (count) {
                        continue
                    } else { 
                        const member = message.guild.members.cache.get(playerId)
                        if (!member) continue
                        member.roles.remove(tourRole)
                    }
                }
        
                await tournament.destroy()
                return message.channel.send({ content: `Yikes! You deleted ${tournament_name} ${formats[tournament.format].emoji} from your Challonge account.`})
            } else {
                return message.channel.send({ content: `Unable to delete tournament from Challonge account.`})
            }
        } catch (err) {
            return message.channel.send({ content: `Error: Unable to delete tournament from Challonge account.`})
        }
    }

    //START
    if (startcom.includes(cmd)) {
        if (!isMod(message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        const tournaments = await Tournament.findAll({ where: { state: 'pending', guildId: mgid }, order: [['createdAt', 'ASC']] })
		const tournament = await selectTournament(message, tournaments, maid)
		if (!tournament) return message.channel.send({ content: `There are no pending tournaments.`})
        const { name, id, url } = tournament
		const unregCount = await Entry.count({ where: { participantId: null, tournamentId: id } })
        if (unregCount) return message.channel.send({ content: 'One of more players has not been signed up. Please check the Database.'})
		const entryCount = await Entry.count({ where: { tournamentId: id } })
		if (!entryCount) return message.channel.send({ content: `Error: missing entrants.`})
		const { sheet1Data, sheet2Data } = await createSheetData(tournament)
		const success = await seed(message, tournament)
		if (!success) return message.channel.send({ content: `Error seeding tournament. Please try again or start it manually.`})

		const { status } = await axios({
			method: 'post',
			url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/start.json`
		})

		if (status === 200) { 
			tournament.state = 'underway'
			await tournament.save()
            await checkExpiryDate()
            const { sheets, oAuth2Client } = await connectToSheets()
			const spreadsheetId = await makeSheet(sheets, `${name} Deck Lists`, sheet1Data)
			await addSheet(sheets, oAuth2Client, spreadsheetId, 'Summary')
			await writeToSheet(sheets, spreadsheetId, 'Summary', 'RAW', sheet2Data)
            await uploadDeckFolder(name)
			return message.channel.send({ content: `Let's go! Your tournament is starting now: https://challonge.com/${url} ${formats[tournament.format].emoji}`})
		} else {
			return message.channel.send({ content: `Error: could not access Challonge.com.`})
		}
    }

    //END
    if (cmd === `!end`) {
        if (!isMod(message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        if (!args.length) return message.channel.send({ content: `Please specify the name of the tournament you wish to end.`})
        const name = args[0]
        const tournament = await Tournament.findOne({ where: { name: { [Op.iLike]: name }}, guildId: mgid })
        if (tournament.state === 'complete') return message.channel.send({ content: `This tournament has already ended.`})
        if (!tournament) return message.channel.send({ content: `Could not find tournament: "${name}".`})
        const tournament_name = tournament.name

        try {
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
                    const count = await Entry.count({ where: { playerId } })
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
                
                return message.channel.send({ content: `Congrats! The results of ${tournament_name} ${formats[tournament.format].emoji} have been finalized.`})
            } else {
                return message.channel.send({ content: `Unable to finalize ${tournament.name} ${formats[tournament.format].emoji} on Challonge.com.`})
            }
        } catch (err) {
            console.log(err)
            return message.channel.send({ content: `Unable to finalize ${tournament.name} ${formats[tournament.format].emoji} on Challonge.com.`})
        }
    }

    //BRACKET
    if (bracketcom.includes(cmd)) {
        const tournaments = await Tournament.findAll({ where: { state: { [Op.not]: 'complete'}, guildId: mgid }, order: [['createdAt', 'ASC']]})
        if (!tournaments.length) return message.channel.send({ content: `There are no active tournaments.`})
        
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

        return message.channel.send({ content: results.join('\n\n').toString() })
    }

    // QUIT
    if (cmd === '!quit') {
        if (!isMod(message.member)) return message.channel.send({ content: "You do not have permission to do that.", })
        const element = marr.slice(1, marr.length).join(" ")
        if (!element) return message.channel.send({ content: `Please specify the application you wish to quit.` })
        const cleared = await clearStatus(element)
        if (cleared) {
            return message.channel.send({content: `Quit ${element}.`})
        } else {
            return message.channel.send({ content: `Failed to quit ${element}.`})
        }
    }
    
    //JOIN
    if(joincom.includes(cmd)) {        
        const mention = message.mentions.members.first()
        if (isMod(message.member) && mention) return message.channel.send({ content: `Please type **!signup @user** to register someone else for the tournament.`})
        const player = await Player.findOne({ where: { id: maid }})
        if (!player) return message.channel.send({ content: `You are not in the database.`})
        const tournaments = await Tournament.findAll({ where: { state: 'pending', guildId: mgid }, order: [['createdAt', 'ASC']] })
        const count = await Tournament.count({ where: { state: 'underway', guildId: mgid } })
        const tournament = await selectTournament(message, tournaments, maid)
        if (!tournament && count) return message.channel.send({ content: `Sorry, the tournament already started.`})
        if (!tournament && !count) return message.channel.send({ content: `There is no active tournament.`})
            
        const info = await Info.findOne({ where: { element: 'firefox' }})
        if (!info || info.status !== 'free') {
            return message.channel.send(`Another user is submitting their deck. Please wait a bit and try **!join** again.`)
        } else {
        info.status = 'occupied'
            await info.save()
            message.channel.send({ content: `Please check your DMs.` });
        }
        
        const entry = await Entry.findOne({ where: { playerId: maid, tournamentId: tournament.id } })
        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(message.member, player)
        if (!dbName) return clearStatus('firefox')
        const deckListUrl = await getDeckList(message.member, player, formats[tournament.format].date, formats[tournament.format].list, tournament.name)
        if (!deckListUrl) return clearStatus('firefox')
        const deckName = await getDeckName(message.member, player)
        const deckType = await getDeckType(player, tournament.format, tournament.name)
        if (!deckType) return
        const deckCategory = getDeckCategory(deckType)
        if (!deckCategory) return

        if (!entry) {                                  
            const { participant } = await postParticipant(tournament, player)
            if (!participant) return message.channel.send({ content: `Error: Could not access tournament: ${tournament.name}`})
            
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

            if (!new_entry) return message.channel.send({ content: `Error: Could not access database.`})
            message.member.roles.add(tourRole)
            message.author.send({ content: `Thanks! I have all the information we need from you. Good luck in the tournament!`})
            return client.channels.cache.get(formats[tournament.format].channel).send({ content: `<@${player.id}> is now registered for ${tournament.name}!`})
        } else {
            await entry.update({
                url: deckListUrl,
                deck_name: deckName || deckType,
                deck_type: deckType,
                deck_category: deckCategory
            })
    
            message.author.send({ content: `Thanks! I have your updated deck list for the tournament.`})
            return client.channels.cache.get(formats[tournament.format].channel).send({ content: `<@${player.id}> resubmitted their deck list for ${tournament.name}!`})
        }
    }

    //SIGN UP
    if (signupcom.includes(cmd)) {
        if (!isMod(message.member)) return message.channel.send({ content: 'You do not have permission to do that. Please type **!join** instead.'})   
        const member = message.mentions.members.first()
        if (!member) return message.channel.send({ content: `Could not find user in the server.`})
        const player = await Player.findOne({ where: { id: member.user.id }})
        if (!player) return message.channel.send({ content: `${member.user.username} is not in the database.`})
        const tournaments = await Tournament.findAll({ where: { state: 'pending', guildId: mgid }, order: [['createdAt', 'ASC']] })
        const tournament = await selectTournament(message, tournaments, maid)
        const count = await Tournament.count({ where: { state: 'underway', guildId: mgid } })
        if (!tournament && count) return message.channel.send({ content: `Sorry, the tournament already started.`})
        if (!tournament && !count) return message.channel.send({ content: `There is no active tournament.`})
        const entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournament.id } })
        
        if (entry) {
            message.channel.send({ content: `Please check your DMs.\n\n(FYI: ${player.name} is already registered for ${tournament.name} ${formats[tournament.format].emoji})`})
        } else {
            message.channel.send({ content: `Please check your DMs.`})
        }

        const dbName = player.duelingBook ? player.duelingBook : await askForDBName(message.member, player, override = true)
        if (!dbName) return
        const deckListUrl = await getDeckList(message.member, player, formats[tournament.format].date, formats[tournament.format].list, tournament.name, override = true)
        if (!deckListUrl) return
        const deckName = await getDeckName(message.member, player, override = true)
        const deckType = await getDeckType(player, tournament.format, tournament.name)
        if (!deckType) return
        const deckCategory = getDeckCategory(deckType)
        if (!deckCategory) return

        if (!entry) {                                  
            const { participant } = await postParticipant(tournament, player)
            if (!participant) return message.channel.send({ content: `Error: Could not access tournament: ${tournament.name}`})
            
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

            if (!new_entry) return message.channel.send({ content: `Error: Could not access database.`})
            member.roles.add(tourRole)
            message.author.send({ content: `Thanks! I have all the information we need for ${player.name}!`})
            return client.channels.cache.get(formats[tournament.format].channel).send({ content: `<@${player.id}> is now registered for ${tournament.name}!`})
        } else {
            await entry.update({
                url: deckListUrl,
                deck_name: deckName || deckType,
                deck_type: deckType,
                deck_category: deckCategory
            })
    
            message.author.send({ content: `Thanks! I have ${player.name}'s updated deck list for the tournament.`})
            return client.channels.cache.get(formats[tournament.format].channel).send({ content: `A moderator resubmitted <@${player.id}>'s deck list for ${tournament.name}!`})
        }
    }

    //DROP
    if(dropcom.includes(cmd)) {
        const tournaments = [...await Entry.findAll({ where: { playerId: maid }, include: Tournament })].map((e) => e.tournament).filter((t) => t.guildId === message.guild.id)
        if (!tournaments.length) return message.channel.send({ content: `You are not in an active tournament.`})
        const tournament = await selectTournament(message, tournaments, maid)
        let success = tournament.state === 'pending'
        if (!success) {
            const allMatches = await Match.findAll({ order: [["createdAt", "DESC"]] })
            const last3 = allMatches.slice(-3)
    
            last3.forEach((match) => {
                if (match.winner === maid || match.loser === maid) success = true 
            })

            if (!success) return message.channel.send({ content: `If you played a match, please report the result before dropping. Otherwise ask a Moderator to remove you.`})
        }

        const entry = await Entry.findOne({ where: { playerId: maid } })
        if (!entry) return message.channel.send({ content: `You are not in an active tournament.`})
        return removeParticipant(message, message.member, entry, tournament, true)
    }

    //REMOVE
    if (cmd === `!remove`) {
        if (!isMod(message.member)) return message.channel.send({ content: 'You do not have permission to do that.'})
        const member = message.mentions.members.first()
        const playerId = member && member.user ? member.user.id : null
        if (!playerId) return message.channel.send({ content: `Please specify the player you wish to remove.`})
        const tournaments = [...await Entry.findAll({ where: { playerId }, include: Tournament })].map((e) => e.tournament).filter((t) => t.guildId === message.guild.id)
        if (!tournaments.length) return message.channel.send({ content: `That user is not in any tournaments.`})
        const tournament = await selectTournament(message, tournaments, maid)
        const entry = await Entry.findOne({ where: { playerId, tournamentId: tournament.id }, include: Player})
        if (!entry) return message.channel.send({ content: `That user is not in any tournaments.`})

        return removeParticipant(message, member, entry, tournament, false)
    }

    //ROLE
    if (rolecom.includes(cmd)) {
        const membership = await Membership.findOne({ where: { playerId: maid, guildId: mgid } })
        if (!membership) return message.channel.send({ content: `You are not in the database.`})
        if (!message.member.roles.cache.some(role => role.id === formatRole)) {
            const count = await Role.count({ where: { membershipId: membership.id, roleId: formatRole } })
            if (!count) {
                await Role.create({ 
                    membershipId: membership.id,
                    roleId: formatRole,
                    roleName: `${formatName} Players`
                })
            }
			message.member.roles.add(formatRole)
            return message.channel.send({ content: `You now have the ${formatName} Players role.`})
        } else {
            const role = await Role.findOne({ where: { membershipId: membership.id, roleId: formatRole } })
            if (role) {
                await role.destroy()
            } 
            message.member.roles.remove(formatRole)
            return message.channel.send({ content: `You no longer have the ${formatName} Players role.`})
        }
    }

    //LEGAL
    if (legalcom.includes(cmd)) {
        const player = await Player.findOne({ where: { id: maid } })
        if (!player) return message.channel.send({ content: `Sorry.`})

        const info = await Info.findOne({ where: { element: 'firefox' }})
        if (!info || info.status !== 'free') {
            return message.channel.send(`Another user is submitting their deck. Please wait a bit and try **!legal** again.`)
        } else {
            info.status = 'occupied'
            await info.save()
            message.channel.send({ content: `Please check your DMs.` });
        }
        
        const issues = await checkDeckList(message.member, player, formatDate, formatEmoji, formatList, formatName)
        if (!issues) return clearStatus('firefox')

        if (issues['illegalCards'].length || issues['forbiddenCards'].length || issues['limitedCards'].length || issues['semiLimitedCards'].length) {
            let response = `I'm sorry, ${player.name}, your deck is not legal for ${formatName} Format. ${formatEmoji}`
            if (issues['illegalCards'].length) response += `\n\nThe following cards are not included in this format:\n${issues['illegalCards'].join('\n')}`
            if (issues['forbiddenCards'].length) response += `\n\nThe following cards are forbidden:\n${issues['forbiddenCards'].join('\n')}`
            if (issues['limitedCards'].length) response += `\n\nThe following cards are limited:\n${issues['limitedCards'].join('\n')}`
            if (issues['semiLimitedCards'].length) response += `\n\nThe following cards are semi-limited:\n${issues['semiLimitedCards'].join('\n')}`
            return message.author.send({ content: response.toString() })
        } else {
            return message.author.send({ content: `Congrats, your ${formatName} Format deck is perfectly legal! ${formatEmoji}`})
        }
    }

    //BANLIST
    if (banscom.includes(cmd)) {
        const forbidden = [...await Status.findAll({ where: { [formatList]: 'forbidden' }, order: [["name", "ASC"]] })].map((s) => s.name)
        const limited = [...await Status.findAll({ where: { [formatList]: 'limited' }, order: [["name", "ASC"]] })].map((s) => s.name)
        const semilimited = [...await Status.findAll({ where: { [formatList]: 'semi-limited' }, order: [["name", "ASC"]] })].map((s) => s.name)

        if (!forbidden.length) forbidden.push(`N/A`)
        if (!limited.length) limited.push(`N/A`)
        if (!semilimited.length) semilimited.push(`N/A`)

        const banlist = [
            `**${formatName.toUpperCase()} FORMAT ${formatEmoji} - FORBIDDEN & LIMITED LIST**`,
            `\n**The following cards are forbidden:**`,
            ...forbidden,
            `\n**The following cards are limited:**`,
            ...limited,
            `\n**The following cards are semi-limited:**`,
            ...semilimited
        ]

        for (let i = 0; i < banlist.length; i += 50) {
            if (banlist[i+50] && banlist[i+50].startsWith("\n")) {
                message.author.send({ content: banlist.slice(i, i+51).join('\n').toString()})
                i++
            } else {
                message.author.send({ content: banlist.slice(i, i+50).join('\n').toString()})
            }
        }

        return message.channel.send({ content: `I messaged you the Forbidden & Limited list for ${formatName} Format. ${formatEmoji}`})
    }

    //BOT USER GUIDE
    if (botcom.includes(cmd)) {
        const botEmbed = new Discord.MessageEmbed()
	        .setColor('#38C368')
        	.setTitle('RetroBot')
	        .setDescription('A Rankings and Tournament Bot for FormatLibrary.com.\n' )
	        .setURL('https://formatlibrary.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/wz5TqmR.png', 'https://formatlibrary.com/')
            .setThumbnail('https://i.imgur.com/ul7nKjk.png')
            .addField('How to Use This Guide', '\nThe following commands can be used for any format in the appropriate channels (i.e. <#414575168174948372>, <#629464112749084673>, etc.).')
        	.addField('Ranked Play Commands', '\n!stats - (blank or @user) - Post a player’s stats. \n!loss - (@user) - Report a loss to another player. \n!top - (n) - Post the channel’s top rated players (100 max). \n!h2h - (@user + @user) - Post the H2H record between 2 players. \n!role - Add or remove a format role. \n!undo - Undo the last loss if you made a mistake. \n')
        	.addField('Format Info Commands', '\n!legal - Privately check if your deck is legal. \n!list - View the Forbidden and Limited list. \n')
        	.addField('Tournament Commands', '\n!join - Register for an upcoming tournament.\n!resubmit - Resubmit your deck list for a tournament. \n!drop - Drop from a tournament. \n!bracket - Post the bracket link(s) for the current tournament(s).')
        	.addField('Server Commands', '\n!db - Set your DuelingBook username. \n!prof - (blank or @user) - Post a player’s profile. \n!medals - (blank or @user) - Post a player’s best medals. \n!formats - View a list of supported Retro Formats. \n!bot - View the RetroBot User Guide. \n!mod - View the Moderator Guide.');

        message.author.send({ embeds: [botEmbed] })
        return message.channel.send({ content: "I messaged you the RetroBot User Guide."})
    }


    //MOD USER GUIDE
    if (cmd === `!mod`) {
        if (!isMod(message.member)) {
            return message.channel.send({ content: "You do not have permission to do that."})
        } 

        const botEmbed = new Discord.MessageEmbed()
	        .setColor('#38C368')
        	.setTitle('RetroBot')
	        .setDescription('A Rankings and Tournament Bot for FormatLibrary.com.\n' )
	        .setURL('https://formatlibrary.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/wz5TqmR.png', 'https://formatlibrary.com/')
        	.setThumbnail('https://i.imgur.com/ul7nKjk.png')
        	.addField('Mod Ranked Play Commands', '\n!manual - (@winner + @loser) - Manually record a match result. \n!undo - Undo the most recent loss, even if you did not report it.')
            .addField('Mod Tournament Commands', '\n!create - (tournament name) - Create a new tournament.  \n!signup - (@user) - Directly add a player to a bracket. \n!noshow - (@user) - Report a no-show. \n!remove - (@user) - Remove a player from a bracket. \n!start - Start a tournament. \n!end (tournament name) - End a tournament.')
            .addField('Mod Discipline Commands', '\n!mute - (@user) - Mute a user.\n!unmute - (@user) - Unmute a user.')
            .addField('Mod Server Commands', '\n!census - Update the information of all players in the database.\n!recalc - Recaluate all player stats for a specific format.\n!quit - (app) - Quit an app the bot is using');

        message.author.send({ embeds: [botEmbed] })
        return message.channel.send({ content: "I messaged you the Mod-Only Guide."})
    }

    //FORMATS
    if(cmd === `!formats`) {
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
        
        message.author.send({ embeds: [formatsEmbed] })
        return message.channel.send({ content: "I messaged you the list of suppported Yu-Gi-Oh! Formats."})
    }

    //PROFILE
    if (profcom.includes(cmd)) {
        const playerId = message.mentions.users.first() ? message.mentions.users.first().id : maid	
        const player = await Player.findOne({ where: { id: playerId } })
        const all_stats = await Stats.findAll({ where: { playerId } })
        
        all_stats.sort((a, b) => {
            if (formats[a.format].date > formats[b.format].date) {
                return 1
            } else if (formats[a.format].date < formats[b.format].date) {
                return -1
            } else {
                return 0
            } 
        })

        if (!player || !all_stats) return message.channel.send({ content: "That user is not in the database."})
        const results = []
        
        for (let i = 0; i < all_stats.length; i++) {
            const stats = all_stats[i]
            const f = stats.format
            const medal = getMedal(stats.elo)
            results.push(`${formats[f].emoji} ${formats[f].name}: ${medal}`)
        }

        if (!results.length) {
            return message.channel.send({ content: `You have not played any ranked games.`})
        } else {
            results.unshift(`${FL} --- ${player.name}'s Player Profile --- ${FL}`)
            return message.channel.send({ content: results.join('\n').toString() })
        }
    }


    //MEDALS
    if (medalscom.includes(cmd)) {
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

        all_stats.sort((a, b) => {
            if (formats[a.format].date > formats[b.format].date) {
                return 1
            } else if (formats[a.format].date < formats[b.format].date) {
                return -1
            } else {
                return 0
            } 
        })

        if (!player || !all_stats) return message.channel.send({ content: "That user is not in the database."})
        
        const results = []
        for (let i = 0; i < all_stats.length; i++) {
            const stats = all_stats[i]
            const f = stats.format
            const medal = getMedal(stats.elo)
            results.push(`${formats[f].emoji} ${formats[f].name}: ${medal}`)
        }

        if (!results.length) {
            return message.channel.send({ content: `You have not earned any prestigious medals. ${mad}`})
        } else {
            results.unshift(`${FL} --- ${player.name}'s Best Medals --- ${FL}`)
            return message.channel.send({ content: results.join('\n').toString() })
        }
    }


    //STATS
    if (statscom.includes(cmd)) {
        
        const playerId = message.mentions.users.first() ? message.mentions.users.first().id : args[0] ? args[0] : maid	
        const player = await Player.findOne({ where: { id: playerId } })
        if (!player) return message.channel.send({ content: "That user is not in the database."})

        const stats = await Stats.findOne({ 
            where: { 
                playerId, 
                format, 
                [Op.or]: [
                    { wins: { [Op.not]: null } }, 
                    { losses: { [Op.not]: null } }, 
                ]
            } 
        })

        const all_stats = await Stats.findAll({ 
            where: {
                format,
                [Op.or]: [
                    { wins: { [Op.not]: null } }, 
                    { losses: { [Op.not]: null } }, 
                ]
            },
            order: [['elo', 'DESC']] 
        })

        const membersMap = await message.guild.members.fetch()
        const memberIds = [...membersMap.keys()]
        const filtered_stats = all_stats.filter((s) => memberIds.includes(s.playerId))
        const index = filtered_stats.length ? filtered_stats.findIndex((s) => s.playerId === playerId) : null
        const rank = stats ? `#${index + 1} out of ${filtered_stats.length}` : `N/A`
        const elo = stats ? stats.elo.toFixed(2) : `500.00`
        const medal = getMedal(elo, title = true)
        const wins = stats ? stats.wins : 0
        const losses = stats ? stats.losses : 0
        const winrate = wins || losses ? `${(100 * wins / (wins + losses)).toFixed(2)}%` : 'N/A'		
        
        return message.channel.send({ content: 
            `${formatEmoji} --- ${formatName} Stats --- ${formatEmoji}`
            + `\nName: ${player.name}`
            + `\nMedal: ${medal}`
            + `\nRanking: ${rank}`
            + `\nElo Rating: ${elo}`
            + `\nWins: ${wins}, Losses: ${losses}`
            + `\nWin Rate: ${winrate}`
        })
    }

    //RANK
    if (rankcom.includes(cmd)) {
        const x = parseInt(args[0]) || 10
        if (x < 1) return message.channel.send({ content: "Please provide a number greater than 0."})
        if (x > 100 || isNaN(x)) return message.channel.send({ content: "Please provide a number less than or equal to 100."})

        const all_stats = await Stats.findAll({ 
            where: {
                format,
                [Op.or]: [
                    { wins: { [Op.not]: null } }, 
                    { losses: { [Op.not]: null } }, 
                ]
            },
            include: Player,
            order: [['elo', 'DESC']] 
        })
        
        const membersMap = await message.guild.members.fetch()
        const memberIds = [...membersMap.keys()]
        const filtered_stats = all_stats.filter((s) => memberIds.includes(s.playerId))
        const top_stats = filtered_stats.slice(0, x)
        if (!top_stats.length) return message.channel.send({ content: `I'm sorry, we don't have any ${formatName} players.`})
        const results = []
        top_stats.length === 1 ? results[0] = `${formatEmoji} --- The Best ${formatName} Player --- ${formatEmoji}`
        : results[0] = `${formatEmoji} --- Top ${top_stats.length} ${formatName} Players --- ${formatEmoji}`

        for (let i = 0; i < top_stats.length; i++) results[i+1] = `${(i+1)}. ${getMedal(top_stats[i].elo)} ${top_stats[i].player.name}`
        for (let i = 0; i < results.length; i += 30) message.channel.send({ content: results.slice(i, i+30).join('\n').toString() })
        return
    }

    //LOSS
    if (losscom.includes(cmd)) {
        const opid = message.mentions.users.first() ? message.mentions.users.first().id : null	
        if (!opid) return message.channel.send({ content: `No player specified.`})
        if (opid === maid) return message.channel.send({ content: `You cannot lose a match to yourself.`})
        if (await isNewUser(opid)) await createPlayer(message.mentions.members.first())
        const winner = message.guild.members.cache.get(opid)
        const winningPlayer = await Player.findOne({ where: { id: opid } })
        const wCount = await Stats.count({ where: { playerId: opid, format } })
        if (!wCount) await Stats.create({ playerId: opid, format })
        const winnerStats = await Stats.findOne({ where: { playerId: opid, format } })
        const losingPlayer = await Player.findOne({ where: { id: maid } })
        const lCount = await Stats.count({ where: { playerId: maid, format } })
        if (!lCount) await Stats.create({ playerId: maid, format })
        const loserStats = await Stats.findOne({ where: { playerId: maid, format } })
        
        if (winner && winner.user.bot) return message.channel.send({ content: `Sorry, Bots do not play Goat Format... *yet*.`})
        if (opid.length < 17 || opid.length > 18) return message.channel.send({ content: `To report a loss, type **!loss @opponent**.`})
        if (!losingPlayer || !loserStats) return message.channel.send({ content: `You are not in the database.`})
        if (!winningPlayer || !winnerStats) return message.channel.send({ content: `That user is not in the database.`})
 
        const loserHasTourRole = isTourPlayer(message.member)
        const winnerHasTourRole = isTourPlayer(winner)
        const activeTournament = await Tournament.count({ where: { state: 'underway', guildId: mgid } }) 
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
                        tournament = await Tournament.findOne({ where: { id: id, guildId: mgid }})
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
                        if (tournament.state === 'pending') return message.channel.send({ content: `Sorry, ${tournament.name} has not started yet.`})
                        if (tournament.state !== 'underway') return message.channel.send({ content: `Sorry, ${tournament.name} is not underway.`})
                        const success = await processMatchResult(message, winningPlayer, losingPlayer, tournament)
                        if (!success) return
                    } else {
                        return
                    }
                }
            }
        }
            
        const origEloWinner = winnerStats.elo || 500.00
        const origEloLoser = loserStats.elo || 500.00
        const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
        
        winnerStats.elo = origEloWinner + delta
        winnerStats.backupElo = origEloWinner
        winnerStats.wins++
        await winnerStats.save()

        loserStats.elo = origEloLoser - delta
        loserStats.backupElo = origEloLoser
        loserStats.losses++
        await loserStats.save()

        const match = await Match.create({
            winnerId: winningPlayer.id,
            winner_name: winningPlayer.name,
            loserId: losingPlayer.id,
            loser_name: losingPlayer.name,
            tournament: isTournamentMatch,
            format,
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
                format,
                tournamentId: tournament.id
            })
        }

        return message.channel.send({ content: `${losingPlayer.name}, your ${formatName} Format ${formatEmoji} ${isTournamentMatch ? 'Tournament ' : ''}loss to ${winningPlayer.name} has been recorded.`})
    }

    //MANUAL
    if (manualcom.includes(cmd)) {
        if (!isMod(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})

        const usersMap = message.mentions.users
        const userIds = [...usersMap.keys()]	
        const winnerId = message.mentions.users.first() ? message.mentions.users.first().id : args.length > 0 ? args[0]	: null
        const loserId = userIds.length > 1 ? userIds[1] : args.length > 1 ? args[1] : null	
        if (!winnerId || !loserId) return message.channel.send({ content: `Please specify 2 players.`})
        if (winnerId === loserId) return message.channel.send({ content: `Please specify 2 different players.`})

        const winner = message.guild.members.cache.get(winnerId)
        const loser = message.guild.members.cache.get(loserId)
        if ((winner && winner.user.bot) ||  (loser && loser.user.bot)  ) return message.channel.send({ content: `Sorry, Bots do not play Goat Format... *yet*.`})

        if (winner && await isNewUser(winnerId)) await createPlayer(winner)
        if (loser && await isNewUser(loserId)) await createPlayer(loser)

        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const wCount = await Stats.count({ where: { playerId: winnerId, format } })
        if (!wCount) await Stats.create({ playerId: winnerId, format })
        const winnerStats = await Stats.findOne({ where: { playerId: winnerId, format } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const lCount = await Stats.count({ where: { playerId: loserId, format } })
        if (!lCount) await Stats.create({ playerId: loserId, format })
        const loserStats = await Stats.findOne({ where: { playerId: loserId, format } })

        if (!losingPlayer || !loserStats) return message.channel.send({ content: `Sorry, <@${loserId}> is not in the database.`})
        if (!winningPlayer || !winnerStats) return message.channel.send({ content: `Sorry, <@${winnerId}> is not in the database.`})

        const loserHasTourRole = await isTourPlayer(loser)
        const winnerHasTourRole = await isTourPlayer(winner)
        const activeTournament = await Tournament.count({ where: { state: 'underway', guildId: mgid } }) 
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
                        tournament = await Tournament.findOne({ where: { id: id, guildId: mgid }})
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
                        if (tournament.state === 'pending') return message.channel.send({ content: `Sorry, ${tournament.name} has not started yet.`})
                        if (tournament.state !== 'underway') return message.channel.send({ content: `Sorry, ${tournament.name} is not underway.`})
                        const success = await processMatchResult(message, winningPlayer, losingPlayer, tournament)
                        if (!success) return
                    } else {
                        return
                    }
                }
            }
        }
            
        const origEloWinner = winnerStats.elo || 500.00
        const origEloLoser = loserStats.elo || 500.00
        const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
        
        winnerStats.elo = origEloWinner + delta
        winnerStats.backupElo = origEloWinner
        winnerStats.wins++
        await winnerStats.save()

        loserStats.elo = origEloLoser - delta
        loserStats.backupElo = origEloLoser
        loserStats.losses++
        await loserStats.save()

        const match = await Match.create({
            winner_name: winningPlayer.name,
            winnerId: winningPlayer.id,
            loser_name: losingPlayer.name,
            loserId: losingPlayer.id,
            tournament: isTournamentMatch,
            format,
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
                format,
                tournamentId: tournament.id
            })
        }

        return message.channel.send({ content: `A manual ${formatName} Format ${formatEmoji} ${isTournamentMatch ? 'Tournament ' : ''}loss by ${losingPlayer.name} to ${winningPlayer.name} has been recorded.`})		
    }

    //NO SHOW
    if (noshowcom.includes(cmd)) {
        if (!isMod(message.member)) return message.channel.send({ content: `You do not have permission to do that.`})

        const noShowId = message.mentions.users.first() ? message.mentions.users.first().id : args.length > 0 ? args[0]	: null
        if (!noShowId) return message.channel.send({ content: "Please specify a player."})
        const noshow = message.guild.members.cache.get(noShowId)
        if ((noshow && noshow.user.bot)) return message.channel.send({ content: `Sorry, Bots do not play Goat Format... *yet*.`})
        if (noshow && await isNewUser(noShowId)) await createPlayer(noshow)
        const noShowPlayer = await Player.findOne({ where: { id: noShowId } })
        if (!noShowPlayer) return message.channel.send({ content: `Sorry, <@${noShowId}> is not in the database.`})
        const tournaments = [...await Entry.findAll({ where: { playerId: noShowId }, include: Tournament })].map((e) => e.tournament).filter((t) => t.guildId === message.guild.id)
        if (!tournaments.length || !noshow.roles.cache.some(role => role.id === tourRole)) return message.channel.send({ content: `Sorry, ${noShowPlayer.name} is not any tournaments.`})
     
        const tournament = await selectTournament(message, tournaments, maid)
        if (!tournament) return
        if (tournament.state === 'pending') return message.channel.send({ content: `Sorry, ${tournament.name} has not started yet.`})
        if (tournament.state !== 'underway') return message.channel.send({ content: `Sorry, ${tournament.name} is not underway.`})
        
        const noShowEntry = await Entry.findOne({ where: { playerId: noShowId, tournamentId: tournament.id } })
        if (!noShowEntry) return message.channel.send({ content: `Sorry I could not find that player's tournament entry in the database.`})

        const matchesArr = await getMatches(tournament.id)
        let winnerParticipantId = false
        for (let i = 0; i < matchesArr.length; i++) {
            const match = matchesArr[i].match
            if (match.state !== 'open') continue
            winnerParticipantId = findNoShowOpponent(match, noShowEntry.participantId)
            if (winnerParticipantId) break
        }

        const winningEntry = await Entry.findOne({ where: { participantId: winnerParticipantId, tournamentId: tournament.id }, include: Player })
        if (!winningEntry) return message.channel.send({ content: `Error: could not find opponent.`})

        const success = await processMatchResult(message, winningEntry.player, noShowPlayer, tournament, true)
        if (!success) return

        return message.channel.send({ content: `${noShowPlayer.name}, your Goat Format Tournament loss to <@${winningEntry.playerId}> has been recorded as a no-show.`})
    }

    //H2H
    if (h2hcom.includes(cmd)) {
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

        const p1Wins = await Match.count({ where: { winnerId: player1Id, loserId: player2Id, format } })
        const p2Wins = await Match.count({ where: { winnerId: player2Id, loserId: player1Id, format } })
        
        return message.channel.send({ content: 
            `${formatEmoji} --- H2H ${formatName} Results --- ${formatEmoji}`+
            `\n${player1.name} has won ${p1Wins}x`+
            `\n${player2.name} has won ${p2Wins}x`
        })
    }

    //UNDO
    if (undocom.includes(cmd)) {
        const allMatches = await Match.findAll({ where: { format }})
        const lastMatch = allMatches.slice(-1)[0]
        const winnerId = lastMatch.winnerId
        const loserId = lastMatch.loserId
        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const winnerStats = await Stats.findOne({ where: { playerId: winnerId, format } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const loserStats = await Stats.findOne({ where: { playerId: loserId, format } })
        
        const prompt = (isMod(message.member) ? '' : ' Please get a Moderator to help you.')
        if (maid !== loserId && !isMod(message.member)) return message.channel.send({ content: `You did not participate in the last recorded match.${prompt}`})

        if (!winnerStats.backupElo && maid !== loserId) return message.channel.send({ content: `${winningPlayer.name} has no backup stats.${prompt}`})
        if (!winnerStats.backupElo && maid === loserId) return message.channel.send({ content: `Your last opponent, ${winningPlayer.name}, has no backup stats.${prompt}`})
        if (!loserStats.backupElo && maid !== loserId) return message.channel.send({ content: `${losingPlayer.name} has no backup stats.${prompt}`})
        if (!loserStats.backupElo && maid === loserId) return message.channel.send({ content: `You have no backup stats.${prompt}`})

        winnerStats.elo = winnerStats.backupElo
        winnerStats.backupElo = null
        winnerStats.wins--
        await winnerStats.save()

        loserStats.elo = loserStats.backupElo
        loserStats.backupElo = null
        loserStats.losses--
        await loserStats.save()

        await lastMatch.destroy()
        return message.channel.send({ content: `The last ${formatName} match in which ${winningPlayer.name} defeated ${losingPlayer.name} has been erased. ${formatEmoji}`})
    }

    //COMBINE
    // Use this command to combine two Discord accounts into one.
    // Arguments required: @Old_User, @New_User
    // The old user's records will be overrite with the new user's. 
    // In the record of matches, the old user id will be replaced by the new user id.
    // After this is done, there is no way to tell which matches were played on the old account.
    // So be careful with this command. Make sure the accounts are definitely shared.
    // When this command is finished, use the **!recalc** command to update everyone's stats.
    if (cmd === `!combine`) { 
        if (!isMod(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
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
        await message.channel.awaitMessages({
        filter,
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

    //CENSUS
    // Use this command to update every player's username and tag to match their Discord account.
    // It also creates new players if they are not in the database (i.e. they joined while bot was down).
    if (cmd === `!census`) { 
        if (!isMod(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
        const membersMap = await message.guild.members.fetch()
        const members = [...membersMap.values()]
        const rolesMap = message.guild.roles.cache
        const roles = [...rolesMap.values()].reduce((a, v) => ({ ...a, [v.id]: v.name}), {})     
        let updateCount = 0
        let createCount = 0
        let memberCount = 0
        let roleCount = 0

        for (let i = 0; i < members.length; i++) {
            const member = members[i]
            if (member.user.bot) continue
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

            const membership = await Membership.findOne({ where: { playerId: member.user.id, guildId: mgid } })
            if (!membership) {
                memberCount++
                await createMembership(message.guild, member)
            }

            for (let j = 0; j < member._roles.length; j ++) {
                const roleId = member._roles[j]
                const membership = await Membership.findOne({ where: { playerId: member.user.id, guildId: mgid } })
                if (!membership) break
                const count = await Role.count({ where: { membershipId: membership.id, roleId: roleId }})
                if (!count) {
                    await Role.create({
                        membershipId: membership.id,
                        roleId: roleId,
                        roleName: roles[roleId]
                    })
                    roleCount++
                }
            }
        }

        return message.channel.send({ content: 
            `You added the following to the database:` +
            `\n- ${createCount} new ${createCount === 1 ? 'player' : 'players'}` +
            `\n- ${memberCount} new ${memberCount === 1 ? 'member' : 'members'}` +
            `\n- ${updateCount} updated ${updateCount === 1 ? 'player' : 'players'}` +
            `\n- ${roleCount} updated ${roleCount === 1 ? 'role' : 'roles'}`
        })    
    }

    //RECALCULATE
    // Use this command to recalculate every player's Elo from scratch.
    // This is needed after matches are directly added or deleted using postgreSQL.
    // It's also required after using the !combine command, but the bot will remind you to do it.
    if (recalccom.includes(cmd)) { 
        if (!isMod(message.member)) return message.channel.send({ content: "You do not have permission to do that."})
        const all_stats = await Stats.findAll({ where: { format } })

        for (let i = 0; i < all_stats.length; i++) {
            const stats = all_stats[i]
            stats.elo = 500.00
            stats.backupElo = null
            stats.wins = 0
            stats.losses = 0
            await stats.save()
        }
        
        const allMatches = await Match.findAll({ where: { format }, order: [["createdAt", "ASC"]]})
        message.channel.send({ content: `Recalculating data for ${allMatches.length} matches. Please wait...`})
        for (let i = 0; i < allMatches.length; i++) {
            const match = allMatches[i]
            const winnerId = match.winnerId
            const loserId = match.loserId
            const winningPlayer = await Player.findOne({ where: { id: winnerId }})
            const winnerStats = await Stats.findOne({ where: { playerId: winnerId, format } })
            const losingPlayer = await Player.findOne({ where: { id: loserId }})
            const loserStats = await Stats.findOne({ where: { playerId: loserId, format } })

            if (!winningPlayer || !winnerStats) {
                await trackStats(winnerId, format)
                i--
                continue
            }

            if (!losingPlayer || !loserStats) {
                await trackStats(loserId, format)
                i--
                continue
            }

            const origEloWinner = winnerStats.elo || 500.00
            const origEloLoser = loserStats.elo || 500.00
            const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((origEloWinner - origEloLoser) / 400))))))
            
            winnerStats.elo = origEloWinner + delta
            winnerStats.backupElo = origEloWinner
            winnerStats.wins++
            await winnerStats.save()
    
            loserStats.elo = origEloLoser - delta
            loserStats.backupElo = origEloLoser
            loserStats.losses++
            await loserStats.save()

            match.delta = delta
            await match.save()
            console.log(`${format} Match ${i+1}: ${winningPlayer.name} > ${losingPlayer.name}`)
        }

        return message.channel.send({ content: `Recalculation complete!`})
    }
})