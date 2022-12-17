
//TOURNAMENT FUNCTIONS

//MODULE IMPORTS
const axios = require('axios')
const {Op} = require('sequelize')
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js')

//DATABASE IMPORTS
const { Deck, Entry, Format, Player, Stats, Server, Tournament } = require('../db/index.js')

//FUNCTION IMPORTS
const { getIssues } = require('./deck.js')
const { capitalize, drawDeck, generateRandomString, shuffleArray } = require('./utility.js')

// STATIC IMPORTS
const { legend, mad } = require('../static/emojis')
const emojis = require('../static/emojis')

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
        if (dbname.toLowerCase().includes("duelingbook.com/deck") || dbname.toLowerCase().includes("imgur.com")) {
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
const getDeckList = async (member, player, format, override = false) => {            
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
            if (format.category !== 'TCG') {
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck has been saved. ${legend}\n\nPlease note: Decks for ${format.category} Formats cannot be verified at this time. Be sure your deck is legal for this tournament!`}).catch((err) => console.log(err))
                return { url, ydk }
            }
            const deckArr = [...main, ...extra, ...side,]
            const issues = await getIssues(deckArr, format)
            if (!issues) return false

            const { illegalCards, forbiddenCards, limitedCards, semiLimitedCards, unrecognizedCards } = issues
            if (!illegalCards || !forbiddenCards || !limitedCards || !semiLimitedCards || !unrecognizedCards) return false
                
            if (override) {
                member.send({ content: `Thanks, ${member.user.username}, I saved a copy of ${pronoun} deck. ${legend}`}).catch((err) => console.log(err))
                return { url, ydk }
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
                member.send({ content: `Thanks, ${member.user.username}, ${pronoun} deck is perfectly legal. ${legend}`}).catch((err) => console.log(err))
                return { url, ydk }
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

// SEND DECK
const sendDeck = async (interaction, entryId) => {
    const entry = await Entry.findOne({ where: { id: entryId }, include: [Player, Tournament] })
    interaction.reply({ content: `Please check your DMs.` })
    const deckAttachments = await drawDeck(entry.ydk) || []
    const isAuthor = interaction.user.id === entry.player.discordId
    return interaction.member.send({ content: `${isAuthor ? `${entry.player.name}\'s` : 'Your'} deck for ${entry.tournament.name} is:\n<${entry.url}>`, files: [...deckAttachments]}).catch((err) => console.log(err))
}

// SELECT TOURNAMENT FOR DECK CHECK
const selectTournamentForDeckCheck = async (interaction, entries, isAuthor, format) => {
    if (entries.length === 0) {
        interaction.reply({ content: `${isAuthor ? "You are" : "That player is"} not registered for any ${format.name} format ${format.emoji} tournaments in this server.`})
        return false
    } else if (entries.length === 1) {
        return entries[0]
    } else {
        const options = entries.map((entry, index) => {
            return {
                label: `(${index + 1}) ${entry.tournament.name}`,
                value: `${entry.id}`,
            }
        })
    
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select')
                    .setPlaceholder('Nothing selected')
                    .addOptions(...options),
            )
    
        interaction.reply({ content: `Please select a tournament:`, components: [row] })
        return false
    }
}


// SELECT TOURNAMENT
const selectTournament = async (interaction, tournaments) => {
    if (tournaments.length === 0) {
        interaction.reply({ content: `There is no tournament that meets this criteria.` })
        return false
    } else if (tournaments.length === 1)  {
        return tournaments[0]
    } else {
        const options = tournaments.map((tournament, index) => {
            return {
                label: `(${index + 1}) ${tournament.name}`,
                value: `${tournaments[index].id}`,
            }
        })
    
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select')
                    .setPlaceholder('Nothing selected')
                    .addOptions(...options),
            )
    
        interaction.reply({ content: `Please select a tournament:`, components: [row] })
        return false
    }
}

// CLOSE TOURNAMENT 
const closeTournament = async (interaction, tournamentId) => {
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    await tournament.update({ state: 'standby' })
    return interaction.reply({ content: `Registration for ${tournament.name} ${tournament.logo} is now closed.`})
}

// OPEN TOURNAMENT
const openTournament = async (interaction, tournamentId) => {
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    await tournament.update({ state: 'pending' })
    return interaction.reply({ content: `Registration for ${tournament.name} ${tournament.logo} is now open.`})
}

// JOIN TOURNAMENT 
const joinTournament = async (interaction, tournamentId) => {
    const player = await Player.findOne({
        where: {
            discordId: interaction.user.id
        }
    })

    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        }
    })

    const server = await Server.findOne({
        where: {
            name: interaction.guild.name
        }
    })

    const entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournamentId }})
    const format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.formatName } }})
    if (!format) return interaction.reply(`Unable to determine what format is being played in ${tournament.name}. Please contact an administrator.`)
    interaction.reply({ content: `Please check your DMs.` })
    
    const dbName = player.duelingBook ? player.duelingBook : await askForDBName(interaction.member, player)
    if (!dbName) return
    const { url, ydk } = await getDeckList(interaction.member, player, format)
    if (!url) return

    if (!entry) {
        try {                                
          const { participant } = await postParticipant(server, tournament, player)
          if (!participant) return interaction.member.send({ content: `Error: Unable to register on Challonge for ${tournament.name} ${tournament.logo}.`})
          
          await Entry.create({
              playerName: player.name,
              url: url,
              ydk: ydk,
              participantId: participant.id,
              playerId: player.id,
              tournamentId: tournament.id
          })
    
        } catch (err) {
          console.log(err)
          return interaction.member.send({ content: `Error: Could not access database.`})
        } finally {
          const deckAttachments = await drawDeck(ydk) || []
          interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
          interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in the tournament! FYI, this is the deck you submitted:`, files: [...deckAttachments] }).catch((err) => console.log(err))
          return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
        }
    } else if (entry.active === false) {
        try {                                
            const { participant } = await postParticipant(server, tournament, player)
            if (!participant) return interaction.member.send({ content: `Error: Unable to register on Challonge for ${tournament.name} ${tournament.logo}.`})
            
            await entry.update({
                url: url,
                ydk: ydk,
                participantId: participant.id,
                active: true
            })
        } catch (err) {
            console.log(err)
            return interaction.member.send({ content: `Error: Could not access database.`})
        } finally {
            const deckAttachments = await drawDeck(ydk) || []
            interaction.member.roles.add(server.tourRole).catch((err) => console.log(err))
            interaction.member.send({ content: `Thanks! I have all the information we need from you. Good luck in the tournament! FYI, this is the deck you submitted:`, files: [...deckAttachments] }).catch((err) => console.log(err))
            return client.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> is now registered for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
        }
    } else {
        try {
            await entry.update({ url: url, ydk: ydk })
        } catch (err) {
            console.log(err)
            return interaction.member.send({ content: `Error: Could not access database.`}).catch((err) => console.log(err))
        } finally {
            const deckAttachments = await drawDeck(ydk) || []
            interaction.member.send({ content: `Thanks! I have your updated deck list for the tournament:`, files: [...deckAttachments] }).catch((err) => console.log(err))
            return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `<@${player.discordId}> resubmitted their deck list for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
        }
    }
}


// SIGNUP FOR TOURNAMENT 
const signupForTournament = async (interaction, tournamentId) => {
    const user = interaction.options.getUser('user')
    const member = await interaction.guild.members.fetch(user.id)

    const player = await Player.findOne({
        where: {
            discordId: user.id
        }
    })

    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        }
    })

    const server = await Server.findOne({
        where: {
            name: interaction.guild.name
        }
    })

    const entry = await Entry.findOne({ where: { playerId: player.id, tournamentId: tournamentId }})
    const format = await Format.findOne({ where: { name: {[Op.iLike]: tournament.formatName } }})
    if (!format) return interaction.reply(`Unable to determine what format is being played in ${tournament.name}. Please contact an administrator.`)
    interaction.reply({ content: `Please check your DMs.` })
    
    const dbName = player.duelingBook ? player.duelingBook : await askForDBName(interaction.member, player)
    if (!dbName) return
    const { url, ydk } = await getDeckList(interaction.member, player, format, true)
    if (!url) return

    if (!entry) {
        try {                                
          const { participant } = await postParticipant(server, tournament, player)
          if (!participant) return interaction.member.send({ content: `Error: Unable to register on Challonge for ${tournament.name} ${tournament.logo}.`})
          
          await Entry.create({
              playerName: player.name,
              url: url,
              ydk: ydk,
              participantId: participant.id,
              playerId: player.id,
              tournamentId: tournament.id
          })
    
        } catch (err) {
          console.log(err)
          return interaction.member.send({ content: `Error: Could not access database.`})
        } finally {
          member.roles.add(server.tourRole).catch((err) => console.log(err))
          interaction.member.send({ content: `Thanks! I have all the information we need for ${player.name}.` }).catch((err) => console.log(err))
          return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
        }
    } else if (entry.active === false) {
        try {                                
            const { participant } = await postParticipant(server, tournament, player)
            if (!participant) return interaction.member.send({ content: `Error: Unable to register on Challonge for ${tournament.name} ${tournament.logo}.`})
            
            await entry.update({
                url: url,
                ydk: ydk,
                participantId: participant.id,
                active: true
            })
        } catch (err) {
            console.log(err)
            return interaction.member.send({ content: `Error: Could not access database.`})
        } finally {
            member.roles.add(server.tourRole).catch((err) => console.log(err))
            interaction.member.send({ content: `Thanks! I have all the information we need for ${player.name}.` }).catch((err) => console.log(err))
            return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `A moderator signed up <@${player.discordId}> for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
        }
    } else {
        try {
            await entry.update({ url: url, ydk: ydk })
        } catch (err) {
            console.log(err)
            return interaction.member.send({ content: `Error: Could not access database.`}).catch((err) => console.log(err))
        } finally {
            interaction.member.send({ content: `Thanks! I have ${player.name}'s updated deck list for the tournament.` }).catch((err) => console.log(err))
            return interaction.guild.channels.cache.get(tournament.channelId).send({ content: `A moderator resubmitted <@${player.discordId}>'s deck list for ${tournament.name} ${tournament.logo}!`}).catch((err) => console.log(err))
        }
    }
}

