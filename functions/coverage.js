
const axios = require('axios')
const Canvas = require('canvas')
const fs = require('fs')
const { S3 } = require('aws-sdk')
const { Op } = require('sequelize')
const { BlogPost, Card, Deck, DeckType, Event, Format, Player }  = require('../db/index.js')
const { capitalize, dateToVerbose } = require('./utility')
const { getDeckType } = require('./deck')
const { S3Keys } = require('../secrets.json')


// CREATE DECKS
const createDecks = async (message, event, tournament, useTags = true) => {
    let b = 0 
    try {    
        const res = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}.json?api_key=${tournament.server.challongeAPIKey}`)
        if (!res) return
        const size = event.size || res.data.tournament.participants_count
        const startDate = `${res.data.tournament.started_at.slice(0, 10)} ${res.data.tournament.started_at.slice(11, 26)}`
        const endDate = `${res.data.tournament.completed_at.slice(0, 10)} ${res.data.tournament.completed_at.slice(11, 26)}`
        event.size = size
        event.startDate = startDate
        event.endDate = endDate
        await event.save()

        const { data } = await axios.get(`https://api.challonge.com/v1/tournaments/${tournament.id}/participants.json?api_key=${tournament.server.challongeAPIKey}`)
        if (!data) return
        const participants = data.map((d) => d.participant.name)
        const players = await Player.findAll({ where: { discriminator: {[Op.not]: null } }})
        const shortenedTags = useTags ? players.map((p) => p.name.replace(/[^\ws]/gi, '_') + p.discriminator) :
                                        players.map((p) => p.name.replace(/[^\ws]/gi, '_'))

        fs.readdir(`./decks/${tournament.community}/${tournament.name}/`, async (err, files) => {
            if (err) {
                console.log(err)
            } else {
                console.log('files', files)
                files.forEach(async (file, index) => {
                    let query = file.slice(0, -4)
                    const i = shortenedTags.indexOf(query)
                    if (i === -1) {
                        console.log(`no Player found with the Discord tag: ${query}`)
                    } else {
                        const player = players[i]
                        let pname = player.name
                        const j = participants.indexOf(pname)
                        if (j === -1) {
                            console.log(`no Challonge Participant found for the player: ${pname}`)
                        } else {
                            const count = await Deck.count({
                                where: {
                                    builder: player.name,
                                    eventName: event.name,
                                    eventId: event.id
                                }
                            })

                            if (!count) {
                                const path = `./decks/${tournament.community}/${tournament.name}/${file}`
                                const participant = data[j].participant
                                const placement = parseInt(participant.final_rank, 10) || index + 1
                                const raw = fs.readFileSync(path, 'utf8')
                                const dname = await getDeckType({ name: tournament.community }, player, tournament.formatName, tournament.name)
                                const deckType = await DeckType.findOne({ 
                                    where: { 
                                        name: {[Op.iLike]: dname } 
                                    }
                                }) || ({ name: 'other', category: 'other' })

                                const display = (size <= 8 && placement === 1) ||
                                    (size > 8 && size <= 16 && placement <= 2) ||
                                    (size > 16 && size <= 24 && placement <= 3) ||
                                    (size > 24 && size <= 32 && placement <= 4) ||
                                    (size > 32 && size <= 48 && placement <= 6) ||
                                    (size > 48 && size <= 64 && placement <= 8) ||
                                    (size > 64 && size <= 96 && placement <= 12) ||
                                    (size > 96 && size <= 128 && placement <= 16) ||
                                    (size > 128 && size <= 224 && placement <= 24) ||
                                    (size > 224 && placement <= 32) ||
                                    false

                                await Deck.create({
                                    type: deckType.name,
                                    category: deckType.category,
                                    builder: player.name,
                                    formatName: event.formatName,
                                    formatId: event.formatId,
                                    ydk: raw,
                                    placement: placement,
                                    eventName: event.abbreviation || event.name,
                                    display: display,
                                    community: event.community,
                                    playerId: player.id,
                                    eventId: event.id,
                                    deckTypeId: deckType.id,
                                    eventDate: event.startDate
                                })

                                b++
    
                                console.log(`uploaded ${event.abbreviation || event.name} #${placement} ${deckType.name} deck built by ${player.name}`)
                            } else {
                                console.log(`already have ${player.name}'s deck for ${event.name}`)
                            }
                        }
                    }

                    if (index === files.length - 1) return message.channel.send(`Uploaded ${b} out of ${size} decks for ${event.name}.`)
                })
            }
        })
    } catch (err) {
        console.log(err)
        return message.channel.send(`Error uploading decks for ${event.name}.`)
    }
} 

