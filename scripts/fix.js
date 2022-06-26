

const { Op } = require('sequelize')
const { BlogPost, Deck, DeckType, Match, Matchup, Stats, Status, Format, Player, Membership } = require('../db')
const statuses = require('../static/statuses.json')
const { capitalize } = require('../functions/utility')
const axios = require('axios')
const Canvas = require('canvas')
const fs = require('fs')
const { Op } = require('sequelize')

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
            const deckType = capitalize(d.type, true)
            const deckCategory = capitalize(d.category, true)
            const format = capitalize(d.format, true)
            d.format = format
            d.name = name
            d.category = deckCategory
            d.type = deckType
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
        const games = s.wins + s.losses
        s.games = games
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

const fixStatuses = async () => {
    let b = 0
    const statuses = await Status.findAll({ where: { restriction: 'unlimited' }})
    for (let i = 0; i < statuses.length; i++) {
        const s = statuses[i]
        await s.destroy()
        b++
    }

    return console.log(`destroyed ${b} statuses`)
}

const deleteMemberships = async () => {
    let b = 0
    const memberships = await Membership.findAll({
        where: {
            guildName: 'Discord Bots'
        }
    })

    for (let i = 0; i < memberships.length; i++) {
        const m = memberships[i]
        await m.destroy()
        b++
    }

    return console.log(`destroyed ${b} memberships`)
}

const fixMemberships = async () => {
    let b = 0
    let e = 0
    const memberships = await Membership.findAll({ where: { serverId: null }})

    for (let i = 0; i < memberships.length; i++) {
        const m = memberships[i]
        try {
            const id = m.guildId
            console.log('id', id)
            m.serverId = id
            await m.save()
            console.log('m.serverId', m.serverId)
            b++
        } catch (err) {
            console.log(err)
            await m.destroy()
            e++
        }
    }

    return console.log(`fixed ${b} memberships, encountered ${e} errors and destroyed ${e} memberships`)
}

const fixInternal = async () => {
    const matches = await Match.findAll({
        where: {
            serverId: '961281521719836693'
        }
    })

    for (let i = 0; i < matches.length; i++) {
        const m = matches[i]
        m.internal = true
        await m.save()
    }

    return
}

const findMissingBlogPostPFPs = async () => {
    const blogposts = await BlogPost.findAll({ include: Player })
    for (let i = 0; i < blogposts.length; i++) {
        const bp = blogposts[i]
        const exists = fs.existsSync(`../formatlibrary/public/images/pfps/${bp.playerId}.png`)
        if (!exists) console.log(`missing PFP for ${bp.player.name}`)
    }
}

const downloadPfps = async (playerId, cardId) => {
    const {data} = await axios.get(
        `https://images.duelingbook.com/low-res/${cardId}.jpg`, {
            responseType: 'arraybuffer',
        }
    )

    const png = await sharp(data).toFormat('png').toBuffer()
    const canvas = Canvas.createCanvas(128, 128)
    const context = canvas.getContext('2d')
    const image = await Canvas.loadImage(png)
    context.drawImage(image, 0, 0, 128, 128)
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(`../formatlibrary/public/images/pfps/${playerId}.png`, buffer)
    console.log(`saved new pfp for ${playerId}`)
    count++
}

findMissingBlogPostPFPs()
downloadPfps('224356605846618112', '3560')
// fixInternal()
// fixFormats()
// erasePasswords()
// createNewStatues()
// fixStats()
// fixMatches()
// fixDecks()
// fixDeckTypes()
// fixMatchups()
// fixStatuses()
// deleteMemberships()
// fixMemberships()