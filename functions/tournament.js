
//TOURNAMENT FUNCTIONS

//MODULE IMPORTS
const axios = require('axios')
const {Op} = require('sequelize')

//DATABASE IMPORTS
const { Entry, Format, Player, Stats }  = require('../db/index.js')

//FUNCTION IMPORTS
const { getIssues, saveYDK } = require('./deck.js')
const { capitalize, shuffleArray } = require('./utility.js')

// STATIC IMPORTS
const { legend, mad } = require('../static/emojis')
const roles = require('../static/roles')
const { challongeAPIKeys } = require('../secrets.json')

////// TOURNAMENT REGISTRATION FUNCTIONS ///////

//ASK FOR DB NAME
const askForDBName = async (member, player, override = false, error = false, attempt = 1) => {
    const filter = m => m.author.id === member.id || member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const greeting = override ? '' : 'Hi! '
    const prompt = error ? `I think you're getting ahead of yourself. First, I need ${pronoun} DuelingBook name.`
    : `${greeting}This appears to be ${pronoun} first time using our system. Can you please provide ${pronoun} DuelingBook name?`
	const message = await member.send({ content: prompt.toString() }).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
		max: 1,
        time: 15000
    }).then(async (collected) => {
        const dbName = collected.first().content
        if (dbName.includes("duelingbook.com/deck") || dbName.includes("imgur.com")) {
            if (attempt >= 3) {
                member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
                return false
            } else {
                return askForDBName(member, player, override, true, attempt++)
            }
        } else {
            await player.update({
                duelingBook: dbName
            })
            member.send({ content: `Thanks! I saved ${pronoun} DuelingBook name as: ${dbName}. If that's wrong, go back to the server and type **!db name**.`}).catch((err) => console.log(err))
            return dbName
        }
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

//GET DECK LIST
const getDeckList = async (server, member, player, format, tournamentName, override = false) => {            
    const filter = m => m.author.id === member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const message = await member.send({ content: `Please provide a duelingbook.com/deck link for ${pronoun} tournament deck.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first().content
        if (url.includes('duelingbook.com/deck?id=')) {		
            member.send({ content: 'Thanks. Please wait while I download the .YDK file.'})
            const id = url.slice(url.indexOf('?id=') + 4)
            const {data} = await axios.get(`https://www.duelingbook.com/php-scripts/load-deck.php/deck?id=${id}`)
            if (!data) return false
            const main = data.main.map((e) => e.serial_number)
            const side = data.side.map((e) => e.serial_number)
            const extra = data.extra.map((e) => e.serial_number)
            const ydk = ['created by...', '#main', ...main, '#extra', ...extra, '!side', ...side, ''].join('\n')
            const deckArr = [...main, ...extra, ...side,]
            const issues = await getIssues(deckArr, format)
            if (!issues) return false

            const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
            if (!illegalCards || !forbiddenCards || !limitedCards || !semiLimitedCards || !unrecognizedCards) return false
                
            if (override) {
                saveYDK(server.name, player, ydk, tournamentName)
                member.send({ content: `Thanks, ${member.user.username}, I saved a copy of ${pronoun} deck. ${legend}`}).catch((err) => console.log(err))
                return url
            } else if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {
                let response = [`I'm sorry, ${member.user.username}, your deck is not legal. ${mad}`]
                if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
                if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
                if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
                if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
            
                for (let i = 0; i < response.length; i += 50) {
                    if (response[i+50] && response[i+50].startsWith("\n")) {
                        member.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                        i++
                    } else {
                        member.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                    }
                }
            
                return false
            } else if (unrecognizedCards.length) {
                let response = `I'm sorry, ${member.user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                member.send({ content: response.toString() }).catch((err) => console.log(err))
                return false
             } else {
                saveYDK(server.name, player, ydk, tournamentName)
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck is perfectly legal. ${legend}`}).catch((err) => console.log(err))
                return url
            }
        } else {
            member.send({ content: "Sorry, I only accept duelingbook.com/deck links."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

// SELECT TOURNAMENT
const selectTournament = async (message, tournaments, playerId) => {
    if (tournaments.length === 0) return false
    if (tournaments.length === 1) return tournaments[0]
    const options = tournaments.map((tournament, index) => `(${index + 1}) ${tournament.name}`)
    const filter = m => m.author.id === playerId
    message.channel.send({ content: `Please select a tournament:\n${options.join('\n').toString()}`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000
    }).then(collected => {
        const num = parseInt(collected.first().content.match(/\d+/))
        if (!num || !tournaments[num - 1]) {
            message.channel.send({ content: `Sorry, ${collected.first().content} is not a valid option.`})
            return null
        }
        else return tournaments[num - 1]
    }).catch(err => {
        console.log(err)
        return null
    })
}

////// TOURNAMENT HOST FUNCTIONS ///////

// CREATE SHEET DATA
const createSheetData = async (tournament) => {
    const entries = await Entry.findAll({ where: { tournamentId: tournament.id}, include: Player })
    const typeData = {}
    const catData = {}
    const sheet1Data = [['Player', 'Deck', 'Type', 'Link']]
    const sheet2DataA = [['Deck', 'Entries', 'Percent']]
    const sheet2DataB = [[], ['Category', 'Entries', 'Percent']]

    entries.forEach((e) => {
        typeData[e.deck_type] ? typeData[e.deck_type]++ : typeData[e.deck_type] = 1
        catData[e.deck_category] ? catData[e.deck_category]++ : catData[e.deck_category] = 1
        sheet1Data.push([e.pilot, e.deck_name, e.deck_type, e.url])            
    })

    let typeDataArr = Object.entries(typeData).sort((b, a) => b[0].localeCompare(a[0]))
    let catDataArr = Object.entries(catData).sort((b, a) => b[0].localeCompare(a[0]))

    let typeDataArr2 = typeDataArr.map((e) => [e[0], e[1], `${(e[1], e[1] / entries.length * 100).toFixed(2)}%`])
    let catDataArr2 = catDataArr.map((e) =>[capitalize(e[0]), e[1], `${(e[1], e[1] / entries.length * 100).toFixed(2)}%`])

    const sheet2Data = [...sheet2DataA, ...typeDataArr2, ...sheet2DataB, ...catDataArr2]

    const data = {
        sheet1Data,
        sheet2Data
    }

    return data
}

// GET TOURNAMENT TYPE
const getTournamentType = async (message) => {
    const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `What type of tournament is this?\n(1) Single Elimination\n(2) Double Elimination\n(3) Swiss\n(4) Round Robin`})
	return await message.channel.awaitMessages({
        filter,
		max: 1,
		time: 15000
	}).then(collected => {
		const response = collected.first().content.toLowerCase()
        if (response.includes(1) || response.startsWith('single')) return 'single elimination'
        else if (response.includes(2) || response.startsWith('double')) return 'double elimination'
        else if (response.includes(3) || response.startsWith('swiss')) return 'swiss'
        else if (response.includes(4) || response.startsWith('round')) return 'round robin'
        else return false
	}).catch(err => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
	})
}

// GET TOURNAMENT CHANNEL
const getTournamentChannel = async (server, format, message) => {
    if (server.name === 'Format Library') return format.channel
    const filter = (m) => m.author.id === message.author.id
    message.channel.send({ content: `Please provide a **#link** to the channel that will be used to report match results.` })
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000,
    }).then((collected) => {
        return collected.first().content.toLowerCase().replace(/[\\<>@#&!]/g, "")
    }).catch((err) => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.` })
        return false
    })
}

// GET TOURNAMENT FORMAT
const getTournamentFormat = async (server, message) => {
    if (server.format) {
        const format = await Format.findOne({ where: { name: {[Op.iLike]: server.format } }})
        return format
    } else {
        const filter = m => m.author.id === message.author.id
        message.channel.send({ content: `What format will be played in this tournament?`})
        return await message.channel.awaitMessages({
            filter,
            max: 1,
            time: 15000
        }).then(async collected => {
            const response = collected.first().content.toLowerCase()
            const format = await Format.findOne({ where: { name: {[Op.iLike]: response } }})
            return format
        }).catch(err => {
            console.log(err)
            message.channel.send({ content: `Sorry, time's up.`})
            return false
        })
    }
}

