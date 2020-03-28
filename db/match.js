
const Sequelize = require('sequelize');
const db = require('./db');

const Match = db.define('match', {
    winner: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    loser: {
        type: Sequelize.STRING,        
        allowNull: false
    },
    time: {
        type: Sequelize.NUMBER,        
        allowNull: false
    }
})

module.exports = Match