// COMPOSE BLOG POST
const composeBlogPost = async (message, abbreviation) => {
    try {
        const event = await Event.findOne({ 
            where: { 
                abbreviation: {[Op.iLike]: abbreviation}
            },
            order: [["startDate", "ASC"]]
        })

        const format = await Format.findOne({ where: {
            name: {[Op.iLike]: event.formatName }
        }})

        const winner = await Player.findOne({
            where: {
                id: event.playerId
            }
        })

        const deck = await Deck.findOne({
            where: {
                eventName: abbreviation || event.name,
                placement: 1
            }
        })

        const decks = await Deck.findAll({ 
            where: {
                formatName: {[Op.iLike]: event.formatName }
            }
        })
    
        if (!decks.length) return console.log('no decks found')
        
        const freqs = decks.reduce((acc, curr) => (acc[curr.type] ? acc[curr.type]++ : acc[curr.type] = 1, acc), {})
        const popularDecks = Object.entries(freqs).sort((a, b) => b[1] - a[1]).map((e) => e[0]).slice(0, 6)
        const title = `Congrats to ${event.winner} on winning ${event.abbreviation}!`
        const blogTitleDate = dateToVerbose(event.endDate, false, false, true)
        const publishDate = dateToVerbose(event.endDate, true, true, false)
    
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
            const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`) 
            context.drawImage(image, (card_width + 1) * col, row * (card_height + 1), card_width, card_height)
        }
    
        const conclusion = event.series ? `Enter the next <i>${event.name.replace(/[0-9]/g, '').trim()}</i> to see if you can knock out the reigning champ!` :
            event.name.includes('World Championship') ? `And so the ${event.startDate.getFullYear()} ${capitalize(event.formatName, true)} Format season comes to a close. Be sure to enter next year's qualifiers for your chance to compete in the World Championship!` :
            event.name.includes('Last Chance') ? `And so the ${event.startDate.getFullYear()} ${capitalize(event.formatName, true)} Format qualifying season comes to a close. Tune in to find out who wins the World Championship!` :
            event.name.includes('Obelisk') || event.name.includes('Ra') || event.name.includes('Slifer') ? `Join the Goat Format Europe Discord community to compete in the <i>Academy series</i>!` :
            `Join the ${event.community} Discord community to compete in similar events!`
    
        const content = 
            `<div className="blogpost-title-flexbox">` +
                    `<div className="blogpost-title-text">` +
                        `<a href="/events/${event.abbreviation}">` +
                            `<h1 className="blogpost-title">${title}</h1>` +
                        `</a>` +
                        `<p className="blogpost-date">${blogTitleDate}</p>` +
                    `</div>` +
                `<div className="blogpost-title-emojis">` +
                    `<img className="blogpost-format-icon" src="https://cdn.formatlibrary.com/images/emojis/${format.icon}.png"/>` +
                    `<img className="blogpost-event-icon" src="https://cdn.formatlibrary.com/images/emojis/event.png"/>` +
                `</div>` +
            `</div>` +
            `<div className="blogpost-content-flexbox">` +
                `<p className="blogpost-paragraph">` +
                    `${event.winner} won <a className="blogpost-event-link" href="/events/${event.abbreviation}">${event.name}</a> on ${publishDate} with a ${popularDecks.includes(deck.type) ? 'popular' : 'rogue'} deck, ${capitalize(deck.type, true)}!` +
                `</p>` +
                `<div className="blogpost-images-flexbox">` +
                    `<div className="blogpost-pfp-community-flexbox">` +
                        `<img className="blogpost-pfp" src="https://cdn.formatlibrary.com/images/pfps/${winner.discordId || winner.name}.png" />` +
                        `<img className="blogpost-community"  src="https://cdn.formatlibrary.com/images/logos/${event.community}.png" />` +
                    `</div>` +
                    `<div className="blogpost-deck-box">` + 
                        `<a className="blogpost-deck-link" href="/decks/${deck.id}">` +
                            `<img className="blogpost-deck" src="https://cdn.formatlibrary.com/images/decks/previews/${deck.id}.png" />` +
                        `</a>` +
                    `</div>` +
                `</div>` +
                `<p className="blogpost-paragraph">${conclusion}</p>` +
            `</div>`
    
        await BlogPost.create({
            title: title,
            content: content,
            publishDate: publishDate,
            author: 'RetroBot',
            format: event.formatName,
            playerId: deck.playerId,
            eventDate: event.endDate
        })
    
        const buffer = canvas.toBuffer('image/png')
        const s3 = new S3({
            region: S3Keys.region,
            credentials: {
                accessKeyId: S3Keys.credentials.accessKeyId,
                secretAccessKey: S3Keys.credentials.secretAccessKey
            }
        })

        await s3.upload({ Bucket: 'formatlibrary', Key: `images/decks/previews/${deck.id}.png`, Body: buffer, ACL: 'public-read' }).promise()
        return message.channel.send(`Composed blogpost for ${abbreviation}.`)
    } catch (err) {
        console.log(err)
        return message.channel.send(`Error composing blogpost for ${abbreviation}.`)
    }
}


