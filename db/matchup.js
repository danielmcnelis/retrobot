
const Sequelize = require('sequelize');
const db = require('./db');

const Matchup = db.define('matchup', {
    winningType: {
        type: Sequelize.STRING,   
        defaultValue: 'other',   
        allowNull: false
    },
    losingType: {
        type: Sequelize.STRING,     
        defaultValue: 'other',
        allowNull: false
    },
    wasTournament: {     
        type: Sequelize.BOOLEAN,  
        defaultValue: false,
        allowNull: false
    },
    tournamentName: {     
        type: Sequelize.STRING,  
        allowNull: true
    }
})

module.exports = Matchup