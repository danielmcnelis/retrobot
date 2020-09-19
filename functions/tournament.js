
const { registrationChannel } = require('../static/channels.json')
const { tourRole } = require('../static/roles.json')
const status = require('../static/status.json')
const { Match, Matchup, Player, Tournament, YugiKaiba, Critter, Android, Yata, Vampire, TradChaos, ChaosWarrior, Goat, CRVGoat, Reaper, ChaosReturn, Stein, TroopDup, PerfectCircle, DADReturn, GladBeast, TeleDAD, DarkStrike, Lightsworn, Edison, Frog, SixSamurai, Providence, TenguPlant, LongBeach, DinoRabbit, WindUp, Meadowlands, BabyRuler, RavineRuler, FireWater, HAT, Shaddoll, London, BurningAbyss, Charleston, Nekroz, Clown, PePe, DracoPal, Monarch, ABC, GrassZoo, DracoZoo, LinkZoo, QuickFix, Tough, Magician, Gouki, Danger, PrankKids, SkyStriker, ThunderDragon, LunalightOrcust, StrikerOrcust, Current, Traditional, Rush, Speed, Nova, Rebirth  } = require('../db/index.js')
const { getCat } = require('./utility.js')
const { client, challongeClient } = require('../static/clients.js')
const formats = require('../static/formats.json')
const types = require('../static/types.json')


//ASK FOR DB USERNAME
const askForDBUsername = async (client, message, member, error = false, attempt = 0) => {
    const filter = m => m.author.id === member.user.id
    if (attempt >= 3) return member.user.send(`Sorry, time's up. You can also provide your DuelingBook username on the Discord server by using the **!db** command, followed by your username.`)
    attempt++
    const prompt = error ? `I think you're getting ahead of yourself. First, I need your DuelingBook username.` : `Hi! This appears to be your first tournament in our new system. Can you please provide your DuelingBook username?`
	const msg = await member.user.send(prompt)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 60000
    }).then(async collected => {
        if (collected.first().content.includes("duelingbook.com/deck") || collected.first().content.includes("imgur.com")) return askForDBUsername(client, message, member, true, attempt)
        const player = await Player.findOne({ where: { id: member.user.id }})
        await player.update({
            duelingBook: collected.first().content
        })
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
    const msg = await member.user.send("Please provide a DuelingBook download link for your tournament deck.");
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 180000
    }).then(collected => {
        if (collected.first().content.startsWith("https://www.duelingbook.com/deck") || collected.first().content.startsWith("www.duelingbook.com/deck") || collected.first().content.startsWith("duelingbook.com/deck")) {		
            return getDeckTypeTournament(client, message, member, collected.first().content)
        } else {
            return message.author.send("Sorry, I only accept duelingbook.com/deck links.")      
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
                    try {
                        const tourDeck = await Tournament.findOne({
                            where: { playerId: member.user.id }
                        })
    
                        await tourDeck.update({
                            url,
                            name: collected.first().content.toLowerCase(),
                            type: elem,
                            category: getCat(elem)
                        })
                    } catch (err) {
                        console.log(err)
                    }
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

        if (!success && !resubmission) {
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
        } else if (!success && resubmission) {
                    try {
                        const tourDeck = await Tournament.findOne({
                            where: { playerId: member.user.id }
                        })
    
                        await tourDeck.update({
                            url,
                            name: collected.first().content.toLowerCase(),
                            type: 'other',
                            category: 'other'
                        })

                        sendToTournamentChannel(client, member, url, 'Other')
                        return member.user.send(`Thanks! I have your updated ${collected.first().content} deck list for the tournament.`)
                    } catch (err) {
                        console.log(err)
                    }
        }
    }).catch(err => {    
    console.log(err)
    return member.user.send(`Sorry, time's up. If you wish to try again, go back to the Discord server and use the **!join** command.`)
})

}



