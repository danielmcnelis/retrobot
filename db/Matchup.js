
const { Sequelize } = require('sequelize')
const { db } = require('./db')

const Matchup = db.define('matchups', {
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

module.exports = Matchup