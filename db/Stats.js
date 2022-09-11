
const Sequelize = require('sequelize')
const { db } = require('./db')

const Stats = db.define('stats', {
    format: {
        type: Sequelize.STRING
    },
    elo: {
        type: Sequelize.FLOAT,  
        defaultValue: 500.00
    },
    backupElo: {
        type: Sequelize.FLOAT
    },
    wins: {
        type: Sequelize.INTEGER,  
        defaultValue: 0
    },
    losses: {
        type: Sequelize.INTEGER,  
        defaultValue: 0
    },
    games: {
        type: Sequelize.INTEGER,  
        defaultValue: 0
    },
    internal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    inactive: {
        type: Sequelize.BOOLEAN,  
        defaultValue: false
    }
})

module.exports = Stats


