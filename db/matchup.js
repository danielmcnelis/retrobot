
const Sequelize = require('sequelize')
const { db } = require('./db')

const Matchup = db.define('matchup', {
    format: {
        type: Sequelize.STRING,   
        defaultValue: 'goat'
    },
    winning_deck_name: {
        type: Sequelize.TEXT,        
        allowNull: false
    },
    winning_deck_type: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    winning_deck_category: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    losing_deck_name: {
        type: Sequelize.TEXT,        
        allowNull: false
    },
    losing_deck_type: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    losing_deck_category: {
        type: Sequelize.STRING,        
        allowNull: false
    }
})

module.exports = Matchup
