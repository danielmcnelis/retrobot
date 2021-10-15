

//TOURNAMENT FUNCTIONS

//MODULE IMPORTS
const axios = require('axios')
const fs = require('fs')

//DATABASE IMPORTS
const { Entry, Player, Stats }  = require('../db/index.js')

//FUNCTION IMPORTS
const { saveYDK } = require('./deck.js')
const { capitalize, convertArrayToObject, shuffleArray } = require('./utility.js')

// STATIC IMPORTS
const { legend } = require('../static/emojis.json')
const formats = require('../static/formats.json')
const { tourRole } = require('../static/roles.json')
const { challongeAPIKey } = require('../secrets.json')

////// TOURNAMENT REGISTRATION FUNCTIONS ///////

//ASK FOR DB NAME
const askForDBName = async (member, player, override = false, error = false, attempt = 1) => {
    const filter = m => m.author.id === member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const greeting = override ? '' : 'Hi! '
    const prompt = error ? `I think you're getting ahead of yourself. First, I need ${pronoun} DuelingBook name.`
    : `${greeting}This appears to be ${player.name}'s first tournament in our system. Can you please provide ${pronoun} DuelingBook name?`
	const msg = await member.user.send(prompt)

    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 30000
    }).then(async (collected) => {
        const dbName = collected.first().content
        if (dbName.includes("duelingbook.com/deck") || dbName.includes("imgur.com")) {
            if (attempt >= 3) {
                member.user.send(`Sorry, time's up. Go back to the server and try again.`)
                return false
            } else {
                return askForDBName(member, player, override, true, attempt++)
            }
        } else {
            await player.update({
                duelingBook: dbName
            })
            member.user.send(`Thanks! I saved ${pronoun} DuelingBook name as: ${dbName}. If that's wrong, go back to the server and type **!db name**.`)
            return dbName
        }
    }).catch((err) => {
        console.log(err)
        member.user.send(`Sorry, time's up. Go back to the server and try again.`)
        return false
    })

    return collected
}

//GET DECK LIST TOURNAMENT
const getDeckList = async (member, player, formatDate, formatList, override = false) => {            
    const filter = m => m.author.id === member.user.id
    const pronoun = override ? `${player.name}'s` : 'your'
    const msg = await member.user.send(`Please provide a duelingbook.com/deck link for ${pronoun} tournament deck.`);
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 180000
    }).then(async (collected) => {
        const url = collected.first().content
        if (url.includes("www.duelingbook.com/deck")) {		
            member.send('Thanks. Please wait while I download the .YDK file. This can take up to 30 seconds.')
            const issues = await saveYDK(player, url, formatDate, formatList)

            if (override) {
                member.send(`Thanks, ${member.user.username}, I saved a copy of ${pronoun} deck. ${legend}`)
                return url
            } else if (issues['illegalCards'].length || issues['forbiddenCards'].length || issues['limitedCards'].length || issues['semiLimitedCards'].length) {
                let response = `I'm sorry, ${member.user.username}, ${pronoun} deck is not legal. ${legend}`
                if (issues['illegalCards'].length) response += `\n\nThe following cards are not in this game:\n${issues['illegalCards'].join('\n')}`
                if (issues['forbiddenCards'].length) response += `\n\nThe following cards are forbidden:\n${issues['forbiddenCards'].join('\n')}`
                if (issues['limitedCards'].length) response += `\n\nThe following cards are limited:\n${issues['limitedCards'].join('\n')}`
                if (issues['semiLimitedCards'].length) response += `\n\nThe following cards are semi-limited:\n${issues['semiLimitedCards'].join('\n')}`
                response += `\n\nPlease edit ${pronoun} deck and try again once it's legal. If you believe this message is in error, contact the Tournament Organizer.`
            
                member.send(response)
                return false
            } else if (issues['unrecognizedCards'].length) {
                let response = `I'm sorry, ${member.user.username}, the following card IDs were not found in our database:\n${issues['unrecognizedCards'].join('\n')}`
                response += `\n\nThese cards are either alternate artwork, new to the TCG, OCG only, or incorrect in our database. Please contact the Tournament Organizer or the Admin if you can't resolve this.`
                
                member.send(response)
                return false
             } else {
                member.send(`Thanks, ${member.user.username}, ${pronoun} deck is perfectly legal. ${legend}`)
                return url
            }
        } else {
            member.send("Sorry, I only accept duelingbook.com/deck links.")
            return false
        }
    }).catch((err) => {
        console.log(err)
        member.send(`Sorry, time's up. Go back to the server and try again.`)
        return false
    })

    return collected
}

