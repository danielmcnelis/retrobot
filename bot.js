

//GOATBOT - A RANKINGS BOT FOR GOATFORMAT.COM

const Discord = require('discord.js')
const fs = require('fs')
const { Op } = require('sequelize')
const { sad, rock, bron, silv, gold, plat, dia, mast, lgnd, goat, upvote, downvote, tweet, star } = require('./static/emojis.json')
const { pfpcom, botcom, rolecom, statscom, losscom, h2hcom, undocom, rankcom, deckscom, replayscom, yescom, nocom } = require('./static/commands.json')
const { botRole, goatRole, tourRole } = require('./static/roles.json')
const { welcomeChannel, registrationChannel } = require('./static/channels.json')
const types = require('./static/types.json')
const status = require('./static/status.json')
const { Player, Match, Matchup, Replay, Deck, Tournament }  = require('./db/index.js')
const { capitalize, createPlayer, isNewUser, isMod } = require('./functions/utility.js')
const { getReplayInfo1 } = require('./functions/replay.js')
const { checkForNewRatings, getDeckType } = require('./functions/deck.js')
const { getDeckTypeTournament, checkResubmission, removeParticipant, getParticipants } = require('./functions/tournament.js')
const { makeSheet, addSheet, writeToSheet } = require('./functions/sheets.js')
const { client, challongeClient } = require('./static/clients.js')

//READY
client.on('ready', () => {
  console.log('GoatBot is online!')
})


//PING
client.on('message', message => {
  if (message.content === '!ping') {
    message.channel.send("pong")
  }
})


//WELCOME
client.on('guildMemberAdd', async (member) => {
    const channel = client.channels.cache.get(welcomeChannel)
    if (!channel) return
    if (await isNewUser(member.user.id)) {
        createPlayer(member) 
        channel.send(`Welcome to the GoatFormat.com discord server, ${member}. Please read the rules and ask about the tutorial. ${goat}`)
    } else {
        channel.send(`Welcome back to GoatFormat.com, ${member}! We missed you. ${goat}`)
    }
})

    
//GOODBYE
client.on('guildMemberRemove', member => {
    const channel = client.channels.cache.get(welcomeChannel)
    if (!channel) return
    channel.send(`Today is a sad day. ${member.user.username} has left the server. ${sad}`)
})