// COMPOSE THUMBNAILS
const composeThumbnails = async (message, event) => {
    try {
        const decks = await Deck.findAll({
            where: {
                eventName: event
            }
        })
    
        if (!decks.length) return console.log('no decks found')
    
        for (let i = 0; i < decks.length; i++) {
            const deck = decks[i]
            console.log(`drawing ${deck.builder}'s deck...`)
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
                const image = await Canvas.loadImage(`https://cdn.formatlibrary.com/images/cards/${card.ypdId}.jpg`) 
                context.drawImage(image, card_width * col, row * card_height, card_width, card_height)
            }
            
            const buffer = canvas.toBuffer('image/png')

            const s3 = new S3({
                region: S3Keys.region,
                credentials: {
                    accessKeyId: S3Keys.credentials.accessKeyId,
                    secretAccessKey: S3Keys.credentials.secretAccessKey
                }
            })

            await s3.upload({ Bucket: 'formatlibrary', Key: `images/decks/thumbnails/${deck.id}.png`, Body: buffer, ACL: 'public-read' }).promise()
        }
    
        return message.channel.send(`Composed deck thumbnails for ${event}.`)
    } catch (err) {
        console.log(err)
        return message.channel.send(`Error composing blogpost for ${event}.`)
    }
}


// SELECT COVERAGE
const selectCoverage = async (message) => {
    const options = [
        '(1) Upload Decks',
        '(2) Compose Deck Thumbnails',
        '(3) Compose BlogPost'
    ]

    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: `What type of coverage would you like to generate?\n${options.join('\n').toString()}`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000
    }).then(collected => {
        const num = parseInt(collected.first().content.match(/\d+/))
        if (!num || !options[num - 1]) {
            message.channel.send({ content: `Sorry, ${collected.first().content} is not a valid option.`})
            return null
        }
        else return options[num - 1]
    }).catch(err => {
        console.log(err)
        return null
    })
}

module.exports = {
    composeBlogPost,
    composeThumbnails,
    createDecks,
    selectCoverage
}