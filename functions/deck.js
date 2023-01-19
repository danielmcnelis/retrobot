

//DECK FUNCTIONS

//MODULE IMPORTS
const axios = require('axios')
const fs = require('fs')
const { Op } = require('sequelize')

//DATABASE IMPORTS
const { Card, Format, Status, Deck } = require('.././db/index.js')

//FUNCTION IMPORTS
const { convertArrayToObject } = require('./utility.js')

// COMPARE DECKS
const compareDecks = (arr1, arr2) => {
    let score = 0
    let avgSize = (arr1.length + arr2.length) / 2

    for (let i = 0; i < arr1.length; i++) {
        const id = arr1[i]
        const index = arr2.indexOf(id)
        if (index !== -1) {
            score++
            arr2.splice(index, 1)
        }
    }

    return score / avgSize
}

// GET DECK FORMAT
const getDeckFormat = async (server, message, interaction) => {
    let format = await Format.findOne({ 
        where: { 
            [Op.or]: {
                name: { [Op.iLike]: server.format },
                channel: interaction.channelId
            }
        }
    })

    if (format) return format
    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: `What format would you like to check?`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000
    }).then(async collected => {
        const response = collected.first().content.toLowerCase()
        const format = await Format.findOne({ where: { name: {[Op.iLike]: response } } })
        if (!format) message.channel.send({ content: `Sorry, I do not recognize that format.`})
        return format
    }).catch(err => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

// GET ISSUES
const getIssues = async (deckArr, format) => {
    const deck = convertArrayToObject(deckArr)        
    const cardIds = !format.date ? [...await Card.findAll({ where: { tcgLegal: true }})].map(c => c.konamiCode) : [...await Card.findAll({ where: { tcgDate: { [Op.lte]: format.date } }})].map(c => c.konamiCode)
    const forbiddenIds = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'forbidden' }, include: Card })].map(s => s.card.konamiCode)
    const limitedIds = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'limited' }, include: Card })].map(s => s.card.konamiCode)
    const semiIds = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'semi-limited' }, include: Card })].map(s => s.card.konamiCode)

    const illegalCards = []
    const forbiddenCards = []
    const limitedCards = []
    const semiLimitedCards = []
    const unrecognizedCards = []

    const keys = Object.keys(deck)
    for (let i = 0; i < keys.length; i++) {
        let konamiCode = keys[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode 
        if (konamiCode === '00000000' && format.name === 'Current') continue
        if (!cardIds.includes(konamiCode)) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) {
                illegalCards.push(card.name)
            } else {
                unrecognizedCards.push(konamiCode)
            }
        } else if (forbiddenIds.includes(konamiCode)) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) forbiddenCards.push(card.name)
        } else if (limitedIds.includes(konamiCode) && deck[konamiCode] > 1) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) limitedCards.push(card.name)
        } else if (semiIds.includes(konamiCode) && deck[konamiCode] > 2) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) semiLimitedCards.push(card.name)
        }
    }
    
    illegalCards.sort()
    forbiddenCards.sort()
    limitedCards.sort()
    semiLimitedCards.sort()
    unrecognizedCards.sort()

    const issues = {
        illegalCards,
        forbiddenCards,
        limitedCards,
        semiLimitedCards,
        unrecognizedCards
    }

    return issues
}

//CHECK DECK LIST
const checkDeckList = async (member, format) => {  
    const filter = m => m.author.id === member.user.id
    const message = await member.send({ content: `Please provide a duelingbook.com/deck link for the ${format.name} Format ${format.emoji} deck you would like to check.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return {}
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000
    }).then(async collected => {
        const response = collected.first().content
        if (response.includes('duelingbook.com/deck?id=')) {		
            const id = response.slice(response.indexOf('?id=') + 4)
            const {data} = await axios.get(`https://www.duelingbook.com/php-scripts/load-deck.php/deck?id=${id}`)
            if (!data) return {}
            const main = data.main.map((e) => e.serial_number)
            const minimum = format.category === 'Speed' ? 20 : 40

            if (main.length < minimum) {
                member.send(`I'm sorry, your deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    
                return false 
            }

            const side = data.side.map((e) => e.serial_number)
            const extra = data.extra.map((e) => e.serial_number)
            const deckArr = [...main, ...side, ...extra]
            const issues = await getIssues(deckArr, format)
            return issues
        } else {
            member.send({ content: "Sorry, I only accept duelingbook.com/deck links."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch(err => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

//GET DECK TYPE
const getDeckType = async (ydk, format) => {
    const main = ydk.split('#extra')[0]
    if (!main) return
    const primaryDeckArr = main.split('\n').filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()

    const labeledDecks = await Deck.findAll({
        where: {
            type: {[Op.not]: 'other' },
            deckTypeId: {[Op.not]: null },
            formatName: format
        }
    })

    const similarityScores = []

    for (let i = 0; i < labeledDecks.length; i++) {
        const otherDeck = labeledDecks[i]
        const otherMain = otherDeck.ydk.split('#extra')[0]
        if (!otherMain) continue
        const comparisonDeckArr = otherMain.split('\n').filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()

        const score = compareDecks(primaryDeckArr, comparisonDeckArr)
        similarityScores.push([score, otherDeck.type])
    }

    similarityScores.sort((a, b) => {
        if (a[0] > b[0]) {
            return 1
        } else if (a[0] < b[0]) {
            return -1
        } else {
            return 0
        }
    })

    console.log('similarityScores', similarityScores)

    return similarityScores[0][1]    
}

module.exports = {
    checkDeckList,
    getDeckFormat,
    getDeckType,
    getIssues
}