//REMOVE PARTICIPANT
const removeParticipant = async (server, message, member, entry, tournament, drop = false) => {    
    try {
        const success = await axios({
            method: 'delete',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${entry.participantId}.json?api_key=${challongeAPIKeys[server.name]}`
        })

        if (success) {
            await entry.destroy()
            member.roles.remove(roles[server.name].tourRole).catch((err) => console.log(err))
        
            if (drop) {
                return message.channel.send({ content: `I removed you from the tournament. Better luck next time!`})
            } else {
                return message.channel.send({ content: `${member.user.username} has been removed from the tournament.`})
            }
        } else if (!success && drop) {
            return message.channel.send({ content: `Hmm... I don't see you in the participants list.`})
        } else if (!success && !drop) {
            return message.channel.send({ content: `I could not find ${member.user.username} in the participants list.`})
        }
    } catch (err) {
        console.log(err)
        if (drop) {
            return message.channel.send({ content: `Hmm... I don't see you in the participants list.`})
        } else {
            return message.channel.send({ content: `I could not find ${member.user.username} in the participants list.`})
        }
    }   
}

//SEED
const seed = async (server, message, tournament) => {
    message.channel.send({ content: `Seeding in progress, please wait.`})
    const format = tournament.format
    const entries = await Entry.findAll({ where: { tournamentId: tournament.id } })    
    const expEntries = []
    const newbieEntries = []

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const playerId = entry.playerId
        const stats = await Stats.findOne({ where: { format, playerId, serverId: '414551319031054346' } })
        if (stats) {
            expEntries.push([entry.participantId, entry.pilot, stats.elo])
        } else {
            newbieEntries.push([entry.participantId, entry.pilot, null])
        }
    }

    const seeds = [...expEntries.sort((a, b) => b[2] - a[2]), ...shuffleArray(newbieEntries)]    
    let count = 0
    const results = []
    for (let i = 0; i < seeds.length; i++) {
        const participantId = seeds[i][0]
        const name = seeds[i][1]

        try {
            await axios({
                method: 'put',
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${participantId}.json?api_key=${challongeAPIKeys[server.name]}`,
                data: {
                    participant: {
                        seed: i+1
                    }
                }
            })
            
            results.push(`${name} is now the ${i+1} seed.`)
            count++
        } catch (err) {
            console.log(err)
        }   
    }

    for (let i = 0; i < results.length; i += 30) message.channel.send({ content: results.slice(i, i + 30).join('\n').toString()})
    return count === seeds.length
}


////// TOURNAMENT MANAGEMENT FUNCTIONS ///////

//CHECK PAIRING
const checkPairing = (match, p1, p2) => (match.player1_id === p1 && match.player2_id === p2) || (match.player1_id === p2 && match.player2_id === p1)

//FIND NEXT MATCH
const findNextMatch = (matchesArr = [], matchId, participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.state === 'complete') continue
        if (match.prerequisite_match_ids_csv.includes(matchId) && (match.player1_id === participantId || match.player2_id === participantId)) {
            return match.id
        }
    }

    return false
}

//FIND NEXT OPPONENT
const findNextOpponent = async (tournamentId, matchesArr = [], matchId, participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === matchId) {
            const player1_id = match.player1_id
            const player2_id = match.player2_id
            if (player1_id === participantId) {
                if (!player2_id) return false
                const opponentEntry = await Entry.findOne({
                    where: {
                        tournamentId: tournamentId,
                        participantId: player2_id
                    },
                    include: Player
                })

                return opponentEntry
            } else if (player2_id === participantId) {
                if (!player1_id) return false
                const opponentEntry = await Entry.findOne({
                    where: {
                        tournamentId: tournamentId,
                        participantId: player1_id
                    },
                    include: Player
                }) 

                return opponentEntry
            }
        }
    }

    return false
}

//FIND NO SHOW OPPONENT
const findNoShowOpponent = (match, noShowParticipantId) => {
    if (match.player1_id === noShowParticipantId) return match.player2_id
    if (match.player2_id === noShowParticipantId) return match.player1_id
    else return false
}

//FIND OTHER PRE REQ MATCH
const findOtherPreReqMatch = (matchesArr = [], nextMatchId, completedMatchId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === nextMatchId) {
            const pre_reqs = match.prerequisite_match_ids_csv.split(",").map((e) => parseInt(e))
            if (pre_reqs[0] === completedMatchId) {
                const pairing = getPairing(matchesArr, pre_reqs[1])
                return pairing
            } else if (pre_reqs[1] === completedMatchId) {
                const pairing = getPairing(matchesArr, pre_reqs[0])
                return pairing
            } 
            else return false
        }
    }

    return false
}

//GET MATCHES
const getMatches = async (server, tournamentId) => {
    try {
        const { data } = await axios({
            method: 'get',
            url: `https://api.challonge.com/v1/tournaments/${tournamentId}/matches.json?api_key=${challongeAPIKeys[server.name]}`
        })
        
        return data
    } catch (err) {
        console.log(err)
    }
}

//GET PAIRING
const getPairing = (matchesArr = [], matchId) => {
    let p1 = null
    let p2 = null

    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === matchId) {
            p1 = match.player1_id
            p2 = match.player2_id
            break
        }
    }

    const pairing = {
        p1,
        p2
    }

    return pairing
}

