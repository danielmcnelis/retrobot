
const Sequelize = require('sequelize')
const { db } = require('./db')

const Iron = db.define('irons', {
    name: {
        type: Sequelize.STRING
    },
    format: {
        type: Sequelize.STRING
    },
    team: {
        type: Sequelize.STRING
    },
    paired: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    eliminated: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    position: {
        type: Sequelize.INTEGER
    },
    captain: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    },
    confirmed: {
        type: Sequelize.BOOLEAN,   
        defaultValue: false
    }
})

module.exports = Iron