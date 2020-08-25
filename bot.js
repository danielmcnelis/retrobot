

//RETROBOT - A RANKINGS BOT FOR FORMATLIBRARY.COM

const Discord = require('discord.js')
const fs = require('fs')
const { Op } = require('sequelize')
const OldData = require('./static/oldData.json')
const { sad, rock, bron, silv, gold, plat, dia, mast, lgnd, FL, approve } = require('./static/emojis.json')
const { pfpcom, botcom, rolecom, statscom, profcom, losscom, h2hcom, undocom, rankcom, deckscom, replayscom, yescom, nocom } = require('./static/commands.json')
const { botRole, tourRole, politicsRole } = require('./static/roles.json')
const { welcomeChannel, registrationChannel, deckListsChannel, replayLinksChannel, politicsChannel } = require('./static/channels.json')
const types = require('./static/types.json')
const status = require('./static/status.json')
const formats = require('./static/formats.json')
const { Match, Matchup, Player, Tournament, YugiKaiba, Critter, Android, Yata, Vampire, TradChaos, ChaosWarrior, Goat, CRVGoat, Reaper, ChaosReturn, Stein, TroopDup, PerfectCircle, DADReturn, GladBeast, TeleDAD, DarkStrike, Lightsworn, Edison, Frog, SixSamurai, Providence, TenguPlant, LongBeach, DinoRabbit, WindUp, Meadowlands, BabyRuler, RavineRuler, FireWater, HAT, Shaddoll, London, BurningAbyss, Charleston, Nekroz, Clown, PePe, DracoPal, Monarch, ABC, GrassZoo, DracoZoo, LinkZoo, QuickFix, Tough, Magician, Gouki, Danger, PrankKids, SkyStriker, ThunderDragon, LunalightOrcust, StrikerOrcust, Current, Traditional, Rush, Nova, Rebirth  } = require('./db/index.js')
const { capitalize, restore, revive, createPlayer, isNewUser, isAdmin, isMod, getMedal } = require('./functions/utility.js')
const { askForDBUsername, getDeckListTournament, checkResubmission, removeParticipant, getParticipants } = require('./functions/tournament.js')
const { makeSheet, addSheet, writeToSheet } = require('./functions/sheets.js')
const { client, challongeClient } = require('./static/clients.js')
const rb = "730922003296419850"

//READY
client.on('ready', () => {
  console.log('RetroBot is online!')
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
        createPlayer(member.user.id, member.user.username, member.user.tag) 
        channel.send(`${member} Welcome to the FormatLibrary.com ${FL} Discord server! Use the command **!bot** to learn how to play rated games and join tournaments on this server. ${lgnd}`)
    } else {
        channel.send(`${member} Welcome back to the FormatLibrary.com ${FL} Discord server! We missed you. ${approve}`)
    }
})

    
//GOODBYE
client.on('guildMemberRemove', member => {
    const channel = client.channels.cache.get(welcomeChannel)
    if (!channel) return
    channel.send(`Oh dear. ${member.user.username} has left the server. ${sad}`)
})


