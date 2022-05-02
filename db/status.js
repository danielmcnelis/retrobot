
const Sequelize = require('sequelize')
const { db } = require('./db')

const Status = db.define('statuses', {
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  banlist: {
    type: Sequelize.STRING,
    allowNull: false
  },
  restriction: {
    type: Sequelize.STRING,
    allowNull: false
  }
})

module.exports = Status