//CHANGE DECK TYPE TOURNAMENT
const changeDeckTypeTournament = async (client, message, member, entry) => {
    const keys = Object.keys(types)
    let success = false

	const filter = m => m.author.id === message.author.id
	const msg = await message.author.send(`Okay, what kind of deck did ${member.user.username} submit?\n${entry.url}`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 30000
    }).then(async collected => {
        keys.forEach(async function (elem) {
            if (types[elem].includes(collected.first().content.toLowerCase())) {
                success = true
                await entry.update({
                    type: elem,
                    category: getCat(elem)
                })

                message.author.send(`Thanks! I reclassified ${member.user.username}'s deck as "${types[elem][0]}".`)
                return client.channels.cache.get(registrationChannel).send(`<@${member.user.id}>'s deck has been reclassified as "${types[elem][0]}" by ${message.author.username}:
${entry.url}`)
            }
        })

        if (!success) {
            await entry.update({
                type: 'other',
                category: 'other'
            })

            message.author.send(`Thanks! I reclassified ${member.user.username}'s deck as "Other".`)
            return client.channels.cache.get(registrationChannel).send(`<@${member.user.id}>'s deck has been reclassified as "Other" by ${message.author.username}:
${entry.url}`)
        }
    }).catch(err => {    
    console.log(err)
    message.author.send(`Sorry, time's up.`)
    return client.channels.cache.get(registrationChannel).send(`<@${member.user.id}>'s deck was not reclassified.`)
})

}


//SEND TO TOURNAMENT CHANNEL
const sendToTournamentChannel = async (client, member, deckUrl, deckType) => {
    return client.channels.cache.get(registrationChannel).send(`<@${member.user.id}> submitted their ${deckType} deck list for the tournament. Please confirm this deck is legal and accurately labeled, then add ${member.user.username} to the bracket using the **!signup** command:
${deckUrl}`)
}

//SEED
const seed = async (message, challongeClient, name, participantId, index) => {
    try {
        await challongeClient.participants.update({
            id: name,
            participantId: participantId,
            participant: {
            seed: index + 1,
            },
            callback: async (err, data) => {
                if (err) {
                    console.log(err)
                    status['seeded'] = false
                    fs.writeFile("./static/status.json", JSON.stringify(status), (err) => { 
                        if (err) console.log(err)
                    })
                    return message.channel.send(`Something went wrong. ${data.participant.name} should be the ${index+1} seed but there was an error.`)
                } else {
                    return message.channel.send(`${data.participant.name} is now the ${index+1} seed.`)
                }
            }
        })
    } catch (err) {
        console.log(err)
    }
}



//GET UPDATED DECK URL
const getUpdatedDeckURL = async (client, message, member) => {
    const msg = await member.user.send("Okay, please provide a DuelingBook download link for your tournament deck.");
    const filter = collected => collected.author.id === member.user.id;
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 180000
    }).then(collected => {
        if (collected.first().content.startsWith("https://www.duelingbook.com/deck") || collected.first().content.startsWith("www.duelingbook.com/deck") || collected.first().content.startsWith("duelingbook.com/deck")) {
            return getDeckTypeTournament(client, message, member, collected.first().content, true)
        } else {
            return member.user.send("Sorry, I only accept duelingbook.com/deck links.")
        }
    }).catch(err => {
        console.log(err)
        return member.user.send(`Sorry, time's up. If you wish to try again, go back to the server and use the **!join** command.`)
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
                console.log(`removing ${member.user.username}'s tournament role`)
                member.roles.remove(tourRole)

                if (drop) return message.channel.send(`I removed you from the tournament. Better luck next time!`)
                return message.channel.send(`${person.username} has been removed from the tournament.`)
            }
        }
    })
}


//FIND OPPONENT
const findOpponent = async (message, matches, noShow, noShowPlayer, formatName, formatDatabase) => {
    const noShowPartId = noShowPlayer.participantId
    let keys = Object.keys(matches)
    let winnerPartId
    let winner

    keys.forEach(function(elem) {
        if ((matches[elem].match.player1Id === noShowPartId || matches[elem].match.player2Id === noShowPartId)) {
            if (matches[elem].match.state === 'open') {
                winnerPartId = (matches[elem].match.player1Id === noShowPartId ? matches[elem].match.player2Id : matches[elem].match.player1Id)
            }
        }
    })
    
    try {
        const winningEntry = await Tournament.findOne({ where: { participantId: winnerPartId }})
        winner = message.guild.members.cache.get(winningEntry.playerId)
    } catch (err) {
        console.log(err)
    }

    return getParticipants(message, matches, noShow, winner, formatName, formatDatabase, true)
}

