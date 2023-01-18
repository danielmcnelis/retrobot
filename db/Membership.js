
const Sequelize = require('sequelize')
const db = require('./db')

const Membership = db.define('memberships', {
    guildName: {
        type: Sequelize.STRING
    },
    active: {
        type: Sequelize.BOOLEAN,  
        defaultValue: true
    }
})

module.exports = Membership