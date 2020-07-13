
const { registrationChannel } = require('../static/channels.json')
const { tourRole } = require('../static/roles.json')
const status = require('../static/status.json')
const { Match, Matchup, Player, Tournament, YugiKaiba, Critter, Android, Yata, Vampire, TradChaos, ChaosWarrior, Goat, CRVGoat, Reaper, ChaosReturn, Stein, TroopDup, PerfectCircle, DADReturn, GladBeast, TeleDAD, DarkStrike, Lightsworn, Edison, Frog, SixSamurai, Providence, TenguPlant, LongBeach, DinoRabbit, WindUp, Meadowlands, BabyRuler, RavineRuler, FireWater, HAT, Shaddoll, London, BurningAbyss, Charleston, Nekroz, Clown, PePe, DracoPal, Monarch, ABC, GrassZoo, DracoZoo, LinkZoo, QuickFix, Tough, Magician, Gouki, Danger, PrankKids, SkyStriker, ThunderDragon, LunalightOrcust, StrikerOrcust, Current, Traditional, Rush, Nova, Rebirth  } = require('../db/index.js')
const { getCat } = require('./utility.js')
const { yescom, nocom } = require('../static/commands.json')
const { client, challongeClient } = require('../static/clients.js')
const formats = require('../static/formats.json')
const types = require('../static/types.json')


//ASK FOR DB USERNAME
const askForDBUsername = async (client, message, member) => {
    const filter = m => m.author.id === member.user.id
	const msg = await member.user.send(`Hi! This appears to be your first tournament in our new system. Can you please provide your DuelingBook username?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 60000
    }).then(async collected => {
        const player = await Player.findOne({ where: { id: member.user.id }})
        player.duelingBook = collected.first().content
        await player.save()
        member.user.send(`Thanks! I've saved your DuelingBook username as: ${collected.first().content}. If that's not correct, you can update it on the Discord server by using the command **!db** followed by your username.`)
        return setTimeout(function() {
            getDeckListTournament(client, message, member)
        }, 2000)	
    }).catch(err => {
        console.log(err)
        return member.user.send(`Sorry, time's up. You can also provide your DuelingBook username on the Discord server by using the **!db** command, followed by your username.`)
    })
}


//GET DECK LIST TOURNAMENT
const getDeckListTournament = async (client, message, member) => {            
    const filter = m => m.author.id === member.user.id
    const msg = await member.user.send("Please provide an Imgur screenshot or a DuelingBook download link for your tournament deck.");
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 180000
    }).then(collected => {
        if ( (!collected.first().content.startsWith("https://i") && !collected.first().content.startsWith("https://www.duelingbook.com/deck")) || collected.first().content.length > 50) {		
            return member.user.send("Sorry, I only accept (1) Imgur.com or DuelingBook.com link.")
        } else if (collected.first().content.startsWith("https://i.imgur") || collected.first().content.startsWith("https://www.duelingbook.com/deck")) {
            return getDeckTypeTournament(client, message, member, collected.first().content)
        } else if (collected.first().content.startsWith("https://imgur")) {
            const str = collected.first().content
            const newStr = str.substring(8, str.length)
            const url = "https://i." + newStr + ".png";
            return getDeckTypeTournament(client, message, member, url)          
        }
    }).catch(err => {
        console.log(err)
        return message.author.send(`Sorry, time's up. If you wish to try again, go back to the Discord server and use the **!join** command.`)
    })
}

