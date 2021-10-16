

//TOURNAMENT FUNCTIONS

//MODULE IMPORTS
const axios = require('axios')
const fs = require('fs')

//DATABASE IMPORTS
const { Entry, Player, Stats }  = require('../db/index.js')

//FUNCTION IMPORTS
const { saveYDK } = require('./deck.js')
const { capitalize, convertArrayToObject, shuffleArray } = require('./utility.js')

// STATIC IMPORTS
const { legend } = require('../static/emojis.json')
const formats = require('../static/formats.json')
const { tourRole } = require('../static/roles.json')
const { challongeAPIKey } = require('../secrets.json')

////// TOURNAMENT REGISTRATION FUNCTIONS ///////

//ASK FOR DB NAME
const askForDBName = async (member, player, override = false, error = false, attempt = 1) => {
    const filter = m => m.author.id === member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const greeting = override ? '' : 'Hi! '
    const prompt = error ? `I think you're getting ahead of yourself. First, I need ${pronoun} DuelingBook name.`
    : `${greeting}This appears to be ${player.name}'s first tournament in our system. Can you please provide ${pronoun} DuelingBook name?`
	const msg = await member.user.send(prompt)

    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 30000
    }).then(async (collected) => {
        const dbName = collected.first().content
        if (dbName.includes("duelingbook.com/deck") || dbName.includes("imgur.com")) {
            if (attempt >= 3) {
                member.user.send(`Sorry, time's up. Go back to the server and try again.`)
                return false
            } else {
                return askForDBName(member, player, override, true, attempt++)
            }
        } else {
            await player.update({
                duelingBook: dbName
            })
            member.user.send(`Thanks! I saved ${pronoun} DuelingBook name as: ${dbName}. If that's wrong, go back to the server and type **!db name**.`)
            return dbName
        }
    }).catch((err) => {
        console.log(err)
        member.user.send(`Sorry, time's up. Go back to the server and try again.`)
        return false
    })

    return collected
}

//GET DECK LIST TOURNAMENT
const getDeckList = async (member, player, formatDate, formatList, tournamentName, override = false) => {            
    const filter = m => m.author.id === member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const msg = await member.user.send(`Please provide a duelingbook.com/deck link for ${pronoun} tournament deck.`);
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first().content
        if (url.includes("www.duelingbook.com/deck")) {		
            member.send('Thanks. Please wait while I download the .YDK file. This can take up to 30 seconds.')
            const issues = await saveYDK(player, url, formatDate, formatList, tournamentName)

            if (override) {
                member.send(`Thanks, ${member.user.username}, I saved a copy of ${pronoun} deck. ${legend}`)
                return url
            } else if (issues['illegalCards'].length || issues['forbiddenCards'].length || issues['limitedCards'].length || issues['semiLimitedCards'].length) {
                let response = `I'm sorry, ${member.user.username}, ${pronoun} deck is not legal. ${legend}`
                if (issues['illegalCards'].length) response += `\n\nThe following cards are not in this game:\n${issues['illegalCards'].join('\n')}`
                if (issues['forbiddenCards'].length) response += `\n\nThe following cards are forbidden:\n${issues['forbiddenCards'].join('\n')}`
                if (issues['limitedCards'].length) response += `\n\nThe following cards are limited:\n${issues['limitedCards'].join('\n')}`
                if (issues['semiLimitedCards'].length) response += `\n\nThe following cards are semi-limited:\n${issues['semiLimitedCards'].join('\n')}`
                response += `\n\nPlease edit ${pronoun} deck and try again once it's legal. If you believe this message is in error, contact the Tournament Organizer.`
            
                member.send(response)
                return false
            } else if (issues['unrecognizedCards'].length) {
                let response = `I'm sorry, ${member.user.username}, the following card IDs were not found in our database:\n${issues['unrecognizedCards'].join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                member.send(response)
                return false
             } else {
                member.send(`Thanks, ${member.user.username}, ${pronoun} deck is perfectly legal. ${legend}`)
                return url
            }
        } else {
            member.send("Sorry, I only accept duelingbook.com/deck links.")
            return false
        }
    }).catch((err) => {
        console.log(err)
        member.send(`Sorry, time's up. Go back to the server and try again.`)
        return false
    })

    return collected
}

//GET DECK NAME
const getDeckName = async (member, player, override = false) => {
    const pronoun = override ? `${player.name}'s` : 'your'
	const msg = await member.send(`Please provide the common name for ${pronoun} deck (i.e. Chaos Control, Chaos Turbo, Warrior, etc.).`)
    const filter = m => m.author.id === member.user.id
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 20000
    }).then(async collected => {
        const response = collected.first().content.toLowerCase()
        return response
    }).catch(err => {    
        console.log(err)
        member.send(`Sorry, time's up.`)
        return false
    })

    return collected
}

