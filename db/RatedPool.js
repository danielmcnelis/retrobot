
const { Sequelize } = require('sequelize')
const { db } = require('./db')

export const RatedPool = db.define('ratedPools', {
    name: {
        type: Sequelize.STRING
    },
    format: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING,      
        defaultValue: 'pending'
    },
    playerId: {
        type: Sequelize.STRING
    }
})