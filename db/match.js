
const Sequelize = require('sequelize');
const { db } = require('./db');

const Match = db.define('match', {
    winnerId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    winner_name: {
        type: Sequelize.STRING,        
        allowNull: true
    },
    loserId: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    loser_name: {
        type: Sequelize.STRING,        
        allowNull: true
    },
    delta: {
        type: Sequelize.FLOAT,  
        defaultValue: 10,      
        allowNull: false
    },
    format: {
        type: Sequelize.STRING,   
        defaultValue: "goat",      
        allowNull: false
    },
    tournament: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    }
})

module.exports = Match

