
const { Sequelize } = require('sequelize')
const { db } = require('./db')

export const Status = db.define('statuses', {
  name: {
    type: Sequelize.STRING
  },
  banlist: {
    type: Sequelize.STRING
  },
  restriction: {
    type: Sequelize.STRING
  }
})
