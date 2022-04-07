
const Sequelize = require('sequelize')
const { db } = require('./db')

const Card = db.define('cards', {
  name: {
    type: Sequelize.TEXT,
    unique: true,
    allowNull: false
  },
  konamiCode: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  ypdId: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  tcgLegal: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  ocgLegal: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  category: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  icon: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  normal: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  effect: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  fusion: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  ritual: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  synchro: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  }, 
  xyz: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  pendulum: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  link: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  flip: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  gemini: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  spirit: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  toon: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  tuner: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  union: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  attribute: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  type: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  level: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  rating: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  arrows: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  scale: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  atk: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  def: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  tcgDate: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  ocgDate: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  color: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  extraDeck: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  sortPriority: {
    type: Sequelize.INTEGER,
    allowNull: true
  }
})

module.exports = Card


