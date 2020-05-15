
const { Deck, Tournament }  = require('../db/index.js')
const { hasDeck, getCat } = require('./utility.js')
const { yescom, nocom } = require('../static/commands.json')
const types = require('../static/types.json')

//CHECK FOR NEW RATINGS
const checkForNewRatings = async (message, player, deckType, deckName) => {
    let upvoteFilterPassed = false
    let downvoteFilterPassed = false
    let reacter
    const deck = await Deck.findOne({ where: { type: deckType, playerId: player.id }})
    const remove = (array, element) => {
        let newArray = [...array]
        return newArray.filter(el => el !== element)
    }

    const upvoteFilter = (reaction, user) => {
        if (reaction.emoji.name === 'upvote') {
            if (user.id === player.id) {
                upvoteFilterPassed = false
                return message.channel.send(`Sorry, ${user.username}, you cannot rate your own deck.`)
            } else if (deck.posRaters.includes(user.id)) {
                upvoteFilterPassed = false
                return message.channel.send(`Sorry, ${user.username}, you already upvoted this deck.`)
            } else {
                upvoteFilterPassed = true
                reacter = user
                return true
            }
        }
    }
    
    const downvoteFilter = (reaction, user) => {
        if (reaction.emoji.name === 'downvote') {
            if (user.id === player.id) {
                downFilterPassed = false
                return message.channel.send(`Sorry, ${user.username}, you cannot rate your own deck.`)
            } else if (deck.negRaters.includes(user.id)) {
                downFilterPassed = false
                return message.channel.send(`Sorry, ${user.username}, you already downvoted this deck.`)
            } else {
                downvoteFilterPassed = true
                reacter = user
                return true
            }
        }
    }

    const posCollector = message.createReactionCollector(upvoteFilter, { time: 1800000 })
    posCollector.on('collect', async () => {
        if (upvoteFilterPassed) {
            deck.negRaters = remove(deck.negRaters, reacter.id)
            deck.posRaters = [...deck.posRaters, reacter.id]
            deck.rating++
    		await deck.save()
            return message.channel.send(`${player.name}'s ${deckName} deck received an upvote from ${reacter.username}!`)
        }
    })
    posCollector.on('end', err => console.log(err))

    const negCollector = message.createReactionCollector(downvoteFilter, { time: 1800000 })
    negCollector.on('collect', async () => {
        if (downvoteFilterPassed) {
            deck.posRaters = remove(deck.posRaters, reacter.id)
            deck.negRaters = [...deck.negRaters, reacter.id]
            deck.rating--
            await deck.save()
            return message.channel.send(`${player.name}'s ${deckName} deck received a downvote from ${reacter.username}...`)
        }
    })    
    negCollector.on('end', err => console.log(err))
}


//GET DECK TYPE
const getDeckType = async (message, member, url) => {
    const keys = Object.keys(types)
    let success = false
	const filter = m => m.author.id === member.user.id
	message.channel.send(`Okay, ${member.user.username}, what kind of deck is this?`)
	message.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(collected => {
        keys.forEach(async function (elem) {
            if (types[elem].includes(collected.first().content.toLowerCase())) {
                success = true
                if (await hasDeck(member, elem)) {
                    return getDeckOverwriteConfirmation(message, member, url, elem, types[elem][0])
                } else {
                    await Deck.create({ 
                        url,
                        category: getCat(elem),
                        type: elem,
                        playerId: member.user.id
                    }) 
                    
                    return message.channel.send(`Thanks! I saved your ${types[elem][0]} deck to the public database.`)
                }
            }
        })

        if (!success) return getOtherDeckConfirmation(message, member, url, collected.first().content)
    }).catch(err => {    
        console.log(err)
        return message.channel.send(`Perhaps another time would be better.`)
    })
}


//GET OTHER DECK CONFIRMATION
const getOtherDeckConfirmation = async (message, member, url, name) => {
    const count = await Deck.count({ where: { playerId: member.user.id, type: 'other' } })
    if (count >= 3) return getOtherDeckOverwriteConfirmation(message, member, url, name)

	const filter = m => m.author.id === member.user.id
    message.channel.send(`Hmm... ${name}? I do not recognize that deck. Would you like to save it under the "Other" category?`)
	message.channel.awaitMessages(filter, {
		max: 1,
        time: 10000
    }).then(async function (collected) {
        if (yescom.includes(collected.first().content.toLowerCase())) {
            await Deck.create({
                url,
                type: 'other',
                category: 'other',
                playerId: member.user.id
            })

            return message.channel.send(`Thanks! I saved your ${name} deck to the public database.`)
        } else if (nocom.includes(collected.first().content.toLowerCase())) {
            return message.channel.send(`Not a problem. You can review the available deck categories by using the **!cats** command.`)
        }
    }).catch(err => { 
        console.log(err)    
        return message.channel.send(`Perhaps another time would be better.`)
    })
}


module.exports = {
    checkForNewRatings,
    getDeckType,
    getOtherDeckConfirmation
}
