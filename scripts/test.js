

const { getDeckType } = require('../functions/deck')
const { Deck } = require('../db')
const { Op } = require('sequelize')


const testGetDeckType = async () => {
    const decks = await Deck.findAll({
        where: {
            type: {[Op.or]: ['Other', null]}
        },
        order: [['formatId', 'ASC'], ['id', 'ASC']]
    })

    for (let i = 0; i < decks.length; i++) {
        try {
            const deck = decks[i]
            const ydk = deck.ydk
            const formatName = deck.formatName
            const type = await getDeckType(ydk, formatName)
    
            console.log(`Determined deck ${deck.id} to be: ${type}`)
        } catch (err) {
            console.log(err)
        }
    }
}

testGetDeckType()