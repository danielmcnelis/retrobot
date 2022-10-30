
const Sequelize = require('sequelize')
const { db } = require('./db')

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
  ydk: {
    type: Sequelize.TEXT
  },
  eventName: {
    type: Sequelize.STRING
  },
  eventDate: {
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
    defaultValue: true
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
  }
})

module.exports = Deck
