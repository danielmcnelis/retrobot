
const { Sequelize } = require('sequelize')
const { db } = require('./db')

export const Server = db.define('servers', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.STRING
  },
  size: {
    type: Sequelize.INTEGER
  },
  format: {
    type: Sequelize.STRING
  },
  ownerId: {
    type: Sequelize.STRING
  },
  internalLadder: {
    type: Sequelize.BOOLEAN
  },
  access: {
    type: Sequelize.STRING,
    defaultValue: 'free'
  },
  logo: {
    type: Sequelize.STRING
  },
  emoji: {
    type: Sequelize.STRING
  },
  challongeAPIKey: {
      type: Sequelize.STRING
  },
  googleToken: {
      type: Sequelize.TEXT
  },
  botSpamChannel: {
      type: Sequelize.STRING
  },
  ratedChannel: {
      type: Sequelize.STRING
  },
  welcomeChannel: {
      type: Sequelize.STRING
  },
  adminRole: {
      type: Sequelize.STRING
  },
  modRole: {
      type: Sequelize.STRING
  },
  rankedRole: {
      type: Sequelize.STRING
  },
  tourRole: {
      type: Sequelize.STRING
  }
})