// CHECK TIMER
const checkTimer = async (interaction, tournamentId) => {
    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        }
    }) 

    const now = new Date()
    const difference = tournament.deadline - now

    if (difference < 0) return interaction.reply(`The deadline has passed.`)
    if (difference < 60 * 1000) return interaction.reply(`Remaining time: less than 1 minute.`)

    let hours = Math.floor(difference / (1000 * 60 * 60))
    const word1 = hours === 1 ? 'hour' : 'hours'
    let minutes = Math.round((difference - (hours * (1000 * 60 * 60))) / (1000 * 60))
    
    while (minutes >= 60) {
        hours++
        minutes-= 60
    }

    if (hours < 1) {
        const word2 = minutes === 1 ? 'minute' : 'minutes'
        return interaction.reply(`Remaining time: ${minutes} ${word2}.`)
    } else {
        const word2 = minutes === 1 ? 'minute' : 'minutes'
        return interaction.reply(`Remaining time: ${hours} ${word1} and ${minutes} ${word2}.`)
    }
}

// SET TIMER FOR TOURNAMENT
const setTimerForTournament = async (interaction, tournamentId) => {
    const tournament = await Tournament.findOne({
        where: {
            id: tournamentId
        }
    }) 

    const server = await Server.findOne({
        where: {
            name: interaction.guild.name
        }
    })

    const timestamp = Date.now()
    let hours = interaction.options.getNumber('hours')
    let minutes = interaction.options.getNumber('minutes')
    const timeRemaining = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000)
    const deadline = new Date(timestamp + timeRemaining)
    await tournament.update({ deadline })

    while (minutes >= 60) {
        hours++
        minutes-= 60
    }

    const word1 = hours === 1 ? 'hour' : 'hours'
    const word2 = minutes === 1 ? 'minute' : 'minutes'

    if (hours < 1) {
        interaction.reply(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} The next round begins now! You have ${minutes} ${word2} to complete your match. ${emojis.thinkygo}`)
    } else {
        interaction.reply(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} The next round begins now! You have ${hours} ${word1} and ${minutes} ${word2} to complete your match. ${emojis.thinkygo}`)
    }

    sendPairings(interaction.guild, server, tournament, true)
    return setTimeout(() => {
        return interaction.reply(`${emojis.high_alert} **Attention: ${tournament.name} Participants!** ${emojis.high_alert} Time is up in the round! ${emojis.vince}`)
    }, timeRemaining)
}