//COMMANDS
client.on('message', async (message) => {
    const messageArray = message.content.split(" ")
    const cmd = messageArray[0]
    const args = messageArray.slice(1)
    const maid = message.author.id

    if (!message.guild || message.author.bot) {
        return
    }

    const keys = Object.keys(formats)
    let formatDatabase = ''
    let formatName = ''
    let formatEmoji = ''
    let formatRole = ''
    let formatChannel = ''
        
    keys.forEach(function(key) {
        if(message.channel.id === formats[key].channel) {
            formatDatabase = formats[key].database
            formatName = formats[key].name
            formatEmoji = formats[key].emoji
            formatRole = formats[key].role
            formatChannel = formats[key].channel
        }
    })


    //REPLAY-LINKS MODERATION
    if((message.channel.id === replayLinksChannel) && maid !== rb && (!message.content.includes('duelingbook.com') || !message.content.includes('replay') || message.content.length > 200)) {
        message.delete(2000);
        message.channel.send("Please do not use this channel for discussion. Only post short messages with a DuelingBook.com replay link.").then(sentMessage => {
        sentMessage.delete(10000); });

    }


    //DECK-LISTS MODERATION
    if((message.channel.id === deckListsChannel) && maid !== rb && (!message.content.includes('imgur') || message.content.length > 200)) {
        message.delete(2000);
        return message.channel.send("Please do not use this channel for discussion. Only post short messages with an Imgur.com deck link.").then(sentMessage => {
        sentMessage.delete(10000); });
    }
    

    //AVATAR
    if (pfpcom.includes(cmd.toLowerCase())) {
        let person = message.mentions.users.first()
        let reply = person ? person.displayAvatarURL() : message.author.displayAvatarURL()
        return message.channel.send(reply)
    }


    //NAME
    if (cmd.toLowerCase() === `!name`) {
        const playerId = messageArray[1].replace(/[\\<>@#&!]/g, "")
        const member = message.guild.members.cache.get(playerId)
        const player = await Player.findOne({ where: { id: playerId } })
        return message.channel.send(`The database name of ${member.user.username} is: ${player.name}.`)
    }


    //DUELINGBOOK NAME
    if (cmd.toLowerCase() === `!db` || cmd.toLowerCase() === `!dbname`) {
        const person = message.mentions.users.first()
        const playerId = person ? person.id : maid
        const player = await Player.findOne({ where: { id: playerId } })

        if (person && player.duelingBook) return message.channel.send(`${player.name}'s DuelingBook name is: ${player.duelingBook}.`)
        if (person && !player.duelingBook) return message.channel.send(`${player.name} does not have a DuelingBook name in our the database.`)

        if (messageArray.length > 1) {
            player.duelingBook = messageArray.slice(1, messageArray.length).join(' ')
            await player.save()
            return message.channel.send(`Your DuelingBook username has been set to: ${player.duelingBook}.`)
        } else if ( player.duelingBook) {
            return message.channel.send(`Your DuelingBook username is: ${player.duelingBook}.`)
        } else {
            return message.channel.send(`You do not have a DuelingBook username registered to our database. Please use the command **!db** followed by your DuelingBook username to register it.`)
        }
    }


    //CLEAR
    if (cmd.toLowerCase() === `!clear`) {
        if(!isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")

        message.channel.fetchMessages()
            .then(function(list){
                    message.channel.bulkDelete(list)
                }, function(err){ message.channel.send("ERROR: ERROR CLEARING CHANNEL.")})            
    }

    //POLITICS
    if(cmd.toLowerCase() === `!politics`) {
        if(!message.member.roles.cache.some(role => role.id === politicsRole)) {
        message.member.roles.add(politicsRole)
        return message.channel.send(`I have added you to the Politics role. You can now learn about ~~communism~~ neoliberalism from Noelle in <#${politicsChannel}>.`) }
        
        else {
        message.member.roles.remove(politicsRole)
        return message.channel.send(`I have removed you from the Politics role. You no longer have to read MMF’s rants in <#${politicsChannel}>.`) }
    }
    
    
    //ROLE
    if (rolecom.includes(cmd.toLowerCase())) {
        keys.forEach(function(key) {
            if(message.channel.id === formats[key].channel) {
                if (!message.member.roles.cache.some(role => role.id === formats[key].role)) {
                    message.member.roles.add(formats[key].role)
                    return message.channel.send(`You now have the ${formats[key].name} role.`)
                } else {
                    message.member.roles.remove(formats[key].role);
                    return message.channel.send(`You no longer have the ${formats[key].name} role.`)
                }
            }
        })
    }


    //BOT USER GUIDE
    if (botcom.includes(cmd.toLowerCase())) {
        console.log
        const botEmbed = new Discord.MessageEmbed()
	        .setColor('#38C368')
        	.setTitle('RetroBot')
	        .setDescription('A Rankings and Tournament Bot for FormatLibrary.com.\n' )
	        .setURL('https://formatlibrary.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/wz5TqmR.png', 'https://formatlibrary.com/')
            .setThumbnail('https://i.imgur.com/ul7nKjk.png')
            .addField('How to User This Guide', '\nThe following commands can be used for any format in the appropriate channels (i.e. <#414575168174948372>, <#629472339473596436>, <#459474235165900800>, <#538498087245709322>). Commands require arguments as follows: (blank) no argument, (@user) mention a user, (n) a number, (link) a URL.')
        	.addField('Ranked Play Commands', '\n!loss - (@user) - Report a loss to another player. \n!stats - (blank or @user) - Post a player’s stats. \n!top - (number) - Post the server’s top players (100 max). \n!h2h - (@user + @user) - Post the H2H record between 2 players. \n!role - Add or remove a format role. \n!undo - Undo the last loss if you reported it. \n')
        	.addField('Tournament Commands', '\n!join - Register for the next tournament. \n!drop - Drop from the current tournament. \n!show - Show the current tournament.')
        	.addField('Server Commands', '\n!db - Set your DuelingBook.com username. \n!bot - View the RetroBot User Guide. \n!mod - View the Mod-Only User Guide.');

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
        	.addField('Mod-Only Ranked Play Commands', '\n!manual - (@winner + @loser) - Manually record a match result. \n!undo - Undo the most recent loss, even if you did not report it.')
            .addField('Mod-Only Tournament Commands', '\n!create - (tournament name) - Create a new tournament.  \n!signup - (@user) - Add a player to the bracket. \n!remove - (@user) - Remove a player from the bracket. \n!start - Start the next tournament. \n!end - End the current tournament.')
            .addField('Mod-Only Server Commands', '\n!census - Update the information of all players in the database.\n!recalc - Recaluate all player stats for a specific format if needed.');

        message.author.send(botEmbed);
        return message.channel.send("I messaged you the Mod-Only Guide.")
    }


    //FORMATS
    if(cmd.toLowerCase() === `!formats`) {
        const formatsEmbed = new Discord.RichEmbed()
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
        
        message.author.send(formatsEmbed);
        return message.channel.send("I messaged you the list of suppported Yu-Gi-Oh! Formats.")
        
        }


    //CHALLONGE - CREATE
    if (cmd.toLowerCase() === `!create`) {
        const member = message.guild.members.cache.get(maid)
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        function getRandomString(length, chars) {
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
            return result;
        }

        const keyPairs = {}

        keys.forEach(function(key) {
            const newKey = key.replace(/[\. ,:-]+/g, "").toLowerCase()
            keyPairs[newKey] = key
        })
    
        const filter = m => m.author.id === member.user.id
        const msg = await message.channel.send(`Okay, what format will be played in this tournament?`)
        const collected = await msg.channel.awaitMessages(filter, {
            max: 1,
            time: 20000
        }).then(async collected => {
            const str = getRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz');
            const name = (args[0] ? args[0] : 'New Tournament')
            const formatKey = keyPairs[collected.first().content.replace(/[\. ,:-]+/g, "").toLowerCase()] || null
            const format = formats[formatKey] ? formats[formatKey].name : null
            const emote = formats[formatKey] ? formats[formatKey].emoji : null
            const url = (args[0] ? args[0] : str)

            if(!format) {
                return message.channel.send(`Sorry, I do not recognize that format. I cannot create a tournament for you.`)
            }

            await challongeClient.tournaments.create({
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
                        status['format'] = formatKey
                        fs.writeFile("./static/status.json", JSON.stringify(status), (err) => { 
                            if (err) console.log(err)
                        })
                        return message.channel.send(`I created a new ${format} tournament named ${name}, located at https://challonge.com/${url}. ${emote}`)
                    }
                }
            })
        }).catch(err => {    
            console.log(err)
            return message.channel.send(`Perhaps another time would be better.`)
        })
    }


    //CHALLONGE - DESTROY
    if (cmd.toLowerCase() === `!destroy`) {
        if (!isAdmin(message.member)) return message.channel.send('You do not have permission to do that.')
        const name = (args[0] ? args[0] : status['tournament'])
        await challongeClient.tournaments.destroy({
            id: name,
            callback: (err) => {
                if (err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be deleted.`)
                } else {
                    if (status['tournament'] === name) {
                        delete status['tournament']
                        delete status['format']
                        fs.writeFile("./static/status.json", JSON.stringify(status), (err) => { 
                            if (err) console.log(err)
                        })
                    }
                    return message.channel.send(`I deleted the tournament named "${name}" from the FormatLibrary.com Challonge account.`)
                }
            }
          });  
    }

    //CHALLONGE - END
    if (cmd.toLowerCase() === `!end`) {
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

        let deckRecordsArr = Object.entries(deckRecords).sort((b, a) => b[0].localeCompare(a[0]))
        let arr = deckRecordsArr.map(function(deck) {
            return(
                `${types[deck[0]][0]}: ${deckRecords[deck[0]].wins}W, ${deckRecords[deck[0]].losses}L`
            )
        })

        const emote = formats[status['format']] ? formats[status['format']].emoji : ''

        challongeClient.tournaments.finalize({
            id: name,
            callback: async (err) => {
                if (err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be finalized.`)
                } else {
                    delete status['tournament']
                    delete status['format']
                    fs.writeFile("./statis/status.json", JSON.stringify(status), (err) => { 
                        if (err) console.log(err)
                    })

                    await Tournament.destroy({ where: {}, truncate: true })
                    client.channels.cache.get(registrationChannel).send(arr)
                    return message.channel.send(`Congratulations, your tournament results have been finalized: https://challonge.com/${name}. ${emote}`)
                }
            }
        })
    }


    //CHALLONGE - SHOW
    if (cmd.toLowerCase() === `!show`) {
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
                    const emote = formats[status['format']] ? formats[status['format']].emoji : ''
                    return message.channel.send(`Here is the link to the tournament you requested: https://challonge.com/${name}. ${emote}`)
                }
            }
        })  
    }

    //CHALLONGE - START
    if (cmd.toLowerCase() === `!start`) {
        if (!isMod(message.member)) return message.channel.send('You do not have permission to do that.')
        const unregistered = await Tournament.findAll({ where: { participantId: null } })
        if (unregistered.length) return message.channel.send('One of more players has not been signed up. Please check the Database.')

        const allDecks = await Tournament.findAll()
        const typeData = {}
        const catData = {}
        const sheet1Data = [['Player', 'Deck', 'Type', 'Link']]
        const sheet2DataA = [['Deck', 'Entries', 'Percent']]
        const sheet2DataB = [[], ['Category', 'Entries', 'Percent']]

        allDecks.forEach(function (deck) {
            typeData[deck.type] ? typeData[deck.type]++ : typeData[deck.type] = 1
            catData[deck.category] ? catData[deck.category]++ : catData[deck.category] = 1
            const row = [deck.pilot, deck.name, types[deck.type][0], deck.url]
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
        await challongeClient.tournaments.start({
            id: name,
            callback: async (err) => {
                if (err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be initialized.`)
                } else {
                    const spreadsheetId = await makeSheet(`${name} Deck Lists`, sheet1Data)
                    const link = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
                    await addSheet(spreadsheetId, 'Summary')
                    await writeToSheet(spreadsheetId, 'Summary', 'RAW', sheet2Data)
                    const emote = formats[status['format']] ? formats[status['format']].emoji : ''
                    client.channels.cache.get(registrationChannel).send(`Deck list spreadsheet: ${link}`)
                    return message.channel.send(`Let's go! Your tournament is starting now: https://challonge.com/${name}. ${emote}`)
                }
            }
        })
    }


    //CHALLONGE - DECK SHEET
    if (cmd.toLowerCase() === `!decksheet`) {
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
        if (!name) return message.channel.send(`Error: the tournament you provided, "${name}", could not be accessed.`)
        const spreadsheetId = await makeSheet(`${name} Deck Lists`, sheet1Data)
        const link = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
        await addSheet(spreadsheetId, 'Summary')
        await writeToSheet(spreadsheetId, 'Summary', 'RAW', sheet2Data)
        client.channels.cache.get(registrationChannel).send(`Deck list spreadsheet: ${link}`)
        return message.channel.send(`Success! You can find the deck list spreadsheet in the Tournament Registration channel.`)
    }


    //CHALLONGE - JOIN
    if (cmd.toLowerCase() === `!join`) {
        const name = status['tournament']
        const member = message.guild.members.cache.get(maid)
        if (!name) return message.channel.send('There is no active tournament.')
        if (!member) return message.channel.send('I could not find you in the server. Please be sure you are not invisible.')
        
        if (await isNewUser(maid)) {
            createPlayer(member.user.id, member.user.username, member.user.tag)
            return message.channel.send("I added you to the Tournament database. Please try again.")
        }

        const player = await Player.findOne({ where: { id: maid }})

        await challongeClient.tournaments.show({
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
                    } else if (player.duelingBook) {
                        return getDeckListTournament(client, message, member)
                    } else {
                        return askForDBUsername(client, message, member)
                    }
                }
            }
        })
    }

    //CHALLONGE - SIGN UP
    if (cmd.toLowerCase() === `!signup`) {
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
    if (cmd.toLowerCase() === `!remove`) {
        const name = status['tournament']
        const person = message.mentions.users.first()
        const member = message.guild.members.cache.get(person.id)

        if (!name) return message.channel.send('There is no active tournament.')
        if (!person) return message.channel.send('Please provide an @ mention of the player you wish to sign-up for the tournament.')
        if (!member) return message.channel.send('I could not find that user in the server.')

        await challongeClient.participants.index({
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
    if (cmd.toLowerCase() === `!drop`) {
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
    if (cmd.toLowerCase() === `!inspect`) {
        if (!isAdmin(message.member)) return message.channel.send('You do not have permission to do that.')
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


    //STATS
    if (statscom.includes(cmd.toLowerCase())) {
        const playerId = (messageArray.length === 1 ? maid : messageArray[1].replace(/[\\<>@#&!]/g, ""))
        const player = await Player.findOne({ where: { id: playerId } })

        if (!player && maid === playerId) {
            createPlayer(member.user.id, member.user.username, member.user.tag);
            return message.channel.send("I added you to the Format Library database. Please try again.")
        } else if (!player && maid !== playerId) {
            return message.channel.send("That user is not in the Format Library database.")
        }

        const allRecords = await eval(formatDatabase).findAll({ 
            where: {
                [Op.or]: [ { wins: { [Op.gt]: 0 } }, { losses: { [Op.gt]: 0 } } ]
            },
            order: [['stats', 'DESC']]
        })

        const index = allRecords.length ? allRecords.findIndex(record => record.dataValues.playerId === playerId) : -1
        const record = allRecords.length ? await eval(formatDatabase).findOne({
            where: {
                playerId: playerId
            }
        }) : {
            stats: 500,
            wins: 0,
            losses: 0
        }

        const rank = (index === -1 ? `N/A` : `#${index + 1} out of ${allRecords.length}`)
        const medal = (record.stats <= 290 ? `Chump ${sad}`
        : (record.stats > 290 && record.stats <= 350) ? `Rock ${rock}`
        : (record.stats > 350 && record.stats <= 410) ? `Bronze ${bron}`
        : (record.stats > 410 && record.stats <= 470) ? `Silver ${silv}`
        : (record.stats > 470 && record.stats <= 530) ? `Gold ${gold}`
        : (record.stats > 530 && record.stats <= 590) ? `Platinum ${plat}`
        : (record.stats > 590 && record.stats <= 650) ? `Diamond ${dia}`
        : (record.stats > 650 && record.stats <= 710) ? `Master ${mast}`
        : `Legend ${lgnd}`)

        return message.channel.send(`${formatEmoji} --- ${formatName} Format Stats --- ${formatEmoji}
Name: ${player.name}
Medal: ${medal}
Ranking: ${rank}
Wins: ${record.wins}, Losses: ${record.losses}
Elo Rating: ${record.stats.toFixed(2)}`)
    }



    //PROFILE
    if (profcom.includes(cmd.toLowerCase())) {
        const playerId = (messageArray.length === 1 ? maid : messageArray[1].replace(/[\\<>@#&!]/g, ""))
        const player = await Player.findOne({ where: { id: playerId } })

        if (!player && maid === playerId) {
            createPlayer(member.user.id, member.user.username, member.user.tag);
            return message.channel.send("I added you to the Format Library database. Please try again.")
        } else if (!player && maid !== playerId) {
            return message.channel.send("That user is not in the Format Library database.")
        }

        let legends = '';
        let masters = '';
        let diamonds = '';
        let platinums = '';

        let vault = {}

        keys.forEach(async function(key) {
            if (formats[key].name === 'Voice') return
            const formatDatabase = formats[key].database
            console.log('formatDatabase', formatDatabase)
            const record = await eval(formatDatabase).findOne({ 
                where: {
                    playerId: playerId
                }
            })

            console.log(`record.stats for ${formats[key].name} format = ${record.stats}`)

            const medal = getMedal(record.stats)
            vault[formats[key].emoji] = medal
            if (medal === lgnd) legends += ` ${lgnd}`
            if (medal === mast) masters += ` ${mast}`
            if (medal === dia) diamonds += ` ${dia}`
            if (medal === plat) platinums += ` ${plat}`  
        })

        console.log('vault', vault)

        return `You have the following medals:\n ${legends + masters + diamonds + platinums}`
    }


    //RANK
    if (rankcom.includes(cmd.toLowerCase())) {
        const x = parseInt(args[0])
        let result = []
        x === 1 ? result[0] = `${formatEmoji} --- The Best ${formatName} Player --- ${formatEmoji}`
        : result[0] = `${formatEmoji} --- Top ${x} ${formatName} Players --- ${formatEmoji}`

        if (x < 1) return message.channel.send("Please provide a number greater than 0.")
        if (x > 100 || isNaN(x)) return message.channel.send("Please provide a number less than or equal to 100.")
        
        const allPlayers = await eval(formatDatabase).findAll({ 
            where: {
                [Op.or]: [ { wins: { [Op.gt]: 0 } }, { losses: { [Op.gt]: 0 } } ]
            },
            include: Player,
            order: [['stats', 'DESC']]
        })
                
        if (x > allPlayers.length) return message.channel.send(`I need a smaller number. We only have ${allPlayers.length} ${formatName} Format players.`)
    
        const topPlayers = allPlayers.slice(0, x)
    
        for (let i = 0; i < x; i++) { 
            result[i+1] = `${(i+1)}. ${getMedal(topPlayers[i].stats)} ${topPlayers[i].player.name}`
        }
    
        message.channel.send(result.slice(0,30))
        if (result.length > 30) message.channel.send(result.slice(30,60))
        if (result.length > 60) message.channel.send(result.slice(60,90))
        if (result.length > 90) message.channel.send(result.slice(90,99))
        return
    }


    //LOSS
    if (losscom.includes(cmd.toLowerCase())) {
        const oppo = messageArray[1].replace(/[\\<>@#&!]/g, "")
        const winner = message.guild.members.cache.get(oppo)
        const loser = message.guild.members.cache.get(maid)
        const winningPlayer = await eval(formatDatabase).findOne({ where: { playerId: oppo } })
        const losingPlayer = await eval(formatDatabase).findOne({ where: { playerId: maid } })

        if (!oppo || oppo == '@') return message.channel.send("No player specified.")
        if (oppo == maid) return message.channel.send("You cannot lose a match to yourself.")
        if (winner.roles.cache.some(role => role.id === botRole)) return message.channel.send(`Sorry, Bots do not play ${formatName} Format... *yet*.`)
        if (oppo.length < 17 || oppo.length > 18) return message.channel.send("To report a loss, please type the command **!loss** followed by an @ mention of your opponent.")
        if (!winningPlayer) {
	        createPlayer(loser.user.id, loser.user.username, loser.user.tag)
            return message.channel.send("Sorry, you were not in the Format Library database. Please try again.")
        }

        if (!losingPlayer) { 
            createPlayer(winner.user.id, winner.user.username, winner.user.tag)
            return message.channel.send("Sorry, that user was not in the Format Library database. Please try again.")
        }
        
        if (loser.roles.cache.some(role => role.id === tourRole) || winner.roles.cache.some(role => role.id === tourRole)) {
            return challongeClient.matches.index({
                id: status['tournament'],
                callback: (err, data) => {
                    if (err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        const tournamentChannel = formats[status['format']] ? formats[status['format']].channel : null
                        if (formatChannel !== tournamentChannel) {
                            return message.channel.send(`Please report this match in the appropriate channel: <#${tournamentChannel}>.`)
                        } else {
                            return getParticipants(message, data, loser, winner, formatName, formatDatabase)
                        }
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
        await Match.create({ format: formatDatabase, winner: winner.user.id, loser: loser.user.id, delta })
        return message.reply(`Your ${formatName} Format loss to ${winner.user.username} has been recorded.`)
    }


    //MANUAL
    if (cmd.toLowerCase() === `!manual`) {
        const winnerId = messageArray[1].replace(/[\\<>@#&!]/g, "")
        const loserId = messageArray[2].replace(/[\\<>@#&!]/g, "")
        const winner = message.guild.members.cache.get(winnerId)
        const loser = message.guild.members.cache.get(loserId)
        const winningPlayer = await eval(formatDatabase).findOne({ where: { playerId: winnerId } })
        const losingPlayer = await eval(formatDatabase).findOne({ where: { playerId: loserId } })

        if (!isMod(message.member)) return message.channel.send("You do not have permission to do that.")
        if (!winner || !loser) return message.channel.send("Please specify 2 players.")
        if (winner === loser) return message.channel.send("Please specify 2 different players.")
        if (winner.roles.cache.some(role => role.id === botRole) || loser.roles.cache.some(role => role.id === botRole)) return message.channel.send(`Sorry, Bots do not play ${formatName} Format... *yet*.`)
        if (!losingPlayer) {
	        createPlayer(loser.user.id, loser.user.username, loser.user.tag)
            return message.channel.send(`Sorry, ${loser.user.username} was not in the Format Library database. Please try again.`)
        }

        if (!winningPlayer) {
	        createPlayer(winner.user.id, winner.user.username, winner.user.tag)
            return message.channel.send(`Sorry, ${winner.user.username} was not in the Format Library database. Please try again.`)
        }

        if (winner.roles.cache.some(role => role.id === tourRole) || loser.roles.cache.some(role => role.id === tourRole)) {
            return challongeClient.matches.index({
                id: status['tournament'],
                callback: (err, data) => {
                    if (err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        const tournamentChannel = formats[status['format']] ? formats[status['format']].channel : null
                        if (formatChannel !== tournamentChannel) {
                            return message.channel.send(`Please report this match in the appropriate channel: <#${tournamentChannel}>.`)
                        } else {
                            return getParticipants(message, data, loser, winner, formatName, formatDatabase)
                        }
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
        await Match.create({ format: formatDatabase, winner: winner.user.id, loser: loser.user.id, delta })
        return message.channel.send(`A manual ${formatName} Format loss by ${loser.user.username} to ${winner.user.username} has been recorded.`)
    }


    //H2H
    if (h2hcom.includes(cmd.toLowerCase())) {
        if (messageArray.length === 1) return message.channel.send("Please specify at least 1 other player.")
        if (messageArray.length > 3) return message.channel.send("You may only compare 2 players at a time.")
        const player1Id = messageArray[1].replace(/[\\<>@#&!]/g, "")
        const player2Id = (messageArray.length === 2 ? maid : messageArray[2].replace(/[\\<>@#&!]/g, ""))

        const player1 = await Player.findOne({ where: { id: player1Id } })
        const player2 = await Player.findOne({ where: { id: player2Id } })
        
        if (player1Id === player2Id) return message.channel.send("Please specify 2 different players.")
        if (!player1 && player2Id === maid) return message.channel.send("That user is not in the Format Library database.")
        if (!player1 && player2Id !== maid) return message.channel.send("The first user is not in the Format Library database.")
        if (!player2 && player2Id === maid) return message.channel.send("You are not in the Format Library database.")
        if (!player2 && player2Id !== maid) return message.channel.send("The second user is not in the Format Library database.")
    
        const p1Wins = await Match.count({ where: { format: formatDatabase, winner: player1Id, loser: player2Id } })
        const p2Wins = await Match.count({ where: { format: formatDatabase, winner: player2Id, loser: player1Id } })

        return message.channel.send(`${formatEmoji} --- H2H ${formatName} Results --- ${formatEmoji}
${player1.name} has won ${p1Wins}x
${player2.name} has won ${p2Wins}x`)
    }


    //UNDO
    if (undocom.includes(cmd.toLowerCase())) {
        const allMatches = await Match.findAll({
            where: {
                format: formatDatabase
            }
        })

        const lastMatch = allMatches.slice(-1)[0]
        const loserId = lastMatch.loser
        const winnerId = lastMatch.winner
        const winner = message.guild.members.cache.get(winnerId)
        const loser = message.guild.members.cache.get(loserId)

        const losingPlayer = await eval(formatDatabase).findOne({ where: { playerId: loserId } })
        const winningPlayer = await eval(formatDatabase).findOne({ where: { playerId: winnerId } })
        const prompt = (isMod(message.member) ? '' : ' Please get a Moderator to help you.')

        if (maid !== loserId && !isMod(message.member)) return message.channel.send(`The last recorded ${formatName} Format match was ${loser.name}'s loss to ${winner.name}.${prompt}`)
        if (winningPlayer.backup === null && maid !== loserId) return message.channel.send(`${winner.name} has no backup ${formatName} Format stats.${prompt}`)
        if (winningPlayer.backup === null && maid === loserId) return message.channel.send(`Your last opponent, ${winner.name}, has no backup ${formatName} Format stats.${prompt}`)
        if (losingPlayer.backup === null  && maid !== loserId) return message.channel.send(`${loser.name} has no ${formatName} Format backup stats.${prompt}`)
        if (losingPlayer.backup === null && maid === loserId) return message.channel.send(`You have no ${formatName} Format backup stats.${prompt}`)

        winningPlayer.stats = winningPlayer.backup
        losingPlayer.stats = losingPlayer.backup
        winningPlayer.backup = null
        losingPlayer.backup = null
        winningPlayer.wins--
        losingPlayer.losses--
        await winningPlayer.save()
        await losingPlayer.save()
        await lastMatch.destroy()
        return message.channel.send(`The last ${formatName} Format match in which ${winner.user.username} defeated ${loser.user.username} has been erased.`)
    }


    //CENSUS
    if (cmd.toLowerCase() === `!census`) { 
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
                    createPlayer(member.user.id, member.user.username, member.user.tag, createCount)
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
    if (cmd.toLowerCase() === `!recalculate` || cmd.toLowerCase() === `!recalc`) { 
        if (!isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")
        const allPlayers = await eval(formatDatabase).findAll()
        const allMatches = await Match.findAll({
            where: {
                format: formatDatabase
            }
        })

        allPlayers.forEach(async function (player) {
            await player.update({
                stats: 500,
                backup: null,
                wins: 0,
                losses: 0
            })
        })

        let z = 0;

        allMatches.forEach(function (match) {
            z++
            restore(match.winner, match.loser, formatDatabase, z)	
        })

        message.channel.send(`Recalculating data. Please wait...`)
    }


    //WINNERS	
    if (cmd.toLowerCase() === `!winners`) { 	
        console.log('winners...')	
        if (!isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")	

        const labels = Object.keys(OldData)	
        let winner	
        let z = 0	

        for (let i = 0; i < labels.length; i++) {	
            const format = OldData[labels[i]]	

            for (let j = 0; j < format.length; j++) {	
                const record = format[j].Result	

                if (record.includes(">")) {
                    winner = record.substring(0, record.indexOf(">"))
                } else {
                    winner = record.substring(record.indexOf("<") + 1)
                }

                z++	

                revive(winner, z)	
            }	
        }	
    }	

    //LOSERS	
    if (cmd.toLowerCase() === `!losers`) { 	
        console.log('losers...')	
        if (!isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")	

        const labels = Object.keys(OldData)	
        let loser	
        let z = 0	

        for (let i = 0; i < labels.length; i++) {	
            const format = OldData[labels[i]]	

            for (let j = 0; j < format.length; j++) {	
                const record = format[j].Result	

                if (record.includes(">")) {
                    loser = record.substring(record.indexOf(">") + 1)
                } else {
                    loser = record.substring(0, record.indexOf("<"))
                }

                z++	

                revive(loser, z)	
            }	
        }	
    }	



    //IMPORT	
    if (cmd.toLowerCase() === `!import`) { 	
        if (!isAdmin(message.member)) return message.channel.send("You do not have permission to do that.")	

        const labels = Object.keys(OldData)	
        let winner	
        let loser	
        let z = 0	

        for (let i = 0; i < labels.length; i++) {	
            const format = labels[i]	
            console.log('format', format)	
            for (let j = 0; j < OldData[format].length; j++) {	
                const record = OldData[format][j].Result	
                

                if (record.includes(">")) {
                    winner = record.substring(0, record.indexOf(">"))
                    loser = record.substring(record.indexOf(">") + 1)
                } else {
                    winner = record.substring(record.indexOf("<") + 1)
                    loser = record.substring(0, record.indexOf("<"))
                }

                z++	

                restore(winner, loser, format, z)	
            }	
        }	
    }

})