//GET DECK NAME
const getDeckName = async (member, player, override = false) => {
    const pronoun = override ? `${player.name}'s` : 'your'
	const msg = await member.send(`Please provide the common name for ${pronoun} deck (i.e. Chaos Control, Chaos Turbo, Warrior, etc.).`)
    const filter = m => m.author.id === member.user.id
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 20000
    }).then(async collected => {
        const response = collected.first().content.toLowerCase()
        return response
    }).catch(err => {    
        console.log(err)
        member.send(`Sorry, time's up.`)
        return false
    })

    return collected
}

//GET DECK TYPE
const getDeckType = async (player) => {
    const raw = fs.readFileSync(`./decks/${player.tag.replace(/[^\w\s]/gi, "_").replace(/ /g,'')}.ydk`, 'utf8')
    const main = raw.split('#extra')[0]
    const arr = main.split('\n').filter(el => el.charAt(0) !== '#' && el.charAt(0) !== '!' && el !== '').sort()
    const ydk = convertArrayToObject(arr)

    const angel = '95956346'
    const archfiend = '49881766'
    const barrel = '27053506'
    const bazoo = '40133511'
    const ben_kei = '84430950'
    const bigbang = '61127349'
    const bigshield = '65240384'
    const blade = '39507162'
    const bls = '72989439'
    const brain = '87910978'
    const bwc = '98239899'
    const canceller = '84636823'
    const cannon = '11384280'
    const cardd = '72892473'
    const cat = '14878871'
    const clown = '13215230'
    const coin = '36562627'
    const collapse = '20644748'
    const convulsion = '62966332'
    const countdown = '95308449'
    const cyjar = '34124316'
    const dda = '70074904'
    const ddwl = '07572887'
    const decree = '51452091'
    const desserts = '24068492'
    const difu = '23557835'
    const dmoc = '40737112'
    const drain = '82732705'
    const driver = '34906152'
    const economics = '04259068'
    const ecto = '97342942'
    const emissary = '75043725'
    const exodia = '33396948'
    const fire = '46918794'
    const freed = '16556849'
    const fusi = '51632798'
    const fusiongate = '33550694'
    const gate = '43040603'
    const gbind = '85742772'
    const gearfried = '0423705'
    const gigantes = '47606319'
    const gkass = '25262697'
    const gkspear = '63695531'
    const goblin = '78658564'
    const gorilla = '39168895'
    const granmarg = '60229110'
    const horus6 = '11224103'
    const horus8 = '48229808'
    const hugerev = '65396880'
    const insect = '96965364'
    const jinzo = '77585513'
    const koala = '69579761'
    const lacooda = '02326738'
    const lava = '0102380'
    const lastturn = '28566710'
    const leftarm = '07902349'
    const leftleg = '44519536'
    const life = '02204140'
    const limiter = '23171610'
    const llab = '03136426'
    const luminous = '81777047'
    const lv2 = '47507260'
    const manju = '95492061'
    const manticore = '77121851'
    const mask = '28933734'
    const mataza = '22609617'
    const mazera = '06133894'
    const meanae = '74153887'
    const mech = '07359741'
    const megamorph = '22046459'
    const meta = '46411259'
    const milus = '07489323'
    const mimic = '74713516'
    const mobius = '04929256'
    const mof = '31560081'
    const natures = '61166988'
    const necro = '47355498'
    const necromancer = '01434352'
    const needle = '81843628'
    const nightass = '16226786'
    const oath = '22796548'
    const panda = '09817927'
    const pixie = '35429292'
    const poison = '08842266'
    const purity = '77527210'
    const pyrlight = '53569894'
    const rat = '97017120'
    const reasoning = '58577036'
    const relinq = '64631466'
    const reprod = '29228529'
    const rightarm = '70903634'
    const rightleg = '08124921'
    const rftdd = '27174286'
    const rml = '70791313'
    const rota = '32807846'
    const serpent = '08131171'
    const scapegoat = '73915051'
    const scarabs = '15383415'
    const sdm = '73752131'
    const shallow = '43434803'
    const silent = '01995985'
    const skull = '32274490'
    const slump = '52417194'
    const smackdown = '01965724'
    const smoke = '63789924'
    const solemn = '41420027'
    const sorc = '09596126'
    const soulex = '68005187'
    const soulrel = '05758500'
    const spy = '24317029'
    const stein = '69015963'
    const storm = '19613556'
    const strike = '41006930'
    const susa = '40473581'
    const swap = '31036355'
    const taiyou = '38699854'
    const tdrag = '31786629'
    const thanksgiving = '57182235'
    const thestalos = '26205777'
    const tiger = '83986578'
    const tomato = '83011277'
    const tooncannon = '79875176'
    const toonelf = '42386471'
    const trio = '29843091'
    const trunade = '42703248'
    const tsuk = '34853266'
    const turtle = '77044671'
    const underdog = '35762283'
    const wicked = '06285791'
    const wmc = '38992735'
    const worl = '17078030'
    const xhead = '62651957'
    const zombyra = '88472456'
    const zorc = '97642679'

    const deckType = 
        (ydk[collapse] >= 2 || ydk[insect] >= 2  || ydk[susa] >= 2 || ydk[toonelf] >= 2 || ydk[mazera] >= 2 || ydk[pixie] >= 2 || ydk[ecto] >= 2 || ydk[silent] >= 2 || ydk[skull] >= 2 || ydk[hugerev] >= 2 || ydk[necromancer] >= 2 || ydk[smackdown] >= 2 || ydk[pyrlight] >= 2 || ydk[clown] >= 2 || ydk[coin] >= 2) ? 'other' :
        (ydk[cat] >= 2  && (ydk[panda] >= 2 || ydk[milus] >= 2) && !ydk[stein] && (ydk[trunade] >= 2 || ydk[decree] >= 2)) ? 'cat otk' :
        (ydk[cat] >= 2 && ydk[manticore] >= 1 && ydk[wicked] >= 2) ? 'cat control' :
        (ydk[ben_kei] >= 2 && (ydk[trunade] >= 2 || ydk[decree] >= 2)) ? 'ben kei otk' :
        (ydk[stein] >= 2 && ydk[gate] >= 2) ? 'stein gate turbo' :
        (ydk[stein] >= 2 && (ydk[megamorph] >= 2 || ydk[natures] >= 2 || ydk[thanksgiving] >= 2) &&!ydk[cat] && (ydk[trunade] >= 2 || ydk[decree] >= 2)) ? 'stein otk' :
        (ydk[cat] >= 2 && ydk[stein] >= 2 && (ydk[trunade] >= 2 || ydk[decree] >= 2)) ? 'cat stein otk' :
        (ydk[cyjar] == 1 && ydk[cardd] == 1 && ydk[taiyou] >= 2 && ydk[shallow] >= 2 && ydk[reprod] >= 2) ? 'empty jar' :
        (ydk[rml] >= 2 && ydk[oath] >= 2 && ydk[convulsion] >= 2 && ydk[trunade] >= 2) ? 'library ftk' :
        (ydk[exodia] == 1 && ydk[leftarm] == 1 && ydk[rightarm] == 1 && ydk[leftleg] == 1 && ydk[rightleg] == 1) ? 'exodia' :
        ((!ydk[meta] || !ydk[scapegoat]) && (ydk[turtle] >= 3 || ydk[life] >= 2 || (ydk[turtle] >= 2 && ydk[life] >= 1))) ? 'zombie' :
        (ydk[horus6] >= 1 && ydk[meta] >= 1 && ydk[scapegoat] >= 1) ? 'horus control' :
        (ydk[horus8] >= 1 && ydk[horus6] >= 1 && !ydk[scapegoat]) ? 'horus turbo' :
        (ydk[relinq] >= 2) ? 'relinquished' :
        (ydk[zorc] >= 2) ? 'zorc' :
        (ydk[lastturn] == 2) ? 'last turn' :
        (ydk[countdown] >= 2) ? 'final countdown' :
        (ydk[slump] >= 2) ? 'heavy slump' :
        (ydk[emissary] >= 3 && ydk[meta] >= 2) ? 'emissary control' :
        (ydk[emissary] >= 3 && (!ydk[meta] || ydk[meta] <= 1)) ? 'emissary beatdown' :
        (ydk[needle] >= 2 && (ydk[llab] == 2 || ydk[gbind] == 2 || ydk[worl] >= 2)) ? 'stall deckout' :
        (ydk[meanae] >= 2 && ydk[rota] >= 1) ? 'dark scorpion' :
        (ydk[strike] >= 2) ? 'strike ninja' :
        (ydk[dmoc] == 1 && ydk[economics] >= 2 && (ydk[driver] >= 1 || ydk[cannon] >= 1 || ydk[tooncannon] >= 1)) ? 'economics ftk' :
        (ydk[fusiongate] >= 2) ? 'fusion gate turbo' :
        (((ydk[reasoning] >= 2 && ydk[gate] >= 1) || ((ydk[reasoning] >= 1 && ydk[gate] >= 2))) && (!ydk[economics] || ydk[economics] <= 1)) ? 'reasoning gate turbo' :
        ((ydk[bazoo] >= 2 || ydk[sorc] >= 2 || ydk[freed] >= 2 || ydk[strike] >= 2 || ydk[purity] >= 2 || ydk[soulrel] >= 2) && ydk[difu] >= 2) ? 'dimension fusion turbo' :
        ((ydk[jinzo] == 1 || ydk[mech] >= 2 || ydk[xhead] >= 2) && ydk[limiter] >= 2) ? 'machine' :
        ((ydk[freed] >= 2 || ydk[purity] >= 1) && ydk[rftdd] >= 1 && !ydk[manju]) ? 'light return' :
        ((ydk[freed] >= 2 || ydk[luminous] >= 1 || ydk[purity] >= 2) && !ydk[manju]) ? 'light beatdown' :    
        (ydk[gearfried] >= 2 && (ydk[smoke] >= 2 || ydk[bwc] >= 2)) ? 'gearfried' :
        (ydk[archfiend] >= 2 && ydk[underdog] >= 2) ? 'vanilla beatdown' :
        ((ydk[zombyra] >= 2 || ydk[gorilla] >= 2 || ydk[goblin] >= 2 || ydk[fusi] >= 2 || ydk[sdm] >= 2 || ydk[archfiend] >= 2) && ydk[drain] >= 2) ? 'drain beatdown' :
        ((ydk[dda] >= 2 || ydk[rat] >= 2) && ydk[gigantes] >= 2 && !ydk[lacooda] && !ydk[scapegoat]) ? 'earth beatdown' :
        ((ydk[llab] == 2 || ydk[gbind] == 2 || ydk[worl] >= 2) && !ydk[lacooda] && !ydk[scarabs] && (ydk[koala] >= 2 || ydk[barrel] >= 2 || ydk[desserts] >= 2 || ydk[wmc] >= 2 || ydk[lava] >= 2 || ydk[fire] >= 2)) ? 'stall burn' :
        (ydk[tsuk] >= 2 && (ydk[lacooda] >= 2 || ydk[mask] >= 2 || ydk[mimic] >= 2) && ydk[solemn] >= 2 && !ydk[soulex] && !ydk[manju]) ? 'flip control' :
        (ydk[drain] >= 2 && !ydk[lacooda] && !ydk[scarabs] && (ydk[barrel] >= 2 || ydk[desserts] >= 2 || ydk[wmc] >= 2 || ydk[lava] >= 2)) ? 'drain burn' :
        (ydk[spy] >= 2 && ydk[necro] >= 2 && (ydk[gkass] >= 1 || ydk[gkspear] >= 1)) ? 'gravekeeper' :
        (ydk[lacooda] >= 2 && ydk[scarabs] >= 2 && (ydk[gbind] >= 2 || ydk[llab] >= 2 || ydk[worl] >= 2)) ? 'pacman' :
        (ydk[scapegoat] >= 1 && ydk[meta] >= 1 && ydk[soulex] >= 2) ? 'soul control' :
        ((ydk[thestalos] >= 2 || ydk[mobius] >= 2 || ydk[granmarg] >= 2) && (ydk[brain] >= 2 || ydk[soulex] >= 2 || (ydk[brain] >= 1 && ydk[soulex] >= 1))) ? 'monarch' :
        (ydk[sorc] >= 2 && ydk[rftdd] >= 1 && (!ydk[angel] || !ydk[tomato] || !ydk[swap]) && !ydk[serpent] && (!ydk[nightass] || ydk[nightass] <= 1)) ? 'chaos return' :
        (ydk[bazoo] >= 2 && ydk[rftdd] >= 1) ? 'bazoo return' :
        (ydk[canceller] >= 2 && ydk[solemn] >= 2) ? 'canceller stun' :
        (ydk[tiger] >= 2 && ydk[solemn] >= 2) ? 'tiger stun' :
        (ydk[meta] >= 1 &&  ydk[scapegoat] >= 1 && (ydk[wmc] >= 2 || ydk[lava] >= 2 || ydk[trio] >= 2)) ? 'goat burn' :
        ((ydk[panda] >= 2 || ydk[mataza] >= 2) && (ydk[koala] >= 2 || ydk[spy] >= 2) && ydk[storm]) ? 'aggro bomb' :
        ((!ydk[llab] || ydk[llab] <= 1) && (!ydk[gbind] || ydk[gbind] <= 1) && (!ydk[worl] || ydk[worl] <= 1) && (ydk[koala] >= 2 || ydk[bigshield] >= 2) && (ydk[barrel] >= 2 || ydk[fire] >= 2 || ydk[poison] >= 2)) ? 'speed burn' :
        (ydk[sorc] >= 2 && ydk[tomato] >= 1 && ydk[angel] >= 1 && !ydk[scapegoat] && !ydk[meta]) ? 'chaos recruiter' :
        (ydk[sorc] >= 1 && ydk[rota] >= 1 && ydk[solemn] >= 2) ? 'chaos warrior' :
        ((!ydk[sorc] || ydk[sorc] <= 1) && ydk[rota] >= 1  && (ydk[blade] >= 1 || ydk[ddwl] >= 1 || ydk[lv2] >= 1) && ydk[solemn] >= 2 && !ydk[llab] && !ydk[gbind] && !ydk[worl] && !ydk[freed]) ? 'warrior' :
        (ydk[sorc] >= 2 && ydk[tdrag] >= 3 && ydk[mof] >= 1 && !ydk[scapegoat]) ? 'chaos turbo' :
        (ydk[sorc] >= 2 && ydk[meta] >= 1 && ydk[scapegoat] >= 1) ? 'chaos control' :
        ((!ydk[sorc] || ydk[sorc] <= 1) && ((ydk[scapegoat] >= 1 && ydk[meta] >= 2) || (ydk[scapegoat] >= 2 && ydk[meta] >= 1)) && ydk[bls] && (!ydk[bigbang] || ydk[bigbang] <= 1)) ? 'goat control' :
        'other'

    return deckType
}