////// TOURNAMENT HOST FUNCTIONS ///////

// CREATE SHEET DATA
const createSheetData = async (tournament) => {
    try {
        const entries = await Entry.findAll({ where: { tournamentId: tournament.id}, include: Player })
        const typeData = {}
        const catData = {}
        const sheet1Data = [['Player', 'Deck', 'Type', 'Link']]
        const sheet2DataA = [['Deck', 'Entries', 'Percent']]
        const sheet2DataB = [[], ['Category', 'Entries', 'Percent']]
    
        entries.forEach((e) => {
            typeData[e.deck_type] ? typeData[e.deck_type]++ : typeData[e.deck_type] = 1
            catData[e.deck_category] ? catData[e.deck_category]++ : catData[e.deck_category] = 1
            sheet1Data.push([e.playerName, e.deck_name, e.deck_type, e.url])            
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
    } catch (err) {
        console.log(err)
        return {}
    }
}

// GET TOURNAMENT SERIES
const getTournamentSeries = async (message) => {
    const filter = m => m.author.id === message.author.id
	message.channel.send({ content: `Please select a tournament series:`})
	return await message.channel.awaitMessages({
        filter,
		max: 1,
		time: 15000
	}).then(collected => {
		const response = collected.first().content.toLowerCase()
        if (response.includes(1) || response.startsWith('single')) return 'single elimination'
        else return false
	}).catch(err => {
		console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
	})
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
const removeParticipant = async (server, interaction, member, entry, tournament, drop = false) => {    
    try {
        const success = await axios({
            method: 'delete',
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${entry.participantId}.json?api_key=${server.challongeAPIKey}`
        })

        if (success) {
            if (tournament.state === 'pending') {
                await entry.destroy()
            } else {
                entry.active = false
                await entry.save()
            }

            const playerId = entry.playerId
            const count = await Entry.count({ 
                where: {
                    playerId: playerId,
                    active: true,
                    '$tournament.serverId$': server.id
                },
                include: Tournament,
            })

            if (!count) member.roles.remove(server.tourRole).catch((err) => console.log(err))
        
            if (drop) {
                return interaction.reply({ content: `I removed you from the tournament. Better luck next time!`})
            } else {
                return interaction.reply({ content: `${member.user.username} has been removed from the tournament.`})
            }
        } else if (!success && drop) {
            return interaction.reply({ content: `Hmm... I don't see you in the participants list.`})
        } else if (!success && !drop) {
            return interaction.reply({ content: `I could not find ${member.user.username} in the participants list.`})
        }
    } catch (err) {
        console.log(err)
        if (drop) {
            return interaction.reply({ content: `Hmm... I don't see you in the participants list.`})
        } else {
            return interaction.reply({ content: `I could not find ${member.user.username} in the participants list.`})
        }
    }   
}

//SEED
const seed = async (interaction, tournamentId) => {
    const server = await Server.findOne({ where: { id: interaction.guildId }})
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    interaction.channel.send({ content: `Seeding in progress, please wait.`})

    const entries = await Entry.findAll({ where: { active: true, tournamentId: tournament.id } })  
    const serverId = server.internalLadder ? server.id : '414551319031054346'  
    const expEntries = []
    const newbieEntries = []

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const playerId = entry.playerId
        const stats = await Stats.findOne({ where: { format: tournament.formatName, playerId, serverId }})
        
        if (stats) {
            expEntries.push([entry.participantId, entry.playerName, stats.elo])
        } else {
            newbieEntries.push([entry.participantId, entry.playerName, null])
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
                url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants/${participantId}.json?api_key=${server.challongeAPIKey}`,
                data: {
                    participant: {
                        seed: i+1
                    }
                }
            })
            
            results.push(`${name} is now the ${i+1} seed.`)
            count++
        } catch (err) {
            interaction.channel.send({ content: `Error processing ${name} (participantId: ${participantId}) as the ${i+1} seed.`})
        }
    }

    for (let i = 0; i < results.length; i += 30) interaction.channel.send({ content: results.slice(i, i + 30).join('\n').toString()})
    if (count !== seeds.length) interaction.channel.send({ content: `Error seeding tournament. Please fix seeding manually if desired.`})
    return
}


////// TOURNAMENT MANAGEMENT FUNCTIONS ///////

//CHECK PAIRING
const checkPairing = (match, p1, p2) => (match.player1_id === p1 && match.player2_id === p2) || (match.player1_id === p2 && match.player2_id === p1)

//FIND NEXT MATCH
const findNextMatch = (matchesArr = [], matchId, participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        // if (match.state === 'complete') continue
        if (match.prerequisite_match_ids_csv.includes(matchId) && (match.player1_id === participantId || match.player2_id === participantId)) {
            if (match.state === 'complete') {
                return findNextMatch(matchesArr, match.id, participantId)
            } else {
                return match.id
            }
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
            url: `https://api.challonge.com/v1/tournaments/${tournamentId}/matches.json?api_key=${server.challongeAPIKey}`
        })
        
        return data
    } catch (err) {
        console.log(err)
        return []
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
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${server.challongeAPIKey}`,
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
    else return [1, 0]
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
const processMatchResult = async (server, interaction, winner, winningPlayer, loser, losingPlayer, tournament, noshow = false) => {
    const losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id }, include: Player })
    const winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id }, include: Player })
    if (!losingEntry || !winningEntry) {
        interaction.channel.send({ content: `Sorry I could not find your tournament in the database.`})
        return false
    } 

    const gameCount = noshow ? [0, 0] : [1, 0]
    if (!gameCount || !gameCount.length) {
        interaction.channel.send({ content: `Please specify a valid game count.`})
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
            url: `https://api.challonge.com/v1/tournaments/${tournament.id}/matches/${matchId}.json?api_key=${server.challongeAPIKey}`,
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
        interaction.channel.send({ content: `Error: could not update bracket for ${tournament.name}.`})
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
            const playerId = losingEntry.player.id
            const discordId = losingEntry.player.discordId
            const member = interaction.guild.members.cache.get(discordId)
            losingEntry.active = false
            await losingEntry.save()

            const count = await Entry.count({
                where: {
                    playerId: playerId,
                    active: true,
                    '$tournament.serverId$': server.id
                },
                include: Tournament
            })

            if (member && !count) member.roles.remove(server.tourRole).catch((err) => console.log(err))
        }

        const loserNextMatch = loserEliminated ? null : findNextMatch(updatedMatchesArr, matchId, losingEntry.participantId)
        const loserNextOpponent = loserNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, loserNextMatch, losingEntry.participantId) : null
        const loserMatchWaitingOn = loserNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, loserNextMatch, matchId) 
        const loserWaitingOnP1 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p1 }, include: Player }) : null
        const loserWaitingOnP2 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p2 }, include: Player }) : null

        setTimeout(async () => {
            if (loserEliminated) {
                return interaction.reply({ content: `${losingPlayer.name}, You are eliminated from the tournament. Better luck next time!`})
            } else if (loserNextOpponent) {
                try {
                    console.log(`New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${loserNextOpponent.player.name + '#' + loserNextOpponent.player.discriminator}\nDuelingBook: ${loserNextOpponent.player.duelingBook}`)
                    loser.user.send(`New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${loserNextOpponent.player.name + '#' + loserNextOpponent.player.discriminator}\nDuelingBook: ${loserNextOpponent.player.duelingBook}`)
                } catch (err) {
                    console.log(err)
                }

                try {
                    const member = await guild.members.fetch(loserNextOpponent.player.discordId)
                    console.log(`New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${losingPlayer.name + '#' + losingPlayer.discriminator}\nDuelingBook: ${losingPlayer.duelingBook}`)
                    member.user.send(`New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${losingPlayer.name + '#' + losingPlayer.discriminator}\nDuelingBook: ${losingPlayer.duelingBook}`)
                } catch (err) {
                    console.log(err)
                }
        
                return interaction.reply({ content: `New Match: <@${losingPlayer.discordId}> (DB: ${losingPlayer.duelingBook}) vs. <@${loserNextOpponent.player.discordId}> (DB: ${loserNextOpponent.player.duelingBook}). Good luck to both duelists.`})
            } else if (loserMatchWaitingOn && loserWaitingOnP1 && loserWaitingOnP2) {
                return interaction.reply({ content: `${losingPlayer.name}, You are waiting for the result of ${loserWaitingOnP1.player.name} (DB: ${loserWaitingOnP1.player.duelingBook}) vs ${loserWaitingOnP2.player.name} (DB: ${loserWaitingOnP2.player.duelingBook}).`})
            } else {
                return interaction.reply({ content: `${losingPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
            }
        }, 2000)
        
        if (!winnerNextMatch || (winnerNextMatch && loserNextMatch !== winnerNextMatch)) {
            setTimeout(async () => {
                if (!winnerNextMatch) {
                    return interaction.reply({ content: `<@${winningPlayer.discordId}>, You won the tournament! Congratulations on your stellar performance! ${legend}`})
                } else if (winnerNextOpponent) {
                    try {
                        console.log(`New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${winnerNextOpponent.player.name + '#' + winnerNextOpponent.player.discriminator}\nDuelingBook: ${winnerNextOpponent.player.duelingBook}`)
                        winner.user.send(`New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${winnerNextOpponent.player.name + '#' + winnerNextOpponent.player.discriminator}\nDuelingBook: ${winnerNextOpponent.player.duelingBook}`)
                    } catch (err) {
                        console.log(err)
                    }

                    try {
                        const member = await guild.members.fetch(winnerNextOpponent.player.discordId)
                        console.log(`New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${winningPlayer.name + '#' + winningPlayer.discriminator}\nDuelingBook: ${winningPlayer.duelingBook}`)
                        member.user.send(`New Match for ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${winningPlayer.name + '#' + winningPlayer.discriminator}\nDuelingBook: ${winningPlayer.duelingBook}`)
                    } catch (err) {
                        console.log(err)
                    }
                    
                    return interaction.reply({ content: `New Match: <@${winningPlayer.discordId}> (DB: ${winningPlayer.duelingBook}) vs. <@${winnerNextOpponent.player.discordId}> (DB: ${winnerNextOpponent.player.duelingBook}). Good luck to both duelists.`})
                } else if (winnerMatchWaitingOn && winnerWaitingOnP1 && winnerWaitingOnP2) {
                    return interaction.reply({ content: `${winningPlayer.name}, You are waiting for the result of ${winnerWaitingOnP1.player.name} (DB: ${winnerWaitingOnP1.player.duelingBook}) vs ${winnerWaitingOnP2.player.name} (DB: ${winnerWaitingOnP2.player.duelingBook}).`})
                } else {
                    return interaction.reply({ content: `${winningPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`})
                }
            }, 4000)
        }
    }
    
    return true
}

// SEND PAIRINGS
const sendPairings = async (guild, server, tournament, ignoreRound1) => {
    const matches = [...await getMatches(server, tournament.id)].map((el) => el.match).filter((match) => match.state === 'open')
    
    for (let i = 0; i < matches.length; i++) {
        const match = matches[i]
        if (ignoreRound1 && match.round === 1) continue
        const round = tournament.type === 'double elimination' && match.round < 0 ? `Losers Round ${Math.abs(match.round)}` :
            tournament.type === 'double elimination' && match.round > 0 ? `Winners Round ${Math.abs(match.round)}` :
            `Round ${match.round}`

        try {
            const { player: player1 } = await Entry.findOne({
                where: {
                    tournamentId: tournament.id,
                    participantId: match.player1_id
                },
                include: Player
            })
    
            const { player: player2 } = await Entry.findOne({
                where: {
                    tournamentId: tournament.id,
                    participantId: match.player2_id
                },
                include: Player
            })
    
            try {
                const p1Member = await guild.members.fetch(player1.discordId)
                console.log(`New pairing for ${round} of ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${player2.name + '#' + player2.discriminator}\nDuelingBook: ${player2.duelingBook}`)
                p1Member.user.send(`New pairing for ${round} of ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${player2.name + '#' + player2.discriminator}\nDuelingBook: ${player2.duelingBook}`)
            } catch (err) {
                console.log(err)
            }
    
            try {
                const p2Member = await guild.members.fetch(player2.discordId)
                console.log(`New pairing for ${round} of ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${player1.name + '#' + player1.discriminator}\nDuelingBook: ${player1.duelingBook}`)
                p2Member.user.send(`New pairing for ${round} of ${tournament.name}! ${tournament.logo}\nServer: ${server.name} ${server.logo}\nFormat: ${tournament.formatName} ${tournament.emoji}\nDiscord: ${player1.name + '#' + player1.discriminator}\nDuelingBook: ${player1.duelingBook}`)
            } catch (err) {
                console.log(err)
            }
        } catch (err) {
            console.log(err)
        }
    }
}

// CREATE TOURNAMENT
const createTournament = async (interaction, formatName, name, abbreviation, tournament_type, channelName) => {
    const server = !interaction.guildId ? {} : 
        await Server.findOne({ where: { id: interaction.guildId }}) || 
        await Server.create({ id: interaction.guildId, name: interaction.guild.name })

    const format = await Format.findOne({
        where: {
            [Op.or]: {
                name: { [Op.iLike]: server.format || formatName },
                channel: interaction.channelId
            }
        }
    })
    
    const channel = interaction.guild.name !== 'Format Library' ? await interaction.guild.channels.cache.find((channel) => channel.name === channelName) : {}
    const channelId = interaction.guild.name === 'Format Library' ? format.channelId : channel.id

    const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')

    // const name = input.startsWith('FLC') ? `Format Library Championship ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('YRS') ? `Yu-Gi-Oh! Retro Series ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('DLC') ? `Drama Llama Classic ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('DDS') ? `Digbic Dig Series ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('ETC') ? `Ellietincan Cup ${pparseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('ACS') ? `Format Library Championship ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('KGP') ? `Format Library Championship ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('DCT') ? `Duelist Crown Tournament ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('DSC') ? `Dark Side Cup ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('WWC') ? `Woawa World Cup ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('GASP') ? `Gigachad Advanced Sneak Preview ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('RWL') ? `Retro World Locals ${parseInt(input.replace(/[^0-9]/g,''))}` :
    //     input.startsWith('BC') ? `Blazing Cheaters ${parseInt(input.replace(/[^0-9]/g,''))}` : 
    //     input.startsWith('FWL') ? `Future World Locals ${parseInt(input.replace(/[^0-9]/g,''))}` : 
    //     input

    const logo = name.toLowerCase().includes('format library championship') ? emojis.FL :
        name.toLowerCase().includes('retro series') ? emojis.mlady :
        name.toLowerCase().includes('drama llama') ? emojis.lmfao :
        name.toLowerCase().includes('digbic') ? emojis.stoned :
        name.toLowerCase().includes('ellietincan') ? emojis.lipton :
        name.toLowerCase().includes('ajtbls') ? emojis.toad :
        name.toLowerCase().includes('ke$ha') ? emojis.UredU :
        name.toLowerCase().includes('crown') ? emojis.king :
        name.toLowerCase().includes('dark side') ? emojis.evil :
        name.toLowerCase().includes('woawa') ? '🦉 ⚽' :
        name.toLowerCase().includes('gigachad') ? emojis.gigachad :
        name.toLowerCase().includes('retro world') ? emojis.celtic :
        name.toLowerCase().includes('future world') ? emojis.farqred :
        name.toLowerCase().includes('blazing cheaters') ? emojis.speeder :
        server.logo || emojis.legend

    try {
        const { status, data } = await axios({
            method: 'post',
            url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeAPIKey}`,
            data: {
                tournament: {
                    name: name,
                    url: abbreviation || name,
                    tournament_type: tournament_type,
                    game_name: 'Yu-Gi-Oh!',
                    pts_for_match_tie: "0.0"
                }
            }
        })
        
        if (status === 200 && data) {
            await Tournament.create({ 
                id: data.tournament.id,
                name: name,
                abbreviation: abbreviation,
                state: 'pending',
                type: tournament_type,
                formatName: format.name,
                logo: logo,
                emoji: server.emoji || format.emoji,
                url: data.tournament.url,
                channelId: channelId,
                serverId: interaction.guildId,
                community: server.name
            })

            return interaction.reply({ content: 
                `You created a new tournament:` + 
                `\nName: ${name} ${logo}` + 
                `\nFormat: ${format.name} ${server.emoji || format.emoji}` + 
                `\nType: ${capitalize(data.tournament.tournament_type, true)}` +
                `\nBracket: https://challonge.com/${data.tournament.url}`
            })
        } 
    } catch (err) {
        console.log(err)
        try {
            const { status, data } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeAPIKey}`,
                data: {
                    tournament: {
                        name: name,
                        url: str,
                        tournament_type: tournament_type,
                        game_name: 'Yu-Gi-Oh!',
                        pts_for_match_tie: "0.0"
                    }
                }
            })
            
            if (status === 200 && data) {
                await Tournament.create({ 
                    id: data.tournament.id,
                    name: data.tournament.name,
                    state: data.tournament.state,
                    type: data.tournament.tournament_type,
                    formatName: format.name,
                    logo: logo,
                    emoji: server.emoji || format.emoji,
                    url: data.tournament.url,
                    channelId: channelId,
                    serverId: interaction.guildId,
                    community: server.name
                })

                return interaction.reply({ content: 
                    `You created a new tournament:` + 
                    `\nName: ${data.tournament.name} ${logo}` + 
                    `\nFormat: ${format.name} ${server.emoji || format.emoji}` + 
                    `\nType: ${capitalize(data.tournament.tournament_type, true)}` +
                    `\nBracket: https://challonge.com/${data.tournament.url}`
                })
            } 
        } catch (err) {
            console.log(err)
            return interaction.reply({ content: `Unable to connect to Challonge account.`})
        }
    }
}

