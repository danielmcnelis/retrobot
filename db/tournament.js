
const Sequelize = require('sequelize')
const { db } = require('./db')

const Tournament = db.define('tournaments', {
    id: {
        primaryKey: true,
        type: Sequelize.STRING
    },
    name: {
        type: Sequelize.STRING
    },
    format: {
        type: Sequelize.STRING
    },
    url: {
        type: Sequelize.STRING
    },
    display: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    cleanName: {
        type: Sequelize.STRING
    },
    shortName: {
        type: Sequelize.STRING
    },
    winner: {
        type: Sequelize.STRING
    },
    playerId: {
        type: Sequelize.STRING
    },
    size: {
        type: Sequelize.INTEGER
    },
    type: {
        type: Sequelize.STRING
    },
    series: {
        type: Sequelize.BOOLEAN
    },
    worlds: {
        type: Sequelize.BOOLEAN
    },
    state: {
        type: Sequelize.STRING,   
        defaultValue: 'pending'
    },
    rounds: {
        type: Sequelize.INTEGER
    },
    community: {
        type: Sequelize.STRING
    },
    emoji: {
        type: Sequelize.STRING
    },
    formatEmoji: {
        type: Sequelize.STRING
    },
    channelId: {
        type: Sequelize.STRING
    },
    guildId: {
        type: Sequelize.STRING
    },
    startDate: {
        type: Sequelize.DATE
    },
    endDate: {
        type: Sequelize.DATE
    },
})

module.exports = Tournament