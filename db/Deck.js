
const Sequelize = require('sequelize')
const { db } = require('./db')

const Deck = db.define('decks', {
  name: {
    type: Sequelize.STRING
  },
  deckType: {
      type: Sequelize.STRING
  },
  deckCategory: {
      type: Sequelize.STRING
  },
  builder: {
    type: Sequelize.STRING
  },
  format: {
    type: Sequelize.STRING
  },
  ydk: {
    type: Sequelize.TEXT
  },
  event: {
    type: Sequelize.STRING
  },
  placement: {
    type: Sequelize.INTEGER
  },
  display: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  },
  community: {
    type: Sequelize.STRING
  },
  downloads: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  views: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  rating: {
    type: Sequelize.INTEGER,
    defaultValue: 0
  },
  playerId: {
      type: Sequelize.STRING
  },
  tournamentId: {
      type: Sequelize.STRING
  }
})

module.exports = Deck
