
const Sequelize = require('sequelize')
const db = require('./db')

const Tournament = db.define('tournaments', {
  id: {
    primaryKey: true,
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.STRING
  },
  abbreviation: {
    type: Sequelize.STRING
  },
  url: {
    type: Sequelize.STRING
  },
  formatName: {
    type: Sequelize.STRING
  },
  formatId: {
    type: Sequelize.INTEGER
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

module.exports = Tournament