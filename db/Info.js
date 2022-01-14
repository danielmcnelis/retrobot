
const Sequelize = require('sequelize')
const {db} = require('./db')

const Info = db.define('info', {
    element: {
        type: Sequelize.STRING,  
        allowNull: false
    },
    status: {
        type: Sequelize.STRING,
        allowNull: true
    }
})

module.exports = Info