// SELECT TOURNAMENT
const selectTournament = async (message, tournaments, playerId) => {
    if (tournaments.length === 0) return false
    if (tournaments.length === 1) return tournaments[0]
    const options = tournaments.map((tournament, index) => `(${index + 1}) ${tournament.name}`)
    const filter = m => m.author.id === playerId
    const msg = await message.channel.send(`Please select a tournament:\n${options.join('\n')}`)
    const collected = await msg.channel.awaitMessages(filter, {
        max: 1,
        time: 15000
    }).then(collected => {
        const num = parseInt(collected.first().content.match(/\d+/))
        if (!num || !tournaments[num - 1]) {
            message.channel.send(`Sorry, ${collected.first().content} is not a valid option.`)
            return null
        }
        else return tournaments[num - 1]
    }).catch(err => {
        console.log(err)
        return null
    })

    return collected
}


////// TOURNAMENT HOST FUNCTIONS ///////

// CREATE SHEET DATA
const createSheetData = async () => {
    const allDecks = await Entry.findAll()
    const typeData = {}
    const catData = {}
    const sheet1Data = [['Player', 'Deck', 'Type', 'Link']]
    const sheet2DataA = [['Deck', 'Entries', 'Percent']]
    const sheet2DataB = [[], ['Category', 'Entries', 'Percent']]

    allDecks.forEach(function (deck) {
        typeData[deck.type] ? typeData[deck.type]++ : typeData[deck.type] = 1
        catData[deck.category] ? catData[deck.category]++ : catData[deck.category] = 1
        const row = [deck.pilot, deck.name, deck.type, deck.url]
        sheet1Data.push(row)
    })

    let typeDataArr = Object.entries(typeData).sort((b, a) => b[0].localeCompare(a[0]))
    let catDataArr = Object.entries(catData).sort((b, a) => b[0].localeCompare(a[0]))

    let typeDataArr2 = typeDataArr.map(function(elem) {
        return [elem[0], elem[1], `${(elem[1], elem[1] / allDecks.length * 100).toFixed(2)}%`]
    })

    let catDataArr2 = catDataArr.map(function(elem) {
        return [capitalize(elem[0]), elem[1], `${(elem[1], elem[1] / allDecks.length * 100).toFixed(2)}%`]
    })

    const sheet2Data = [...sheet2DataA, ...typeDataArr2, ...sheet2DataB, ...catDataArr2]

    const data = {
        sheet1Data,
        sheet2Data
    }

    return data
}

