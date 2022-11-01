
const { Sequelize } = require('sequelize')
const { db } = require('./db')

const Role = db.define('roles', {
    roleId: {
        type: Sequelize.STRING
    },
    roleName: {
        type: Sequelize.STRING
    }
})

module.exports = Role