// DROP FROM TOURNAMENT
const dropFromTournament = async (interaction, tournamentId) => {
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    const player = await Player.findOne({ where: { discordId: interaction.user.id }})
    const server = await Server.findOne({ where: { id: interaction.guildId }})

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
            if (match.winnerId === player.id || match.loserId === player.id) success = true 
        })

        if (!success) return interaction.reply({ content: `If you played a match, please report the result before dropping. Otherwise ask a Moderator to remove you.`})
    }

    const entry = await Entry.findOne({ 
        where: { 
            '$player.discordId$': interaction.user.id, 
            tournamentId: tournament.id
        },
        include: Player
    })

    return removeParticipant(server, interaction, interaction.member, entry, tournament, true)
}

const startTournament = async (interaction, tournamentId) => {
    const server = await Server.findOne({ where: { id: interaction.guildId }})
    const tournament = await Tournament.findOne({ where: { id: tournamentId }})
    
    // await seed(interaction, tournament)

    const { status } = await axios({
        method: 'post',
        url: `https://api.challonge.com/v1/tournaments/${tournament.id}/start.json?api_key=${server.challongeAPIKey}`
    })

    if (status === 200) { 
        await tournament.update({ state: 'underway' })
        message.channel.send({ content: `Let's go! Your tournament is starting now: https://challonge.com/${url} ${tournament.emoji}`})
        return sendPairings(interaction.guild, server, tournament, false)
    } else {
        return interaction.reply({ content: `Error connecting to Challonge.`})
    }
}

module.exports = {
    askForDBName,
    checkPairing,
    checkTimer,
    closeTournament,
    createSheetData,
    createTournament,
    dropFromTournament,
    findNextOpponent,
    findNoShowOpponent,
    findOtherPreReqMatch,
    getDeckList,
    getPairing,
    getTournamentFormat,
    getTournamentType,
    getMatches,
    joinTournament,
    openTournament,
    processMatchResult,
    postParticipant,
    removeParticipant,
    seed,
    selectTournament,
    selectTournamentForDeckCheck,
    sendDeck,
    sendPairings,
    setTimerForTournament,
    signupForTournament,
    startTournament
}