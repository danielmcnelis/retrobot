
const { registrationChannel } = require('../static/channels.json')
const { tourRole } = require('../static/roles.json')
const status = require('../static/status.json')
const { Player, Match, Matchup, Tournament  }  = require('../db/index.js')
const { getCat } = require('./utility.js')
const { yescom, nocom } = require('../static/commands.json')
const { client, challongeClient } = require('../static/clients.js')
const types = require('../static/types.json')

//GET DECK TYPE TOURNAMENT
const getDeckTypeTournament = async (client, message, member, url, resubmission = false) => {
    const keys = Object.keys(types)
    let success = false

	const filter = m => m.author.id === member.user.id
	const msg = await member.user.send(`Okay, ${member.user.username}, what kind of deck is this?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 180000
    }).then(async collected => {
        keys.forEach(async function (elem) {
            if (types[elem].includes(collected.first().content.toLowerCase())) {
                success = true
                if (resubmission) {
                    const tourDeck = await Tournament.findOne({
                        where: { playerId: member.user.id }
                    })
                    await tourDeck.update({
                        url,
                        name: collected.first().content.toLowerCase(),
                        playerId: member.user.id,
                        type: elem,
                        category: getCat(elem)
                    })
                } else {
                    await Tournament.create({
                        url,
                        pilot: member.user.username,
                        name: collected.first().content.toLowerCase(),
                        playerId: member.user.id,
                        type: elem,
                        category: getCat(elem)
                    })
                }

                sendToTournamentChannel(client, member, url, types[elem][0])
                return member.user.send(`Thanks! I have your ${types[elem][0]} deck list for the tournament. Please wait for the Tournament Organizer to add you to the bracket.`)
            }
        })

        if (!success) {
            await Tournament.create({
                url,
                pilot: member.user.username,
                name: collected.first().content.toLowerCase(),
                playerId: member.user.id,
                type: 'other',
                category: 'other'
            })
            sendToTournamentChannel(client, member, url, 'Other')
            return member.user.send(`Thanks! I have your ${collected.first().content} deck list for the tournament. Please wait for the Tournament Organizer to add you to the bracket.`)
        }
    }).catch(err => {    
    console.log(err)
    return member.user.send(`Perhaps another time would be better.`)
})

}


//SEND TO TOURNAMENT CHANNEL
const sendToTournamentChannel = async (client, member, deckUrl, deckType) => {
    return client.channels.cache.get(registrationChannel).send(`<@${member.user.id}> submitted their ${deckType} deck list for the tournament. Please confirm this deck is legal and accurately labeled, then add ${member.user.name} to the bracket using the **!signup** command:
${deckUrl}`)
}


//CHECK RESUBMISSION
const checkResubmission = async (client, message, member) => {
    const filter = m => m.author.id === member.user.id
	const msg = await member.user.send(`You already signed up for the tournament, do you want to resubmit your deck list?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(collected => {
        if (yescom.includes(collected.first().content.toLowerCase())) {
            return getUpdatedDeckURL(client, message, member, true)
        } else if (nocom.includes(collected.first().content.toLowerCase())) {
            return member.user.send(`Not a problem. Thanks.`)
        }
    }).catch(err => {
        console.log(err)
        return member.user.send(`Perhaps another time would be better.`)
    })
}



//GET DECK URL
const getUpdatedDeckURL = async (client, message, member, resubmission = false) => {
    const msg = await member.user.send("Okay, please provide an Imgur screenshot or a DuelingBook download link for your tournament deck.");
    const filter = collected => collected.author.id === member.user.id;
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 180000
    }).then(collected => {
        if (collected.first().content.startsWith("https://i.imgur")) {
            return getDeckTypeTournament(client, message, member, collected.first().content)
        } else if (collected.first().content.startsWith("https://imgur")) {
            const str = collected.first().content
            const newStr = str.substring(8, str.length)
            const url = "https://i." + newStr + ".png";
            return getDeckTypeTournament(client, message, member, url)          
        } else {
            return member.user.send("Sorry, I only accept imgur.com links.")
        }
    }).catch(err => {
        console.log(err)
        return member.user.send('Perhaps another time would be better.')
    })
}


