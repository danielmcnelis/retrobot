
//FUNCTIONS FOR GOATBOT

const { adminRole, modRole } = require('../static/roles.json')
const { Match, Matchup, Player, Tournament, YugiKaiba, Critter, Android, Yata, Vampire, TradChaos, ChaosWarrior, Goat, CRVGoat, Reaper, ChaosReturn, Stein, TroopDup, PerfectCircle, DADReturn, GladBeast, TeleDAD, DarkStrike, Lightsworn, Edison, Frog, SixSamurai, Providence, TenguPlant, LongBeach, DinoRabbit, WindUp, Meadowlands, BabyRuler, RavineRuler, FireWater, HAT, Shaddoll, London, BurningAbyss, Charleston, Nekroz, Clown, PePe, DracoPal, Monarch, ABC, GrassZoo, DracoZoo, LinkZoo, QuickFix, Tough, Magician, Gouki, Danger, PrankKids, SkyStriker, ThunderDragon, LunalightOrcust, StrikerOrcust, Current, Traditional, Rush, Nova, Rebirth  } = require('../db/index.js')
const categories = require('../static/categories.json')

//CREATE PLAYER
const createPlayer = async (id, username = null, tag = null) => {
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
        await Rebirth
    } catch (err) {
        console.log(err)
    }
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
    getCat
}