//GET PARTICIPANTS
const getParticipants = async (message, matches, loser, winner, formatName, formatDatabase, noshow = false) => {
    challongeClient.participants.index({
        id: status['tournament'],
        callback: (err, data) => {
            if (err) {
                return message.channel.send(`Error: the current tournament, "${status['tournament']}", could not be accessed.`)
            } else {
                return addMatchResult(message, matches, data, loser, winner, formatName, formatDatabase, noshow)
            }
        }
    })
}

//ADD MATCH RESULT
const addMatchResult = async (message, matches, participants, loser, winner, formatName, formatDatabase, noshow = false) => {
    let loserId
    let winnerId
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

        winnerId = winnerEntry.participantId
    } catch (err) {
        console.log(err)
    }

    try {
        let loserEntry = await Tournament.findOne({
            where: {
                playerId: loser.user.id
            }
        })

        loserId = loserEntry.participantId
    } catch (err) {
        console.log(err)
    }

    if (!loserId) {
        players.forEach(function(elem) {
            if (participants[elem].participant.name === loser.user.username) {
                loserId = participants[elem].participant.id
            }
        })
    }

    if (!winnerId) {
        players.forEach(function(elem) {
            if (participants[elem].participant.name === winner.user.username) {
                winnerId = participants[elem].participant.id
            }
        })
    }

    let keys = Object.keys(matches)
    keys.forEach(function(elem) {
        if ( (matches[elem].match.player1Id === loserId && matches[elem].match.player2Id === winnerId) || (matches[elem].match.player2Id === loserId && matches[elem].match.player1Id === winnerId) ) {
            if (matches[elem].match.state === 'complete') {
                matchComplete = true
            } else if (matches[elem].match.state === 'open') {
                matchID = matches[elem].match.id
                if (noshow) {
                    score = '0-0'
                } else if (matches[elem].match.player1Id === loserId) {
                    score = '0-1'
                } else {
                    score = '1-0'
                }
            }
        }
    })

    if (!winnerId) {
        return message.channel.send(`${winner.user.username} is not in the tournament.`)
    } else if (!loserId) {
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
              winnerId: winnerId
            },
            callback: async (err) => {
                if (err) {
                    return message.channel.send(`Error: The match between ${winner.user.username} and ${loser.user.username} could not be updated.`)
                } else if (!noshow) {
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
                    try {
                        await winningPlayersRecord.save()
                        await losingPlayersRecord.save()
                    } catch (err) {
                        console.log('error saving player records')
                    }
                    
                    try {
                        await Match.create({ format: formatDatabase, winner: winner.user.id, loser: loser.user.id, delta })
                    } catch (err) {
                        console.log('error creating Match')
                    }

                    try {
                        await Matchup.create({ 
                            format: formatDatabase, 
                            winningType: winningPlayer.tournament.type, 
                            losingType: losingPlayer.tournament.type, 
                            wasTournament: true, 
                            tournamentName: status['tournament'] 
                        })
                    } catch (err) {
                        console.log('error creating Matchup')
                        console.log(err)
                    }

                    try {
                        const entry = await Tournament.findOne({ where: { playerId: loser.user.id } })
                        entry.losses++
                        await entry.save()
                    } catch (err) {
                        console.log('error saving entry')
                    }
                         
                    message.channel.send(`<@${loser.user.id}>, Your ${formatName} tournament loss to ${winner.user.username} has been recorded.`)
                    return setTimeout(function() {
                        getUpdatedMatchesObject(message, participants, matchID, loserId, winnerId, loser, winner)
                    }, 3000)	
                } else {
                    try {
                        const entry = await Tournament.findOne({ where: { playerId: loser.user.id } })
                        entry.losses++
                        await entry.save()
                    } catch (err) {
                        console.log('error saving entry')
                    }
                         
                    message.channel.send(`<@${loser.user.id}>, Your ${formatName} tournament match against ${winner.user.username} has been recorded as a no-show.`)
                    return setTimeout(function() {
                        getUpdatedMatchesObject(message, participants, matchID, loserId, winnerId, loser, winner)
                    }, 3000)
                }
            }
        })
    }
}


