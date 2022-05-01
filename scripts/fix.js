

const { Op } = require('sequelize')
const { Match, Stats, Format, Player } = require('../db')

const fixFormats = async () => {
    let b = 0
    let c = 0
    const formats = await Format.findAll()
    console.log(`formats.length`, formats.length)
    for (let i = 0; i < formats.length; i++) {
        const f = formats[i]
        const name = f.name.replace(' ', '_').replace('-', '_')
        console.log(`name`, name)
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

fixFormats()
// erasePasswords()