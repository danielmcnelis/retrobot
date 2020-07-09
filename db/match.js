
const Sequelize = require('sequelize');
const db = require('./db');

const Match = db.define('match', {
    format: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    winner: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    loser: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    delta: {
        type: Sequelize.FLOAT,        
        allowNull: false
    }
})

module.exports = Match