//REMOVE PARTICIPANT
const removeParticipant = async (message, participants, name, person, drop = false) => {    
    let participantID
    let keys = Object.keys(participants)
    const member = message.guild.members.cache.get(person.id)

    keys.forEach(function(elem) {
        if (participants[elem].participant.name === person.username) {
            participantID = participants[elem].participant.id
        }
    })

    if (!member) return message.channel.send('I could not find that person in the server.')

    challongeClient.participants.destroy({
        id: name,
        participantID: participantID,
        callback: async (err) => {
            if (err) {
                if (drop) {
                    return message.channel.send(`Hmm... I don't see you in the participants list.`)
                } else {
                    return message.channel.send(`Error: could not find "${person.username}" in the participants list.`)
                }
            } else {
                const tourDeck = await Tournament.findOne({ where: { playerId: person.id } })
                await tourDeck.destroy()
                member.roles.remove(tourRole)

                if (drop) return message.channel.send(`I removed you from the tournament. Better luck next time!`)
                return message.channel.send(`${person.username} has been removed from the tournament.`)
            }
        }
    })
}


//TOURNAMENT CHECK
const getParticipants = async (message, matches, loser, winner) => {
    challongeClient.participants.index({
        id: status['tournament'],
        callback: (err, data) => {
            if (err) {
                return message.channel.send(`Error: the current tournament, "${status['tournament']}", could not be accessed.`)
            } else {
                return addMatchResult(message, matches, data, loser, winner)
            }
        }
    })
}


//CHECK MATCHES
const addMatchResult = async (message, matches, participants, loser, winner) => {
    let loserID
    let winnerID
    let matchID
    let matchComplete = false
    let score
    let players = Object.keys(participants)

    try {
        let winnerEntry = await Tournament.findOne({
            where: {
                playerId: winner.user.id
            }
        })

        winnerID = winnerEntry.participantId
    } catch (err) {
        console.log(err)
    }

    try {
        let loserEntry = await Tournament.findOne({
            where: {
                playerId: loser.user.id
            }
        })

        loserID = loserEntry.participantId
    } catch (err) {
        console.log(err)
    }

    if (!loserID) {
        players.forEach(function(elem) {
            if (participants[elem].participant.name === loser.user.username) {
                loserID = participants[elem].participant.id
            }
        })
    }

    if (!winnerID) {
        players.forEach(function(elem) {
            if (participants[elem].participant.name === winner.user.username) {
                winnerID = participants[elem].participant.id
            }
        })
    }

    let keys = Object.keys(matches)
    keys.forEach(function(elem) {
        if ( (matches[elem].match.player1Id === loserID && matches[elem].match.player2Id === winnerID) || (matches[elem].match.player2Id === loserID && matches[elem].match.player1Id === winnerID) ) {
            if (matches[elem].match.state === 'complete') {
                matchComplete = true
            } else if (matches[elem].match.state === 'open') {
                matchID = matches[elem].match.id
                score = (matches[elem].match.player1Id === loserID ? '0-1' : '1-0')
            }
        }
    })

    if (!winnerID) {
        return message.channel.send(`${winner.user.username} is not in the tournament.`)
    } else if (!loserID) {
        return message.channel.send(`${loser.user.username} is not in the tournament.`)
    } else if (matchComplete && !matchID) {
        return message.channel.send(`The match result between ${winner.user.username} and ${loser.user.username} was already recorded.`)
    } else if (!matchComplete && !matchID) {
        return message.channel.send(`${winner.user.username} and ${loser.user.username} were not supposed to play a match.`)
    } else if (matchID) {
        challongeClient.matches.update({
            id: status['tournament'],
            matchId: matchID,
            match: {
              scoresCsv: score,
              winnerId: winnerID
            },
            callback: async (err) => {
                if (err) {
                    return message.channel.send(`Error: The match between ${winner.user.username} and ${loser.user.username} could not be updated.`)
                } else {
                    const winningPlayer = await Player.findOne({ where: { id: winner.user.id }, include: [ { model: Tournament, attribute: 'type' } ] })
                    const losingPlayer = await Player.findOne({ where: { id: loser.user.id }, include: [ { model: Tournament, attribute: 'type' } ] })
                    const statsLoser = losingPlayer.stats
                    const statsWinner = winningPlayer.stats
                    winningPlayer.backup = statsWinner
                    losingPlayer.backup = statsLoser
                    const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
                    winningPlayer.stats += delta
                    losingPlayer.stats -= delta
                    winningPlayer.wins++
                    losingPlayer.losses++
                    await winningPlayer.save()
                    await losingPlayer.save()
                    await Match.create({ winner: winner.user.id, loser: loser.user.id, delta })
                    await Matchup.create({ winningType: winningPlayer.tournament.type, losingType: losingPlayer.tournament.type, wasTournament: true, tournamentName: status['tournament'] })

                    const entry = await Tournament.findOne({ where: { playerId: loser.user.id } })
                    entry.losses++
                    await entry.save()
                         
                    message.channel.send(`<@${loser.user.id}>, Your tournament loss to ${winner.user.username} has been recorded.`)
                    return setTimeout(function() {
                        console.log('timeout')
                        getUpdatedMatchesObject(message, participants, matchID, loserID, winnerID, loser, winner)
                    }, 3000)	
                }
            }
        })
    }
}


