
const Sequelize = require('sequelize')
const { db } = require('./db')

const Deck = db.define('decks', {
  name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  deckType: {
      type: Sequelize.STRING,
      allowNull: true
  },
  deckCategory: {
      type: Sequelize.STRING,
      allowNull: true
  },
  builder: {
    type: Sequelize.STRING,
    allowNull: true
  },
  format: {
    type: Sequelize.STRING,
    allowNull: true
  },
  ydk: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  event: {
    type: Sequelize.STRING,
    allowNull: true
  },
  placement: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  display: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  community: {
    type: Sequelize.STRING,
    allowNull: true
  },
  downloads: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  views: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  rating: {
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  playerId: {
      type: Sequelize.STRING,
      allowNull: true
  },
  tournamentId: {
      type: Sequelize.STRING,
      allowNull: true
  }
})

module.exports = Deck