//POST PARTICIPANT
const postParticipant = async (server, tournament, player) => {
    try {
        const { data } = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${challongeAPIKeys[server.name]}`,
            data: {
                participant: {
                    name: player.name
                }
            }
        })
        return data
    } catch (err) {
        console.log(err)
    }   
}

// GET GAME COUNT
const getGameCount = async (message, tournament, noshow) => {
    if (noshow) return [0, 0]
    if (tournament.type === 'double elimination' || tournament.type === 'single elimination') return [1, 0]
    
    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: `What was the game count (i.e. 2-0, 2-1, etc.)?`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000
    }).then(collected => {
        const response = collected.first().content
        const char1 = response.charAt(0)
        const char2 = response.charAt(response.indexOf('-') + 1)
        const num1 = parseInt(char1)
        const num2 = parseInt(char2)
        if (isNaN(num1) || isNaN(num2)) {
            return false
        } else if (num1 > num2) {
            return [num1, num2]
        } else {
            return [num2, num1]
        }
    }).catch(err => {
        console.log(err)
        return false
    })
}

//PROCESS MATCH RESULT
const processMatchResult = async (server, message, winningPlayer, losingPlayer, tournament, noshow = false) => {
    const losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id } })
    const winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id } })
    if (!losingEntry || !winningEntry) {
        message.channel.send({ content: `Sorry I could not find your tournament in the database.`})
        return false
    } 

    const gameCount = await getGameCount(message, tournament, noshow) || []
    if (!gameCount || !gameCount.length) {
        message.channel.send({ content: `Please specify a valid game count.`})
        return false
    }

    const matchesArr = await getMatches(server, tournament.id) || []
    let matchId = false
    let scores = false
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.state !== 'open') continue
        if (checkPairing(match, losingEntry.participantId, winningEntry.participantId)) {
            matchId = match.id    
            scores = match.player1_id === winningEntry.participantId ? `${gameCount[0]}-${gameCount[1]}` : `${gameCount[1]}-${gameCount[0]}`
            break
        }
    }

    let success

    try {
        success = await axios({
            method: 'put',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${matchId}.json?api_key=${challongeAPIKeys[server.name]}`,
            data: {
                match: {
                    winner_id: winningEntry.participantId,
                    scores_csv: scores
                }
            }
        })
    } catch (err) {
        console.log(err)
    }
     
    if (!success) {
        message.channel.send({ content: `Error: could not update bracket for ${tournament.name}.`})
        return false
    }
 
    losingEntry.losses++
    await losingEntry.save()
    
    winningEntry.wins++
    await winningEntry.save()
    
    if (tournament.type === 'single elimination' || tournament.type === 'double elimination') {
        const updatedMatchesArr = await getMatches(server, tournament.id) || []
        const winnerNextMatch = findNextMatch(updatedMatchesArr, matchId, winningEntry.participantId)
        const winnerNextOpponent = winnerNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, winnerNextMatch, winningEntry.participantId) : null
        const winnerMatchWaitingOn = winnerNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, winnerNextMatch, matchId) 
        const winnerWaitingOnP1 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: winnerMatchWaitingOn.p1 }, include: Player }) : null
        const winnerWaitingOnP2 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: winnerMatchWaitingOn.p2 }, include: Player }) : null

        const loserEliminated = tournament.type === 'single elimination' ? true :
            tournament.type === 'double elimination' && losingEntry.losses >= 2 ? true :
            false

        if (loserEliminated) {
            const entries = await Entry.count({ where: { playerId: losingPlayer.id } })
            if (entries === 1) {
                const member = message.guild.members.cache.get(losingEntry.playerId)
                if (member) member.roles.remove(roles[server.name].tourRole).catch((err) => console.log(err))
            }
            await losingEntry.destroy()
        }

        const loserNextMatch = loserEliminated ? null : findNextMatch(updatedMatchesArr, matchId, losingEntry.participantId)
        const loserNextOpponent = loserNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, loserNextMatch, losingEntry.participantId) : null
        const loserMatchWaitingOn = loserNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, loserNextMatch, matchId) 
        const loserWaitingOnP1 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p1 }, include: Player }) : null
        const loserWaitingOnP2 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p2 }, include: Player }) : null

        setTimeout(() => {
            if (loserEliminated) return message.channel.send({ content: `${losingPlayer.name}, You are eliminated from the tournament. Better luck next time!`})
            else if (loserNextOpponent) return message.channel.send({ content: `New Match: <@${losingPlayer.id}> (DB: ${losingPlayer.duelingBook}) vs. <@${loserNextOpponent.playerId}> (DB: ${loserNextOpponent.player.duelingBook}). Good luck to both duelists.`})
            else if (loserMatchWaitingOn && loserWaitingOnP1 && loserWaitingOnP2) {
                return message.channel.send({ content: `${losingPlayer.name}, You are waiting for the result of ${loserWaitingOnP1.player.name} (DB: ${loserWaitingOnP1.player.duelingBook}) vs ${loserWaitingOnP2.player.name} (DB: ${loserWaitingOnP2.player.duelingBook}).`})
            }
            else return message.channel.send({ content: `${losingPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
        }, 2000)
        
        if (!winnerNextMatch || (winnerNextMatch && loserNextMatch !== winnerNextMatch)) {
            setTimeout(() => {
                if (!winnerNextMatch) return message.channel.send({ content: `<@${winningPlayer.id}>, You won the tournament! Congratulations on your stellar performance! ${legend}`})
                else if (winnerNextOpponent) return message.channel.send({ content: `New Match: <@${winningPlayer.id}> (DB: ${winningPlayer.duelingBook}) vs. <@${winnerNextOpponent.playerId}> (DB: ${winnerNextOpponent.player.duelingBook}). Good luck to both duelists.`})
                else if (winnerMatchWaitingOn && winnerWaitingOnP1 && winnerWaitingOnP2) {
                    return message.channel.send({ content: `${winningPlayer.name}, You are waiting for the result of ${winnerWaitingOnP1.player.name} (DB: ${winnerWaitingOnP1.player.duelingBook}) vs ${winnerWaitingOnP2.player.name} (DB: ${winnerWaitingOnP2.player.duelingBook}).`})
                }
                else return message.channel.send({ content: `${winningPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
            }, 4000)
        }
    }
    
    return true
}

module.exports = {
    askForDBName,
    checkPairing,
    createSheetData,
    findNextMatch,
    findNextOpponent,
    findNoShowOpponent,
    findOtherPreReqMatch,
    getDeckList,
    getPairing,
    getTournamentChannel,
    getTournamentFormat,
    getTournamentType,
    getMatches,
    processMatchResult,
    postParticipant,
    removeParticipant,
    seed,
    selectTournament
}