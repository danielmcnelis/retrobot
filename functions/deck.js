

//DECK FUNCTIONS

//MODULE IMPORTS
const axios = require('axios')
const fs = require('fs')
const { Op } = require('sequelize')

//DATABASE IMPORTS
const { Card, Format, Status, Deck } = require('../../formatlibrary/libs/models/src/lib/index.js')

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
const getDeckFormat = async (server, message, interaction) => {
    let format = await Format.findOne({ 
        where: { 
            [Op.or]: {
                name: { [Op.iLike]: server.format },
                channel: interaction.channelId
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
    const cardIds = !format.date ? [...await Card.findAll({ where: { tcgLegal: true }})].map(c => c.konamiCode) : [...await Card.findAll({ where: { tcgDate: { [Op.lte]: format.date } }})].map(c => c.konamiCode)
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
            const minimum = format.category === 'Speed' ? 20 : 40

            if (main.length < minimum) {
                member.send(`I'm sorry, your deck must contain at least ${minimum} cards.`).catch((err) => console.log(err))    
                return false 
            }

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
const getDeckType = async (ydk, format) => {
    const main = ydk.split('#extra')[0]
    if (!main) return
    const arr = main.split('\n').filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()
    const deck = convertArrayToObject(arr)

    const deckType = format.toLowerCase() === 'goat' ? (
            (deck[collapse] >= 2 || deck[insect] >= 2  || deck[susa] >= 2 || deck[toonelf] >= 2 || deck[mazera] >= 2 || deck[pixie] >= 2 || deck[ecto] >= 2 || deck[silent] >= 2 || deck[skull] >= 2 || deck[hugerev] >= 2 || deck[necrovalley] >= 2 || deck[smackdown] >= 2 || deck[pyrlight] >= 2 || deck[clown] >= 2 || deck[coin] >= 2) ? 'other' :
            (deck[cat] >= 2  && (deck[panda] >= 2 || deck[milus] >= 2) && !deck[stein] && (deck[trunade] >= 2 || deck[decree] >= 2)) ? 'cat otk' :
            (deck[cat] >= 2 && deck[manticore] && deck[wicked] >= 2) ? 'cat control' :
            (deck[panda] >= 2 && deck[trio] >= 2 && !deck[milus]) ? 'panda burn' :
            (deck[mataza] >= 2) ? 'mataza aggro' :
            (deck[ben_kei] >= 2 && (deck[trunade] >= 2 || deck[decree] >= 2)) ? 'ben kei otk' :
            (deck[stein] >= 2 && deck[gate] >= 2) ? 'stein gate turbo' :
            (deck[stein] >= 2 && (deck[megamorph] >= 2 || deck[natures] >= 2 || deck[thanksgiving] >= 2) &&!deck[cat] && (deck[trunade] >= 2 || deck[decree] >= 2)) ? 'stein otk' :
            (deck[cat] >= 2 && deck[stein] >= 2 && (deck[trunade] >= 2 || deck[decree] >= 2)) ? 'cat stein otk' :
            (deck[cyjar] && deck[cardd] && deck[taiyou] >= 2 && deck[shallow] >= 2 && deck[reprod] >= 2) ? 'empty jar' :
            (deck[rml] >= 2 && deck[oath] >= 2 && deck[convulsion] >= 2 && deck[trunade] >= 2) ? 'library ftk' :
            (deck[exodia] && deck[leftarm] && deck[rightarm] && deck[leftleg] && deck[rightleg]) ? 'exodia' :
            ((!deck[meta] || !deck[scapegoat]) && (deck[turtle] >= 3 || deck[life] >= 2 || (deck[turtle] >= 2 && deck[life]))) ? 'zombie' :
            (deck[horus6] && deck[meta] && deck[scapegoat]) ? 'horus control' :
            (deck[horus8] && deck[horus6] && !deck[scapegoat]) ? 'horus turbo' :
            (deck[relinq] >= 2) ? 'relinquished' :
            (deck[zorc] >= 2) ? 'zorc' :
            (deck[lastturn] == 2) ? 'last turn' :
            (deck[countdown] >= 2) ? 'final countdown' :
            (deck[slump] >= 2) ? 'heavy slump' :
            (deck[emissary] >= 3 && deck[meta] >= 2) ? 'emissary control' :
            (deck[emissary] >= 3 && (!deck[meta] || deck[meta] <= 1)) ? 'emissary beatdown' :
            (deck[needle] >= 2 && (deck[llab] == 2 || deck[gbind] == 2 || deck[worl] >= 2)) ? 'stall deckout' :
            (deck[meanae] >= 2 && deck[rota]) ? 'dark scorpion' :
            (deck[strike] >= 2) ? 'strike ninja' :
            (deck[dmoc] && deck[economics] >= 2 && (deck[driver] || deck[cannon] || deck[tooncannon])) ? 'economics ftk' :
            (deck[fusiongate] >= 2) ? 'fusion gate turbo' :
            (((deck[reasoning] >= 2 && deck[gate]) || ((deck[reasoning] && deck[gate] >= 2))) && (!deck[economics] || deck[economics] <= 1)) ? 'reasoning gate turbo' :
            ((deck[bazoo] >= 2 || deck[sorc] >= 2 || deck[freed] >= 2 || deck[strike] >= 2 || deck[purity] >= 2 || deck[soulrel] >= 2) && deck[difu] >= 2) ? 'dimension fusion turbo' :
            ((deck[jinzo] || deck[mech] >= 2 || deck[xhead] >= 2) && deck[limiter] >= 2) ? 'machine' :
            ((deck[freed] >= 2 || deck[purity]) && deck[rftdd] && !deck[manju]) ? 'light return' :
            ((deck[freed] >= 2 || deck[luminous] || deck[purity] >= 2) && !deck[manju]) ? 'light beatdown' :    
            (deck[gearfried] >= 2 && (deck[smoke] >= 2 || deck[bwc] >= 2)) ? 'gearfried' :
            (deck[archfiend] >= 2 && deck[underdog] >= 2) ? 'vanilla beatdown' :
            ((deck[zombyra] >= 2 || deck[gorilla] >= 2 || deck[goblin] >= 2 || deck[fusi] >= 2 || deck[sdm] >= 2 || deck[archfiend] >= 2) && deck[drain] >= 2) ? 'drain beatdown' :
            ((deck[dda] >= 2 || deck[rat] >= 2) && deck[gigantes] >= 2 && !deck[lacooda] && !deck[scapegoat]) ? 'earth beatdown' :
            ((deck[llab] == 2 || deck[gbind] == 2 || deck[worl] >= 2) && !deck[lacooda] && !deck[scarabs] && (deck[koala] >= 2 || deck[barrel] >= 2 || deck[desserts] >= 2 || deck[wmc] >= 2 || deck[lava] >= 2 || deck[fire] >= 2)) ? 'stall burn' :
            (deck[tsuk] >= 2 && (deck[lacooda] >= 2 || deck[mask] >= 2 || deck[mimic] >= 2) && deck[solemn] >= 2 && !deck[soulex] && !deck[manju]) ? 'flip control' :
            (deck[drain] >= 2 && !deck[lacooda] && !deck[scarabs] && (deck[barrel] >= 2 || deck[desserts] >= 2 || deck[wmc] >= 2 || deck[lava] >= 2)) ? 'drain burn' :
            (deck[spy] >= 2 && deck[necrovalley] >= 2 && (deck[gkass] || deck[gkspear])) ? 'gravekeeper' :
            (deck[lacooda] >= 2 && deck[scarabs] >= 2 && (deck[gbind] >= 2 || deck[llab] >= 2 || deck[worl] >= 2)) ? 'pacman' :
            (deck[scapegoat] && deck[meta] && deck[soulex] >= 2) ? 'soul control' :
            ((deck[thestalos] >= 2 || deck[mobius] >= 2 || deck[granmarg] >= 2) && (deck[brain] >= 2 || deck[soulex] >= 2 || (deck[brain] && deck[soulex]))) ? 'monarch' :
            (deck[sorc] >= 1 && deck[rftdd] && (!deck[angel] || !deck[tomato] || !deck[swap]) && !deck[serpent] && (!deck[nightass] || deck[nightass] <= 1)) ? 'chaos return' :
            (deck[bazoo] >= 2 && deck[rftdd]) ? 'bazoo return' :
            (deck[canceller] >= 2 && deck[solemn] >= 2) ? 'canceller stun' :
            (deck[tiger] >= 2 && deck[solemn] >= 2) ? 'tiger stun' :
            (deck[meta] &&  deck[scapegoat] && (deck[wmc] >= 2 || deck[lava] >= 2 || deck[trio] >= 2)) ? 'goat burn' :
            ((deck[panda] >= 2 || deck[mataza] >= 2) && (deck[koala] >= 2 || deck[spy] >= 2) && deck[storm]) ? 'aggro bomb' :
            ((!deck[llab] || deck[llab] <= 1) && (!deck[gbind] || deck[gbind] <= 1) && (!deck[worl] || deck[worl] <= 1) && (deck[koala] >= 2 || deck[bigshield] >= 2) && (deck[barrel] >= 2 || deck[fire] >= 2 || deck[poison] >= 2)) ? 'speed burn' :
            (deck[sorc] >= 1 && deck[tomato] && deck[angel] && !deck[scapegoat] && !deck[meta]) ? 'chaos recruiter' :
            (deck[sorc] && deck[tdrag] >= 3 && deck[rota] && deck[solemn] >= 2) ? 'chaos warrior' :
            (deck[rota] && (deck[blade] || deck[ddwl] || deck[lv2]) && deck[solemn] >= 2 && !deck[llab] && !deck[gbind] && !deck[worl] && !deck[freed]) ? 'warrior' :
            (deck[sorc] >= 1 && deck[tdrag] >= 3 && deck[mof] && !deck[scapegoat]) ? 'chaos turbo' :
            (deck[sorc] >= 1 && deck[meta] && deck[scapegoat]) ? 'chaos control' :
            ((!deck[sorc] || deck[sorc] <= 1) && ((deck[scapegoat] && deck[meta] >= 2) || (deck[scapegoat] >= 2 && deck[meta])) && deck[bls] && (!deck[bigbang] || deck[bigbang] <= 1)) ? 'goat control' :
            'other'
        ) : format.toLowerCase() === 'edison' ? (
            (deck[kalut] >= 2 && deck[whirlwind] >= 2 && deck[icarus] >= 2) ? 'blackwing' :
            (deck[accum] >= 2 && deck[cstrike] >= 2 && deck[detonation] >= 2) ? 'chain burn' :
            (deck[diva] >= 2 && deck[mali] >= 2 && deck[miracle] >= 2) ? 'diva hero' :
            (deck[alius] >= 2 && deck[gspark] >= 2) ? 'hero beat' :
            (deck[redmd] >= 2 && deck[wyvern] && deck[kmdrago] && !deck[consonance] && !deck[rejuv]) ? 'dragon beatdown' :
            (deck[redmd] >= 2 && deck[consonance] >= 2 && deck[tradein] >= 2 && !deck[exodia]) ? 'dragon turbo' :
            (deck[boomboxen] >= 2 && deck[celfon] >= 2 && deck[remoten] >= 2) ? 'morphtronic' :
            (deck[consonance] >= 2 && deck[rejuv] >= 2 && deck[exodia]) ? 'exodia ftk' :
            (deck[artemis] >= 2 && deck[bribe] >= 2 && deck[drastic] >= 2) ? 'counter fairy' :
            (deck[kristya] >= 2 && deck[ddwl] >= 2 && deck[ryko] >= 2) ? 'fairy control' :
            (deck[kristya] >= 2 && deck[tethys] >= 2 && deck[valhalla] >= 2) ? 'fairy turbo' :
            (deck[kristya] >= 3 && !!deck[tethys] && deck[rivalry] && deck[gozen]) ? 'fairy stun' :
            (deck[coelacanth] >= 2 && deck[fishborg] >= 2 && deck[moray] >= 2) ? 'fish otk' :
            (deck[firedog] >= 2 && deck[spy] >= 2 && deck[rekindling] >= 2) ? 'flamvell' :
            (deck[swapfrog] >= 2 && deck[caius] >= 2 && (deck[raiza] || deck[mobius] || deck[thestalos]) && !deck[diva]) ? 'frog monarch' :
            (deck[swapfrog] >= 2 && deck[caius] >= 2 && deck[diva] >= 2 && deck[archer]) ? 'diva frog' :
            (deck[ggadget] >= 2 && deck[rgadget] >= 2 && deck[ygadget] >= 2 && !deck[gearframe]) ? 'gadget' :
            (deck[ggadget] >= 2 && deck[rgadget] >= 2 && deck[ygadget] >= 2 && deck[gearframe] >= 2) ? 'machina gadget' :
            (deck[gearframe] >= 2 && deck[fortress] >= 2 && !deck[ggadget]) ? 'machina' :
            (deck[laquari] >= 2 && deck[chariot] >= 2) ? 'gladiator beast' :
            (deck[jdrag] >= 2 && deck[recharge] >= 2) ? 'lightsworn' :
            (deck[lonefire] >= 2 && deck[dandy] >= 2 && deck[quickdraw] && deck[debris] && !deck[jdrag] && !deck[gobzomb] && !deck[rekindling] && !deck[duplication]) ? 'quickdraw plant' :
            (deck[vrocket] >= 2 && deck[dandy] >= 2 && deck[quickdraw]) ? 'volcanic quickdraw' :
            (deck[dandy] >= 2  && deck[quickdraw] && deck[firedog] >= 2 && deck[rekindling] >= 2) ? 'flamvell quickdraw' :
            (deck[quickdraw] >= 2 && deck[tuningware] >= 2 && deck[duplication] >= 2) ? 'quickdraw machine' :
            (deck[quickdraw] >= 2 && deck[gobzomb] && deck[mezuki]) ? 'quickdraw zombie' :
            (deck[gobzomb] >= 2 && deck[turtle] && deck[mezuki] && deck[life] && !deck[quickdraw]) ? 'zombie' :
            (deck[gotss] >= 2 && deck[zanji] >= 2 && deck[gateway] >= 2 && deck[ssunited] >= 2) ? 'six samurai' :
            (deck[cat] && deck[monk] && deck[airbellum] >= 2 && deck[spy] >= 2) ? 'synchro cat' :
            (deck[sorc] && deck[dad] && deck[recharge] >= 2 && !deck[jdrag]) ? 'chaos lightsworn' :
            (deck[caius] >= 2 && deck[treeborn] && deck[recharge] >= 2 && !deck[jdrag]) ? 'lightsworn monarch' :
            (deck[vayu] >= 2 && deck[sirocco] >= 2 && deck[arma] && deck[grepher] && deck[bfadd]) ? 'vayu turbo' :
            (deck[vrocket] >= 2 && deck[garden] >= 2 && !deck[caius] && !deck[quickdraw]) ? 'volcanic garden' : 
            (deck[vrocket] >= 2 && deck[caius] >= 2 && !deck[garden] && !deck[quickdraw]) ? 'volcanic monarch' : 
            (deck[emmersblade] >= 2 && deck[faultroll] >= 2 && deck[fulhelm] >= 2 && deck[gottoms] >= 2) ? 'x-saber' : 
            (deck[necrovalley] >= 2 && deck[spy] >= 2 && deck[wmc] >= 2) ? 'gravekeeper burn' : 
            (deck[salvo] >= 2 && deck[dad]) ? 'salvo dad' : 
            (deck[lonefire] >= 2 && (deck[lion] >= 2 || deck[gravirose] >= 2) && (deck[fert] >= 2 || deck[motr] >= 2) && !deck[quickdraw]) ? 'plant' : 
            (deck[codarus] >= 2 && deck[alo] >= 2) ? 'codarus' : 
            (deck[bushi] >= 2 && deck[rota] && deck[solidarity] >= 2) ? 'bushi' : 
            'other' 
        ) : 'other'

    return deckType
}

module.exports = {
    checkDeckList,
    getDeckFormat,
    getDeckType,
    getIssues
}