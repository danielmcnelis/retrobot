
const Sequelize = require('sequelize')
const { db2 } = require('./db')

const Card = db2.define('card', {
  name: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  konami_code: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  tcg_legal: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  ocg_legal: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  image_file: {
    type: Sequelize.TEXT,
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
    type: Sequelize.INTEGER,
    allowNull: true
  },
  def: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  tcg_date: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  ocg_date: {
    type: Sequelize.TEXT,
    allowNull: true
  }
})

module.exports = Card

