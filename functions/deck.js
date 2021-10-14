

//DECK FUNCTIONS

//MODULE IMPORTS
const fs = require('fs')
const { Builder, By, until } = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
const { Op } = require('sequelize')

//DATABASE IMPORTS
const { Card, Status } = require('../db')

//FUNCTION IMPORTS
const { convertArrayToObject } = require('./utility.js')

//STATIC IMPORTS
const { legend } = require('../static/emojis.json')

//SAVE YDK
const saveYDK = async (player, url, formatDate, formatList) => {
    const options = new firefox.Options()
    options.addArguments("-headless")
    const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build()
    
    try {
        console.log(`Loading ${player.tag}'s deck at ${url}...`)
        const get_deck = `
            deck_arr = ["#created by ...", "#main"]

            for (let i = 0; i < deck_filled_arr.length; i++) {
                if (~~deck_filled_arr[i].data("serial_number") > 0) {
                    deck_arr.push(deck_filled_arr[i].data("serial_number"))
                }
            }

            deck_arr.push("#extra")
            for (i = 0; i < extra_filled_arr.length; i++) {
                if (~~extra_filled_arr[i].data("serial_number") > 0) {
                    deck_arr.push(extra_filled_arr[i].data("serial_number"))   
                }
            }

            deck_arr.push("!side")
            for (i = 0; i < side_filled_arr.length; i++) {
                if (~~side_filled_arr[i].data("serial_number") > 0) {
                    deck_arr.push(side_filled_arr[i].data("serial_number"))
                }
            }

            deck_arr.push("")
            return deck_arr
        `

		await driver.get(url)
		await driver.wait(until.elementLocated(By.id('deck_card1')))
		const deck_arr = await driver.executeScript(get_deck)
        const file = deck_arr.join('\n')
        const cards_arr = deck_arr.filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()
        const cards_obj = convertArrayToObject(cards_arr)        
        const card_ids = await Card.findAll({ where: { tcg_date: { [Op.lte]: formatDate } }}).map(c => c.konami_code)
        const forbidden_card_ids = await Status.findAll({ where: { [formatList]: 'forbidden' }, include: Card }).map(s => s.card.konami_code)
        const limited_card_ids = await Status.findAll({ where: { [formatList]: 'limited' }, include: Card }).map(s => s.card.konami_code)
        const semi_limited_card_ids = await Status.findAll({ where: { [formatList]: 'semi-limited' }, include: Card }).map(s => s.card.konami_code)

        const illegalCards = []
        const forbiddenCards = []
        const limitedCards = []
        const semiLimitedCards = []
        const unrecognizedCards = []

        const keys = Object.keys(cards_obj)
        for (let i = 0; i < keys.length; i++) {
            let konami_code = keys[i]
            while (konami_code.length < 8) konami_code = '0' + konami_code 
            if (!card_ids.includes(konami_code)) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) {
                    illegalCards.push(card.name)
                } else {
                    unrecognizedCards.push(konami_code)
                }
            } else if (forbidden_card_ids.includes(konami_code)) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) forbiddenCards.push(card.name)
            } else if (limited_card_ids.includes(konami_code) && cards_obj[konami_code] > 1) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) limitedCards.push(card.name)
            } else if (semi_limited_card_ids.includes(konami_code) && cards_obj[konami_code] > 2) {
                const card = await Card.findOne({ where: { konami_code: konami_code } })
                if (card) semiLimitedCards.push(card.name)
            }
        }

        const tag = player.tag.replace(/[^\w\s]/gi, "_").replace(/ /g,'')

		fs.writeFile(`./decks/${tag}.ydk`, file, (err) => {
			if(err) {
				return console.log(err)
			} else {
                console.log(`${player.tag}'s deck was saved!`)
            }
		})
        
        illegalCards.sort()
        forbiddenCards.sort()
        limitedCards.sort()
        semiLimitedCards.sort()
        unrecognizedCards.sort()

        const issues = {
            illegalCards,
            forbiddenCards,
            limitedCards,
            semiLimitedCards,
            unrecognizedCards
        }

        return issues
	} catch (err) {
		console.log(err)
	} finally {
		await driver.quit()
	}
}

//CHECK DECK LIST
const checkDeckList = async (member, player, formatDate, formatEmoji, formatList, formatName) => {  
    const filter = m => m.author.id === member.user.id
    const msg = await member.user.send(`Please provide a duelingbook.com/deck link for the ${formatName} Format ${formatEmoji} deck you would like to check.`);
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 180000
    }).then(async collected => {
        const url = collected.first().content
        if (url.includes("www.duelingbook.com/deck")) {		
            member.send('Thanks. Please wait while I download the .YDK file. This can take up to 30 seconds.')
            const issues = await saveYDK(player, url, formatDate, formatList)
            return issues
        } else {
            message.author.send("Sorry, I only accept duelingbook.com/deck links.")    
            return false  
        }
    }).catch(err => {
        console.log(err)
        member.send(`Sorry, time's up. Go back to the server and try again.`)
        return false
    })

    return collected
}

module.exports = {
    checkDeckList,
    saveYDK
}