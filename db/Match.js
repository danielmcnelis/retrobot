
const Sequelize = require('sequelize')
const { db } = require('./db')

const Match = db.define('matches', {
    format: {
        type: Sequelize.STRING
    },
    winner_name: {
        type: Sequelize.STRING
    },
    winnerId: {
        type: Sequelize.STRING
    },
    loser_name: {
        type: Sequelize.STRING
    },
    loserId: {
        type: Sequelize.STRING
    },
    delta: {
        type: Sequelize.FLOAT,  
        defaultValue: 10.00
    },
    tournament: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    internal: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
})

module.exports = Match

