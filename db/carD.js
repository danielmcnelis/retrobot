
const Sequelize = require('sequelize')
const { db } = require('./db')

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

module.exports = Card


