

const { Op } = require('sequelize')
const { Deck, DeckType, Match, Matchup, Stats, Status, Format, Player } = require('../db')
const statuses = require('../static/statuses.json')
const { capitalize } = require('../functions/utility')

const fixFormats = async () => {
    let b = 0
    let c = 0
    const formats = await Format.findAll()

    for (let i = 0; i < formats.length; i++) {
        const f = formats[i]
        const name = f.name.replace(' ', '_').replace('-', '_')

        try {
            const stats = await Stats.findAll({
                where: {
                    format: {[Op.iLike]: name }
                }
            }) || []
    
            for (let j = 0; j < stats.length; j++) {
                const s = stats[j]
                s.format = f.name
                await s.save()
                b++
            }
    
            const matches = await Match.findAll({
                where: {
                    format: {[Op.iLike]: name }
                }
            }) || []
    
            for (let j = 0; j < matches.length; j++) {
                const m = matches[j]
                m.format = f.name
                await m.save()
                c++
            }
        } catch (err) {
            console.log(err)
        }
    }

    return console.log(`fixed ${b} stats, ${c} matches`)
}

const fixDecks = async () => {
    let b = 0
    let e = 0
    const decks = await Deck.findAll()

    for (let i = 0; i < decks.length; i++) {
        try {
            const d = decks[i]
            const name = capitalize(d.name, true)
            const deckType = capitalize(d.deckType, true)
            const deckCategory = capitalize(d.deckCategory, true)
            const format = capitalize(d.format, true)
            d.format = format
            d.name = name
            d.deckCategory = deckCategory
            d.deckType = deckType
            await d.save()
            b++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    return console.log(`fixed ${b} decks, encountered ${e} errors`)
}

const fixDeckTypes = async () => {
    let b = 0
    let e = 0
    const decksTypes = await DeckType.findAll()

    for (let i = 0; i < decksTypes.length; i++) {
        try {
            const d = decksTypes[i]
            const name = capitalize(d.name, true)
            const category = capitalize(d.category, true)
            const format = capitalize(d.format, true)
            d.format = format
            d.name = name
            d.category = category
            await d.save()
            b++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    return console.log(`fixed ${b} deckTypes, encountered ${e} errors`)
}

const fixMatchups = async () => {
    let b = 0
    let e = 0
    const matchups = await Matchup.findAll()

    for (let i = 0; i < matchups.length; i++) {
        try {
            const m = matchups[i]
            const format = capitalize(m.format, true).replace('_', '-')
            m.format = format
            await m.save()
            b++
        } catch (err) {
            e++
            console.log(err)
        }
    }

    return console.log(`fixed ${b} matchups, encountered ${e} errors`)
}

const erasePasswords = async () => {
    let b = 0
    const players = await Player.findAll({
        where: {
            password: {[Op.not]: null }
        }
    })

    for (let i = 0; i < players.length; i++) {
        const p = players[i]
        p.password = null
        await p.save()
        b++
    }

    return console.log(`erased the passwords for ${b} players`)
}

const createNewStatues = async () => {
    let b = 0
    let e = 0
    for (let i = 0; i < statuses.length; i++) {
        const s = statuses[i]
        const name = s.name
        const cardId = s.cardId
        console.log('name, cardId', name, cardId)
        const keys = Object.keys(s)
        console.log('keys.length', keys.length)
        for (let j = 0; j < keys.length; j++) {
            const key = keys[j]
            if (s[key] && key !== 'id' && key !== 'name' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'cardId') {
                console.log('name, key, s.key, cardId', name, key, s.key, cardId)
                try {
                    await Status.create({
                        name: name,
                        banlist: key,
                        restriction: s[key],
                        cardId: cardId
                    })
                    b++
                } catch (err) {
                    e++
                    console.log(err)
                }
            }
        }
    }

    return console.log(`created ${b} new statuses for ${statuses.length} cards, encountered ${e} errors`)
}

const fixStats = async () => {
    const stats = await Stats.findAll()
    for (let i = 0; i < stats.length; i++) {
        const s = stats[i]
        s.serverId = '414551319031054346'
        s.internal = false
        await s.save()
    }
}

const fixMatches = async () => {
    const matches = await Match.findAll()
    for (let i = 0; i < matches.length; i++) {
        const m = matches[i]
        m.serverId = '414551319031054346'
        m.internal = false
        await m.save()
    }
}

// fixFormats()
// erasePasswords()
// createNewStatues()
fixStats()
fixMatches()
fixDecks()
fixDeckTypes()
fixMatchups()