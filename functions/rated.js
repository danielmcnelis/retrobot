
//RATED FUNCTIONS

//MODULE IMPORTS
const axios = require('axios')
const { Op } = require('sequelize')

//DATABASE IMPORTS
const { Format, Player, RatedDeck, RatedPool, Server } = require('../db/index.js')

//STATIC IMPORTS
const channels = require('../static/channels')
const emojis = require('../static/emojis.json')
const { yescom } = require('../static/commands.json')

//FUNCTION IMPORTS
const { getIssues } = require('./deck')


const getPotentialPairConfirmation = async (client, format, potentialPair, newRatedPool, commonGuildId) => {
    const guild = client.guilds.cache.get(commonGuildId)
    const member = await guild.members.fetch(potentialPair.playerId)
    if (!member) return

    try {
        potentialPair.status = 'confirming'
        await potentialPair.save()
    } catch (err) {
        console.log(err)
        return message.channel.send(`Sorry, something went wrong. I've removed you from the Rated ${newRatedPool.format} Format player pool.`)
    }

    const filter = m => m.author.id === potentialPair.playerId
    const message = await member.user.send({ content: `I've found a Rated ${format.name} Format ${format.emoji} opponent for you. Do you still wish to play?`})
    if (!message) return
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 5 * 60 * 1000
    }).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        if (yescom.includes(response)) {
            const pairStillExists = await RatedPool.count({ where: { id: newRatedPool.id }})
            if (!pairStillExists) {
                potentialPair.status = 'pending'
                await potentialPair.save()
                return message.channel.send(`Sorry, your potential opponent found a match while waiting for you to confirm. I'll put you back in the Rated ${format.name} Format ${format.emoji} Pool.`)
            }

            const commonServer = await Server.findOne({ where: { id: commonGuildId }})
            const channelId = commonServer.format ? channels[commonServer.name].ratedChannel : format.channel
            const channel = guild.channels.cache.get(channelId)
            const player = await Player.findOne({ where: { id: potentialPair.playerId }})
            const opponent = await Player.findOne({ where: { id: newRatedPool.playerId }})
            const opposingMember = await guild.members.fetch(opponent.id)

            opposingMember.user.send(`New pairing for Rated ${format.name} Format ${format.emoji}!\nServer: ${commonServer.name} ${commonServer.logo}\nDiscord: ${player.tag}\nDuelingBook: ${player.duelingBook}`)
            message.channel.send(`New pairing for Rated ${format.name} Format ${format.emoji}!\nServer: ${commonServer.name} ${commonServer.logo}\nDiscord: ${opponent.tag}\nDuelingBook: ${opponent.duelingBook}`)
            
            const ratedPoolsToDestroy = await RatedPool.findAll({
                where: {
                    playerId: {[Op.or]: [player.id, opponent.id]}
                }
            }) || []

            for (let d = 0; d < ratedPoolsToDestroy.length; d++) {
                const rPTD = ratedPoolsToDestroy[d]
                await rPTD.destroy()
            }

            return channel.send({ content: `New Rated ${format.name} Format ${format.emoji} Match: <@${opponent.id}> (DB: ${opponent.duelingBook}) vs. <@${player.id}> (DB: ${player.duelingBook}). Good luck to both duelists.`})
        } else {
            await potentialPair.destroy()
            return message.channel.send(`Not a problem. I've removed you from the Rated ${format.name} Format ${format.emoji} player pool.`)
        }
    }).catch(async (err) => {
        console.log(err)
        await potentialPair.destroy()
        return message.channel.send(`Sorry, time's up. I've removed you from the Rated ${newRatedPool.format} Format player pool.`)
    })   
}


// GET DROP FORMATS
const getDropFormats = async (message, pools) => {
    if (pools.length === 1) return pools
    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: `Which Rated Pool(s) do you want to leave?\n(1) - All\n${pools.map((p, index) => `(${index+2}) - ${p}`).join('\n')}`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000
    }).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        console.log('response', response)
        const index = !isNaN(parseInt(response)) ? parseInt(response) - 1 : null
        console.log('index', index)
        const poolsToLeave = response.includes('all') || index === 0 ? pools : 
            index !== null ? [pools[index - 2]] :
            false

        console.log('poolsToLeave', poolsToLeave)
        return poolsToLeave
    }).catch((err) => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}


