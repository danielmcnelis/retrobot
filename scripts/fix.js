

const { Op } = require('sequelize')
const { BlogPost, Card, Deck, DeckType, DeckThumb, Entry, Event, Format, Info, Iron, Match, Matchup, Membership, Player, RatedDeck, RatedPool, Role, Server, Stats, Status, Tournament } = require('../db')
const { capitalize } = require('../functions/utility')
const axios = require('axios')
const Canvas = require('canvas')
const fs = require('fs')
const sharp = require('sharp')

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
        if (!bp.player) continue
        const exists = fs.existsSync(`../formatlibrary/public/images/pfps/${bp.playerId}.png`)
        if (!exists) console.log(`missing PFP for ${bp.player.name}: ${bp.player.id}.png`)
    }
}

const downloadDuelingBookAvatar = async (playerId, cardId) => {
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
}



// COMPOSE THUMBNAILS
const composeThumbnails = async () => {
    let b = 0
    const decks = await Deck.findAll()
    if (!decks.length) return console.log('no decks found')
    for (let i = 0; i < decks.length; i++) {
        try {    
            const deck = decks[i]
            const main = []
            const mainKonamiCodes = deck.ydk.split('#main')[1].split('#extra')[0].split('\n').filter((e) => e.length)
    
            for (let i = 0; i < mainKonamiCodes.length; i++) {
                let konamiCode = mainKonamiCodes[i]
                while (konamiCode.length < 8) konamiCode = '0' + konamiCode
                const card = await Card.findOne({ where: { konamiCode }})
                if (!card) continue
                main.push(card)
            }
    
            main.sort((a, b) => {
                if (a.sortPriority > b.sortPriority) {
                    return 1
                } else if (b.sortPriority > a.sortPriority) {
                    return -1
                } else if (a.name > b.name) {
                    return 1
                } else if (b.name > a.name) {
                    return -1
                } else {
                    return false
                }
            })
            
            const rows = Math.ceil(main.length / 10)
            const card_width = 36
            const card_height = 52.5
            const canvas = Canvas.createCanvas(card_width * 10, card_height * rows)
            const context = canvas.getContext('2d')
    
            for (let i = 0; i < main.length; i++) {
                const card = main[i]
                const row = Math.floor(i / 10)
                const col = i % 10
                const image = await Canvas.loadImage(`../../formatlibrary/public/images/cards/${card.ypdId}.jpg`) 
                context.drawImage(image, card_width * col, row * card_height, card_width, card_height)
            }
            
            const buffer = canvas.toBuffer('image/png')
            fs.writeFileSync(`../../formatlibrary/public/images/decks/thumbnails/${deck.id}.png`, buffer)
            console.log('saved deck thumbnail')
            b++
        } catch (err) {
            console.log(err)
        }
    }

    return console.log(`composed ${b} deck thumbnails.`)
}


// COMPOSE PREVIEWS
const composePreviews = async () => {
    let b = 0
    const decks = await Deck.findAll({
        where: {
            placement: 1
        }
    })

    for (let z = 0; z < decks.length; z++) {
        try {
            const deck = decks[z]
            const main = []
            const mainKonamiCodes = deck.ydk.split('#main')[1].split('#extra')[0].split('\n').filter((e) => e.length)
    
            for (let i = 0; i < mainKonamiCodes.length; i++) {
                let konamiCode = mainKonamiCodes[i]
                while (konamiCode.length < 8) konamiCode = '0' + konamiCode
                const card = await Card.findOne({ where: { konamiCode }})
                if (!card) continue
                main.push(card)
            }
    
            main.sort((a, b) => {
                if (a.sortPriority > b.sortPriority) {
                    return 1
                } else if (b.sortPriority > a.sortPriority) {
                    return -1
                } else if (a.name > b.name) {
                    return 1
                } else if (b.name > a.name) {
                    return -1
                } else {
                    return false
                }
            })
    
            const rows = Math.ceil(main.length / 10)
            const card_width = 72
            const card_height = 105
            const canvas = Canvas.createCanvas((card_width * 10) + 9, (card_height * rows) + rows - 1)
            const context = canvas.getContext('2d')
        
            for (let i = 0; i < main.length; i++) {
                const card = main[i]
                const row = Math.floor(i / 10)
                const col = i % 10
                const image = await Canvas.loadImage(`../../formatlibrary/public/images/cards/${card.ypdId}.jpg`) 
                context.drawImage(image, (card_width + 1) * col, row * (card_height + 1), card_width, card_height)
            }
        
            const buffer = canvas.toBuffer('image/png')
            fs.writeFileSync(`../../formatlibrary/public/images/decks/previews/${deck.id}.png`, buffer)
            console.log(`composed preview`)
            b++
        } catch (err) {
            console.log(err)
        }
    }

    return console.log(`composed ${b} previews`)
}

const fixBlogposts = async () => {
    let a = 0
    const blogposts = await BlogPost.findAll()
    for (let i = 0; i < blogposts.length; i++) {
        const b = blogposts[i]
        const player = await Player.findOne({ where: { discordId: b.playerId }})
        b.playerId = player.id
        await b.save()
        a++
    }

    return console.log(`updated ${a} blog posts`)
}

fixBlogposts()
// composeThumbnails()
// composePreviews()
// downloadDuelingBookAvatar('692063231988072479', '3904')
// findMissingBlogPostPFPs()
// fixInternal()
// fixFormats()
// erasePasswords()
// createNewStatues()
// fixStats()
// fixMatches()
// fixDecks()
// fixDeckTypes()
// fixMatchups()
// deleteMemberships()
// fixMemberships()