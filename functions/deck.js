

//DECK FUNCTIONS

//MODULE IMPORTS
const axios = require('axios')
const fs = require('fs')
const { Op } = require('sequelize')

//DATABASE IMPORTS
import { Card, Format, Status } from '../../fl/libs/models/src/index.ts'

//FUNCTION IMPORTS
const { convertArrayToObject } = require('./utility.js')

//STATIC IMPORTS
const { 
    accum, airbellum, alius, alo, aggolem, angel, archer, archfiend, arma, artemis, barrel, bazoo, ben_kei, bfadd, bigbang, bigshield, blade, bls,
    boomboxen, brain, bribe, bushi, bwc, caius, canceller, cannon, cardd, cat, celfon, chariot, clown, codarus, coelacanth, coin, collapse, 
    consonance, convulsion, countdown, cstrike, cyjar, dad, dandy, dda, ddwl, debris, decree, desserts, detonation, difu, diva, dmoc, drain, 
    drastic, driver, duplication, economics, ecto, emissary, emmersblade, exodia, faultroll, fert, fire, firedog, fishborg, 
    fortress, freed, fulhelm, fusi, fusiongate, garden, gate, gateway, gbind, gearframe, gearfried, ggadget, gigantes, 
    gkass, gkspear, goblin, gobzomb, gorilla, gotss, gottoms, gozen, granmarg, gravirose, grepher, gspark, horus6, horus8, 
    hugerev, icarus, insect, jdrag, jinzo, kalut, koala, kmdrago, kristya, lacooda, laquari, lastturn, lava, leftarm, leftleg, 
    life, lion, limiter, llab, lonefire, luminous, lv2, mali, manju, manticore, mask, mataza, mazera, meanae, mech, 
    megamorph, meta, mezuki, milus, mimic, miracle, mobius, mof, monk, moray, motr, natures, necrovalley, 
    needle, nightass, oath, panda, pixie, poison, purity, pyrlight, quickdraw, raiza, rat, reasoning, recharge, redmd, 
    rejuv, rekindling, relinq, remoten, reprod, rgadget, rightarm, rightleg, rivalry, rftdd, rml, rota, ryko, salvo, scapegoat, scarabs, sdm, 
    serpent, shallow, silent, sirocco, skull, slump, smackdown, smoke, solemn, solidarity, sorc, soulex, soulrel, 
    spy, ssunited, stein, storm, strike, susa, swap, swapfrog, taiyou, tdrag, tethys, thanksgiving, thestalos, tiger, 
    tomato, tooncannon, toonelf, tradein, treeborn, trio, trunade, tsuk, tuningware, turtle, underdog, valhalla, vayu, vrocket, 
    whirlwind, wicked, wmc, worl, wyvern, xhead, ygadget, zanji, zombyra, zorc
} = require('../static/cards.json')


// GET DECK FORMAT
const getDeckFormat = async (server, message, mcid) => {
    let format = await Format.findOne({ 
        where: { 
            [Op.or]: {
                name: { [Op.iLike]: server.format },
                channel: mcid
            }
        }
    })

    if (format) return format
    const filter = m => m.author.id === message.author.id
    message.channel.send({ content: `What format would you like to check?`})
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 15000
    }).then(async collected => {
        const response = collected.first().content.toLowerCase()
        const format = await Format.findOne({ where: { name: {[Op.iLike]: response } } })
        if (!format) message.channel.send({ content: `Sorry, I do not recognize that format.`})
        return format
    }).catch(err => {
        console.log(err)
        message.channel.send({ content: `Sorry, time's up.`})
        return false
    })
}

