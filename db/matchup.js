
const Sequelize = require('sequelize')
const { db } = require('./db')

const Matchup = db.define('matchups', {
    format: {
        type: Sequelize.STRING
    },
    winning_deck_name: {
        type: Sequelize.STRING
    },
    winning_deck_type: {
        type: Sequelize.STRING
    },
    winning_deck_category: {
        type: Sequelize.STRING
    },
    losing_deck_name: {
        type: Sequelize.STRING
    },
    losing_deck_type: {
        type: Sequelize.STRING
    },
    losing_deck_category: {
        type: Sequelize.STRING
    }
})

module.exports = Matchup
