
//FUNCTIONS FOR GOATBOT

const { adminRole, modRole } = require('../static/roles.json')
const { sad, rock, bron, silv, gold, plat, dia, mast, lgnd } = require('../static/emojis.json')
const Names = require('../static/names.json')
const { Match, Matchup, Player, Tournament, YugiKaiba, Critter, Android, Yata, Vampire, TradChaos, ChaosWarrior, Goat, CRVGoat, Reaper, ChaosReturn, Stein, TroopDup, PerfectCircle, DADReturn, GladBeast, TeleDAD, DarkStrike, Lightsworn, Edison, Frog, SixSamurai, Providence, TenguPlant, LongBeach, DinoRabbit, WindUp, Meadowlands, BabyRuler, RavineRuler, FireWater, HAT, Shaddoll, London, BurningAbyss, Charleston, Nekroz, Clown, PePe, DracoPal, Monarch, ABC, GrassZoo, DracoZoo, LinkZoo, QuickFix, Tough, Magician, Gouki, Danger, PrankKids, SkyStriker, ThunderDragon, LunalightOrcust, StrikerOrcust, Current, Traditional, Rush, Nova, Rebirth  } = require('../db/index.js')
const categories = require('../static/categories.json')

//CREATE PLAYER
const createPlayer = async (id, username = null, tag = null, z = 0) => {
    setTimeout(async function() {
        try {
            await Player.create({
                id: `${id}`,
                name: `${username}`,
                tag: `${tag}`
            })
            await YugiKaiba.create({ playerId: id })
            await Critter.create({ playerId: id })
            await Android.create({ playerId: id })
            await Yata.create({ playerId: id })
            await Vampire.create({ playerId: id })
            await TradChaos.create({ playerId: id })
            await ChaosWarrior.create({ playerId: id })
            await Goat.create({ playerId: id })
            await CRVGoat.create({ playerId: id })
            await Reaper.create({ playerId: id })
            await ChaosReturn.create({ playerId: id })
            await Stein.create({ playerId: id })
            await TroopDup.create({ playerId: id })
            await PerfectCircle.create({ playerId: id })
            await DADReturn.create({ playerId: id })
            await GladBeast.create({ playerId: id })
            await TeleDAD.create({ playerId: id })
            await DarkStrike.create({ playerId: id })
            await Lightsworn.create({ playerId: id })
            await Edison.create({ playerId: id })
            await Frog.create({ playerId: id })
            await SixSamurai.create({ playerId: id })
            await Providence.create({ playerId: id })
            await TenguPlant.create({ playerId: id })
            await LongBeach.create({ playerId: id })
            await DinoRabbit.create({ playerId: id })
            await WindUp.create({ playerId: id })
            await Meadowlands.create({ playerId: id })
            await BabyRuler.create({ playerId: id })
            await RavineRuler.create({ playerId: id })
            await FireWater.create({ playerId: id })
            await HAT.create({ playerId: id })
            await Shaddoll.create({ playerId: id })
            await London.create({ playerId: id })
            await BurningAbyss.create({ playerId: id })
            await Charleston.create({ playerId: id })
            await Nekroz.create({ playerId: id })
            await Clown.create({ playerId: id })
            await PePe.create({ playerId: id })
            await DracoPal.create({ playerId: id })
            await Monarch.create({ playerId: id })
            await ABC.create({ playerId: id })
            await GrassZoo.create({ playerId: id })
            await DracoZoo.create({ playerId: id })
            await LinkZoo.create({ playerId: id })
            await QuickFix.create({ playerId: id })
            await Tough.create({ playerId: id })
            await Magician.create({ playerId: id })
            await Gouki.create({ playerId: id })
            await Danger.create({ playerId: id })
            await PrankKids.create({ playerId: id })
            await SkyStriker.create({ playerId: id })
            await ThunderDragon.create({ playerId: id })
            await LunalightOrcust.create({ playerId: id })
            await StrikerOrcust.create({ playerId: id })
            await Current.create({ playerId: id })
            await Traditional.create({ playerId: id })
            await Rush.create({ playerId: id })
            await Nova.create({ playerId: id })
            await Rebirth.create({ playerId: id })
        } catch (err) {
            console.log(err)
        }

        console.log(`added ${username} to the database`)
    }, z*100)
}


//REVIVE
const revive = async (playerId, z) => {
	return setTimeout(async function() {
        const player = await Player.findOne({ where: { id: playerId }})

        if (!player) {
            console.log(`adding ${playerId} to the database`)
            const username = Names[playerId] ? Names[playerId] : null
            await createPlayer(playerId, username)
        } else {
            console.log(`${player.name} AKA player ${z} already exists`)
        }
    }, z*100)
}


//RESTORE
const restore = async (winner, loser, format, z) => {
    return setTimeout(async function() {
        const winnersRow = await eval(format).findOne({ where: { playerId: winner }})
        const losersRow = await eval(format).findOne({ where: { playerId: loser }})

        const statsLoser = losersRow.stats
        const statsWinner = winnersRow.stats
        winnersRow.backup = statsWinner
        losersRow.backup = statsLoser
        const delta = 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
        winnersRow.stats += delta
        losersRow.stats -= delta
        winnersRow.wins++
        losersRow.losses++

        await winnersRow.save()
        await losersRow.save()
        await Match.create({ format: format, winner: winner, loser: loser, delta })
        console.log(`Match ${z}: a ${format} format loss by ${loser} to ${winner} has been added to the database.`)
    }, z*100)
}


//IS NEW USER?
const isNewUser = async (playerId) => {
    const count = await Player.count({ where: { id: playerId } })
    return !count
}


//IS ADMIN?
const isAdmin = (member) => {
    return member.roles.cache.some(role => role.id === adminRole)
}


//IS MOD?
const isMod = (member) => {
    return member.roles.cache.some(role => role.id === modRole)
}


//GET CAT
const getCat = (type) => {
    let category
    const keys = Object.keys(categories)
    keys.forEach(function (cat) {
        if (categories[cat].includes(type)) {
            category = cat
        }
    })

    return category
}

//GET MEDAL
const getMedal = (stats) => {
    return stats <= 290 ? sad
    : (stats > 290 && stats <= 350) ? rock
    : (stats > 350 && stats <= 410) ? bron
    : (stats > 410 && stats <= 470) ? silv
    : (stats > 470 && stats <= 530) ? gold
    : (stats > 530 && stats <= 590) ? plat
    : (stats > 590 && stats <= 650) ? dia
    : (stats > 650 && stats <= 710) ? mast
    : lgnd
}

//CAPITALIZE
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

module.exports = {
    capitalize,
    createPlayer,
    isNewUser,
    isAdmin,
    isMod,
    getCat,
    getMedal,
    restore,
    revive
}
