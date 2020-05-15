
const Sequelize = require('sequelize');
const db = require('./db');

const Replay = db.define('replay', {
    url: {
        type: Sequelize.STRING,
        allowNull: false
    },
    p1Id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    p2Id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    p1Name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    p2Name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    deck1: {
        type: Sequelize.STRING,
        defaultValue: 'other',
        allowNull: false
    },
    deck2: {
        type: Sequelize.STRING,
        defaultValue: 'other',
        allowNull: true
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

module.exports = Replay