//GET DECK TYPE TOURNAMENT
const getDeckTypeTournament = async (client, message, member, url, resubmission = false) => {
    const keys = Object.keys(types)
    const player = Player.findOne({ where: { id: member.user.id }})
    let success = false

	const filter = m => m.author.id === member.user.id
	const msg = await member.user.send(`Okay, ${member.user.username}, what kind of deck is this?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 60000
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
    return member.user.send(`Sorry, time's up. If you wish to try again, go back to the Discord server and use the **!join** command.`)
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
        time: 18000
    }).then(collected => {
        if (yescom.includes(collected.first().content.toLowerCase())) {
            return getUpdatedDeckURL(client, message, member, true)
        } else if (nocom.includes(collected.first().content.toLowerCase())) {
            return member.user.send(`Not a problem. Thanks.`)
        }
    }).catch(err => {
        console.log(err)
        return member.user.send(`Sorry, time's up. If you wish to try again, go back to the Discord server and use the **!join** command.`)
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
        return member.user.send(`Sorry, time's up. If you wish to try again, go back to the Discord server and use the **!join** command.`)
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
const getParticipants = async (message, matches, loser, winner, formatName, formatDatabase) => {
    challongeClient.participants.index({
        id: status['tournament'],
        callback: (err, data) => {
            if (err) {
                return message.channel.send(`Error: the current tournament, "${status['tournament']}", could not be accessed.`)
            } else {
                return addMatchResult(message, matches, data, loser, winner, formatName, formatDatabase)
            }
        }
    })
}


//ADD MATCH RESULT
const addMatchResult = async (message, matches, participants, loser, winner, formatName, formatDatabase) => {
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
                    const winningPlayersRecord = await eval(formatDatabase).findOne({ where: { playerId: winner.user.id } })
                    const losingPlayersRecord = await eval(formatDatabase).findOne({ where: { playerId: loser.user.id } })
                    const winningPlayer = await Player.findOne({ where: { id: winner.user.id }, include: [ { model: Tournament, attribute: 'type' } ] })
                    const losingPlayer = await Player.findOne({ where: { id: loser.user.id }, include: [ { model: Tournament, attribute: 'type' } ] })
                    const statsLoser = losingPlayersRecord.stats
                    const statsWinner = winningPlayersRecord.stats
                    winningPlayersRecord.backup = statsWinner
                    losingPlayersRecord.backup = statsLoser
                    const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
                    winningPlayersRecord.stats += delta
                    losingPlayersRecord.stats -= delta
                    winningPlayersRecord.wins++
                    losingPlayersRecord.losses++
                    await winningPlayersRecord.save()
                    await losingPlayersRecord.save()
                    await Match.create({ format: formatDatabase, winner: winner.user.id, loser: loser.user.id, delta })
                    await Matchup.create({ format: formatDatabase, winningType: winningPlayer.tournament.type, losingType: losingPlayer.tournament.type, wasTournament: true, tournamentName: status['tournament'] })

                    const entry = await Tournament.findOne({ where: { playerId: loser.user.id } })
                    entry.losses++
                    await entry.save()
                         
                    message.channel.send(`<@${loser.user.id}>, Your ${formatName} tournament loss to ${winner.user.username} has been recorded.`)
                    return setTimeout(function() {
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
        const opponent = await Tournament.findOne({ 
            where: { 
                participantId: newOppoLoser 
            }, 
            include: Player 
        })
        const losingPlayer = await Player.findOne({ where: { id: loser.user.id } })
        const opponentDB = opponent.player.duelingBook ? ` (DB: ${opponent.player.duelingBook})` : ``
        const loserDB = losingPlayer.duelingBook ? ` (DB: ${losingPlayer.duelingBook})` : ``
        message.channel.send(`New Match: <@${loser.user.id}>${loserDB} vs <@${opponent.playerId}>${opponentDB}. Good luck to both duelists.`)
    } else if (matchWaitingOnLoser) {
        message.channel.send(`${loser.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
    } else {
        const entry = await Tournament.findOne({ where: { playerId: loser.user.id } })
        const winningPlayer = await Player.findOne({ where: { id: winner.user.id } })
        const losingPlayer = await Player.findOne({ where: { id: loser.user.id } })
        const winnerDB = winningPlayer.duelingBook ? ` (DB: ${winningPlayer.duelingBook})` : ``
        const loserDB = losingPlayer.duelingBook ? ` (DB: ${losingPlayer.duelingBook})` : ``
        if (entry.losses === 1) return message.channel.send(`New Match: <@${loser.user.id}>${loserDB} vs <@${winner.user.id}>${winnerDB}. Good luck to both duelists.`)
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
        const opponent = await Tournament.findOne({ 
            where: { 
                participantId: newOppoWinner
            }, 
            include: Player 
        })
        const winningPlayer = await Player.findOne({ where: { id: winner.user.id } })
        const opponentDB = opponent.player.duelingBook ? ` (DB: ${opponent.player.duelingBook})` : ``
        const winnerDB = winningPlayer.duelingBook ? ` (DB: ${winningPlayer.duelingBook})` : ``
        message.channel.send(`New Match: <@${winner.user.id}>${winnerDB} vs <@${opponent.playerId}>${opponentDB}. Good luck to both duelists.`)
    } else if (matchWaitingOnWinner) {
        message.channel.send(`${winner.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
    } else {
        winner.roles.remove(tourRole)
        message.channel.send(`<@${winner.user.id}>, You won the tournament! Congratulations on your stellar performance!`)
    }
    
    return
}

module.exports = {
    askForDBUsername,
    getDeckListTournament,
    getDeckTypeTournament,
    sendToTournamentChannel,
    checkResubmission,
    getUpdatedDeckURL,
    removeParticipant,
    getParticipants,
    getUpdatedMatchesObject,
    addMatchResult
}