//GET UPDATED MATCHES OBJECT
const getUpdatedMatchesObject = async (message, participants, matchID, loserId, winnerId, loser, winner) => {
    return challongeClient.matches.index({
        id: status['tournament'],
        callback: (err, data) => {
            if (err) {
                return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
            } else {
                return checkMatches(message, data, participants, matchID, loserId, winnerId, loser, winner)
            }
        }
    }) 
}




//CHECK MATCHES
const checkMatches = async (message, matches, participants, matchID, loserId, winnerId, loser, winner) => {
    console.log('loser.user.username', loser.user.username)
    console.log('winner.user.username', winner.user.username)
    let winnerNextMatchId
    let winnerWaitingOnMatchId
    let winnerNextOppoPartId
    let winnerWaitingOnP1Id
    let winnerWaitingOnP2Id
    let winnerMatchWaitingOnP1Name
    let winnerMatchWaitingOnP2Name

    let loserNextMatchId
    let loserWaitingOnMatchId
    let loserNextOppoPartId
    let loserWaitingOnP1Id
    let loserWaitingOnP2Id
    let loserMatchWaitingOnP1Name
    let loserMatchWaitingOnP2Name

    let keys = Object.keys(matches)
    let players = Object.keys(participants)

    keys.forEach(function(elem) {
        if ((matches[elem].match.player1Id === winnerId || matches[elem].match.player2Id === winnerId)) {
            if (matches[elem].match.state === 'pending') {
                if (matches[elem].match.player1Id) {
                    winnerWaitingOnMatchId = matches[elem].match.player2PrereqMatchId
                } else {
                    winnerWaitingOnMatchId = matches[elem].match.player1PrereqMatchId
                }
            } else if (matches[elem].match.state === 'open') {
                winnerNextMatchId = matches[elem].match.id
                winnerNextOppoPartId = (matches[elem].match.player1Id === winnerId ? matches[elem].match.player2Id : matches[elem].match.player1Id)
            }
        }

        if ((matches[elem].match.player1Id === loserId || matches[elem].match.player2Id === loserId)) {
            if (matches[elem].match.state === 'pending') {
                if (matches[elem].match.player1Id) {
                    loserWaitingOnMatchId = matches[elem].match.player2PrereqMatchId
                } else {
                    loserWaitingOnMatchId = matches[elem].match.player1PrereqMatchId
                }
            } else if (matches[elem].match.state === 'open') {
                loserNextMatchId = matches[elem].match.id
                loserNextOppoPartId = (matches[elem].match.player1Id === loserId ? matches[elem].match.player2Id : matches[elem].match.player1Id)
            }
        }
    })


    keys.forEach(function(elem) {
        if (matches[elem].match.id === winnerWaitingOnMatchId) {
            winnerWaitingOnP1Id = matches[elem].match.player2Id
            winnerWaitingOnP2Id = matches[elem].match.player1Id
        }

        if (matches[elem].match.id === loserWaitingOnMatchId) {
            loserWaitingOnP1Id = matches[elem].match.player2Id
            loserWaitingOnP2Id = matches[elem].match.player1Id
        }  
    })

    players.forEach(function(elem) {
         if (participants[elem].participant.id === winnerNextOppoPartId) winnerNextOppoName = participants[elem].participant.name
         if (participants[elem].participant.id === loserNextOppoPartId) loserNextOppoName = participants[elem].participant.name
         if (participants[elem].participant.id === winnerWaitingOnP1Id) winnerMatchWaitingOnP1Name = participants[elem].participant.name
         if (participants[elem].participant.id === winnerWaitingOnP2Id) winnerMatchWaitingOnP2Name = participants[elem].participant.name
         if (participants[elem].participant.id === loserWaitingOnP1Id) loserMatchWaitingOnP1Name = participants[elem].participant.name
         if (participants[elem].participant.id === loserWaitingOnP2Id) loserMatchWaitingOnP2Name = participants[elem].participant.name
    })

    if (loserWaitingOnMatchId) {
        if (loserMatchWaitingOnP1Name && loserMatchWaitingOnP2Name) {
            message.channel.send(`${loser.user.username}, You are waiting for the result of ${loserMatchWaitingOnP1Name} vs ${loserMatchWaitingOnP2Name}.`)
        } else {
            message.channel.send(`${loser.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`) 
        }
    } else if (loserNextOppoPartId) {
        const opponent = await Tournament.findOne({ 
            where: { 
                participantId: loserNextOppoPartId 
            }, 
            include: Player 
        })
        const losingPlayer = await Player.findOne({ where: { id: loser.user.id } })
        const opponentDB = opponent.player.duelingBook ? ` (DB: ${opponent.player.duelingBook})` : ``
        const loserDB = losingPlayer.duelingBook ? ` (DB: ${losingPlayer.duelingBook})` : ``
        message.channel.send(`New Match: <@${loser.user.id}>${loserDB} vs <@${opponent.playerId}>${opponentDB}. Good luck to both duelists.`)
    } else {
        const entry = await Tournament.findOne({ where: { playerId: loser.user.id } })
        const winningPlayer = await Player.findOne({ where: { id: winner.user.id } })
        const losingPlayer = await Player.findOne({ where: { id: loser.user.id } })
        const winnerDB = winningPlayer.duelingBook ? ` (DB: ${winningPlayer.duelingBook})` : ``
        const loserDB = losingPlayer.duelingBook ? ` (DB: ${losingPlayer.duelingBook})` : ``
        if (entry.losses === 1) {
            return message.channel.send(`New Match: <@${loser.user.id}>${loserDB} vs <@${winner.user.id}>${winnerDB}. Good luck to both duelists.`)
        } else {
            console.log(`removing ${loser.user.username}'s tournament role`)
            loser.roles.remove(tourRole)
            message.channel.send(`${loser.user.username}, You are eliminated from the tournament. Better luck next time!`)
        }
    }

    if (winnerWaitingOnMatchId) {
        if (winnerMatchWaitingOnP1Name && winnerMatchWaitingOnP2Name) {
            message.channel.send(`${winner.user.username}, You are waiting for the result of ${winnerMatchWaitingOnP1Name} vs ${winnerMatchWaitingOnP2Name}.`)
        } else {
            message.channel.send(`${winner.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`) 
        }
    } else if (winnerNextOppoPartId && (winnerNextOppoPartId !== loserId)) {
        const opponent = await Tournament.findOne({ 
            where: { 
                participantId: winnerNextOppoPartId
            },
            include: Player 
        })
        const winningPlayer = await Player.findOne({ where: { id: winner.user.id } })
        const opponentDB = opponent.player.duelingBook ? ` (DB: ${opponent.player.duelingBook})` : ``
        const winnerDB = winningPlayer.duelingBook ? ` (DB: ${winningPlayer.duelingBook})` : ``
        message.channel.send(`New Match: <@${winner.user.id}>${winnerDB} vs <@${opponent.playerId}>${opponentDB}. Good luck to both duelists.`)
    } else if (!winnerNextOppoPartId && !winnerWaitingOnMatchId) {
        console.log(`removing ${winner.user.username}'s tournament role`)
        winner.roles.remove(tourRole)
        message.channel.send(`<@${winner.user.id}>, You won the tournament! Congratulations on your stellar performance!`)
    }
    
    return
}

module.exports = {
    askForDBUsername,
    getDeckListTournament,
    getDeckTypeTournament,
    changeDeckTypeTournament,
    sendToTournamentChannel,
    getUpdatedDeckURL,
    removeParticipant,
    seed,
    getParticipants,
    findOpponent,
    getUpdatedMatchesObject,
    addMatchResult
}