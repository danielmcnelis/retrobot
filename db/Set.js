
const Sequelize = require('sequelize')
const { db } = require('./db')

const Set = db.define('sets', {
  setName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  setCode: {
    type: Sequelize.STRING,
    allowNull: false
  },
  tcgDate: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  size: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  tcgPlayerGroupId: {
    type: Sequelize.INTEGER,
    allowNull: true
  }
})

module.exports = Set