//COMMANDS
client.on('message', async (message) => {
    const messageArray = message.content.split(" ")
    const cmd = messageArray[0]
    const args = messageArray.slice(1)
    const maid = message.author.id
    let tweetFilterPassed = false  

    if ( (message.content.includes('https://i.imgur.com') || message.content.includes('https://www.duelingbook.com/deck') || message.content.includes('https://www.duelingbook.com/replay') ) && message.author.bot) {
        let player = await Player.findOne({ where: { tag: message.content.substring(0, message.content.indexOf(`'s `)) }})
        let deckName = message.content.substring((message.content.indexOf(`'s `)+3), message.content.indexOf(` deck`))
        let deckType 
        let keys = Object.keys(types)
        keys.forEach(function(elem) {
            if (types[elem].includes(deckName)) { 
                deckType = elem
            }
        })

        return checkForNewRatings(message, player, deckType, deckName)
    }

    if (!message.guild || message.author.bot) {
        return
    }

    const tweetFilter = (reaction) => {
        if (reaction.emoji.name === 'tweet') {
            tweetFilterPassed = true
            return true
        }
    }
    
    message.awaitReactions(tweetFilter, {
        max: 1,
        time: 86400000
    }).then(collected => {
        if (tweetFilterPassed) {
            return message.channel.send('Tweet this message.')
        }
    }).catch(err => {
        console.log(err)
    })


    //CHALLONGE - CREATE
    if (cmd === `!create`) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        function getRandomString(length, chars) {
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
            return result;
        }

        const str = getRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz');
        const name = (args[0] ? args[0] : 'New Tournament')
        const url = (args[0] ? args[0] : str)
        challongeClient.tournaments.create({
            tournament: {
            name: name,
            url: url,
            tournamentType: 'double elimination',
            gameName: 'Yu-Gi-Oh!',
            },
            callback: (err) => {
            if (err) {
                return message.channel.send(`Error: The name "${url}" is already taken.`)
            } else {
                status['tournament'] = name
                fs.writeFile("./status.json", JSON.stringify(status), (err) => { 
                    if (err) console.log(err)
                })
                return message.channel.send(`I created a new tournament named ${name}, located at https://challonge.com/${url}`)
            }
            }
        });   
    }


    //CHALLONGE - DESTROY
    if (cmd === `!destroy`) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        const name = (args[0] ? args[0] : status['tournament'])
        challongeClient.tournaments.destroy({
            id: name,
            callback: (err) => {
                if (err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be deleted.`)
                } else {
                    if (status['tournament'] === name) {
                        delete status['tournament']
                        fs.writeFile("./status.json", JSON.stringify(status), (err) => { 
                            if (err) console.log(err)
                        })
                    }
                    return message.channel.send(`I deleted the tournament named "${name}" from the GoatFormat.com Challonge account.`)
                }
            }
          });  
    }

    if (cmd === `!test`) {
        const allMatchups = await Matchup.findAll({ where: { tournamentName: status['tournament'] }})
        const deckRecords = {}
        const deckCrossTabs = {}

        allMatchups.forEach(function (matchup) {
            // if (!deckRecords[matchup.winningType]) deckRecords[matchup.winningType] = { wins: 0, losses: 0 }
            // if (!deckRecords[matchup.losingType]) deckRecords[matchup.losingType] = { wins: 0, losses: 0 }
            // deckRecords[matchup.winningType].wins++
            // deckRecords[matchup.losingType].losses++

            // console.log('matchup', matchup)
            
            if (!deckCrossTabs[matchup.winningType]) deckCrossTabs[matchup.winningType] = { [matchup.losingType]: { wins: 0, losses: 0 }}
            if (!deckCrossTabs[matchup.losingType]) deckCrossTabs[matchup.losingType] = { [matchup.winningType]: { wins: 0, losses: 0 }}

            if (deckCrossTabs[matchup.winningType]) {
                if(!deckCrossTabs[matchup.winningType][matchup.losingType]) {
                    deckCrossTabs[matchup.winningType][matchup.losingType] = { wins: 0, losses: 0 }
                }
            } 

            if (deckCrossTabs[matchup.losingType]) {
                if(!deckCrossTabs[matchup.losingType][matchup.winningType]) {
                    deckCrossTabs[matchup.losingType][matchup.winningType] = {wins: 0, losses: 0 }
                }
            }

            // if (!deckCrossTabs[matchup.winningType][matchup.losingType]) deckCrossTabs[matchup.winningType][matchup.losingType] = { wins: 0, losses: 0 }
            // if (!deckCrossTabs[matchup.losingType][matchup.winningType]) deckCrossTabs[matchup.losingType][matchup.winningType] = { wins: 0, losses: 0 }
            deckCrossTabs[matchup.winningType][matchup.losingType] ? deckCrossTabs[matchup.winningType][matchup.losingType].wins++ : deckCrossTabs[matchup.winningType][matchup.losingType].wins = 1
            deckCrossTabs[matchup.losingType][matchup.winningType] ? deckCrossTabs[matchup.losingType][matchup.winningType].losses++ : deckCrossTabs[matchup.losingType][matchup.winningType].losses = 1
        })

        // let deckRecordsArr = Object.entries(deckRecords).sort((b, a) => b[0].localeCompare(a[0]))
        // let arr = deckRecordsArr.map(function(deck) {
        //     return(
        //         `${types[deck[0]][0]}: ${deckRecords[deck[0]].wins}W, ${deckRecords[deck[0]].losses}L`
        //     )
        // })

        let deckCrosstabsArr = Object.entries(deckCrossTabs).sort((b, a) => b[0].localeCompare(a[0]))
        // let arr2 = deckCrosstabsArr.map(function(deck) {
        //     return(
        //         `${types[deck[0]][0]}: ${deckRecords[deck[0]].wins}W, ${deckRecords[deck[0]].losses}L`
        //     )
        // })

        console.log('deckCrosstabsArr', deckCrosstabsArr)
        deckCrosstabsArr.forEach(function(elem) {
            console.log('elem:', elem)
        })

        // allMatchups.forEach(function (matchup) {
        //     deckCrossTabs[matchup.winningType][matchup.losingType].wins ? deckCrossTabs[matchup.winningType][matchup.losingType].wins++ : deckCrossTabs[matchup.winningType][matchup.losingType].wins = 1
        //     deckCrossTabs[matchup.losingType][matchup.winningType].losses ? deckCrossTabs[matchup.losingType][matchup.winningType].losses++ : deckCrossTabs[matchup.losingType][matchup.winningType].losses = 1
        // })

        // let deckRecordsArr = Object.entries(deckRecords).sort((b, a) => b[0].localeCompare(a[0]))
        // let arr = deckRecordsArr.map(function(deck) {
        //     return(
        //         `${types[deck[0]][0]}: ${deckRecords[deck[0]].wins}W, ${deckRecords[deck[0]].losses}L`
        //     )
        // })

        // message.channel.send(arr)
    }

    //CHALLONGE - END
    if (cmd === `!end`) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        const name = (args[0] ? args[0] : status['tournament'])

        const allMatchups = await Matchup.findAll({ where: { tournamentName: status['tournament'] }})
        const deckRecords = {}
        const deckCrossTabs = {}

        allMatchups.forEach(function (matchup) {
            if (!deckRecords[matchup.winningType]) deckRecords[matchup.winningType] = { wins: 0, losses: 0 }
            if (!deckRecords[matchup.losingType]) deckRecords[matchup.losingType] = { wins: 0, losses: 0 }
            deckRecords[matchup.winningType].wins++
            deckRecords[matchup.losingType].losses++
        })

        allMatchups.forEach(function (matchup) {
            if (!deckCrossTabs[matchup.winningType][matchup.losingType]) deckCrossTabs[matchup.winningType][matchup.losingType] = { wins: 0, losses: 0 }
            if (!deckCrossTabs[matchup.losingType][matchup.winningType]) deckCrossTabs[matchup.losingType][matchup.winningType] = { wins: 0, losses: 0 }
            deckCrossTabs[matchup.winningType][matchup.losingType].wins ? deckCrossTabs[matchup.winningType][matchup.losingType].wins++ : deckCrossTabs[matchup.winningType][matchup.losingType].wins = 1
            deckCrossTabs[matchup.losingType][matchup.winningType].losses ? deckCrossTabs[matchup.losingType][matchup.winningType].losses++ : deckCrossTabs[matchup.losingType][matchup.winningType].losses = 1
        })

        let deckRecordsArr = Object.entries(deckRecords).sort((b, a) => b[0].localeCompare(a[0]))
        let arr = deckRecordsArr.map(function(deck) {
            return(
                `${types[deck[0]][0]}: ${deckRecords[deck[0]].wins}W, ${deckRecords[deck[0]].losses}L`
            )
        })

        // let deckCrosstabsArr = Object.entries(deckCrossTabs).sort((b, a) => b[0].localeCompare(a[0]))
        // let arr2 = deckCrosstabsArr.map(function(deck) {
        //     return(
        //         `${types[deck[0]][0]}: ${deckRecords[deck[0]].wins}W, ${deckRecords[deck[0]].losses}L`
        //     )
        // })

        // console.log('deckCrosstabsArr', deckCrosstabsArr)

        challongeClient.tournaments.finalize({
            id: name,
            callback: async (err) => {
                if (err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be finalized.`)
                } else {
                    delete status['tournament']
                    fs.writeFile("./status.json", JSON.stringify(status), (err) => { 
                        if (err) console.log(err)
                    })

                    await Tournament.destroy({ where: {}, truncate: true })

                    // client.channels.cache.get(registrationChannel).send(typeDataArr2)
                    client.channels.cache.get(registrationChannel).send(arr)

                    return message.channel.send(`Congratulations, your tournament results have been finalized: https://challonge.com/${name}.`)
                }
            }
        })
    }


    //CHALLONGE - SHOW
    if (cmd === `!show`) {
        const name = (args[0] ? args[0] : status['tournament'])
        if (!name) {
            return message.channel.send('There is no active tournament.')
        }
        challongeClient.tournaments.show({
            id: name,
            callback: (err) => {
                if (err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be found.`)
                } else {
                    return message.channel.send(`Here is the link to the tournament you requested: https://challonge.com/${name}.`)
                }
            }
        })  
    }

    //CHALLONGE - START
    if (cmd === `!start`) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        const unregistered = await Tournament.findAll({ where: { participantId: null } })
        if (unregistered.length) return message.channel.send('One of more players has not been signed up. Please check the Database.')

        const allDecks = await Tournament.findAll()
        const typeData = {}
        const catData = {}
        const sheet1Data = [['Player', 'Deck', 'Link']]
        const sheet2DataA = [['Deck', 'Entries', 'Percent']]
        const sheet2DataB = [[], ['Category', 'Entries', 'Percent']]

        allDecks.forEach(function (deck) {
            typeData[deck.type] ? typeData[deck.type]++ : typeData[deck.type] = 1
            catData[deck.category] ? catData[deck.category]++ : catData[deck.category] = 1
            const row = [deck.pilot, types[deck.type][0], deck.url]
            sheet1Data.push(row)
        })

        let typeDataArr = Object.entries(typeData).sort((b, a) => b[0].localeCompare(a[0]))
        let catDataArr = Object.entries(catData).sort((b, a) => b[0].localeCompare(a[0]))

        let typeDataArr2 = typeDataArr.map(function(elem) {
            return [types[elem[0]][0], elem[1], `${(elem[1], elem[1] / allDecks.length * 100).toFixed(2)}%`]
        })

        let catDataArr2 = catDataArr.map(function(elem) {
            return [capitalize(elem[0]), elem[1], `${(elem[1], elem[1] / allDecks.length * 100).toFixed(2)}%`]
        })

        const sheet2Data = [...sheet2DataA, ...typeDataArr2, ...sheet2DataB, ...catDataArr2]
        const name = (args[0] ? args[0] : status['tournament'])
        challongeClient.tournaments.start({
            id: name,
            callback: async (err) => {
                if (err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be initialized.`)
                } else {
                    const spreadsheetId = await makeSheet(`${name} Deck Lists`, sheet1Data)
                    const link = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
                    await addSheet(spreadsheetId, 'Summary')
                    await writeToSheet(spreadsheetId, 'Summary', 'RAW', sheet2Data)
                    client.channels.cache.get(registrationChannel).send(`Deck list spreadsheet: ${link}`)
                    return message.channel.send(`Let's go! Your tournament is starting now: https://challonge.com/${name}.`)
                }
            }
        })
    }

    //CHALLONGE - JOIN
    if (cmd === `!join`) {
        const name = status['tournament']
        const member = message.guild.members.cache.get(maid)
        if (!name) return message.channel.send('There is no active tournament.')
        if (!member) return message.channel.send('I could not find you in the server. Please be sure you are not invisible.')
        
        if (await isNewUser(maid)) {
            createPlayer(message.member)
            return message.channel.send("I added you to the Goat Format database. Please try again.")
        }

        challongeClient.tournaments.show({
            id: name,
            callback: async (err, data) => {
                if (err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be found.`)
                } else {
                    if (data.tournament.state !== 'pending') return message.channel.send("Sorry, the tournament already started.")
                    message.channel.send("Please check your DMs.")
                    const tourDeck = await Tournament.findOne({ where: { playerId: maid } })
                    if (tourDeck) {
                        return checkResubmission(client, message, member)
                    }
            
                    const msg = await member.user.send("Please provide an Imgur screenshot or a DuelingBook download link for your tournament deck.");
                    const filter = collected => collected.author.id === maid;
                    const collected = await msg.channel.awaitMessages(filter, {
                        max: 1,
                        time: 15000
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
                        return message.author.send('Perhaps another time would be better.')
                    })
                }
            }
        })
    }

    //CHALLONGE - SIGN UP
    if (cmd === `!signup`) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that. Please use the command **!join** instead.')
        
        const name = status['tournament']
        const person = message.mentions.users.first()
        const member = message.guild.members.cache.get(person.id)
        const entry = await Tournament.findOne({ where: { playerId: person.id }})

        if (!name) return message.channel.send(`There is no active tournament.`)
        if (!person) return message.channel.send(`Please provide an @ mention of the player you wish to sign-up for the tournament.`)
        if (!member) return message.channel.send(`I couldn't find that user in the server.`)
        if (!entry) return message.channel.send(`That person has not registered for the tournament.`)

        await challongeClient.tournaments.show({
            id: name,
            callback: async (err, data) => {
                if (err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be found.`)
                } else {
                    if (data.tournament.state !== 'pending') return message.channel.send("Sorry, the tournament already started.")
                    await challongeClient.participants.create({
                        id: name,
                        participant: {
                        name: person.username,
                        },
                        callback: async (err, data) => {
                            if (err) {
                                console.log(err)
                                return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                            } else {
                                member.roles.add(tourRole)
                                const entry = await Tournament.findOne({ where: { playerId: member.user.id }})
                                entry.update({ participantId: data.participant.id })
                                return message.channel.send(`${person.username} is now registered for the tournament.`)
                            }
                        }
                    })
                }
            }
        })


        
    }


    //CHALLONGE - REMOVE
    if (cmd === `!remove`) {
        const name = status['tournament']
        const person = message.mentions.users.first()
        const member = message.guild.members.cache.get(person.id)

        if (!name) return message.channel.send('There is no active tournament.')
        if (!person) return message.channel.send('Please provide an @ mention of the player you wish to sign-up for the tournament.')
        if (!member) return message.channel.send('I could not find that user in the server.')

        challongeClient.participants.index({
            id: name,
            callback: (err, data) => {
                if (err) {
                    return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                } else {
                    return removeParticipant(message, data, name, person)
                }
            }
        })
    }


    //CHALLONGE - DROP
    if (cmd === `!drop`) {
        const name = status['tournament']
        const person = message.author
        if (!name) return message.channel.send('There is no active tournament.')
        
        challongeClient.participants.index({
            id: name,
            callback: (err, data) => {
                if (err) {
                    return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                } else {
                    return removeParticipant(message, data, name, person)
                }
            }
        })
    }



    //CHALLONGE - INSPECT
    if (cmd === `!inspect`) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        let elem = (args[0] ? args[0] : 'tournament')
        let name = (args[1] ? args[1] : status['tournament'])

        if (elem === 'participants' || elem === 'part') {
            challongeClient.participants.index({
                id: name,
                callback: (err, data) => {
                    if (err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        console.log(data)
                        message.channel.send(`I printed the tournament participants to the console.`)
                    }
                }
            })
        } else if (elem === 'matches' || elem === 'match') {
            challongeClient.matches.index({
                id: name,
                callback: (err, data) => {
                    if (err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        console.log(data)
                        message.channel.send(`I printed the tournament matches to the console.`)
                    }
                }
            })
        } else if (elem === 'tour' || elem === 'tournament') {
            challongeClient.tournaments.show({
                id: name,
                callback: (err, data) => {
                    if (err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        console.log(data)
                        message.channel.send(`I printed the current tournament summary to the console.`)
                    }
                }
            })
        } else {
            return message.channel.send(`Invalid input: ${args[0]} is not a tournament element.`)
        }
    }

    //DECK-LISTS AUTO MODERATION
    if (deckscom.includes(cmd)) {  
        const person = message.mentions.users.first()
        const playerId = (person ? person.id : message.author.id)
        const decks = await Deck.findAll({ where: { playerId }, order: [['rating', 'DESC']] })
        const player = await Player.findOne( { where: {id: playerId } })

        if (!decks && playerId !== maid) return message.channel.send("That player has no decks in the database.")
        if (!decks && playerId === maid) {
            if (await isNewUser(playerId)) {
                createPlayer(message.member)
                return message.channel.send("I added you to the Goat Format database. Please try again.")
            } else {
                return message.channel.send("You don't have any decks in the database.")
            }
        } 

        decks.forEach(function (deck) {
            message.channel.send(`${player.tag}'s ${types[deck.type][0]} deck (${deck.rating}${star}):
${deck.url}`)
        })
    }


    //REPLAY-LINKS AUTO MODERATION
    if (replayscom.includes(cmd)) {    
        const person = message.mentions.users.first()
        const playerId = (person ? person.id : message.author.id)
        const replays = await Replay.findAll({ where: { [Op.or]: [{ p1: playerId }, { p2: playerId }] }, order: [['rating', 'DESC']] })
        
        if (!replays && playerId !== maid) return message.channel.send("That player has no replays in the database.")
        if (!replays && playerId === maid) {
            if (await isNewUser(playerId)) {
                createPlayer(message.member)
                return message.channel.send("I added you to the Goat Format database. Please try again.")
            } else {
                return message.channel.send("You don't have any replays in the database.")
            }
        } 

        let result = []
        replays.forEach(function (replay, index) {
            result.push(`${(index + 1)}. ${replay.p1Name} (${types[replay.deck1]}) vs ${replay.p2Name} (${types[replay.deck2]}) - ${replay.rating}${star}`)
        })

        message.channel.send(result.slice(0,30))
        message.channel.send(result.slice(30,60))
        message.channel.send(result.slice(60,90))
        message.channel.send(result.slice(90,99))
    }

    if (cmd === `!cats`) {
    const deckEmbed = new Discord.MessageEmbed()
    .addField('Control', `Chaos Control
Chaos Return
Chaos Turbo
Dark Master Zorc
Goat Control
Flip Control
Soul Control
P.A.C.M.A.N.
Relinquished
Strike Ninja
Zombie`, true)
        .addField('Aggro', `Anti-Meta Warrior
Aggro Monarch
Bazoo Return
Chaos Recruiter
Dark Scorpion
Drain Beat
Gearfried
Gravekeeper
Tiger Stun
Water`, true)
        .addField('Combo', `Ben-Kei OTK
Dimension Fusion Turbo
Economics FTK
Empty Jar
Exodia
Last Turn
Library FTK
Machine
Reasoning Gate Turbo
Rescue Cat OTK
Stein OTK`, true)
    .addField('Burn', `Aggro Burn
Dark Burn
Drain Burn
Speed Burn`, true)
        return message.channel.send(deckEmbed)
    }

    //DECK-LISTS AUTO MODERATION
    if (cmd === `!save`) {
        if (await isNewUser(maid)) {
            createPlayer(message.member)
            return message.channel.send("I added you to the Goat Format database. Please try again.")
        }

        if (message.content.startsWith("!save https://i.imgur")) {
            return getDeckType(message, message.member, args[0])
        } else if (message.content.startsWith("!save https://imgur")) {
            let url = `https://i.${args.join(" ").substring(8, args.join(" ").length)}.png`;
            return getDeckType(message, message.member, url)          
        } else if (message.content.startsWith("!save https://www.duelingbook.com/replay?")) {
            return getReplayInfo1(message, message.member, args[0])          
        } else {
            return message.channel.send(`If you wish to save a deck, please provide (1) Imgur.com link. If you wish to save a replay, please provide (1) DuelingBook.com/replay link. Please try again.`)
        }
    }


    //AVATAR
    if (pfpcom.includes(cmd)) {
        let person = message.mentions.users.first()
        let reply = person ? person.displayAvatarURL() : message.author.displayAvatarURL()
        return message.channel.send(reply)
    }


    //NAME
    if (cmd === `!name`) {
        const playerId = messageArray[1].replace(/[\\<>@#&!]/g, "")
        const member = message.guild.members.cache.get(playerId)
        const player = await Player.findOne({ where: { id: playerId } })
        return message.channel.send(`The database name of ${member.user.username} is: ${player.name}.`)
    }


    //RENAME
    if (cmd === `!rename`) {
        if (!isMod(message.member)) {
            return message.channel.send("You do not have permission to do that.")
        }

        const playerId = messageArray[1].replace(/[\\<>@#&!]/g, "")
        const member = message.guild.members.cache.get(playerId)
        const player = await Player.findOne({ where: { id: playerId } })
	    player.name = messageArray.slice(2, messageArray.length).join(' ')
	    player.tag = member.user.tag
        await player.save()
           
        return message.channel.send(`The database name of ${member.user.username} is now: ${player.name}.`)
    }


    //ROLE
    if (rolecom.includes(cmd)) {
        if (!message.member.roles.cache.some(role => role.id === goatRole)) {
			message.member.roles.add(goatRole)
            return message.channel.send("You now have the Ranked Goats role.")
        } else {
            message.member.roles.remove(goatRole);
            return message.channel.send("You no longer have the Ranked Goats role.")
        }
    }


    //BOT USER GUIDE
    if (botcom.includes(cmd)) {
        const botEmbed = new Discord.MessageEmbed()
	        .setColor('#38C368')
        	.setTitle('GoatBot')
	        .setDescription('A Rankings Bot for GoatFormat.com.\n' )
	        .setURL('https://goatformat.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/93IC0Ua.png', 'https://formatlibrary.com/')
        	.setThumbnail('https://i.imgur.com/9lMCJJH.png')
        	.addField('Ranked Play Commands', '\n!loss - (@user) - Report a loss to another player. \n!stats - (blank or @user) - Post a player’s stats. \n!top - (number) - Post the server’s top players (100 max). \n!h2h - (@user + @user) - Post the H2H record between 2 players. \n!role - Add or remove the Ranked Goats role. \n!undo - Undo the last loss if you reported it. \n')
        	.addField('Tournament Commands', '\n!join - Register for the next tournament. \n!drop - Drop from the current tournament. \n!show - Show the current tournament.')
        	.addField('Server Commands', '\n!save - (imgur.com link) - Save a deck. \n!decks - (blank or @user) - Post a player’s deck(s). \n!bot - View the GoatBot User Guide. \n!mod - View the Mod-Only User Guide.');

        message.author.send(botEmbed);
        return message.channel.send("I messaged you the GoatBot User Guide.")
    }

    //MOD USER GUIDE
    if (cmd === `!mod`) {
        if (!isMod(message.member)) {
            return message.channel.send("You do not have permission to do that.")
        } 

        const botEmbed = new Discord.MessageEmbed()
	        .setColor('#38C368')
        	.setTitle('GoatBot')
	        .setDescription('A Rankings Bot for GoatFormat.com.\n' )
	        .setURL('https://goatformat.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/93IC0Ua.png', 'https://formatlibrary.com/')
        	.setThumbnail('https://i.imgur.com/9lMCJJH.png')
        	.addField('Mod-Only Ranked Play Commands', '\n!manual - (@winner + @loser) - Manually record a match result. \n!undo - Undo the most recent loss, even if you did not report it.')
            .addField('Mod-Only Tournament Commands', '\n!create - (tournament name) - Create a new tournament.  \n!signup - (@user) - Add a player to the bracket. \n!remove - (@user) - Remove a player from the bracket. \n!start - Start the next tournament. \n!end - End the current tournament.')
            .addField('Mod-Only Server Commands', '\n!rename - (@user + new name) - Rename a user in the database.\n!census - Add missing players and update all names in the database.\n!recalc - Recaluate all player stats if needed.');

        message.author.send(botEmbed);
        return message.channel.send("I messaged you the Mod-Only Guide.")
    }


    //STATS
    if (statscom.includes(cmd)) {
        const playerId = (messageArray.length === 1 ?  maid : messageArray[1].replace(/[\\<>@#&!]/g, ""))
        const player = await Player.findOne({ where: { id: playerId } })

        if (!player && maid === playerId) {
            createPlayer(message.member);
            return message.channel.send("I added you to the Goat Format database. Please try again.")
        } else if (!player && maid !== playerId) {
            return message.channel.send("That user is not in the Goat Format database.")
        }

        const allPlayers = await Player.findAll({ 
            where: {
                [Op.or]: [ { wins: { [Op.gt]: 0 } }, { losses: { [Op.gt]: 0 } } ]
            },
            order: [['stats', 'DESC']]
        })
        
        const index = allPlayers.findIndex(player => player.dataValues.id === playerId)
        const rank = (index === -1 ? `N/A` : `#${index + 1} out of ${allPlayers.length}`)
        const medal = (player.stats <= 290 ? `Chump ${sad}`
        : (player.stats > 290 && player.stats <= 350) ? `Rock ${rock}`
        : (player.stats > 350 && player.stats <= 410) ? `Bronze ${bron}`
        : (player.stats > 410 && player.stats <= 470) ? `Silver ${silv}`
        : (player.stats > 470 && player.stats <= 530) ? `Gold ${gold}`
        : (player.stats > 530 && player.stats <= 590) ? `Platinum ${plat}`
        : (player.stats > 590 && player.stats <= 650) ? `Diamond ${dia}`
        : (player.stats > 650 && player.stats <= 710) ? `Master ${mast}`
        : `Legend ${lgnd}`)

        return message.channel.send(`${goat} --- Goat Format Stats --- ${goat}
Name: ${player.name}
Medal: ${medal}
Ranking: ${rank}
Wins: ${player.wins}, Losses: ${player.losses}
Elo Rating: ${player.stats.toFixed(2)}`)
    }


    //RANK
    if (rankcom.includes(cmd)) {
        const x = parseInt(args[0])
        let result = []
        x === 1 ? result[0] = `${goat} --- The Best Goat Player --- ${goat}`
        : result[0] = `${goat} --- Top ${x} Goat Players --- ${goat}`

        if (x < 1) return message.channel.send("Please provide a number greater than 0.")
        if (x > 100 || isNaN(x)) return message.channel.send("Please provide a number less than or equal to 100.")
        
        const allPlayers = await Player.findAll({ 
            where: {
                [Op.or]: [ { wins: { [Op.gt]: 0 } }, { losses: { [Op.gt]: 0 } } ]
            },
            order: [['stats', 'DESC']]
        })
                
        if (x > allPlayers.length) return message.channel.send(`I need a smaller number. We only have ${allPlayers.length} Goat Format players.`)
    
        const topPlayers = allPlayers.slice(0, x)
        const getMedal = (stats) => {
            return stats <= 290 ? sad
            : (stats > 290 && stats <= 350) ? rock
            : (stats > 350 && stats <= 410) ? bron
            : (stats > 410 && stats <= 470) ? silv
            : (stats > 470 && stats <= 530) ? gold
            : (stats > 530 && stats <= 590) ? plat
            : (stats > 590 && stats <= 650) ? dia
            : (stats > 650 && stats <= 710) ? mast
            : lgnd
        }
    
        for (let i = 0; i < x; i++) { 
            result[i+1] = `${(i+1)}. ${getMedal(topPlayers[i].stats)} ${topPlayers[i].name}`
        }
    
        message.channel.send(result.slice(0,30))
        if (result.length > 30) message.channel.send(result.slice(30,60))
        if (result.length > 60) message.channel.send(result.slice(60,90))
        if (result.length > 90) message.channel.send(result.slice(90,99))
        return
    }


    //LOSS
    if (losscom.includes(cmd)) {
        const oppo = messageArray[1].replace(/[\\<>@#&!]/g, "")
        const winner = message.guild.members.cache.get(oppo)
        const loser = message.guild.members.cache.get(maid)
        const winningPlayer = await Player.findOne({ where: { id: oppo } })
        const losingPlayer = await Player.findOne({ where: { id: maid } })

        if (!oppo || oppo == '@') return message.channel.send("No player specified.")
        if (oppo == maid) return message.channel.send("You cannot lose a match to yourself.")
        if (winner.roles.cache.some(role => role.id === botRole)) return message.channel.send("Sorry, Bots do not play Goat Format... *yet*.")
        if (oppo.length < 17 || oppo.length > 18) return message.channel.send("To report a loss, please type the command **!loss** followed by an @ mention of your opponent.")
        if (!losingPlayer) {
	        createPlayer(loser)
            return message.channel.send("Sorry, you were not in the Goat Format database. Please try again.")
        }

        if (!winningPlayer) { 
            createPlayer(winner)
            return message.channel.send("Sorry, that user was not in the Goat Format database. Please try again.")
        }
        
        if (loser.roles.cache.some(role => role.id === tourRole) || winner.roles.cache.some(role => role.id === tourRole)) {
            return challongeClient.matches.index({
                id: status['tournament'],
                callback: (err, data) => {
                    if (err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        return getParticipants(message, data, loser, winner)
                    }
                }
            }) 
        }

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
        return message.reply(`Your Goat Format loss to ${winner.user.username} has been recorded.`)
    }


    //MANUAL
    if (cmd === `!manual`) {
        const winnerId = messageArray[1].replace(/[\\<>@#&!]/g, "")
        const loserId = messageArray[2].replace(/[\\<>@#&!]/g, "")
        const winner = message.guild.members.cache.get(winnerId)
        const loser = message.guild.members.cache.get(loserId)
        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const losingPlayer = await Player.findOne({ where: { id: loserId } })

        if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
        if (!winner || !loser) return message.channel.send("Please specify 2 players.")
        if (winner === loser) return message.channel.send("Please specify 2 different players.")
        if (winner.roles.cache.some(role => role.id === botRole) || loser.roles.cache.some(role => role.id === botRole)) return message.channel.send("Sorry, Bots do not play Goat Format... *yet*.")
        if (!losingPlayer) {
	        createPlayer(loser)
            return message.channel.send(`Sorry, ${loser.user.username} was not in the Goat Format database. Please try again.`)
        }

        if (!winningPlayer) {
	        createPlayer(winner)
            return message.channel.send(`Sorry, ${winner.user.username} was not in the Goat Format database. Please try again.`)
        }

        if (winner.roles.cache.some(role => role.id === tourRole) || loser.roles.cache.some(role => role.id === tourRole)) {
            return challongeClient.matches.index({
                id: status['tournament'],
                callback: (err, data) => {
                    if (err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        return getParticipants(message, data, loser, winner)
                    }
                }
            }) 
        }
        
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
        return message.channel.send(`A manual Goat Format loss by ${loser.user.username} to ${winner.user.username} has been recorded.`)
    }


    //H2H
    if (h2hcom.includes(cmd)) {
        if (messageArray.length === 1) return message.channel.send("Please specify at least 1 other player.")
        if (messageArray.length > 3) return message.channel.send("You may only compare 2 players at a time.")
        const player1Id = messageArray[1].replace(/[\\<>@#&!]/g, "")
        const player2Id = (messageArray.length === 2 ? maid : messageArray[2].replace(/[\\<>@#&!]/g, ""))
        const player1 = await Player.findOne({ where: { id: player1Id } })
        const player2 = await Player.findOne({ where: { id: player2Id } })
        
        if (player1Id === player2Id) return message.channel.send("Please specify 2 different players.")
        if (!player1 && player2Id === maid) return message.channel.send("That user is not in the Goat Format database.")
        if (!player1 && player2Id !== maid) return message.channel.send("The first user is not in the Goat Format database.")
        if (!player2 && player2Id === maid) return message.channel.send("You are not in the Goat Format database.")
        if (!player2 && player2Id !== maid) return message.channel.send("The second user is not in the Goat Format database.")
    
        const p1Wins = await Match.count({ where: { winner: player1Id, loser: player2Id } })
        const p2Wins = await Match.count({ where: { winner: player2Id, loser: player1Id } })

        return message.channel.send(`${goat} --- H2H Goat Results --- ${goat}
${player1.name} has won ${p1Wins}x
${player2.name} has won ${p2Wins}x`)
    }


    //UNDO
    if (undocom.includes(cmd)) {
        const allMatches = await Match.findAll({})
        const lastMatch = allMatches.slice(-1)[0]
        const loserId = lastMatch.loser
        const winnerId = lastMatch.winner
        const losingPlayer = await Player.findOne({ where: { id: loserId } })
        const winningPlayer = await Player.findOne({ where: { id: winnerId } })
        const prompt = (isMod(message.member) ? '' : ' Please get a Moderator to help you.')

        if (maid !== loserId && !isMod(message.member)) return message.channel.send(`The last recorded match was ${losingPlayer.name}'s loss to ${winningPlayer.name}.${prompt}`)
        if (winningPlayer.backup === null && maid !== loserId) return message.channel.send(`${winningPlayer.name} has no backup stats.${prompt}`)
        if (winningPlayer.backup === null && maid === loserId) return message.channel.send(`Your last opponent, ${winningPlayer.name}, has no backup stats.${prompt}`)
        if (losingPlayer.backup === null  && maid !== loserId) return message.channel.send(`${losingPlayer.name} has no backup stats.${prompt}`)
        if (losingPlayer.backup === null && maid === loserId) return message.channel.send(`You have no backup stats.${prompt}`)

        winningPlayer.stats = winningPlayer.backup
        losingPlayer.stats = losingPlayer.backup
        winningPlayer.backup = null
        losingPlayer.backup = null
        winningPlayer.wins--
        losingPlayer.losses--
        await winningPlayer.save()
        await losingPlayer.save()
        await lastMatch.destroy()
        return message.channel.send(`The last Goat Format match in which ${winningPlayer.name} defeated ${losingPlayer.name} has been erased.`)
    }


    //CENSUS
    if (cmd === `!census`) { 
        if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
        message.channel.send(`One moment please.`)
        const allMembers = await message.guild.members.fetch()
        let updateCount = 0
        let createCount = 0
        try {
            allMembers.forEach(async function(member) {
                const player = await Player.findOne({ where: { id: member.user.id } })
                if (player && ( player.name !== member.user.username || player.tag !== member.user.tag )) {
                    updateCount++
                    await player.update({
                        name: member.user.username,
                        tag: member.user.tag
                    })
                } else if (!player && !member.user.bot) {
                    createCount++
                    createPlayer(member)
                }
            })
        } catch (err) {
            return message.channel.send(`Something went wrong. I couldn't update the database.`)   
        }

        return setTimeout(function () {
            let word1
            let word2     
            createCount === 1 ? word1 =  'player' : word1 = 'players'
            updateCount === 1 ? word2 =  'other' : word2 = 'others'
            return message.channel.send(`Census complete! You added ${createCount} ${word1} to the database and updated ${updateCount} ${word2}.`)
        }, 3000)	
    }


    //RECALCULATE
    if (cmd === `!recalculate` || cmd === `!recalc`) { 
        if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
        const allPlayers = await Player.findAll()
        const allMatches = await Match.findAll()

        allPlayers.forEach(async function (player) {
            await player.update({
                stats: 500,
                backup: null,
                wins: 0,
                losses: 0
            })
        })

        allMatches.forEach(async function (match) {
            const winner = await allPlayers.find(player => player.id === match.winner)
            const loser = await allPlayers.find(player => player.id === match.loser)
            const statsLoser = loser.stats
            const statsWinner = winner.stats
            winner.backup = statsWinner
            loser.backup = statsLoser
            const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
            winner.stats += delta
            loser.stats -= delta
            winner.wins++
            loser.losses++
            await winner.save()
            await loser.save()
            await match.update(delta)
        })
    }

})