
const Sequelize = require('sequelize');
const db = require('./db');

const Deck = db.define('deck', {
    url: {
        type: Sequelize.STRING,      
        allowNull: false
    },
    type: {
        type: Sequelize.STRING,      
        allowNull: false
    },
    category: {
        type: Sequelize.STRING,      
        defaultValue: 'other',      
        allowNull: false
    },
    rating: {
        type: Sequelize.INTEGER,
        defaultValue: 0,      
        allowNull: false      
    },
    posRaters: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],      
        allowNull: false
    },
    negRaters: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],      
        allowNull: false
    }
})

module.exports = Deck