// GET TOURNAMENT TYPE
const getTournamentType = async (message) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`What type of tournament is this?\n(1) Single Elimination\n(2) Double Elimination\n(3) Swiss\n(4) Round Robin`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(collected => {
		const response = collected.first().content.toLowerCase()
        if (response.includes(1) || response.startsWith('single')) return 'single elimination'
        else if (response.includes(2) || response.startsWith('double')) return 'double elimination'
        else if (response.includes(3) || response.startsWith('swiss')) return 'swiss'
        else if (response.includes(4) || response.startsWith('round')) return 'round robin'
        else return false
	}).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
	})

    return collected
}

// GET TOURNAMENT FORMAT
const getTournamentFormat = async (message) => {
    const filter = m => m.author.id === message.author.id
	const msg = await message.channel.send(`What format will be played in this tournament?`)
	const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
		time: 15000
	}).then(collected => {
        const response = collected.first().content.toLowerCase().replace(/ /g,"_")
        if(formats[response]) return response
        else return false
	}).catch(err => {
		console.log(err)
        message.channel.send(`Sorry, time's up.`)
        return false
	})

    return collected
}

//REMOVE PARTICIPANT
const removeParticipant = async (message, member, entry, tournament, drop = false) => {    
    try {
        const success = await axios({
            method: 'delete',
            url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/participants/${entry.participantId}.json`,
        })

        if (success) {
            await entry.destroy()
            member.roles.remove(tourRole)
        
            if (drop) {
                return message.channel.send(`I removed you from the tournament. Better luck next time!`)
            } else {
                return message.channel.send(`${member.user.username} has been removed from the tournament.`)
            }
        } else if (!success && drop) {
            return message.channel.send(`Hmm... I don't see you in the participants list.`)
        } else if (!success && !drop) {
            return message.channel.send(`I could not find ${member.user.username} in the participants list.`)
        }
    } catch (err) {
        console.log(err)
        if (drop) {
            return message.channel.send(`Hmm... I don't see you in the participants list.`)
        } else {
            return message.channel.send(`I could not find ${member.user.username} in the participants list.`)
        }
    }   
}

//SEED
const seed = async (message, tournament) => {
    const format = tournament.format
    const entries = await Entry.findAll({ where: { tournamentId: tournament.id } })    
    const expEntries = []
    const newbieEntries = []

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i]
        const playerId = entry.playerId
        const stats = await Stats.findOne({ where: { format, playerId } })
        if (stats) {
            expEntries.push([entry.participantId, entry.pilot, stats.elo])
        } else {
            newbieEntries.push([entry.participantId, entry.pilot, null])
        }
    }

    const seeds = [...expEntries.sort((a, b) => b[2] - a[2]), ...shuffleArray(newbieEntries)]    
    let count = 0
    const results = []
    for (let i = 0; i < seeds.length; i++) {
        const participantId = seeds[i][0]
        const name = seeds[i][1]

        try {
            await axios({
                method: 'put',
                url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/participants/${participantId}.json`,
                data: {
                    participant: {
                        seed: i+1
                    }
                }
            })

            results.push(`${name} is now the ${i+1} seed.`)
            count++
        } catch (err) {
            console.log(err)
        }   
    }

    for (let i = 0; i < results.length; i += 30) message.channel.send(results.slice(i, i + 30))
    return count === seeds.length
}


////// TOURNAMENT MANAGEMENT FUNCTIONS ///////

//CHECK CHALLONGE PAIRING
const checkPairing = (match, p1, p2) => (match.player1_id === p1 && match.player2_id === p2) || (match.player1_id === p2 && match.player2_id === p1)

//FIND NEXT MATCH
const findNextMatch = (matchesArr, matchId, participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.state === 'complete') continue
        if (match.prerequisite_match_ids_csv.includes(matchId) && (match.player1_id === participantId || match.player2_id === participantId)) {
            return match.id
        }
    }

    return false
}

//FIND NEXT OPPONENT
const findNextOpponent = async (tournamentId, matchesArr, matchId, participantId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === matchId) {
            const player1_id = match.player1_id
            const player2_id = match.player2_id
            if (player1_id === participantId) {
                if (!player2_id) return false
                const opponentEntry = await Entry.findOne({
                    where: {
                        tournamentId: tournamentId,
                        participantId: player2_id
                    },
                    include: Player
                })

                return opponentEntry
            } else if (player2_id === participantId) {
                if (!player1_id) return false
                const opponentEntry = await Entry.findOne({
                    where: {
                        tournamentId: tournamentId,
                        participantId: player1_id
                    },
                    include: Player
                }) 

                return opponentEntry
            }
        }
    }

    return false
}

//FIND NO SHOW OPPONENT
const findNoShowOpponent = (match, noShowParticipantId) => {
    if (match.player1_id === noShowParticipantId) return match.player2_id
    if (match.player2_id === noShowParticipantId) return match.player1_id
    else return false
}

//FIND OTHER PRE REQ MATCH
const findOtherPreReqMatch = (matchesArr, nextMatchId, completedMatchId) => {
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === nextMatchId) {
            const pre_reqs = match.prerequisite_match_ids_csv.split(",").map((e) => parseInt(e))
            if (pre_reqs[0] === completedMatchId) {
                const pairing = getPairing(matchesArr, pre_reqs[1])
                return pairing
            } else if (pre_reqs[1] === completedMatchId) {
                const pairing = getPairing(matchesArr, pre_reqs[0])
                return pairing
            } 
            else return false
        }
    }

    return false
}

//GET MATCHES
const getMatches = async (tournamentId) => {
    try {
        const { data } = await axios.get(
            `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournamentId}/matches.json`
        )
        return data
    } catch (err) {
        console.log(err)
    }
}

//GET PAIRING
const getPairing = (matchesArr, matchId) => {
    let p1 = null
    let p2 = null

    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.id === matchId) {
            p1 = match.player1_id
            p2 = match.player2_id
            break
        }
    }

    const pairing = {
        p1,
        p2
    }

    return pairing
}

//POST PARTICIPANT
const postParticipant = async (tournament, player) => {
    try {
        const { data } = await axios({
            method: 'post',
            url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/participants.json`,
            data: {
                participant: {
                    name: player.name
                }
            }
        })
        return data
    } catch (err) {
        console.log(err)
    }   
}

