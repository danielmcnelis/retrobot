
//REPLAY FUNCTIONS

//MODULE IMPORTS
// const { Builder, By, until } = require('selenium-webdriver')
// const firefox = require('selenium-webdriver/firefox')
const axios = require('axios')

//FIND USERS
const findUsers = async (target) => {
    // const options = new firefox.Options()
    // options.addArguments("-headless")
    const max = 35332339
    const hits = []
    const getUsers = `
        const names = []
        const collection = document.getElementsByClassName('username_txt selectable')
        for (let i = 0; i < collection.length; i++) {
            names.push(collection.item(i).innerHTML)
        }
        return names
    `

    for (let id = 35254226; id < max; id++) {
        //const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build()
        try {
            // const url = `https://www.duelingbook.com/replay?id=${id}`
            // console.log(`Checking ${url}...`)
            // await driver.get(url)
            // await driver.sleep(1000)
            // const names = await driver.executeScript(getUsers)
            const res = await axios.get(`https://www.duelingbook.com/replay?id=${id}`) 
            //console.log('names', names)
            console.log('res', res)
            return
            if (names.includes(target)) hits.push(url)
        } catch (err) {
            console.log(err)
        } finally {
            //await driver.quit()
        }
    }

    console.log('HITS:', hits)
}

findUsers('giya76')