// GET RATED FORMAT
const getRatedFormat = async (message) => {
    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: `What format do you want to play?`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000
    }).then(async (collected) => {
        const response = collected.first().content.toLowerCase()
        const format = await Format.findOne({ where: { name: {[Op.iLike]: response } }})
        return format
    }).catch((err) => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

//GET PREVIOUS RATED DECK
const getPreviousRatedDeck = async (user, yourRatedDecks, format) => {   
    if (!yourRatedDecks || !yourRatedDecks.length) return false
    const options = yourRatedDecks.map((yRD, index) => `(${index + 1}) - ${yRD.name} - <${yRD.url}>`)
    options.push(`(${options.length + 1}) - Submit a New Deck`)

    const filter = m => m.author.id === user.id
    const message = await user.send({ content: `Which of your ${format.name} Format ${format.emoji} Rated deck(s) would you like to use?\n${options.join('\n')}`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 20000
    }).then(async (collected) => {
        const response = collected.first().content
        const index = !isNaN(parseInt(response)) ? parseInt(response) - 1 : null
        const previousRatedDeck = response.includes('new') || index === options.length ? false : 
            index >= 0 ? yourRatedDecks[index] :
            false

        return previousRatedDeck
    }).catch((err) => {
        console.log(err)
        user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        return false
    })
}

//GET RATED DECK
const getNewRatedDeck = async (user, player, format) => {   
    const filter = m => m.author.id === user.id
    const message = await user.send({ content: `Please provide a duelingbook.com/deck link for your Rated Deck.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first().content
        if (url.includes('duelingbook.com/deck?id=')) {		
            user.send({ content: 'Thanks. Please wait while I download the .YDK file.'})
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
                
            if (illegalCards.length || forbiddenCards.length || limitedCards.length || semiLimitedCards.length) {
                let response = [`I'm sorry, ${user.username}, your deck is not legal. ${emojis.mad}`]
                if (illegalCards.length) response = [...response, `\nThe following cards are not included in this format:`, ...illegalCards]
                if (forbiddenCards.length) response = [...response, `\nThe following cards are forbidden:`, ...forbiddenCards]
                if (limitedCards.length) response = [...response, `\nThe following cards are limited:`, ...limitedCards]
                if (semiLimitedCards.length) response = [...response, `\nThe following cards are semi-limited:`, ...semiLimitedCards]
            
                for (let i = 0; i < response.length; i += 50) {
                    if (response[i+50] && response[i+50].startsWith("\n")) {
                        user.send({ content: response.slice(i, i+51).join('\n').toString()}).catch((err) => console.log(err))
                        i++
                    } else {
                        user.send({ content: response.slice(i, i+50).join('\n').toString()}).catch((err) => console.log(err))
                    }
                }
            
                return false
            } else if (unrecognizedCards.length) {
                let response = `I'm sorry, ${user.username}, the following card IDs were not found in our database:\n${unrecognizedCards.join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact a Moderator or an Admin if you can't resolve this.`
                
                user.send({ content: response.toString() }).catch((err) => console.log(err))
                return false
             } else {
                user.send({ content: `Thanks, ${user.username}, your deck is perfectly legal. ${emojis.legend}`}).catch((err) => console.log(err))
                const deckName = await askForDeckName(user, player) || 'Unnamed Deck'
                const newRatedDeck = await RatedDeck.create({
                    builder: player.name,
                    format: format.name,
                    name: deckName,
                    url: `https://duelingbook.com/deck?id=${id}`,
                    ydk: ydk,
                    playerId: player.id
                })

                return newRatedDeck
            }
        } else {
            user.send({ content: "Sorry, I only accept duelingbook.com/deck links."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch((err) => {
        console.log(err)
        user.send({ content: `Sorry, time's up. Please try again.`}).catch((err) => console.log(err))
        return false
    })
}

//ASK FOR DECK NAME
const askForDeckName = async (member, player, override = false) => {
    const filter = m => m.author.id === member.id || member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const message = await member.send({ content: `Please provide a nickname for ${pronoun} deck.` }).catch((err) => console.log(err))
    if (!message || !message.channel) return false
    return await message.channel.awaitMessages({
        filter,
		max: 1,
        time: 15000
    }).then(async (collected) => {
        const response = collected.first().content
        return response
    }).catch((err) => {
        console.log(err)
        member.send({ content: `Okay, I'll save this as an "Unnamed Deck". You can always change it later.`}).catch((err) => console.log(err))
        return 'Unnamed Deck'
    })
}

module.exports = {
    getDropFormats,
    getNewRatedDeck,
    getPotentialPairConfirmation,
    getPreviousRatedDeck,
    getRatedFormat
}
