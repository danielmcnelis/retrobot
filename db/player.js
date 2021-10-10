
const Sequelize = require('sequelize');
const {db} = require('./db');

const Player = db.define('player', {
    id: {
        primaryKey: true,
        type: Sequelize.STRING,
        allowNull: false
    },
    name: {
        type: Sequelize.STRING,
        allowNull: true
    },
    tag: {
        type: Sequelize.STRING,        
        allowNull: true
    },
    duelingBook: {
        type: Sequelize.STRING,
        allowNull: true
    },
    muted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
})

module.exports = Player

