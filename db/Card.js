
const Sequelize = require('sequelize')
const db = require('./db')
const Print = require('./Print')

const Card = db.define('cards', {
  name: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  konamiCode: {
    type: Sequelize.STRING
  },
  ypdId: {
    type: Sequelize.STRING
  },
  tcgLegal: {
    type: Sequelize.BOOLEAN
  },
  ocgLegal: {
    type: Sequelize.BOOLEAN
  },
  category: {
    type: Sequelize.STRING
  },
  icon: {
    type: Sequelize.STRING
  },
  normal: {
    type: Sequelize.BOOLEAN
  },
  effect: {
    type: Sequelize.BOOLEAN
  },
  fusion: {
    type: Sequelize.BOOLEAN
  },
  ritual: {
    type: Sequelize.BOOLEAN
  },
  synchro: {
    type: Sequelize.BOOLEAN
  },
  xyz: {
    type: Sequelize.BOOLEAN
  },
  pendulum: {
    type: Sequelize.BOOLEAN
  },
  link: {
    type: Sequelize.BOOLEAN
  },
  flip: {
    type: Sequelize.BOOLEAN
  },
  gemini: {
    type: Sequelize.BOOLEAN
  },
  spirit: {
    type: Sequelize.BOOLEAN
  },
  toon: {
    type: Sequelize.BOOLEAN
  },
  tuner: {
    type: Sequelize.BOOLEAN
  },
  union: {
    type: Sequelize.BOOLEAN
  },
  attribute: {
    type: Sequelize.STRING
  },
  type: {
    type: Sequelize.STRING
  },
  level: {
    type: Sequelize.INTEGER
  },
  rating: {
    type: Sequelize.INTEGER
  },
  arrows: {
    type: Sequelize.STRING
  },
  scale: {
    type: Sequelize.INTEGER
  },
  atk: {
    type: Sequelize.STRING
  },
  def: {
    type: Sequelize.STRING
  },
  description: {
    type: Sequelize.TEXT
  },
  tcgDate: {
    type: Sequelize.STRING
  },
  ocgDate: {
    type: Sequelize.STRING
  },
  color: {
    type: Sequelize.STRING
  },
  extraDeck: {
    type: Sequelize.BOOLEAN
  },
  sortPriority: {
    type: Sequelize.INTEGER
  }
})

Card.countResults = async (filter = {}, booster) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['tcgLegal', 'ocgLegal', 'normal', 'effect', 'fusion', 'ritual', 'synchro', 'xyz', 'pendulum', 'link', 'flip', 'gemini', 'spirit', 'toon', 'tuner', 'union', 'extraDeck'].includes(key)) { value = value.toLowerCase() === 'true' }
        if (['level', 'rating', 'scale', 'sortPriority'].includes(key) && operator !== 'btw') { value = parseInt(value) }
        
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

    let include = []
    if (booster) {
        filter['$prints.cardCode$'] = {[Op.iLike]: booster + '%' }        
        include = [{ model: Print } ]
    }

    const count = await Card.count({ 
        where: filter,
        include: include
     })
    return count
}

Card.find = async (filter = {}, booster, limit = 10, page = 1, sort = []) => {
    filter = Object.entries(filter).reduce((reduced, [key, by]) => {
        let value = by.value
        if (typeof value === 'string') value.replaceAll('%20', ' ')
        let operator = by.operator
        if (['tcgLegal', 'ocgLegal', 'normal', 'effect', 'fusion', 'ritual', 'synchro', 'xyz', 'pendulum', 'link', 'flip', 'gemini', 'spirit', 'toon', 'tuner', 'union', 'extraDeck'].includes(key)) { value = value.toLowerCase() === 'true' }
        if (['level', 'rating', 'scale', 'sortPriority'].includes(key) && operator !== 'btw') { value = parseInt(value) }

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

    if (booster) filter['$prints.cardCode$'] = {[Op.iLike]: booster + '%' }

    const cards = await Card.findAll({
        where: filter,
        offset: (page - 1) * limit,
        limit: limit,
        subQuery: false,
        attributes: { exclude: ['tcgLegal', 'ocgLegal', 'ocgDate', 'createdAt', 'updatedAt'] },
        include: [{ model: Print, separate: !booster, attributes: ['id'] }],
        order: sort
    })

    return cards
}

console.log('Card', Card)

module.exports = Card