// SELECT TOURNAMENT
const selectTournament = async (message, tournaments, playerId) => {
    if (tournaments.length === 0) return false
    if (tournaments.length === 1) return tournaments[0]
    const options = tournaments.map((tournament, index) => `(${index + 1}) ${tournament.name}`)
    const filter = m => m.author.id === playerId
    const msg = await message.channel.send(`Please select a tournament:\n${options.join('\n')}`)
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 15000
    }).then(collected => {
        const num = parseInt(collected.first().content.match(/\d+/))
        if (!num || !tournaments[num - 1]) {
            message.channel.send(`Sorry, ${collected.first().content} is not a valid option.`)
            return null
        }
        else return tournaments[num - 1]
    }).catch(err => {
        console.log(err)
        return null
    })

    return collected
}


////// TOURNAMENT HOST FUNCTIONS ///////

// CREATE SHEET DATA
const createSheetData = async () => {
    const allDecks = await Entry.findAll()
    const typeData = {}
    const catData = {}
    const sheet1Data = [['Player', 'Deck', 'Type', 'Link']]
    const sheet2DataA = [['Deck', 'Entries', 'Percent']]
    const sheet2DataB = [[], ['Category', 'Entries', 'Percent']]

    allDecks.forEach(function (deck) {
        typeData[deck.type] ? typeData[deck.type]++ : typeData[deck.type] = 1
        catData[deck.category] ? catData[deck.category]++ : catData[deck.category] = 1
        const row = [deck.pilot, deck.name, deck.type, deck.url]
        sheet1Data.push(row)
    })

    let typeDataArr = Object.entries(typeData).sort((b, a) => b[0].localeCompare(a[0]))
    let catDataArr = Object.entries(catData).sort((b, a) => b[0].localeCompare(a[0]))

    let typeDataArr2 = typeDataArr.map(function(elem) {
        return [elem[0], elem[1], `${(elem[1], elem[1] / allDecks.length * 100).toFixed(2)}%`]
    })

    let catDataArr2 = catDataArr.map(function(elem) {
        return [capitalize(elem[0]), elem[1], `${(elem[1], elem[1] / allDecks.length * 100).toFixed(2)}%`]
    })

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
	const msg = await message.channel.send(`What type of tournament is this?\n(1) Single Elimination\n(2) Double Elimination\n(3) Swiss\n(4) Round Robin`)
	const collected = await msg.channel.awaitMessages(filter, {
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
        message.channel.send(`Sorry, time's up.`)
	})

    return collected
}

// GET TOURNAMENT FORMAT
const getTournamentFormat = async (message) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`What format will be played in this tournament?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(collected => {
        const response = collected.first().content.toLowerCase().replace(/ /g,"_")
        if(formats[response]) return response
        else return false
	}).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

//REMOVE PARTICIPANT
const removeParticipant = async (message, member, entry, tournament, drop = false) => {    
    try {
        const success = await axios({
            method: 'delete',
            url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/participants/${entry.participantId}.json`,
        })

        if (success) {
            await entry.destroy()
            member.roles.remove(tourRole)
        
            if (drop) {
                return message.channel.send(`I removed you from the tournament. Better luck next time!`)
            } else {
                return message.channel.send(`${member.user.username} has been removed from the tournament.`)
            }
        } else if (!success && drop) {
            return message.channel.send(`Hmm... I don't see you in the participants list.`)
        } else if (!success && !drop) {
            return message.channel.send(`I could not find ${member.user.username} in the participants list.`)
        }
    } catch (err) {
        console.log(err)
        if (drop) {
            return message.channel.send(`Hmm... I don't see you in the participants list.`)
        } else {
            return message.channel.send(`I could not find ${member.user.username} in the participants list.`)
        }
    }   
}

//SEED
const seed = async (message, tournament) => {
    const format = tournament.format
    const entries = await Entry.findAll({ where: { tournamentId: tournament.id } })    
    const expEntries = []
    const newbieEntries = []

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const playerId = entry.playerId
        const stats = await Stats.findOne({ where: { format, playerId } })
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
                url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/participants/${participantId}.json`,
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

    for (let i = 0; i < results.length; i += 30) message.channel.send(results.slice(i, i + 30))
    return count === seeds.length
}


////// TOURNAMENT MANAGEMENT FUNCTIONS ///////

//CHECK CHALLONGE PAIRING
const checkPairing = (match, p1, p2) => (match.player1_id === p1 && match.player2_id === p2) || (match.player1_id === p2 && match.player2_id === p1)

//FIND NEXT MATCH
const findNextMatch = (matchesArr, matchId, participantId) => {
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
const findNextOpponent = async (tournamentId, matchesArr, matchId, participantId) => {
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
const findOtherPreReqMatch = (matchesArr, nextMatchId, completedMatchId) => {
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
const getMatches = async (tournamentId) => {
    try {
        const { data } = await axios.get(
            `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournamentId}/matches.json`
        )
        return data
    } catch (err) {
        console.log(err)
    }
}

//GET PAIRING
const getPairing = (matchesArr, matchId) => {
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
const postParticipant = async (tournament, player) => {
    try {
        const { data } = await axios({
            method: 'post',
            url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/participants.json`,
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

