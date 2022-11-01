
const { Sequelize } = require('sequelize')
const { db } = require('./db')

const Status = db.define('statuses', {
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

module.exports = Status