// GET ISSUES
const getIssues = async (deckArr, format) => {
    const deck = convertArrayToObject(deckArr)        
    const cardIds = format.name === 'Current' ? [...await Card.findAll({ where: { tcgLegal: true }})].map(c => c.konamiCode) : [...await Card.findAll({ where: { tcgDate: { [Op.lte]: format.date } }})].map(c => c.konamiCode)
    const forbiddenIds = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'forbidden' }, include: Card })].map(s => s.card.konamiCode)
    const limitedIds = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'limited' }, include: Card })].map(s => s.card.konamiCode)
    const semiIds = [...await Status.findAll({ where: { banlist: [format.banlist], restriction: 'semi-limited' }, include: Card })].map(s => s.card.konamiCode)

    const illegalCards = []
    const forbiddenCards = []
    const limitedCards = []
    const semiLimitedCards = []
    const unrecognizedCards = []

    const keys = Object.keys(deck)
    for (let i = 0; i < keys.length; i++) {
        let konamiCode = keys[i]
        while (konamiCode.length < 8) konamiCode = '0' + konamiCode 
        if (konamiCode === '00000000' && format.name === 'Current') continue
        if (!cardIds.includes(konamiCode)) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) {
                illegalCards.push(card.name)
            } else {
                unrecognizedCards.push(konamiCode)
            }
        } else if (forbiddenIds.includes(konamiCode)) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) forbiddenCards.push(card.name)
        } else if (limitedIds.includes(konamiCode) && deck[konamiCode] > 1) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) limitedCards.push(card.name)
        } else if (semiIds.includes(konamiCode) && deck[konamiCode] > 2) {
            const card = await Card.findOne({ where: { konamiCode: konamiCode } })
            if (card) semiLimitedCards.push(card.name)
        }
    }
    
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
}

//SAVE YDK
const saveYDK = async (serverName, player, ydk, subFolder = 'other') => {
    try {
        const folderName = `./decks/${serverName}`
        if (!fs.existsSync(folderName)) fs.mkdirSync(folderName)
        const tag = player.name.replace(/[^\ws]/gi, "_").replace(/ /g,'') + player.discriminator
        fs.writeFile(`./decks/${serverName}/${subFolder}/${tag}.ydk`, ydk, (err) => {
            if (err) {
                console.log(err)
            } else {
                console.log(`${tag}'s deck was saved!`)
            }
        })
        
        return true
    } catch (err) {
        console.log(err)
        return false
    }
}

//CHECK DECK LIST
const checkDeckList = async (member, format) => {  
    const filter = m => m.author.id === member.user.id
    const message = await member.send({ content: `Please provide a duelingbook.com/deck link for the ${format.name} Format ${format.emoji} deck you would like to check.`}).catch((err) => console.log(err))
    if (!message || !message.channel) return {}
    return await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 30000
    }).then(async collected => {
        const response = collected.first().content
        if (response.includes('duelingbook.com/deck?id=')) {		
            const id = response.slice(response.indexOf('?id=') + 4)
            const {data} = await axios.get(`https://www.duelingbook.com/php-scripts/load-deck.php/deck?id=${id}`)
            if (!data) return {}
            const main = data.main.map((e) => e.serial_number)
            const side = data.side.map((e) => e.serial_number)
            const extra = data.extra.map((e) => e.serial_number)
            const deckArr = [...main, ...side, ...extra]
            const issues = await getIssues(deckArr, format)
            return issues
        } else {
            member.send({ content: "Sorry, I only accept duelingbook.com/deck links."}).catch((err) => console.log(err))    
            return false  
        }
    }).catch(err => {
        console.log(err)
        member.send({ content: `Sorry, time's up. Go back to the server and try again.`}).catch((err) => console.log(err))
        return false
    })
}

