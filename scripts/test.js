

const { getDeckType } = require('../functions/deck')
const { Deck, DeckType } = require('../db')
const { Op } = require('sequelize')


const testGetDeckType = async (eventId) => {
    const decks = await Deck.findAll({
        where: {
            // eventId: eventId,
            type: {[Op.or]: ['Other', null]}
        },
        order: [['formatId', 'ASC'], ['id', 'ASC']]
    })

    for (let i = 0; i < decks.length; i++) {
        try {
            const deck = decks[i]
            const ydk = deck.ydk
            const formatName = deck.formatName
            const name = await getDeckType(ydk, formatName)

            if (name) {
                const deckType = await DeckType.findOne({
                    where: {
                        name: name
                    }
                })

                await deck.update({
                    type: deckType.name,
                    deckTypeId: deckType.id
                })

                console.log(`Labeling ${deck.builder}'s deck ${deck.id} as: ${name}`)
            } else {
                console.log(`<!> Could not determine type for ${deck.builder}'s deck ${deck.id} <!>`)
                continue
            }
    
        } catch (err) {
            console.log(err)
        }
    }
}

testGetDeckType()