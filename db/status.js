
const Sequelize = require('sequelize')
const {db2} = require('./db')

const Status = db2.define('status', {
  name: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  may02: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jul02: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  oct02: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  dec02: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  apr03: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  may03: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jul03: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  aug03: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  nov03: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  feb04: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  apr04: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  oct04: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  apr05: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  oct05: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  apr06: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep06: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  mar07: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jun07: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep07: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  mar08: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  may08: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep08: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  mar09: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep09: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  mar10: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep10: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  mar11: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep11: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  mar12: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep12: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  mar13: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep13: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  oct13: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jan14: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  apr14: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jul14: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  oct14: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jan15: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  apr15: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jul15: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  nov15: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  feb16: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  apr16: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  aug16: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  mar17: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jun17: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep17: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  nov17: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  feb18: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  may18: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep18: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  dec18: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jan19: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  apr19: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jul19: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  oct19: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jan20: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  apr20: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  jun20: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  sep20: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  dec20: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  mar21: {
    type: Sequelize.TEXT,
    allowNull: true
  }
})

module.exports = Status