//PROCESS MATCH RESULT
const processMatchResult = async (message, winningPlayer, losingPlayer, tournament, noshow = false) => {
    const losingEntry = await Entry.findOne({ where: { playerId: losingPlayer.id, tournamentId: tournament.id } })
    const winningEntry = await Entry.findOne({ where: { playerId: winningPlayer.id, tournamentId: tournament.id } })
    if (!losingEntry || !winningEntry) {
        message.channel.send(`Sorry I could not find your tournament in the database.`)
        return false
    } 

    const matchesArr = await getMatches(tournament.id)
    let matchId = false
    let scores = false
    for (let i = 0; i < matchesArr.length; i++) {
        const match = matchesArr[i].match
        if (match.state !== 'open') continue
        if (checkPairing(match, losingEntry.participantId, winningEntry.participantId)) {
            matchId = match.id    
            scores = noshow ? "0-0" : match.player1_id === winningEntry.participantId ? "1-0" : "0-1"
            break
        }
    }

    const success = await axios({
        method: 'put',
        url: `https://formatlibrary:${challongeAPIKey}@api.challonge.com/v1/tournaments/${tournament.id}/matches/${matchId}.json`,
        data: {
            match: {
                winner_id: winningEntry.participantId,
                scores_csv: scores
            }
        }
    })
     
    if (!success) {
        message.channel.send(`Error: could not update bracket for ${tournament.name}.`)
        return false
    } 
 
    losingEntry.losses++
    await losingEntry.save()
    
    winningEntry.wins++
    await winningEntry.save()
    const updatedMatchesArr = await getMatches(tournament.id)
    const winnerNextMatch = findNextMatch(updatedMatchesArr, matchId, winningEntry.participantId)
    const winnerNextOpponent = winnerNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, winnerNextMatch, winningEntry.participantId) : null
    const winnerMatchWaitingOn = winnerNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, winnerNextMatch, matchId) 
    const winnerWaitingOnP1 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: winnerMatchWaitingOn.p1 }, include: Player }) : null
    const winnerWaitingOnP2 = winnerMatchWaitingOn && winnerMatchWaitingOn.p1 && winnerMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: winnerMatchWaitingOn.p2 }, include: Player }) : null

    const loserEliminated = tournament.type === 'single elimination' ? true :
        tournament.type === 'double elimination' && losingEntry.losses >= 2 ? true :
        false

    if (loserEliminated) {
        const entries = await Entry.count({ where: { playerId: losingPlayer.id } })
        if (entries === 1) {
            const member = message.guild.members.cache.get(losingEntry.playerId)
            if (member) member.roles.remove(tourRole)
        }
        await losingEntry.destroy()
    }

    const loserNextMatch = loserEliminated ? null : findNextMatch(updatedMatchesArr, matchId, losingEntry.participantId)
    const loserNextOpponent = loserNextMatch ? await findNextOpponent(tournament.id, updatedMatchesArr, loserNextMatch, losingEntry.participantId) : null
    const loserMatchWaitingOn = loserNextOpponent ? null : findOtherPreReqMatch(updatedMatchesArr, loserNextMatch, matchId) 
    const loserWaitingOnP1 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p1 }, include: Player }) : null
    const loserWaitingOnP2 = loserMatchWaitingOn && loserMatchWaitingOn.p1 && loserMatchWaitingOn.p2 ? await Entry.findOne({ where: { tournamentId: tournament.id, participantId: loserMatchWaitingOn.p2 }, include: Player }) : null

    setTimeout(() => {
        if (loserEliminated) return message.channel.send(`${losingPlayer.name}, You are eliminated from the tournament. Better luck next time!`)
        else if (loserNextOpponent) return message.channel.send(`New Match: <@${losingPlayer.id}> (DB: ${losingPlayer.duelingBook}) vs. <@${loserNextOpponent.playerId}> (DB: ${loserNextOpponent.player.duelingBook}). Good luck to both duelists.`)
        else if (loserMatchWaitingOn && loserWaitingOnP1 && loserWaitingOnP2) {
            return message.channel.send(`${losingPlayer.name}, You are waiting for the result of ${loserWaitingOnP1.player.name} (DB: ${loserWaitingOnP1.player.duelingBook}) vs ${loserWaitingOnP2.player.name} (DB: ${loserWaitingOnP2.player.duelingBook}).`)
        }
        else return message.channel.send(`${losingPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
    }, 2000)
    
    if (!winnerNextMatch || (winnerNextMatch && loserNextMatch !== winnerNextMatch)) {
        setTimeout(() => {
            if (!winnerNextMatch) return message.channel.send(`<@${winningPlayer.id}>, You won the tournament! Congratulations on your stellar performance! ${legend}`)
            else if (winnerNextOpponent) return message.channel.send(`New Match: <@${winningPlayer.id}> (DB: ${winningPlayer.duelingBook}) vs. <@${winnerNextOpponent.playerId}> (DB: ${winnerNextOpponent.player.duelingBook}). Good luck to both duelists.`)
            else if (winnerMatchWaitingOn && winnerWaitingOnP1 && winnerWaitingOnP2) {
                return message.channel.send(`${winningPlayer.name}, You are waiting for the result of ${winnerWaitingOnP1.player.name} (DB: ${winnerWaitingOnP1.player.duelingBook}) vs ${winnerWaitingOnP2.player.name} (DB: ${winnerWaitingOnP2.player.duelingBook}).`)
            }
            else return message.channel.send(`${winningPlayer.name}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
        }, 4000)
    }

    return true
}

module.exports = {
    askForDBName,
    checkPairing,
    createSheetData,
    findNextMatch,
    findNextOpponent,
    findNoShowOpponent,
    findOtherPreReqMatch,
    getDeckList,
    getDeckName,
    getDeckType,
    getPairing,
    getTournamentFormat,
    getTournamentType,
    getMatches,
    processMatchResult,
    postParticipant,
    removeParticipant,
    seed,
    selectTournament
}