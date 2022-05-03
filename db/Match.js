
const Sequelize = require('sequelize')
const { db } = require('./db')

const Match = db.define('matches', {
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
    },
    internal: {
        type: Sequelize.BOOLEAN,        
        allowNull: true
    }
})

module.exports = Match

