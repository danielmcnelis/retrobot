
const Sequelize = require('sequelize')
const { db } = require('./db')

const Match = db.define('match', {
    format: {
        type: Sequelize.STRING,   
        defaultValue: "goat",      
        allowNull: false
    },
    winner_name: {
        type: Sequelize.STRING,        
        allowNull: true
    },
    winnerId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    loser_name: {
        type: Sequelize.STRING,        
        allowNull: true
    },
    loserId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    delta: {
        type: Sequelize.FLOAT,  
        defaultValue: 10,      
        allowNull: false
    },
    tournament: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    }
})

module.exports = Match

