

const {Builder, By, until} = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
const fs = require('fs')
const { Tournament, Card, Status } = require('../db/index.js')
const { Op } = require('sequelize')

const convertSortedArrayToObject = (arr) => {
    const obj = {}

    arr.forEach(elem => {
        if (!obj[elem]) {
            obj[elem] = 1
        } else {
            obj[elem]++
        }
    })

    return obj
}

//SAVE ALL YDKs
const saveAllYDK = async () => {
    const allDecks = await Tournament.findAll()

    console.log('allDecks.length', allDecks.length)

    for (let i = 0; i < allDecks.length; i++) {
        const member = {
            user: {
                username: allDecks[i].pilot
            }
        }

        const url = allDecks[i].url

        console.log('member.user.username', member.user.username)
        console.log('url', url)

        setTimeout(async function () {
            try {
                await saveYDK(member, url)
            } catch (err) {
                console.log('Fudge. An error:', err)
            }
        }, (( i * 15000 ) + 1000))
    }
}


//SAVE YDK
const saveYDK = async (member, url) => {
    console.log('~~~SAVING YDK~~~')
    const options = new firefox.Options()
    options.addArguments("-headless")
    const username = member.user ? member.user.username : member.username

    console.log('username', username)
    
    const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build()
    console.log('driver is READY')
    
    try {
        console.log(`Loading ${username}'s deck at ${url}...`)
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
	  
        // console.log('deck_arr', deck_arr)

        let cards_arr = []

        deck_arr.forEach(elem => {
            if (elem.charAt(0) !== '#' && elem.charAt(0) !== '!' && elem !== '')
            cards_arr.push(elem)
        })

        // console.log('cards_arr (unsorted)', cards_arr)

        cards_arr.sort()

        // console.log('cards_arr (sorted)', cards_arr)

        const cards_obj = convertSortedArrayToObject(cards_arr)

        // console.log('cards_obj', cards_obj)

        const allGoatCardsFromDB = await Card.findAll({
            where: {
                date: {
                    [Op.lte]: '2005-08-17',
                }
            }
        })

        // const allStatusesFromDB = await Status.findAll()

        let goatCardIds = []
        let illegalCards = []

        allGoatCardsFromDB.forEach(card => {
            let id = card.image.slice(0,-4)
            while (id.length < 8) id = '0' + id
            goatCardIds.push(id)
        })

        const keys = Object.keys(cards_obj)

        for (const key of keys) {
            if (goatCardIds.includes(key)) console.log(`${key} is Goat legal.`) 
            else {
                console.log(`<!> ${key} is NOT Goat legal <!>`)
                let id = key
                while (id.charAt(0) === '0') id = id.slice(1)
                
                const imageFile = `${id}.jpg`
                console.log('imageFile', imageFile)

                const illegalCard = await Card.findOne({
                    where: {
                        image: imageFile
                    }
                })

                console.log('illegalCard.name', illegalCard.name)
                illegalCards.push(illegalCard.name)
            }
        }

		fs.writeFile(`./decks/${username}.ydk`, file, function(err) {
			if(err) {
				return console.log(err)
			}
			console.log(`${username}'s deck was saved!`);
		})

        return illegalCards.sort()
	} catch (err) {
		console.log(err)
	} finally {
		await driver.quit()
	}
}

module.exports = {
    saveAllYDK,
    saveYDK
}