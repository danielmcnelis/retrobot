
const Sequelize = require('sequelize')
const db = require('./db')

const Pool = db.define('pools', {
    name: {
        type: Sequelize.STRING
    },
    format: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING,      
        defaultValue: 'pending'
    },
    playerId: {
        type: Sequelize.STRING
    }
})

module.exports = Pool