//GET UPDATED MATCHES OBJECT
const getUpdatedMatchesObject = async (message, participants, matchID, loserID, winnerID, loser, winner) => {
    return challongeClient.matches.index({
        id: status['tournament'],
        callback: (err, data) => {
            if (err) {
                return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
            } else {
                return checkMatches(message, data, participants, matchID, loserID, winnerID, loser, winner)
            }
        }
    }) 
}


//CHECK MATCHES
const checkMatches = async (message, matches, participants, matchID, loserID, winnerID, loser, winner) => {
    let newOppoIDLoser
    let newOppoLoser
    let matchWaitingOnLoser
    let matchWaitingOnLoserP1ID
    let matchWaitingOnLoserP2ID
    let matchWaitingOnLoserP1
    let matchWaitingOnLoserP2
    let newOppoIDWinner
    let newOppoWinner
    let matchWaitingOnWinner
    let matchWaitingOnWinnerP1ID
    let matchWaitingOnWinnerP2ID
    let matchWaitingOnWinnerP1
    let matchWaitingOnWinnerP2
    let keys = Object.keys(matches)
    let players = Object.keys(participants)

    keys.forEach(function(elem) {
        if ( (matches[elem].match.player1Id === winnerID || matches[elem].match.player2Id === winnerID) && (matches[elem].match.player1PrereqMatchId === matchID || matches[elem].match.player2PrereqMatchId === matchID) ) {
            if (matches[elem].match.state === 'pending') {
                matchWaitingOnWinner = (matches[elem].match.player1PrereqMatchId === matchID ? matches[elem].match.player2PrereqMatchId : matches[elem].match.player1PrereqMatchId)
            } else if (matches[elem].match.state === 'open') {
                newOppoIDWinner = (matches[elem].match.player1Id === winnerID ? matches[elem].match.player2Id : matches[elem].match.player1Id)
                newMatchIDWinner = matches[elem].match.id
            }
        } else if ( (matches[elem].match.player1Id === loserID || matches[elem].match.player2Id === loserID) && (matches[elem].match.player1PrereqMatchId === matchID || matches[elem].match.player2PrereqMatchId === matchID) ) {
            if (matches[elem].match.state === 'pending') {
                matchWaitingOnLoser = (matches[elem].match.player1PrereqMatchId === matchID ? matches[elem].match.player2PrereqMatchId : matches[elem].match.player1PrereqMatchId)
            } else if (matches[elem].match.state === 'open') {
                newOppoIDLoser = (matches[elem].match.player1Id === loserID ? matches[elem].match.player2Id : matches[elem].match.player1Id)
                newMatchIDLoser = matches[elem].match.id
            }
        }
    })

    keys.forEach(function(elem) {
        if (matches[elem].match.id === matchWaitingOnLoser) {
            matchWaitingOnLoserP1ID = matches[elem].match.player1Id
            matchWaitingOnLoserP2ID = matches[elem].match.player2Id
        }
        
        if (matches[elem].match.id === matchWaitingOnWinner) {
            matchWaitingOnWinnerP1ID = matches[elem].match.player1Id
            matchWaitingOnWinnerP2ID = matches[elem].match.player2Id
        }
    })


    players.forEach(function(elem) {
         if (participants[elem].participant.id === newOppoIDLoser) newOppoLoser = participants[elem].participant.id
         if (participants[elem].participant.id === newOppoIDWinner) newOppoWinner = participants[elem].participant.id
         if (participants[elem].participant.id === matchWaitingOnLoserP1ID) matchWaitingOnLoserP1 = participants[elem].participant.name
         if (participants[elem].participant.id === matchWaitingOnLoserP2ID) matchWaitingOnLoserP2 = participants[elem].participant.name
         if (participants[elem].participant.id === matchWaitingOnWinnerP1ID) matchWaitingOnWinnerP1 = participants[elem].participant.name
         if (participants[elem].participant.id === matchWaitingOnWinnerP2ID) matchWaitingOnWinnerP2 = participants[elem].participant.name
    })


    if (matchWaitingOnLoser) {
        if (matchWaitingOnLoserP1 && matchWaitingOnLoserP2) {
            message.channel.send(`${loser.user.username}, You are waiting for the result of ${matchWaitingOnLoserP1} vs ${matchWaitingOnLoserP2}.`)
        } else {
            message.channel.send(`${loser.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`) 
        }
    } else if (newOppoLoser) {
        const opponent = await Tournament.findOne({ where: { participantId: newOppoLoser } })
        message.channel.send(`New Match: <@${loser.user.id}> vs <@${opponent.playerId}>. Good luck to both duelists.`)
    } else if (matchWaitingOnLoser) {
        message.channel.send(`${loser.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
    } else {
        const entry = await Tournament.findOne({ where: { playerId: loser.user.id } })
        if (entry.losses === 1) return message.channel.send(`New Match: <@${loser.user.id}> vs <@${winner.user.id}>. Good luck to both duelists.`)
        loser.roles.remove(tourRole)
        message.channel.send(`${loser.user.username}, You are eliminated from the tournament. Better luck next time!`)
    }

    if (matchWaitingOnWinner) {
        if (matchWaitingOnWinnerP1 && matchWaitingOnWinnerP2) {
            message.channel.send(`${winner.user.username}, You are waiting for the result of ${matchWaitingOnWinnerP1} vs ${matchWaitingOnWinnerP2}.`)
        } else {
            message.channel.send(`${winner.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`) 
        }
    } else if (newOppoWinner) {
        const opponent = await Tournament.findOne({ where: { participantId: newOppoWinner } })
        message.channel.send(`New Match: <@${winner.user.id}> vs <@${opponent.playerId}>. Good luck to both duelists.`)
    } else if (matchWaitingOnWinner) {
        message.channel.send(`${winner.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
    } else {
        winner.roles.remove(tourRole)
        message.channel.send(`<@${winner.user.id}>, You won the tournament! Congratulations on your stellar performance!`)
    }
    
    return
}

module.exports = {
    getDeckTypeTournament,
    sendToTournamentChannel,
    checkResubmission,
    getUpdatedDeckURL,
    removeParticipant,
    getParticipants,
    getUpdatedMatchesObject,
    addMatchResult
}