//GET DECK TYPE
const getDeckType = async (server, player, format, tournamentName = 'other') => {
    const file = `./decks/${server.name}/${tournamentName}/${player.name.replace(/[^\ws]/gi, "_").replace(/ /g,'') + player.discriminator}.ydk`
    const raw = fs.readFileSync(file, 'utf8')
    if (!raw) return
    const main = raw.split('#extra')[0]
    if (!main) return
    const arr = main.split('\n').filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()
    const ydk = convertArrayToObject(arr)

    const deckType = format.toLowerCase() === 'goat' ? (
            (ydk[collapse] >= 2 || ydk[insect] >= 2  || ydk[susa] >= 2 || ydk[toonelf] >= 2 || ydk[mazera] >= 2 || ydk[pixie] >= 2 || ydk[ecto] >= 2 || ydk[silent] >= 2 || ydk[skull] >= 2 || ydk[hugerev] >= 2 || ydk[necrovalley] >= 2 || ydk[smackdown] >= 2 || ydk[pyrlight] >= 2 || ydk[clown] >= 2 || ydk[coin] >= 2) ? 'other' :
            (ydk[cat] >= 2  && (ydk[panda] >= 2 || ydk[milus] >= 2) && !ydk[stein] && (ydk[trunade] >= 2 || ydk[decree] >= 2)) ? 'cat otk' :
            (ydk[cat] >= 2 && ydk[manticore] && ydk[wicked] >= 2) ? 'cat control' :
            (ydk[panda] >= 2 && ydk[trio] >= 2 && !ydk[milus]) ? 'panda burn' :
            (ydk[mataza] >= 2) ? 'mataza aggro' :
            (ydk[ben_kei] >= 2 && (ydk[trunade] >= 2 || ydk[decree] >= 2)) ? 'ben kei otk' :
            (ydk[stein] >= 2 && ydk[gate] >= 2) ? 'stein gate turbo' :
            (ydk[stein] >= 2 && (ydk[megamorph] >= 2 || ydk[natures] >= 2 || ydk[thanksgiving] >= 2) &&!ydk[cat] && (ydk[trunade] >= 2 || ydk[decree] >= 2)) ? 'stein otk' :
            (ydk[cat] >= 2 && ydk[stein] >= 2 && (ydk[trunade] >= 2 || ydk[decree] >= 2)) ? 'cat stein otk' :
            (ydk[cyjar] && ydk[cardd] && ydk[taiyou] >= 2 && ydk[shallow] >= 2 && ydk[reprod] >= 2) ? 'empty jar' :
            (ydk[rml] >= 2 && ydk[oath] >= 2 && ydk[convulsion] >= 2 && ydk[trunade] >= 2) ? 'library ftk' :
            (ydk[exodia] && ydk[leftarm] && ydk[rightarm] && ydk[leftleg] && ydk[rightleg]) ? 'exodia' :
            ((!ydk[meta] || !ydk[scapegoat]) && (ydk[turtle] >= 3 || ydk[life] >= 2 || (ydk[turtle] >= 2 && ydk[life]))) ? 'zombie' :
            (ydk[horus6] && ydk[meta] && ydk[scapegoat]) ? 'horus control' :
            (ydk[horus8] && ydk[horus6] && !ydk[scapegoat]) ? 'horus turbo' :
            (ydk[relinq] >= 2) ? 'relinquished' :
            (ydk[zorc] >= 2) ? 'zorc' :
            (ydk[lastturn] == 2) ? 'last turn' :
            (ydk[countdown] >= 2) ? 'final countdown' :
            (ydk[slump] >= 2) ? 'heavy slump' :
            (ydk[emissary] >= 3 && ydk[meta] >= 2) ? 'emissary control' :
            (ydk[emissary] >= 3 && (!ydk[meta] || ydk[meta] <= 1)) ? 'emissary beatdown' :
            (ydk[needle] >= 2 && (ydk[llab] == 2 || ydk[gbind] == 2 || ydk[worl] >= 2)) ? 'stall deckout' :
            (ydk[meanae] >= 2 && ydk[rota]) ? 'dark scorpion' :
            (ydk[strike] >= 2) ? 'strike ninja' :
            (ydk[dmoc] && ydk[economics] >= 2 && (ydk[driver] || ydk[cannon] || ydk[tooncannon])) ? 'economics ftk' :
            (ydk[fusiongate] >= 2) ? 'fusion gate turbo' :
            (((ydk[reasoning] >= 2 && ydk[gate]) || ((ydk[reasoning] && ydk[gate] >= 2))) && (!ydk[economics] || ydk[economics] <= 1)) ? 'reasoning gate turbo' :
            ((ydk[bazoo] >= 2 || ydk[sorc] >= 2 || ydk[freed] >= 2 || ydk[strike] >= 2 || ydk[purity] >= 2 || ydk[soulrel] >= 2) && ydk[difu] >= 2) ? 'dimension fusion turbo' :
            ((ydk[jinzo] || ydk[mech] >= 2 || ydk[xhead] >= 2) && ydk[limiter] >= 2) ? 'machine' :
            ((ydk[freed] >= 2 || ydk[purity]) && ydk[rftdd] && !ydk[manju]) ? 'light return' :
            ((ydk[freed] >= 2 || ydk[luminous] || ydk[purity] >= 2) && !ydk[manju]) ? 'light beatdown' :    
            (ydk[gearfried] >= 2 && (ydk[smoke] >= 2 || ydk[bwc] >= 2)) ? 'gearfried' :
            (ydk[archfiend] >= 2 && ydk[underdog] >= 2) ? 'vanilla beatdown' :
            ((ydk[zombyra] >= 2 || ydk[gorilla] >= 2 || ydk[goblin] >= 2 || ydk[fusi] >= 2 || ydk[sdm] >= 2 || ydk[archfiend] >= 2) && ydk[drain] >= 2) ? 'drain beatdown' :
            ((ydk[dda] >= 2 || ydk[rat] >= 2) && ydk[gigantes] >= 2 && !ydk[lacooda] && !ydk[scapegoat]) ? 'earth beatdown' :
            ((ydk[llab] == 2 || ydk[gbind] == 2 || ydk[worl] >= 2) && !ydk[lacooda] && !ydk[scarabs] && (ydk[koala] >= 2 || ydk[barrel] >= 2 || ydk[desserts] >= 2 || ydk[wmc] >= 2 || ydk[lava] >= 2 || ydk[fire] >= 2)) ? 'stall burn' :
            (ydk[tsuk] >= 2 && (ydk[lacooda] >= 2 || ydk[mask] >= 2 || ydk[mimic] >= 2) && ydk[solemn] >= 2 && !ydk[soulex] && !ydk[manju]) ? 'flip control' :
            (ydk[drain] >= 2 && !ydk[lacooda] && !ydk[scarabs] && (ydk[barrel] >= 2 || ydk[desserts] >= 2 || ydk[wmc] >= 2 || ydk[lava] >= 2)) ? 'drain burn' :
            (ydk[spy] >= 2 && ydk[necrovalley] >= 2 && (ydk[gkass] || ydk[gkspear])) ? 'gravekeeper' :
            (ydk[lacooda] >= 2 && ydk[scarabs] >= 2 && (ydk[gbind] >= 2 || ydk[llab] >= 2 || ydk[worl] >= 2)) ? 'pacman' :
            (ydk[scapegoat] && ydk[meta] && ydk[soulex] >= 2) ? 'soul control' :
            ((ydk[thestalos] >= 2 || ydk[mobius] >= 2 || ydk[granmarg] >= 2) && (ydk[brain] >= 2 || ydk[soulex] >= 2 || (ydk[brain] && ydk[soulex]))) ? 'monarch' :
            (ydk[sorc] >= 1 && ydk[rftdd] && (!ydk[angel] || !ydk[tomato] || !ydk[swap]) && !ydk[serpent] && (!ydk[nightass] || ydk[nightass] <= 1)) ? 'chaos return' :
            (ydk[bazoo] >= 2 && ydk[rftdd]) ? 'bazoo return' :
            (ydk[canceller] >= 2 && ydk[solemn] >= 2) ? 'canceller stun' :
            (ydk[tiger] >= 2 && ydk[solemn] >= 2) ? 'tiger stun' :
            (ydk[meta] &&  ydk[scapegoat] && (ydk[wmc] >= 2 || ydk[lava] >= 2 || ydk[trio] >= 2)) ? 'goat burn' :
            ((ydk[panda] >= 2 || ydk[mataza] >= 2) && (ydk[koala] >= 2 || ydk[spy] >= 2) && ydk[storm]) ? 'aggro bomb' :
            ((!ydk[llab] || ydk[llab] <= 1) && (!ydk[gbind] || ydk[gbind] <= 1) && (!ydk[worl] || ydk[worl] <= 1) && (ydk[koala] >= 2 || ydk[bigshield] >= 2) && (ydk[barrel] >= 2 || ydk[fire] >= 2 || ydk[poison] >= 2)) ? 'speed burn' :
            (ydk[sorc] >= 1 && ydk[tomato] && ydk[angel] && !ydk[scapegoat] && !ydk[meta]) ? 'chaos recruiter' :
            (ydk[sorc] && ydk[tdrag] >= 3 && ydk[rota] && ydk[solemn] >= 2) ? 'chaos warrior' :
            (ydk[rota] && (ydk[blade] || ydk[ddwl] || ydk[lv2]) && ydk[solemn] >= 2 && !ydk[llab] && !ydk[gbind] && !ydk[worl] && !ydk[freed]) ? 'warrior' :
            (ydk[sorc] >= 1 && ydk[tdrag] >= 3 && ydk[mof] && !ydk[scapegoat]) ? 'chaos turbo' :
            (ydk[sorc] >= 1 && ydk[meta] && ydk[scapegoat]) ? 'chaos control' :
            ((!ydk[sorc] || ydk[sorc] <= 1) && ((ydk[scapegoat] && ydk[meta] >= 2) || (ydk[scapegoat] >= 2 && ydk[meta])) && ydk[bls] && (!ydk[bigbang] || ydk[bigbang] <= 1)) ? 'goat control' :
            'other'
        ) : format.toLowerCase() === 'edison' ? (
            (ydk[kalut] >= 2 && ydk[whirlwind] >= 2 && ydk[icarus] >= 2) ? 'blackwing' :
            (ydk[accum] >= 2 && ydk[cstrike] >= 2 && ydk[detonation] >= 2) ? 'chain burn' :
            (ydk[diva] >= 2 && ydk[mali] >= 2 && ydk[miracle] >= 2) ? 'diva hero' :
            (ydk[alius] >= 2 && ydk[gspark] >= 2) ? 'hero beat' :
            (ydk[redmd] >= 2 && ydk[wyvern] && ydk[kmdrago] && !ydk[consonance] && !ydk[rejuv]) ? 'dragon beatdown' :
            (ydk[redmd] >= 2 && ydk[consonance] >= 2 && ydk[tradein] >= 2 && !ydk[exodia]) ? 'dragon turbo' :
            (ydk[boomboxen] >= 2 && ydk[celfon] >= 2 && ydk[remoten] >= 2) ? 'morphtronic' :
            (ydk[consonance] >= 2 && ydk[rejuv] >= 2 && ydk[exodia]) ? 'exodia ftk' :
            (ydk[artemis] >= 2 && ydk[bribe] >= 2 && ydk[drastic] >= 2) ? 'counter fairy' :
            (ydk[kristya] >= 2 && ydk[ddwl] >= 2 && ydk[ryko] >= 2) ? 'fairy control' :
            (ydk[kristya] >= 2 && ydk[tethys] >= 2 && ydk[valhalla] >= 2) ? 'fairy turbo' :
            (ydk[kristya] >= 3 && !!ydk[tethys] && ydk[rivalry] && ydk[gozen]) ? 'fairy stun' :
            (ydk[coelacanth] >= 2 && ydk[fishborg] >= 2 && ydk[moray] >= 2) ? 'fish otk' :
            (ydk[firedog] >= 2 && ydk[spy] >= 2 && ydk[rekindling] >= 2) ? 'flamvell' :
            (ydk[swapfrog] >= 2 && ydk[caius] >= 2 && (ydk[raiza] || ydk[mobius] || ydk[thestalos]) && !ydk[diva]) ? 'frog monarch' :
            (ydk[swapfrog] >= 2 && ydk[caius] >= 2 && ydk[diva] >= 2 && ydk[archer]) ? 'diva frog' :
            (ydk[ggadget] >= 2 && ydk[rgadget] >= 2 && ydk[ygadget] >= 2 && !ydk[gearframe]) ? 'gadget' :
            (ydk[ggadget] >= 2 && ydk[rgadget] >= 2 && ydk[ygadget] >= 2 && ydk[gearframe] >= 2) ? 'machina gadget' :
            (ydk[gearframe] >= 2 && ydk[fortress] >= 2 && !ydk[ggadget]) ? 'machina' :
            (ydk[laquari] >= 2 && ydk[chariot] >= 2) ? 'gladiator beast' :
            (ydk[jdrag] >= 2 && ydk[recharge] >= 2) ? 'lightsworn' :
            (ydk[lonefire] >= 2 && ydk[dandy] >= 2 && ydk[quickdraw] && ydk[debris] && !ydk[jdrag] && !ydk[gobzomb] && !ydk[rekindling] && !ydk[duplication]) ? 'quickdraw plant' :
            (ydk[vrocket] >= 2 && ydk[dandy] >= 2 && ydk[quickdraw]) ? 'volcanic quickdraw' :
            (ydk[dandy] >= 2  && ydk[quickdraw] && ydk[firedog] >= 2 && ydk[rekindling] >= 2) ? 'flamvell quickdraw' :
            (ydk[quickdraw] >= 2 && ydk[tuningware] >= 2 && ydk[duplication] >= 2) ? 'quickdraw machine' :
            (ydk[quickdraw] >= 2 && ydk[gobzomb] && ydk[mezuki]) ? 'quickdraw zombie' :
            (ydk[gobzomb] >= 2 && ydk[turtle] && ydk[mezuki] && ydk[life] && !ydk[quickdraw]) ? 'zombie' :
            (ydk[gotss] >= 2 && ydk[zanji] >= 2 && ydk[gateway] >= 2 && ydk[ssunited] >= 2) ? 'six samurai' :
            (ydk[cat] && ydk[monk] && ydk[airbellum] >= 2 && ydk[spy] >= 2) ? 'synchro cat' :
            (ydk[sorc] && ydk[dad] && ydk[recharge] >= 2 && !ydk[jdrag]) ? 'chaos lightsworn' :
            (ydk[caius] >= 2 && ydk[treeborn] && ydk[recharge] >= 2 && !ydk[jdrag]) ? 'lightsworn monarch' :
            (ydk[vayu] >= 2 && ydk[sirocco] >= 2 && ydk[arma] && ydk[grepher] && ydk[bfadd]) ? 'vayu turbo' :
            (ydk[vrocket] >= 2 && ydk[garden] >= 2 && !ydk[caius] && !ydk[quickdraw]) ? 'volcanic garden' : 
            (ydk[vrocket] >= 2 && ydk[caius] >= 2 && !ydk[garden] && !ydk[quickdraw]) ? 'volcanic monarch' : 
            (ydk[emmersblade] >= 2 && ydk[faultroll] >= 2 && ydk[fulhelm] >= 2 && ydk[gottoms] >= 2) ? 'x-saber' : 
            (ydk[necrovalley] >= 2 && ydk[spy] >= 2 && ydk[wmc] >= 2) ? 'gravekeeper burn' : 
            (ydk[salvo] >= 2 && ydk[dad]) ? 'salvo dad' : 
            (ydk[lonefire] >= 2 && (ydk[lion] >= 2 || ydk[gravirose] >= 2) && (ydk[fert] >= 2 || ydk[motr] >= 2) && !ydk[quickdraw]) ? 'plant' : 
            (ydk[codarus] >= 2 && ydk[alo] >= 2) ? 'codarus' : 
            (ydk[bushi] >= 2 && ydk[rota] && ydk[solidarity] >= 2) ? 'bushi' : 
            'other' 
        ) : 'other'

    return deckType
}

module.exports = {
    checkDeckList,
    getDeckFormat,
    getDeckType,
    getIssues,
    saveYDK
}