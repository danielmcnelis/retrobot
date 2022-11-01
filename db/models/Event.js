
const Sequelize = require('sequelize')
const { Format } = require('./Format')
const { Player } = require('./Player')
const { db } = require('../db')

const Event = db.define('events', {
  name: {
    type: Sequelize.STRING
  },
  abbreviation: {
    type: Sequelize.STRING
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
  },
  referenceUrl: {
    type: Sequelize.STRING
  },
  display: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  tournamentId: {
    type: Sequelize.STRING
  },
  winner: {
    type: Sequelize.STRING
  },
  playerId: {
    type: Sequelize.STRING
  },
  size: {
    type: Sequelize.INTEGER
  },
  type: {
    type: Sequelize.STRING
  },
  series: {
    type: Sequelize.BOOLEAN
  },
  community: {
    type: Sequelize.STRING
  },
  startDate: {
    type: Sequelize.DATE
  },
  endDate: {
    type: Sequelize.DATE
  }
})

Event.countResults = async (filter = {}) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['display', 'series'].includes(key)) { value = value.toLowerCase() === 'true' }
        if (['size', 'tournamentId', 'formatId'].includes(key)) { value = parseInt(value) }
        
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

    const query = filter.name
    delete filter.name
    if (query) filter = {[Op.or]: [{name: query}, {abbreviation: query}], ...filter}

    const count = await Event.count({ 
        where: filter
    })

    return count
}

Event.find = async (filter = {}, limit = 12, page = 1, sort = []) => {
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

    const query = filter.name
    delete filter.name
    if (query) filter = {[Op.or]: [{name: query}, {abbreviation: query}], ...filter}

    const events = await Event.findAll({
        where: filter,
        offset: (page - 1) * limit,
        limit: limit,
        subQuery: false,
        attributes: { exclude: ['tournamentId', 'type', 'series', 'createdAt', 'updatedAt'] },        
        include: [{ model: Player, attributes: ['name', 'discordId'] }, {model: Format, attributes: ['name', 'icon']}],
        order: sort
    })

    return events
}

module.exports = Event