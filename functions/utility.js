
//FUNCTIONS FOR GOATBOT

const { adminRole, modRole } = require('../static/roles.json')
const { Match, Matchup, Player, Tournament, YugiKaiba, Critter, Android, Yata, Vampire, TradChaos, ChaosWarrior, Goat, CRVGoat, Reaper, ChaosReturn, Stein, TroopDup, PerfectCircle, DADReturn, GladBeast, TeleDAD, DarkStrike, Lightsworn, Edison, Frog, SixSamurai, Providence, TenguPlant, LongBeach, DinoRabbit, WindUp, Meadowlands, BabyRuler, RavineRuler, FireWater, HAT, Shaddoll, London, BurningAbyss, Charleston, Nekroz, Clown, PePe, DracoPal, Monarch, ABC, GrassZoo, DracoZoo, LinkZoo, QuickFix, Tough, Magician, Gouki, Danger, PrankKids, SkyStriker, ThunderDragon, LunalightOrcust, StrikerOrcust, Current, Traditional, Rush, Nova, Rebirth  } = require('../db/index.js')
const categories = require('../static/categories.json')

//CREATE PLAYER
const createPlayer = async (member) => {
    try {
        await Player.create({
            id: `${member.user.id}`,
            name: `${member.user.username}`,
            tag: `${member.user.tag}`
        })
        await YugiKaiba.create({ playerId: member.user.id })
        await Critter.create({ playerId: member.user.id })
        await Android.create({ playerId: member.user.id })
        await Yata.create({ playerId: member.user.id })
        await Vampire.create({ playerId: member.user.id })
        await TradChaos.create({ playerId: member.user.id })
        await ChaosWarrior.create({ playerId: member.user.id })
        await Goat.create({ playerId: member.user.id })
        await CRVGoat.create({ playerId: member.user.id })
        await Reaper.create({ playerId: member.user.id })
        await ChaosReturn.create({ playerId: member.user.id })
        await Stein.create({ playerId: member.user.id })
        await TroopDup.create({ playerId: member.user.id })
        await PerfectCircle.create({ playerId: member.user.id })
        await DADReturn.create({ playerId: member.user.id })
        await GladBeast.create({ playerId: member.user.id })
        await TeleDAD.create({ playerId: member.user.id })
        await DarkStrike.create({ playerId: member.user.id })
        await Lightsworn.create({ playerId: member.user.id })
        await Edison.create({ playerId: member.user.id })
        await Frog.create({ playerId: member.user.id })
        await SixSamurai.create({ playerId: member.user.id })
        await Providence.create({ playerId: member.user.id })
        await TenguPlant.create({ playerId: member.user.id })
        await LongBeach.create({ playerId: member.user.id })
        await DinoRabbit.create({ playerId: member.user.id })
        await WindUp.create({ playerId: member.user.id })
        await Meadowlands.create({ playerId: member.user.id })
        await BabyRuler.create({ playerId: member.user.id })
        await RavineRuler.create({ playerId: member.user.id })
        await FireWater.create({ playerId: member.user.id })
        await HAT.create({ playerId: member.user.id })
        await Shaddoll.create({ playerId: member.user.id })
        await London.create({ playerId: member.user.id })
        await BurningAbyss.create({ playerId: member.user.id })
        await Charleston.create({ playerId: member.user.id })
        await Nekroz.create({ playerId: member.user.id })
        await Clown.create({ playerId: member.user.id })
        await PePe.create({ playerId: member.user.id })
        await DracoPal.create({ playerId: member.user.id })
        await Monarch.create({ playerId: member.user.id })
        await ABC.create({ playerId: member.user.id })
        await GrassZoo.create({ playerId: member.user.id })
        await DracoZoo.create({ playerId: member.user.id })
        await LinkZoo.create({ playerId: member.user.id })
        await QuickFix.create({ playerId: member.user.id })
        await Tough.create({ playerId: member.user.id })
        await Magician.create({ playerId: member.user.id })
        await Gouki.create({ playerId: member.user.id })
        await Danger.create({ playerId: member.user.id })
        await PrankKids.create({ playerId: member.user.id })
        await SkyStriker.create({ playerId: member.user.id })
        await ThunderDragon.create({ playerId: member.user.id })
        await LunalightOrcust.create({ playerId: member.user.id })
        await StrikerOrcust.create({ playerId: member.user.id })
        await Current.create({ playerId: member.user.id })
        await Traditional.create({ playerId: member.user.id })
        await Rush.create({ playerId: member.user.id })
        await Nova.create({ playerId: member.user.id })
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
