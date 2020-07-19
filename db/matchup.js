
const Sequelize = require('sequelize');
const db = require('./db');

const Matchup = db.define('matchup', {
    format: {
        type: Sequelize.STRING,   
        allowNull: true
    },
    winningType: {
        type: Sequelize.STRING,   
        allowNull: true
    },
    losingType: {
        type: Sequelize.STRING,     
        allowNull: true
    },
    wasTournament: {     
        type: Sequelize.BOOLEAN,  
        allowNull: false
    },
    tournamentName: {     
        type: Sequelize.STRING,  
        allowNull: true
    }
})

module.exports = Matchup