//PROCESS MATCH RESULT
const processMatchResult = async (message, winningPlayer, losingPlayer, tournament, noshow = false) => {
    const losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id } })
    const winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id } })
    if (!losingEntry || !winningEntry) {
        message.channel.send(`Sorry I could not find your tournament in the database.`)
        return false
    } 

    const matchesArr = await getMatches(tournament.id)
    let matchId = false
    let scores = false
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.state !== 'open') continue
        if (checkPairing(match, losingEntry.participantId, winningEntry.participantId)) {
            matchId = match.id    
            scores = noshow ? "0-0" : match.player1_id === winningEntry.participantId ? "1-0" : "0-1"
            break
        }
    }

    const success = await axios({
        method: 'put',
        url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/matches/${matchId}.json`,
        data: {
            match: {
                winner_id: winningEntry.participantId,
                scores_csv: scores
            }
        }
    })
     
    if (!success) {
        message.channel.send(`Error: could not update bracket for ${tournament.name}.`)
        return false
    } 
 
    losingEntry.losses++
    await losingEntry.save()
    
    winningEntry.wins++
    await winningEntry.save()
    const updatedMatchesArr = await getMatches(tournament.id)
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
            if (member) member.roles.remove(tourRole)
        }
        await losingEntry.destroy()
    }

    const loserNextMatch = loserEliminated ? null : findNextMatch(updatedMatchesArr, matchId, losingEntry.participantId)
    const loserNextOpponent = loserNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, loserNextMatch, losingEntry.participantId) : null
    const loserMatchWaitingOn = loserNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, loserNextMatch, matchId) 
    const loserWaitingOnP1 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p1 }, include: Player }) : null
    const loserWaitingOnP2 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p2 }, include: Player }) : null

    setTimeout(() => {
        if (loserEliminated) return message.channel.send(`${losingPlayer.name}, You are eliminated from the tournament. Better luck next time!`)
        else if (loserNextOpponent) return message.channel.send(`New Match: <@${losingPlayer.id}> (DB: ${losingPlayer.duelingBook}) vs. <@${loserNextOpponent.playerId}> (DB: ${loserNextOpponent.player.duelingBook}). Good luck to both duelists.`)
        else if (loserMatchWaitingOn && loserWaitingOnP1 && loserWaitingOnP2) {
            return message.channel.send(`${losingPlayer.name}, You are waiting for the result of ${loserWaitingOnP1.player.name} (DB: ${loserWaitingOnP1.player.duelingBook}) vs ${loserWaitingOnP2.player.name} (DB: ${loserWaitingOnP2.player.duelingBook}).`)
        }
        else return message.channel.send(`${losingPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
    }, 2000)
    
    if (!winnerNextMatch || (winnerNextMatch && loserNextMatch !== winnerNextMatch)) {
        setTimeout(() => {
            if (!winnerNextMatch) return message.channel.send(`<@${winningPlayer.id}>, You won the tournament! Congratulations on your stellar performance! ${legend}`)
            else if (winnerNextOpponent) return message.channel.send(`New Match: <@${winningPlayer.id}> (DB: ${winningPlayer.duelingBook}) vs. <@${winnerNextOpponent.playerId}> (DB: ${winnerNextOpponent.player.duelingBook}). Good luck to both duelists.`)
            else if (winnerMatchWaitingOn && winnerWaitingOnP1 && winnerWaitingOnP2) {
                return message.channel.send(`${winningPlayer.name}, You are waiting for the result of ${winnerWaitingOnP1.player.name} (DB: ${winnerWaitingOnP1.player.duelingBook}) vs ${winnerWaitingOnP2.player.name} (DB: ${winnerWaitingOnP2.player.duelingBook}).`)
            }
            else return message.channel.send(`${winningPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
        }, 4000)
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
    getDeckName,
    getPairing,
    getTournamentFormat,
    getTournamentType,
    getMatches,
    processMatchResult,
    postParticipant,
    removeParticipant,
    seed,
    selectTournament
}