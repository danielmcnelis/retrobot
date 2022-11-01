
const { Sequelize } = require('sequelize')
const { db } = require('./db')

export const Tournament = db.define('tournaments', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.STRING
  },
  url: {
    type: Sequelize.STRING
  },
  formatName: {
    type: Sequelize.STRING
  },
  type: {
    type: Sequelize.STRING
  },
  state: {
    type: Sequelize.STRING
  },
  deadline: {
      type: Sequelize.DATE
  },
  community: {
    type: Sequelize.STRING
  },
  logo: {
    type: Sequelize.STRING
  },
  emoji: {
    type: Sequelize.STRING
  },
  channelId: {
    type: Sequelize.STRING
  },
  serverId: {
    type: Sequelize.STRING
  }
})
