
const { Sequelize } = require('sequelize')
const { db } = require('./db')

export const Matchup = db.define('matchups', {
    format: {
        type: Sequelize.STRING
    },
    winningDeck: {
        type: Sequelize.STRING
    },
    winningDeckId: {
        type: Sequelize.STRING
    },
    losingDeck: {
        type: Sequelize.STRING
    },
    losingDeckId: {
        type: Sequelize.INTEGER
    }
})