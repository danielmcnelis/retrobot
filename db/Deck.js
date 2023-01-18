
const Sequelize = require('sequelize')
const { Op } = require('sequelize')
const db = require('./db')
const Card = require('./Card')
const Format = require('./Format')
const Player = require('./Player')
const Status = require('./Status')

//CONVERT ARRAY TO OBJECT
const convertArrayToObject = (arr = []) => {
    const obj = {}
    arr.forEach(e => obj[e] ? obj[e]++ : obj[e] = 1)
    return obj
}

const Deck = db.define('decks', {
  name: {
    type: Sequelize.STRING
  },
  type: {
    type: Sequelize.STRING
  },
  category: {
    type: Sequelize.STRING
  },
  builder: {
    type: Sequelize.STRING
  },
  playerId: {
    type: Sequelize.STRING
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  origin: {
    type: Sequelize.STRING
  },
  ydk: {
    type: Sequelize.TEXT
  },
  eventName: {
    type: Sequelize.STRING
  },
  publishDate: {
    type: Sequelize.DATE
  },
  eventId: {
    type: Sequelize.INTEGER
  },
  community: {
    type: Sequelize.STRING
  },
  placement: {
    type: Sequelize.INTEGER
  },
  display: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  rating: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  downloads: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  views: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  suggestedType: {
      type: Sequelize.STRING
  },
  shareLink: {
    type: Sequelize.STRING
  },
  linkExpiration: {
    type: Sequelize.DATE
  },
  url: {
    type: Sequelize.STRING
  }
})

Deck.countResults = async (filter = {}) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['display'].includes(key)) { value = value.toLowerCase() === 'true' }
        if (['deckTypeId', 'downloads', 'views', 'rating'].includes(key)) { value = parseInt(value) }
        
        if (operator === 'eq') {
            operator = Op.eq
        } else if (operator === 'not') {
            operator = Op.not
        } else if (operator === 'like') {
            operator = Op.iLike
        } else if (operator === 'gt') {
            operator = Op.gt
        } else if (operator === 'gte') {
            operator = Op.gte
        } else if (operator === 'lt') {
            operator = Op.lt
        } else if (operator === 'lte') {
            operator = Op.lte
        } else if (operator === 'or') {
            operator = Op.or
        } else if (operator === 'and') {
            operator = Op.and
        } else if (operator === 'inc') {
            operator = Op.iLike
            value = '%' + value + '%'
        } else if (operator === 'btw') {
            operator = Op.and
            value = {[Op.gte]: parseInt(value[0]), [Op.lte]: parseInt(value[1])}
        }

        reduced[key] = {[operator]: value}
        return reduced
    }, {})

    const count = await Deck.count({ 
        where: filter
     })
    return count
}


Deck.find = async (filter = {}, limit = 12, page = 1, sort = []) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['display'].includes(key)) { value = value.toLowerCase() === 'true' }
        if (['deckTypeId', 'downloads', 'views', 'rating'].includes(key)) { value = parseInt(value) }
       
        if (operator === 'eq') {
            operator = Op.eq
        } else if (operator === 'not') {
            operator = Op.not
        } else if (operator === 'like') {
            operator = Op.iLike
        } else if (operator === 'gt') {
            operator = Op.gt
        } else if (operator === 'gte') {
            operator = Op.gte
        } else if (operator === 'lt') {
            operator = Op.lt
        } else if (operator === 'lte') {
            operator = Op.lte
        } else if (operator === 'or') {
            operator = Op.or
        } else if (operator === 'and') {
            operator = Op.and
        } else if (operator === 'inc') {
            operator = Op.iLike
            value = '%' + value + '%'
        } else if (operator === 'btw') {
            operator = Op.and
            value = {[Op.gte]: parseInt(value[0]), [Op.lte]: parseInt(value[1])}
        }

        reduced[key] = {[operator]: value}
        return reduced
    }, {})

    const decks = await Deck.findAll({
        where: filter,
        offset: (page - 1) * limit,
        limit: limit,
        subQuery: false,
        attributes: { exclude: ['url', 'shareLink', 'linkExpiration', 'createdAt', 'updatedAt'] },        
        include: [{ model: Player, attributes: ['name', 'discordId'] }, {model: Format, attributes: ['name', 'icon']}],
        order: sort
    })

    return decks
}

Deck.verifyLegality = async (ydk, formatName, formatDate, formatBanlist) => { 
    const cardIds = formatName === 'Current' ? [...await Card.findAll({ where: { tcgLegal: true }})].map(c => c.konamiCode) : [...await Card.findAll({ where: { tcgDate: { [Op.lte]: formatDate } }})].map(c => c.konamiCode)
    const forbiddenIds = [...await Status.findAll({ where: { banlist: formatBanlist, restriction: 'forbidden' }, include: Card })].map(s => s.card.konamiCode)
    const limitedIds = [...await Status.findAll({ where: { banlist: formatBanlist, restriction: 'limited' }, include: Card })].map(s => s.card.konamiCode)
    const semiIds = [...await Status.findAll({ where: { banlist: formatBanlist, restriction: 'semi-limited' }, include: Card })].map(s => s.card.konamiCode)

    const main = ydk.split('#main')[1].split('#extra')[0].split('\n').filter((e) => e.length)
    const extra = ydk.split('#extra')[1].split('!side')[0].split('\n').filter((e) => e.length)
    const side = ydk.split('!side')[1].split('\n').filter((e) => e.length)
    const deckArr = [...main, ...side, ...extra]
    const deck = arrayToObject(deckArr)
    const keys = Object.keys(deck)

    for (let i = 0; i < keys.length; i++) {
        let konamiCode = keys[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode 

        if (!cardIds.includes(konamiCode)) {
            return false
        } else if (forbiddenIds.includes(konamiCode)) {
            return false
        } else if (limitedIds.includes(konamiCode) && deck[konamiCode] > 1) {
            return false
        } else if (semiIds.includes(konamiCode) && deck[konamiCode] > 2) {
            return false
        }
    }
    
    return true
}

Deck.generateShareLink = async () => {
    const base52 = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    return import('nanoid').then(({ customAlphabet }) => customAlphabet(base52, 8)())
}

module.exports = Deck