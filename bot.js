
//GOATBOT - A RANKINGS BOT FOR GOATFORMAT.COM
const Discord = require('discord.js')
const client = new Discord.Client()
const challonge = require('challonge');
const fs = require('fs')
const serverID = '682361248532398143'
const botRole = '682389567185223713'
const modRole = '682361608848015409'
const goatRole = '682461775907913748'
const tourRole = '682748333940277269'
const registrationChannel = '683434748387000364'
const challongeClient = challonge.createClient({
    apiKey: 'JE7pFfKV8XhdZXshqHNjVySDfoVUZeAtDRcULUln'
});

const blank = require('./blank.json')
const status = require('./status.json')
const discordIDs = require('./discordIDs.json')
const names = require('./names.json')
const decks = require('./decks.json')
const replays = require('./replays.json')
const stats = require('./stats.json')
const backup = require('./backup.json') 
const wins = require('./wins.json') 
const losses = require('./losses.json')
const matchups = require('./matchups.json')

const pfpcom = ['!pfp', '!profile', '!avatar']
const botcom = ['!bot', '!help', '!info']
const rolecom = ['!role', '!rankedgoats']
const statscom = ['!stats', '!mystats', '!goatstats']
const losscom = ['!lossvs','!loss','!lose','!goatloss','!goatlossvs','!goatlose']
const h2hcom = ['!h2h', '!head2head', '!headtohead']
const undocom = ['!undolast', '!undo', '!undoloss']
const rankcom = ['!rank', '!top', '!ladder']
const yesSynonyms = ['yes', 'yeah', 'yea', 'ye', 'ya', 'yah', 'yh', 'y']
const noSynonyms = ['no', 'nah', 'nope', 'naw', 'n', 'na']
const deckTypeAlius = {
    goatControl: ['Goat Control', 'goat control', 'goat', 'gc'],
    chaosControl: ['Chaos Control', 'chaos control', 'td chaos control', 'angel chaos', 'angel chaos control', 'skilled chaos', 'skilled chaos control'],
    chaosRecruiter: ['Chaos Recruiter', 'chaos recruiter', 'recruiter chaos'],
    chaosReturn: ['Chaos Return', 'chaos return'],
    dimensionFusionTurbo: ['Dimension Fusion Turbo', 'dimension fusion turbo', 'dft', 'bazoo fusion turbo', 'bazoo turbo'],
    reasoningGateTurbo: ['Reasoning Gate Turbo', 'reasoning gate turbo', 'reasoning gate', 'reason gate turbo', 'reason gate', 'rgt'],
    chaosFlipTurbo: ['Chaos Turbo', 'chaos turbo', 'chaos flip turbo', 'cft', 'ct'],
    flipControl: ['Flip Control', 'flip control', 'tsuku lock', 'tsuk lock', 'flip lock', 'mask control'],
    soulControl: ['Soul Control', 'soul control', 'monarch', 'monarchs'],
    warrior: ['Anti-Meta Warrior', 'anti-meta warrior', 'warrior', 'warriors', 'warrior aggro', 'anti meta warrior','antimeta warrior', 'anti-meta warriors', 'anti meta warriors','antimeta warriors'],
    gearfried: ['Gearfried', 'gearfried', 'gearfriend aggro', 'gearfried stun'],
    tigerstun: ['Tiger Stun', 'tiger stun', 'wanghu stun', 'stun'],
    drainBeat: ['Drain Beat', 'drain beat', 'drain beatdown', 'skill drain beatdown'],
    aggroBurn: ['Aggro Burn', 'aggro burn', 'aggro bomb'],
    aggroMonarch: ['Aggro Monarch', 'aggro monarch', 'aggro monarchs', 'monarch aggro'],
    rescueCat: ['Rescue Cat OTK', 'rescue cat otk', 'rescue cat', 'cat', 'cat otk'],
    benKei: ['Ben-Kei OTK', 'ben-kei otk', 'ben kei', 'ben-kei', 'ben kei otk', 'ben-kei combo', 'ben kei combo'],
    stein: ['Stein OTK', 'stein otk', 'stein', 'cyber-stein', 'cyber stein', 'cyber-stein otk', 'cyber stein otk'],
    darkBurn: ['Dark Burn', 'dark burn', 'black burn', 'burn'],
    drainBurn: ['Drain Burn', 'drain burn', 'skill burn', 'skill drain burn'],
    speedBurn: ['Speed Burn', 'speed burn', 'turbo burn', 'jar burn'],
    pacman: ['P.A.C.M.A.N.', 'p.a.c.m.a.n.', 'pacman'],
    economicsFTK: ['Economics FTK', 'economics ftk', 'economics', 'mass driver ftk', 'mass driver'],
    libraryFTK: ['Library FTK', 'library ftk', 'library'],
    exodia: ['Exodia', 'exodia', 'exodia ftk'],
    lastTurn: ['Last Turn', 'last turn', 'lt'],
    emptyJar: ['Empty Jar', 'empty jar', 'e-jar', 'e jar', 'ejar', 'empty jar ftk', 'mill', 'deck-out', 'deck out'],
    gravekeeper: ['Gravekeeper', 'gravekeeper', `gravekeeper's`, 'gravekeepers'],
    machine: ['Machine', 'machine', 'machines', 'machine otk'],
    water: ['Water', 'water'],
    zombie: ['Zombie', 'zombie', 'zombies'],
    darkScorpion: ['Dark Scorpion', 'dark scorpion', 'dark scorpions', 'scorpion', 'scorpions'],
    darkMasterZorc: ['Dark Master Zorc', 'dark master zorc', 'dark master - zorc', 'zorc'],
    relinquished: ['Relinquished', 'relinquished', 'relinquish', 'relinq'],
    strikeNinja: ['Strike Ninja', 'strike ninja', 'ninja', 'strike ninja return'],
    bazooReturn: ['Bazoo Return', 'bazoo return', 'bazoo'],
    other: ['Other']
}

const sad = `<:sad:682370580884095006>`
const rock = `<:rock:682370580909260869>`
const bron = `<:bronze:682370580456276001>`
const silv = `<:silver:682370580581842949>`
const gold = `<:gold:682370580321665057>`
const plat = `<:platinum:682370580527579245>`
const dia = `<:diamond:682370580288372739>`
const mast = `<:master:682370580711997464>`
const lgnd = `<:legend:682370580653146326>`
const goat = `<:token:682370580564934658>`
const upvote = `<:upvote:585263537358635010>`
const downvote = `<:downvote:585263559332855816>`

client.login('NjgyNDAxNzU1MTcwMDc4Nzcw.Xlcpag.XVeTLXJFH92QUrFZYhvjoKqg0QQ')


//READY
client.on('ready', () => {
  console.log('GoatBot is online!')
})


//PING
client.on('message', message => {
  if (message.content === '!ping') {
    message.channel.send("pong")
  }
})


//WELCOME
client.on('guildMemberAdd', member => {
  	const channel = member.guild.channels.find(ch => ch.name === 'welcome')
	let rawdata = fs.readFileSync('./names.json')

	if (!rawdata.includes(member.user.id)) {
		setTimeout(function(){ createUser(member.user.id, member) }, 1000)	
		channel.send(`Welcome to the GoatFormat.com discord server, ${member}. Be sure to read the rules and tag a staff member if you have any questions. ${goat}`) }
	
	if (rawdata.includes(member.user.id)) {
		channel.send(`Welcome back to GoatFormat.com, ${member}! We missed you. ${goat}`) }
})


//GOODBYE
client.on('guildMemberRemove', member => {
    const channel = member.guild.channels.find(ch => ch.name === 'welcome')
    if (!channel) return
    channel.send(`Today is a sad day. ${names[member.id]} has left the server. ${sad}`)
})


//COMMANDS
client.on('message', async message => {
    const messageArray = message.content.split(" ")
    const cmd = messageArray[0]
    const args = messageArray.slice(1)
    const maid = message.author.id
           

    //CHALLONGE - CREATE
    if(cmd === `!reset`) {
        if(!message.member.roles.has(modRole)) {
            return message.channel.send('You do not have permission to do that.')
        } else if(!args) {
            return message.channel.send("You did not select a valid Status:\n- Registration (r)")
        } else if(args[0].toLowerCase() == 'registraton' || args[0].toLowerCase() == 'reg' || args[0].toLowerCase() == 'r') {
            return clearRegistrationStatus(message, 1)
        } else {
            return message.channel.send("You did not select a valid Status:\n- Registration (r)")
        }
    }

    //CHALLONGE - CREATE
    if(cmd === `!create`) {
        function getRandomString(length, chars) {
            var result = '';
            for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
            return result;
        }

        let str = getRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz');
        let name = (args[0] ? args[0] : 'New Tournament')
        let url = (args[0] ? args[0] : str)
        challongeClient.tournaments.create({
            tournament: {
            name: name,
            url: url,
            tournamentType: 'double elimination',
            gameName: 'Yu-Gi-Oh!',
            },
            callback: (err) => {
            if(err) {
                return message.channel.send(`Error: The name "${url}" is already taken.`)
            } else {
                status['tournament'] = name
                status['registration'] = 'waiting'
                status['round'] = 0
                fs.writeFile("./status.json", JSON.stringify(status), (err) => { 
                    if (err) console.log(err)
                })
                return message.channel.send(`I created a new tournament named ${name}, located at https://challonge.com/${url}`)
            }
            }
        });   
    }


    //CHALLONGE - DESTROY
    if(cmd === `!destroy`) {
        let name = (args[0] ? args[0] : status['tournament'])
        challongeClient.tournaments.destroy({
            id: name,
            callback: (err) => {
                if(err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be deleted.`)
                } else {
                    if (status['tournament'] === name) {
                        delete status['tournament']
                        fs.writeFile("./status.json", JSON.stringify(status), (err) => { 
                            if (err) console.log(err)
                        })
                    }
                    return message.channel.send(`I deleted the tournament named "${name}" from your account.`)
                }
            }
          });  
    }


    //CHALLONGE - END
    if(cmd === `!end`) {
        let name = (args[0] ? args[0] : status['tournament'])
        challongeClient.tournaments.finalize({
            id: name,
            callback: (err) => {
                if(err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be finalized.`)
                } else {
                    delete status['tournament']
                    delete status['round']
                    status['registration'] = 'waiting'
                    fs.writeFile("./status.json", JSON.stringify(status), (err) => { 
                        if (err) console.log(err)
                    })
                    fs.writeFile("./discordIDs.json", JSON.stringify({}), (err) => { 
                        if (err) console.log(err)
                    })
                    return message.channel.send(`Congratulations, your tournament results have been finalized: https://challonge.com/${name}.`)
                }
            }
          });  
    }


    //CHALLONGE - SHOW
    if(cmd === `!show`) {
        let name = (args[0] ? args[0] : status['tournament'])
        if (!name) {
            return message.channel.send('There is no active tournament.')
        }
        challongeClient.tournaments.show({
            id: name,
            callback: (err) => {
                if(err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be found.`)
                } else {
                    return message.channel.send(`Here is the link to the tournament you requested: https://challonge.com/${name}.`)
                }
            }
          });  
    }


    //CHALLONGE - START
    if(cmd === `!start`) {
        let name = (args[0] ? args[0] : status['tournament'])
        challongeClient.tournaments.start({
            id: name,
            callback: (err) => {
                if(err) {
                    return message.channel.send(`Error: the tournament you provided, "${name}", could not be initialized.`)
                } else {
                    status['round'] = 1
                    fs.writeFile("./status.json", JSON.stringify(status), (err) => { 
                        if (err) console.log(err)
                    })

                    return message.channel.send(`Let's go! Your tournament is starting now: https://challonge.com/${name}.`)
                }
            }
          });  
    }

    //CHALLONGE - JOIN
    if(cmd === `!join`) {
        let name = status['tournament']
        let person = message.channel.members.find('id', maid);
        

        if (!name) {
            return message.channel.send('There is no active tournament.')
        } else if (!person) {
            return message.channel.send('Sorry, I could not find you in the server. Please be sure your availability is not set to invisible.')
        } else if (status['round'] !== 0) {
            return message.channel.send("Sorry, the tournament already started.")
        } else if (!decks[maid]) {
            createUser(maid)
            return message.channel.send("I have added you to the Goat Format database. Please try again.")
        } else if (status['registration'] === 'running') {
            return message.channel.send("Another player is currently registering. Please wait.")
        }
    
        status['registration'] = 'running';
	    fs.writeFile("./status.json", JSON.stringify(status), (err) => {
            if (err) console.log(err) });

        message.channel.send("Please check your DMs.");

        if(decks[maid].tournament.url) {
            return checkResubmission(message, maid)
        }

        const msg = await person.send("Please provide an imgur screenshot or a duelingbook download link for your tournament deck.");
        const filter = collected => collected.author.id === maid;
        const collected = await msg.channel.awaitMessages(filter, {
		    max: 1,
            time: 16000
        }).then(collected => {
            console.log(collected.first().content)

            if ( (!collected.first().content.startsWith("https://i") && !collected.first().content.startsWith("https://www.duelingbook.com/deck")) || collected.first().content.length > 46) {		
                clearRegistrationStatus(message)
                return person.send.send("I only accept (1) imgur.com or duelingbook.com link.")
            } else if (collected.first().content.startsWith("https://i.imgur") || collected.first().content.startsWith("https://www.duelingbook.com/deck")) {
                console.log('yo')
                return getDeckTypeTournament(message, maid, collected.first().content)
            } else if (collected.first().content.startsWith("https://imgur")) {
                console.log('hello')
                let str = collected.first().content
                let newStr = str.substring(8, str.length)
                let url = "https://i." + newStr + ".png";
                console.log(str)
                console.log(newStr)
                console.log(url)
                return getDeckTypeTournament(message, maid, url)          
            }
        }).catch(err => {
            clearRegistrationStatus(message)
            console.log('hmm')
            return message.author.send('Perhaps another time would be better.')
        })
    }

    //CHALLONGE - ADD
    if(cmd === `!signup`) {
        let name = status['tournament']
        let person = message.mentions.users.first()
        let dude = message.channel.members.find('id', person.id);

        if (!name) {
            return message.channel.send('There is no active tournament.')
        } else if (!person) {
            return message.channel.send('Please provide an @ mention of the player you wish to sign-up for the tournament.')
        } else if (!dude) {
            return message.channel.send('I could not find that user in the server.')
        }

        challongeClient.participants.create({
            id: name,
            participant: {
            name: person.username,
            },
            callback: (err) => {
                if(err) {
                    return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                } else {
                    dude.addRole(tourRole);
                    discordIDs[person.username] = person.id
                    fs.writeFile("./discordIDs.json", JSON.stringify(discordIDs), (err) => { 
                        if (err) console.log(err)
                    })
                    return message.channel.send(`${person.username} has been signed-up for the tournament.`)
                }
            }
        })
    }


    //CHALLONGE - REMOVE
    if(cmd === `!remove`) {
        let name = status['tournament']
        let person = message.mentions.users.first()
        let dude = message.channel.members.find('id', person.id);

        if (!name) {
            return message.channel.send('There is no active tournament.')
        } else if (!person) {
            return message.channel.send('Please provide an @ mention of the player you wish to sign-up for the tournament.')
        } else if (!dude) {
            return message.channel.send('I could not find that user in the server.')
        }
        
        challongeClient.participants.index({
            id: name,
            callback: (err, data) => {
                if(err) {
                    return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                } else {
                    return removeParticipant(message, data, name, person)
                }
            }
        })
    }


    //CHALLONGE - DROP
    if(cmd === `!drop`) {
        let name = status['tournament']
        let person = message.author

        if (!name) {
            return message.channel.send('There is no active tournament.')
        }
        
        challongeClient.participants.index({
            id: name,
            callback: (err, data) => {
                if(err) {
                    return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                } else {
                    return removeParticipant(message, data, name, person)
                }
            }
        })
    }



    //CHALLONGE - INSPECT
    if(cmd === `!inspect`) {
        let elem = (args[0] ? args[0] : 'tour')
        let name = (args[1] ? args[1] : status['tournament'])

        if (elem === 'participants') {
            challongeClient.participants.index({
                id: name,
                callback: (err, data) => {
                    if(err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        console.log(data)
                        message.channel.send(`I printed the list of tournament participants to the console.`)
                    }
                }
            })
        } else if (elem === 'matches') {
            challongeClient.matches.index({
                id: name,
                callback: (err, data) => {
                    if(err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        console.log(data)
                        message.channel.send(`I printed the list of tournament matches to the console.`)
                    }
                }
            })
        } else if (elem === 'tour') {
            challongeClient.tournaments.show({
                id: name,
                callback: (err, data) => {
                    if(err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        console.log(data)
                        message.channel.send(`I printed the current tournament summary to the console.`)
                    }
                }
            })
        } else {
            return message.channel.send(`Invalid input: ${args[0]} is not a tournament element.`)
        }
    }


    //REPLAY-LINKS AUTO MODERATION



    //DECK-LISTS AUTO MODERATION
    if(cmd === `!save`) {    
        if(!decks[maid] || !replays[maid]) {
            createUser(maid);
            return message.channel.send("I have added you to the Goat Format database. Please try again.")
        }
        
        if (!message.content.startsWith("!save https://i") || message.content.length > 46) {		
            return message.channel.send("I only accept (1) imgur.com link.")
        } else if (message.content.startsWith("!save https://i.imgur")) {
            return getDeckType(message, maid, args[0])
        } else if (message.content.startsWith("!save https://imgur")) {
            let url = `https://i.${args.join(" ").substring(8, args.join(" ").length)}.png`;
            return getDeckType(message, maid, url)          
        }
    }


    //DECK-LISTS AUTO MODERATION
    if(cmd === `!deck`) {    
        let person = message.mentions.users.first()
        let player = (person ? maid : person.id)      

        if(!decks[maid]) {
            createUser(maid);
            return message.channel.send("I have added you to the Goat Format database. Please try again.")
        } else if(!deck[player]) {
            return message.channel.send("That user is not in the Goat Format database.")
        }
    }

    //AVATAR
    if(pfpcom.includes(cmd)) {
        let person = message.mentions.users.first()
        let reply = (person ? person.avatarURL : message.author.avatarURL)
        return message.channel.send(reply)
    }


    //NAME
    if (cmd === `!name`) {
        let player = messageArray[1].replace(/[\\<>@#&!]/g, "")
        return message.channel.send(`The original username of <@${player}> is ${names[player]}.`)
    }


    //RENAME
    if(cmd === `!rename`) {
        if(!message.member.roles.has(modRole)) { 
            return message.channel.send("You do not have permission to do that.")
        }

        let player = messageArray[1].replace(/[\\<>@#&!]/g, "")
	    names[player] = messageArray.slice(2, messageArray.length).join(' ')
   	    fs.writeFile("./names.json", JSON.stringify(names), (err) => { 
            if (err) console.log(err)
        })

        return message.channel.send("The database name of <@" + player + "> is now: " + names[player] + ".")
    }


    //ROLE
    if(rolecom.includes(cmd)) {
		if(!message.member.roles.has(goatRole)) {
			message.member.addRole(goatRole);
			return message.channel.send("I have given you the Ranked Goats role."); }
		else {
            message.member.removeRole(goatRole);
            return message.channel.send("You no longer have the Ranked Goats role."); }
        }


    //BOT USER GUIDE
    if(botcom.includes(cmd)) {
        const botEmbed = new Discord.RichEmbed()
	        .setColor('#38C368')
        	.setTitle('GoatBot')
	        .setDescription('A Rankings Bot for GoatFormat.com.\n' )
	        .setURL('https://goatformat.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/93IC0Ua.png', 'https://formatlibrary.com/')
        	.setThumbnail('https://i.imgur.com/9lMCJJH.png')
        	.addField('Ranked Commands', '\n!loss - (@user) - Report a loss to another player. \n!stats - (blank or @user) - Post a player’s stats. \n!top - (number) - Post the server’s top players (100 max). \n!h2h - (@user + @user) - Post the H2H record between 2 players. \n!role - Add or remove the Ranked Goats role. \n!undo - Undo the last loss if you reported it. \n')
        	.addField('Server Commands', '\n!save - (imgur.com link) - Save a deck. \n!decks - (blank or @user) - Post a player’s deck(s). \n!bot - View the GoatBot User Guide. \n!mod - View the Mod-Only Guide.');

        message.author.send(botEmbed);
        return message.channel.send("I messaged you the GoatBot User Guide.")
    }

    //MOD USER GUIDE
    if(cmd === `!mod`) {
        if(!message.member.roles.has(modRole)) {
            return message.channel.send("You do not have permission to do that.")
        } 

        const botEmbed = new Discord.RichEmbed()
	        .setColor('#38C368')
        	.setTitle('GoatBot')
	        .setDescription('A Rankings Bot for GoatFormat.com.\n' )
	        .setURL('https://goatformat.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/93IC0Ua.png', 'https://formatlibrary.com/')
        	.setThumbnail('https://i.imgur.com/9lMCJJH.png')
        	.addField('Mod-Only Ranked Commands', '\n!manual - (@winner + @loser) - Manually record a match result. \n!undo - Undo the most recent loss, even if you did not report it. \n')
        	.addField('Mod-Only Server Commands', '\n!rename - (@user + new name) - Rename a user in the database.\n!census - Add missing names to the database.\n!recalc - Recaluate all Player Stats after manually deleting records.');

        message.author.send(botEmbed);
        return message.channel.send("I messaged you the Mod-Only Guide.")
    }


    //STATS
    if(statscom.includes(cmd)) {
        const rawdata = fs.readFileSync('./stats.json')
        const rawobj = JSON.parse(rawdata);
        const keys = Object.keys(rawobj);
        const values = keys.map(function (k) { return rawobj[k]; })
        let medal
        let player
        
        if (messageArray.length === 1){ 
            player = maid
        } else if (messageArray.length > 1) {
            player = messageArray[1].replace(/[\\<>@#&!]/g, "")
        }
        
        if(!stats[player] && maid === player) {
            createUser(player);
            return message.channel.send("I have added you to the Goat Format database. Please try again.")
        } else if(!stats[player] && maid !== player) {
            return message.channel.send("That user is not in the Goat Format database.")
        }

        for(p = 0; p < keys.length; p++) {
        	if( (wins[keys[p]] === 0 && losses[keys[p]] === 0) || stats[keys[p]] === 500) {
                keys.splice(p, 1); values.splice(p, 1)
                p--
            }
        }

        values.sort(function(a, b) {
           if(a < b) {
                return 1
            } else if (a > b) {
                return -1
            } else {
                return 0
            }
        })

        let rank = `#${1 + values.map(function(e) {
            return e
        }).indexOf(stats[player])} out of ${values.length}`

        if(rank === `#0 out of ${values.length}`) {
            rank = `N/A`
        }

        if(stats[player] <= 290) {
            medal = `Chump ${sad}`
        } else if(stats[player] > 290 && stats[player] <= 350) {
            medal = `Rock ${rock}`
        } else if(stats[player] > 350 && stats[player] <= 410) {
            medal = `Bronze ${bron}`
        } else if(stats[player] > 410 && stats[player] <= 470) {
            medal = `Silver ${silv}`
        } else if(stats[player] > 470 && stats[player] <= 530) { 
            medal = `Gold ${gold}`
        } else if(stats[player] > 530 && stats[player] <= 590) {
            medal = `Platinum ${plat}`
        } else if(stats[player] > 590 && stats[player] <= 650) {
            medal = `Diamond ${dia}`
        } else if(stats[player] > 650 && stats[player] <= 710) {
            medal = `Master ${mast}`
        } else { 
            medal = `Legend ${lgnd}`
        }

        return message.channel.send(`${goat} --- Goat Format Stats --- ${goat}
Name: ${names[player]}
Medal: ${medal}
Ranking: ${rank}
Wins: ${wins[player]}, Losses: ${losses[player]}
Elo Rating: ${stats[player].toFixed(2)}`)
    }


    //RANK
    if(rankcom.includes(cmd)) {
        let x = args[0]
        let j = 0;
        let medals = []
        let result = [`${goat} --- Top ${x} Goat Players --- ${goat}`]
        let rawdata = fs.readFileSync('./stats.json')
        let rawobj = JSON.parse(rawdata)

        if (x < 1) {
            return message.channel.send("Please provide a number greater than 0.")
        } else if (x > 100) {
            return message.channel.send("Please provide a number less than or equal to 100.")
        }
        
        let arr1 = Object.keys(rawobj)
        let arr2 = arr1.map(function (elem) {
            return rawobj[elem]
        })

        for (let i = 0; i < arr1.length; i++) {
            if((wins[arr1[i]] === 0 && losses[arr1[i]] === 0) || stats[arr1[i]] === 500) {
                arr1.splice(i, 1)
                arr2.splice(i, 1)
                i--
            }
        }
    
        arr2.sort(function(a, b){
            if (a < b) {
                return 1
            } else if (a > b) {
                return -1
            } else {
                return 0
            }
        })
    
        if (x > arr2.length) {
            return message.channel.send(`I need a smaller number. We only have ${arr2.length} Goat Format players.`)
        }
    
        let arr3 = arr2.slice(0, x);
        let arr4 = [];
    
        while (j < arr3.length) {
            for (let i = 0; i < arr1.length; i++) {
                if (stats[arr1[i]] === arr3[j]) {
                    arr4.push(arr1[i])
                    j++
                }
            }
        }
    
        for (let i = 0; i < x; i++) {
            if (arr2[i] <= 290) { 
                medals[i] = sad
            } else if (arr2[i] > 290 && arr2[i] <= 350) {
                medals[i] = rock
            } else if (arr2[i] > 350 && arr2[i] <= 410) {
                medals[i] = bron
            } else if (arr2[i] > 410 && arr2[i] <= 470) {
                medals[i] = silv
            } else if (arr2[i] > 470 && arr2[i] <= 530) {
                medals[i] = gold
            } else if (arr2[i] > 530 && arr2[i] <= 590) {
                medals[i] = plat
            } else if (arr2[i] > 590 && arr2[i] <=650) {
                medals[i] = dia
            } else if (arr2[i] > 650 && arr2[i] <=710) {
                medals[i] = mast
            } else {
                medals[i] = lgnd
            }
        }
    
        for (let i = 0; i < x; i++) { 
            result[i+1] = `${(i+1)}. ${medals[i]} ${names[arr4[i]]}`
        }
    
       if (x == 1) {
           return message.channel.send(`${goat} --- The Best Goat Player --- ${goat}
1. ${medals[0]} ${names[arr4[0]]}`)
        } else { 
            message.channel.send(result.slice(0,30));
            message.channel.send(result.slice(30,60));
            message.channel.send(result.slice(60,90));
            message.channel.send(result.slice(90,99));
            return
        }
    }
    

    //LOSS
    if(losscom.includes(cmd)) {
        const oppo = messageArray[1].replace(/[\\<>@#&!]/g, "")
        const winningDude = message.channel.members.find('id', oppo);
        const losingDude = message.channel.members.find('id', maid);
        const statsLoser = stats[maid];
        const statsWinner = stats[oppo];

        if(!oppo || oppo == '@') { 
            return message.channel.send("No player specified.")
        } else if(oppo == maid) { 
            return message.channel.send("You cannot lose a match to yourself.")
        } else if(message.guild.members.get(oppo).roles.has(botRole)) {
            return message.channel.send("Sorry, Bots do not play Goat Format... *yet*.")
        } else if(oppo.length < 17 || oppo.length > 18) {
            return message.channel.send("To report a loss, please type the command **!loss** followed by an @ mention of your opponent.")
        } else if(!stats[maid]) {
	        createUser(maid)
            return message.channel.send("Sorry, you were not in the Goat Format database. Please try again.")
        } else if(!stats[oppo]) { 
            createUser(oppo)
            return message.channel.send("Sorry, that user was not in the Goat Format database. Please try again.")
        }

        if (losingDude.roles.has(tourRole) || winningDude.roles.has(tourRole)) {
            return challongeClient.matches.index({
                id: status['tournament'],
                callback: (err, data) => {
                    if(err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        return getParticipants(message, data, losingDude, winningDude)
                    }
                }
            }) 
        }

        backup[maid] = statsLoser;
        backup[oppo] = statsWinner;
        fs.writeFile("./backup.json", JSON.stringify(backup), (err) => {
            if (err) console.log(err)
        })

        stats[maid] += 20 * (0 - (1 / (1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
        stats[oppo] += 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
        fs.writeFile("./stats.json", JSON.stringify(stats), (err) => {
            if (err) console.log(err)
        })

        losses[maid]++
        fs.writeFile("./losses.json", JSON.stringify(losses), (err) => {
            if (err) console.log(err)
        })

        wins[oppo]++;
        fs.writeFile("./wins.json", JSON.stringify(wins), (err) => {
            if (err) console.log(err)
        })

        let json = JSON.parse(fs.readFileSync('./records.json'));
        json.push({"Result":`${oppo}>${maid}`});
        fs.writeFile("./records.json", JSON.stringify(json), (err) => {
            if (err) console.log(err)
        })

        return message.reply(`Your Goat Format loss to ${names[oppo]} has been recorded.`)
    }


    //MANUAL
    if(cmd === `!manual`) {
        const winner = messageArray[1].replace(/[\\<>@#&!]/g, "");
        const loser = messageArray[2].replace(/[\\<>@#&!]/g, "");
        const winningDude = message.channel.members.find('id', winner);
        const losingDude = message.channel.members.find('id', loser);
        const statsLoser = stats[loser];
        const statsWinner = stats[winner];

        if(!message.member.roles.has(modRole)) {
            return message.channel.send("You do not have permission to do that.")
        } else if(!winner || !loser){
            return message.channel.send("Please specify 2 players.")
        } else if(winner === "@" || loser === "@") {
            return message.channel.send("Please specify 2 players.")
        } else if(message.guild.members.get(winner).roles.has(botRole) || message.guild.members.get(loser).roles.has(botRole)) { 
            return message.channel.send("Sorry, Bots do not play Goat Format... *yet*.")
        } else if(winner === loser) {
            return message.channel.send("Please specify 2 different players.")
        } else if(!stats[loser]) {
	        createUser(loser);
            return message.channel.send(`Sorry, <@${loser}> was not in the Goat Format database. Please try again.`)
        } else if(!stats[winner]) {
	        createUser(winner);
            return message.channel.send(`Sorry, <@${winner}> was not in the Goat Format database. Please try again.`)
        }

        if (winningDude.roles.has(tourRole) || losingDude.roles.has(tourRole)) {
            return challongeClient.matches.index({
                id: status['tournament'],
                callback: (err, data) => {
                    if(err) {
                        return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                    } else {
                        return getParticipants(message, data, losingDude, winningDude)
                    }
                }
            }) 
        }

        backup[loser] = statsLoser;
        backup[winner] = statsWinner;
        fs.writeFile("./backup.json", JSON.stringify(backup), (err) => {
            if (err) console.log(err)
        })
    
        stats[loser] += 20 * (0 - (1 / (1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
        stats[winner] += 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
        fs.writeFile("./stats.json", JSON.stringify(stats), (err) => {
            if (err) console.log(err)
        })
    
        losses[loser]++
        fs.writeFile("./losses.json", JSON.stringify(losses), (err) => {
            if (err) console.log(err)
        })

        wins[winner]++;
        fs.writeFile("./wins.json", JSON.stringify(wins), (err) => {
            if (err) console.log(err)
        })

        let json = JSON.parse(fs.readFileSync('./records.json'));
        json.push({"Result":`${winner}>${loser}`});
        fs.writeFile("./records.json", JSON.stringify(json), (err) => {
            if (err) console.log(err)
        })

        return message.channel.send(`A manual Goat Format loss by ${names[loser]} to ${names[winner]} has been recorded.`)
    }


    //H2H
    if(h2hcom.includes(cmd)) {
        let rawdata = fs.readFileSync('./records.json')
        let rawobj = JSON.parse(rawdata);
        let p1
        let p2
        let p1wins = 0
        let p2wins = 0
        let i = 0
	
        if (messageArray.length === 2) {
	        p1 = messageArray[1].replace(/[\\<>@#&!]/g, "")
            p2 = maid
        } else if (messageArray.length === 3) {
	        p1 = messageArray[1].replace(/[\\<>@#&!]/g, "")
            p2 = messageArray[2].replace(/[\\<>@#&!]/g, "")
        }
            
        if(messageArray.length === 1 || messageArray.length === 0) {
            return message.channel.send("Please specify at least 1 other player.")
        } else if(messageArray.length > 3) {
            return message.channel.send("You may only compare 2 players at a time.")
        } else if(p1 == p2) {
            return message.channel.send("You must specify 2 different players.")
        } else if(!stats[p1] && p2 == maid) {
            return message.channel.send("That user is not in the Goat Format database.")
        } else if(!stats[p1] && p2 !== maid) {
            return message.channel.send("The first user is not in the Goat Format database.")
        } else if(!stats[p2] && p2 === maid) {
            return message.channel.send("You are not in the Goat Format database.")
        } else if(!stats[p2] && p2 !== maid) {
            return message.channel.send("The second user is not in the Goat Format database.")
        }

        for (i = 0; i < rawobj.length; i++) {
	        if(rawobj[i].Result === `${p1}>${p2}`) {
                p1wins++
            } else if(rawobj[i].Result === `${p2}>${p1}`) {
                p2wins++
            }
        }

        return message.channel.send(`${goat} --- H2H Goat Results --- ${goat}
${names[p1]} has won ${p1wins}x
${names[p2]} has won ${p2wins}x`)
    }


    //UNDO
    if(undocom.includes(cmd)) {
        let rawrecords = fs.readFileSync('./records.json');
        let rawobj = JSON.parse(rawrecords);
        let lastrecord = rawobj[rawobj.length - 1].Result;
        let winner;
        let loser;

        if(lastrecord.length === 35) {
	        winner = lastrecord.substring(0, 17)
            loser = lastrecord.substring(18, 35)
        } else if(lastrecord.length === 36 && lastrecord[17] === ">") {
		    winner = lastrecord.substring(0, 17)
            loser = lastrecord.substring(18, 36)
        } else if(lastrecord.length === 36 && lastrecord[17] !== ">") {
		    winner = lastrecord.substring(0, 18)
            loser = lastrecord.substring(19, 36)
        } else if(lastrecord.length === 37) {
	        winner = lastrecord.substring(0, 18)
            loser = lastrecord.substring(19, 37)
        }

        if(maid !== loser && !message.member.roles.has(modRole)) { 
            return message.channel.send("You did not lose the last Goat Format match so you may not undo it.")
        } else if(backup[winner] === "na" && maid !== loser) { 
            return message.channel.send(`${names[winner]} has no backup stats.`)
        } else if(backup[winner] === "na" && maid === loser) { 
            return message.channel.send(`Your last opponent, ${names[winner]}, has no backup stats. Please get a Moderator to help you.`)
        } else if(backup[loser] == "na" && maid !== loser) { 
            return message.channel.send(`${names[loser]} has no backup stats.`)
         } else if(backup[loser] == "na" && maid === loser) { 
            return message.channel.send("You have no backup stats. Please get a Moderator to help you.")
        }

        stats[winner] = backup[winner]
        stats[loser] = backup[loser]
        fs.writeFile("./stats.json", JSON.stringify(stats), (err) => {
	        if (err) console.log(err) });

        losses[loser]--
        fs.writeFile("./losses.json", JSON.stringify(losses), (err) => {
	        if (err) console.log(err) });

        wins[winner]--
        fs.writeFile("./wins.json", JSON.stringify(wins), (err) => {
	        if (err) console.log(err) });

        backup[winner] = "na";
        backup[loser] = "na";
        fs.writeFile("./backup.json", JSON.stringify(backup), (err) => { 
	        if (err) console.log(err) }); 

        let newobj = rawobj.splice(0, rawobj.length-1);
        fs.writeFile("./records.json", JSON.stringify(newobj), (err) => {
	        if (err) console.log(err) });

        return message.channel.send(`The last Goat Format match in which ${names[winner]} defeated ${names[loser]} has been erased.`)
    }


    //CENSUS
    if(cmd === `!census`) { 
        let i = 0
        const list = client.guilds.get(serverID)
        if(!message.member.roles.has(modRole)) {
            return message.channel.send("You do not have permission to do that.")
        }

        list.members.forEach(function(member){
	        i++
            revive(message, member, i)
        })
    }


    //RECALCULATE
    if(cmd === `!recalculate` || cmd === `!recalc`) { 
        let rawRecords = JSON.parse(fs.readFileSync('./records.json'))
        let rawStats = JSON.parse(fs.readFileSync('./stats.json'))
        let rawBackup = JSON.parse(fs.readFileSync('./backup.json'))
        let rawWins = JSON.parse(fs.readFileSync('./wins.json'))
        let rawLosses = JSON.parse(fs.readFileSync('./losses.json'))
        let arr2 = Object.keys(rawStats)
        let arr3 = Object.keys(rawBackup)
        let arr4 = Object.keys(rawWins)
        let arr5 = Object.keys(rawLosses)
        let len = Math.max(arr2.length, arr3.length, arr4.length, arr5.length)
        let winners = []
        let losers = []

        console.log(rawRecords)
        console.log(arr2)
        console.log(arr3)
        console.log(arr4)
        console.log(arr5)

        if(!message.member.roles.has(modRole)) {
            return message.channel.send("You do not have permission to do that.")
        }

        message.channel.send(`Resetting the stats of ${len} players. Please wait...`);

        for (let j = 0; j < len; j++) { 
            reset(arr2[j], arr2[j], arr2[j], arr2[j], j)
        }
        
        for (let i = 0; i < rawRecords.length; i++) {
            let record = rawRecords[i].Result
            console.log(record)
            
            if (record.length === 35) {
                winners[i] = record.substring(0, 17)
                losers[i] = record.substring(18, 35)
            } else if (record.length === 36 && record[17] === ">") {
    			winners[i] = record.substring(0, 17)
                losers[i] = record.substring(18, 36)
            } else if (record.length === 36 && record[17] !== ">") {
			    winners[i] = record.substring(0, 18)
                losers[i] = record.substring(19, 36)
            } else if (record.length === 37) {
                winners[i] = record.substring(0, 18)
                losers[i] = record.substring(19, 37)
            }
            
            console.log(winners[i])
            console.log(losers[i])
            console.log(rawRecords.length)
            console.log(arr2.length)

            restore(message, winners[i], losers[i], i, rawRecords.length, arr2.length)
        }
    }
})


//FUNCTIONS
//RESET
function reset(arr2, arr3, arr4, arr5, j) {
	return setTimeout(function() {
		stats[arr2] = 500;
		fs.writeFile('./stats.json', JSON.stringify(stats), (err) => { 
            if (err) console.log(err)
        })

		backup[arr3] = 0;
		fs.writeFile('./backup.json', JSON.stringify(backup), (err) => { 
            if (err) console.log(err)
        })

		wins[arr4] = 0;
		fs.writeFile('./wins.json', JSON.stringify(wins), (err) => { 
            if (err) console.log(err)
        })

		losses[arr5] = 0;
		fs.writeFile('./losses.json', JSON.stringify(losses), (err) => { 
            if (err) console.log(err)
        })
    }, (j + 1) * 100) 
}


//RESTORE
function restore(message, winner, loser, num, length1, length2) {
	return setTimeout(function(){
		let statsLoser = stats[loser]
        let statsWinner = stats[winner]
        console.log(statsLoser)
        console.log(statsWinner)
        
		backup[winner] = statsWinner
		backup[loser] = statsLoser
		fs.writeFile('./backup.json', JSON.stringify(backup), (err) => { 
            if (err) console.log(err)
        }) 

		stats[loser] += 20 * (0 - (1 / (1 + (Math.pow(10, ((statsWinner-statsLoser) / 400))))))
		stats[winner] += 20 * (1 - (1 - 1 / (1 + (Math.pow(10, ((statsWinner-statsLoser) / 400))))))
		fs.writeFile('./stats.json', JSON.stringify(stats), (err) => {
            if (err) console.log(err)
        })

		losses[loser]++;
		fs.writeFile('./losses.json', JSON.stringify(losses), (err) => {
            if (err) console.log(err)
        })

		wins[winner]++;
		fs.writeFile('./wins.json', JSON.stringify(wins), (err) => {
            if (err) console.log(err)
        })

		message.channel.send(`Goat Format Match #${(num+1)} in which ${names[winner]} defeated ${names[loser]} has been recorded.`); 

		if (num === length1 - 1 ) {
            return message.channel.send("Elo recalculation complete!")
        }
    }, (num + 1 + ( 1 / 10 * length2)) * 1000)
}


//REVIVE
function revive(message, person, num) {
	if(!names[person.user.id] && person.user.username) {
	    return setTimeout(function() {
		    names[person.user.id] = person.user.username
   		    fs.writeFile("./names.json", JSON.stringify(names), (err) => {
                if (err) console.log(err)
            })

            message.channel.send(`${names[person.user.id]} has been added to the name database!`)
        }, num * 500)
    }
}


//CREATEUSER
function createUser(player, person) {
	if(!names[player] && person) {
		names[player] = person.user.username;
   		fs.writeFile("./names.json", JSON.stringify(names), (err) => {
            if (err) console.log(err) }); }
            
	if(!blank[player]) {
		blank[player] = 0;
   		fs.writeFile("./blank.json", JSON.stringify(blank), (err) => {
			if (err) console.log(err) }); }
            
	if(!replays[player]) {
		replays[player] = {
            0: false,
            1: false,
            2: false,
            3: false,
            4: false,
            5: false,
            6: false,
            7: false,
            8: false,
            9: false,
            10: false,
            11: false,
            12: false,
            13: false,
            14: false,
            15: false,
            16: false,
            17: false,
            18: false,
            19: false,
            20: false,
            21: false,
            22: false,
            23: false,
            24: false,
            25: false,
            26: false,
            27: false,
            28: false,
            29: false,
            30: false,
            31: false,
            32: false,
            33: false,
            34: false,
            35: false,
            36: false,
            37: false,
            38: false,
            39: false,
            40: false,
            41: false,
            42: false,
            43: false,
            44: false,
            45: false,
            46: false,
            47: false,
            48: false,
            49: false
        }
   		fs.writeFile("./replays.json", JSON.stringify(replays), (err) => {
            if (err) console.log(err) }); }
            
	if(!decks[player]) {
		decks[player] = {
            tournament: {
                url: false,
                name: false
            },
            goatControl: {
                url: false,
                category: 'control',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            chaosControl: {
                url: false,
                category: 'control',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            chaosRecruiter: {
                url: false,
                category: 'aggro',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            dimensionFusionTurbo: {
                url: false,
                category: 'combo',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            reasoningGateTurbo: {
                url: false,
                category: 'combo',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            chaosFlipTurbo: {
                url: false,
                category: 'control',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            flipControl: {
                url: false,
                category: 'control',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            warrior: {
                url: false,
                category: 'aggro',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            gearfried: {
                url: false,
                category: 'aggro',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            tigerStun: {
                url: false,
                category: 'aggro',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            drainBeat: {
                url: false,
                category: 'aggro',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            aggroBurn: {
                url: false,
                category: 'burn',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            aggroMonarch: {
                url: false,
                category: 'aggro',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            rescueCat: {
                url: false,
                category: 'combo',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            darkBurn: {
                url: false,
                category: 'burn',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            drainBurn: {
                url: false,
                category: 'burn',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            speedBurn: {
                url: false,
                category: 'burn',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            economicsFTK: {
                url: false,
                category: 'combo',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            libraryFTK: {
                url: false,
                category: 'combo',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            exodia: {
                url: false,
                category: 'combo',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            lastTurn: {
                url: false,
                category: 'combo',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            emptyJar: {
                url: false,
                category: 'combo',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            gravekeeper: {
                url: false,
                category: 'aggro',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            machine: {
                url: false,
                category: 'other',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            water: {
                url: false,
                category: 'other',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            zombie: {
                url: false,
                category: 'other',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            darkScorpion: {
                url: false,
                category: 'other',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            darkMasterZorc: {
                url: false,
                category: 'control',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            relinquished: {
                url: false,
                category: 'control',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            strikeNinja: {
                url: false,
                category: 'aggro',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            bazooReturn: {
                url: false,
                category: 'aggro',
                rating: 0,
                posRaters: [],
                negRaters: []
            },
            other: {
                url: false,
                category: 'other',
                rating: 0,
                posRaters: [],
                negRaters: []
            }
        };
   		fs.writeFile("./decks.json", JSON.stringify(decks), (err) => {
			if (err) console.log(err) }); }

	if(!stats[player]) {
		stats[player] = 500;
   		fs.writeFile("./stats.json", JSON.stringify(stats), (err) => {
			if (err) console.log(err) }); }

	if(!backup[player]) {
		backup[player] = 0;
   		fs.writeFile("./backup.json", JSON.stringify(backup), (err) => {
			if (err) console.log(err) }); }

	if(!wins[player]) {
		wins[player] = 0;
   		fs.writeFile("./wins.json", JSON.stringify(wins), (err) => {
			if (err) console.log(err) }); }

	if(!losses[player]) {
		losses[player] = 0;
   		fs.writeFile("./losses.json", JSON.stringify(losses), (err) => {
			if (err) console.log(err) }); }

}

//CHECK RESUBMISSION
async function checkResubmission(message, dude) {
    let person = message.channel.members.find('id', dude);
    const filter = m => m.author.id === dude
	const msg = await person.send(`You already signed up for the tournament, do you want to resubmit your deck list?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 10000
    }).then(collected => {
        if (yesSynonyms.includes(collected.first().content.toLowerCase())) {
            return getDeckURL(message, dude)
        } else if (noSynonyms.includes(collected.first().content.toLowerCase())) {
            clearRegistrationStatus(message)
            return person.send(`Not a problem. Thanks.`)
        }
    }).catch(err => {
        clearRegistrationStatus(message)
        return person.send(`Perhaps another time would be better.`)
    })
}

//GET DECK URL
async function getDeckURL(message, dude) {
    let person = message.channel.members.find('id', dude);
    const msg = await person.send("Okay, please provide an imgur screenshot or a duelingbook download link for your tournament deck.");
    const filter = collected => collected.author.id === dude;
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 16000
    }).then(collected => {
        if ( (!collected.first().content.startsWith("https://i") && !collected.first().content.startsWith("https://www.duelingbook.com/deck")) || collected.first().content.length > 46) {		
            return person.send("I only accept (1) imgur.com or duelingbook.com link.")
        } else if (collected.first().content.startsWith("https://i.imgur") || collected.first().content.startsWith("https://www.duelingbook.com/deck")) {
            return getDeckTypeTournament(message, dude, collected.first().content)
        } else if (collected.first().content.startsWith("https://imgur")) {
            let url = `https://i.${collected.first().content.join(" ").substring(8, collected.first().content.join(" ").length)}.png`
            return getDeckTypeTournament(message, dude, url)          
        }
    }).catch(err => {
        clearRegistrationStatus(message)
        return person.send('Perhaps another time would be better.')
    })
}


//GET DECK TYPE
const getDeckType = (message, dude, url, tournament = false) => {
    let keys = Object.keys(deckTypeAlius)
	const filter = m => m.author.id === dude
	message.channel.send(`Okay, ${names[dude]}, what kind of deck is this?`)
	message.channel.awaitMessages(filter, {
		max: 1,
        time: 16000
    }).then(collected => {
        keys.forEach(function(elem) {
            if (deckTypeAlius[elem].includes(collected.first().content.toLowerCase()) || collected.first().content.toLowerCase() === 'other') {
                if (decks[dude][elem].url) {
                    return getDeckOverwriteConfirmation(message, dude, url, elem, deckTypeAlius[elem][0])
               } else {
                    decks[dude][elem].url = url
                    fs.writeFile("./decks.json", JSON.stringify(decks), (err) => {
                        if (err) console.log(err)
                    })
                        
                    if (deckTypeAlius[elem][0] === 'Other') {
                        return message.channel.send(`Thanks! I have saved your deck to the public database.`)
                    } else {
                        return message.channel.send(`Thanks! I have saved your ${deckTypeAlius[elem][0]} deck to the public database.`)       
                    }
               }
            }
        })
        const deckEmbed = new Discord.RichEmbed()
            .addField(`Goat Control
Chaos Control
Chaos Recruiter
Chaos Return
Chaos Turbo
Dimension Fusion Turbo
Reasoning Gate Turbo
Soul Control
Flip Control`)
            .addField(`Anti-Meta Warrior
Gearfried
Tiger Stun
Drain Beat
Aggro Burn
Aggro Monarch
Rescue Cat OTK
Ben-Kei OTK
Stein OTK`)
            .addField(`Dark Burn
Drain Burn
Speed Burn
P.A.C.M.A.N.
Economics FTK
Library FTK
Exodia
Last Turn
Empty Jar`)
            .addField(`Gravekeeper
Machine
Water
Zombie
Dark Scorpion
Dark Master Zorc
Relinquished
Strike Ninja
Bazoo Return.`)
        message.channel.send(`Hmm... ${collected.first().content}? I do not recognize that deck. If your deck is not on the list below, you can save it as "Other":`)
        return message.channel.send(deckEmbed);
    }).catch(err => {    
        console.log(err)
    })
}




//GET DECK TYPE
async function getDeckTypeTournament(message, dude, url) {
    let keys = Object.keys(deckTypeAlius)
    let person = message.channel.members.find('id', dude);
	const filter = m => m.author.id === dude
	const msg = await person.send(`Okay, ${names[dude]}, what kind of deck is this?`)
    const collected = await msg.channel.awaitMessages(filter, {
		max: 1,
        time: 16000
    }).then(collected => {
        keys.forEach(function(elem) {
            if (deckTypeAlius[elem].includes(collected.first().content.toLowerCase()) || collected.first().content.toLowerCase() === 'other') {
                decks[dude].tournament.url = url
                decks[dude].tournament.name = elem
                fs.writeFile("./decks.json", JSON.stringify(decks), (err) => {
                    if (err) console.log(err)
                })

                if (elem === 'other') {
                    clearRegistrationStatus(message)
                    sendToTournamentChannel(dude, url, deckTypeAlius[elem][0])
                    return person.send(`Thanks! I have collected your deck list for the tournament. Please wait for the Tournament Organizer to add you to the bracket.`)
                } else {
                    clearRegistrationStatus(message)
                    sendToTournamentChannel(dude, url, deckTypeAlius[elem][0])
                    return person.send(`Thanks! I have collected your ${deckTypeAlius[elem][0]} deck list for the tournament. Please wait for the Tournament Organizer to add you to the bracket.`)
                }
            } 
        })

        decks[dude].tournament.url = url
        decks[dude].tournament.name = 'other'
        fs.writeFile("./decks.json", JSON.stringify(decks), (err) => {
            if (err) console.log(err)
        })
          
        clearRegistrationStatus(message)
        sendToTournamentChannel(dude, url, 'Other')
        return person.send(`Hmm... ${collected.first().content}? I do not recognize that deck. Let's call it "Other" for now. Please wait for the Tournament Organizer to add you to the bracket.`)
    }).catch(err => {
        decks[dude].tournament.url = url
        decks[dude].tournament.name = 'other'
        fs.writeFile("./decks.json", JSON.stringify(decks), (err) => {
            if (err) console.log(err)
        })
          
        clearRegistrationStatus(message)
        sendToTournamentChannel(dude, url, 'Other')
        return person.send(`Well, let's call it "Other" for now. Please wait for the Tournament Organizer to add you to the bracket.`)
    })
}




//REMOVE PARTICIPANT
const removeParticipant = (message, participants, name, person, drop = false) => {    
    let participantID
    let keys = Object.keys(participants)
    let dude = message.channel.members.find('id', person.id)
    keys.forEach(function(elem) {
        if (participants[elem].participant.name === person.username) {
            participantID = participants[elem].participant.id
        }
    })

    if (!dude) {
        return message.channel.send('I could not find that person in the server.')
    } 

    challongeClient.participants.destroy({
        id: name,
        participantID: participantID,
        callback: (err) => {
            if(err) {
                if (drop) {
                    return message.channel.send(`Hmm... I don't see you in the participants list.`)
                } else {
                    return message.channel.send(`Error: could not find "${person.username}" in the participants list.`)
                }
            } else {
                dude.removeRole(tourRole)
                if (drop) {
                    return message.channel.send(`I have removed you from the tournament. Better luck next time!`)
                } else {
                    return message.channel.send(`${person.username} has been removed from the tournament.`)
                }
            }
        }
    })
}




//TOURNAMENT CHECK
const getParticipants = (message, matches, loser, winner) => {
    challongeClient.participants.index({
        id: status['tournament'],
        callback: (err, data) => {
            if(err) {
                return message.channel.send(`Error: the current tournament, "${status['tournament']}", could not be accessed.`)
            } else {
                return addMatchResult(message, matches, data, loser, winner)
            }
        }
    })
}


//CHECK MATCHES
const addMatchResult = (message, matches, participants, loser, winner) => {
    let loserID
    let winnerID
    let matchID
    let matchComplete = false
    let score
    let players = Object.keys(participants)
    players.forEach(function(elem) {
        if (participants[elem].participant.name === loser.user.username) {
            loserID = participants[elem].participant.id
        } else if (participants[elem].participant.name === winner.user.username) {
            winnerID = participants[elem].participant.id
        }
    })

    let keys = Object.keys(matches)
    keys.forEach(function(elem) {
        if ( (matches[elem].match.player1Id === loserID && matches[elem].match.player2Id === winnerID) || (matches[elem].match.player2Id === loserID && matches[elem].match.player1Id === winnerID) ) {
            if (matches[elem].match.state === 'complete') {
                matchComplete = true
            } else if (matches[elem].match.state === 'open') {
                matchID = matches[elem].match.id
                score = (matches[elem].match.player1Id === loserID ? '0-1' : '1-0')
            }
        }
    })

    if (!winnerID) {
        return message.channel.send(`${winner.user.username} is not in the tournament.`)
    } else if (!loserID) {
        return message.channel.send(`${loser.user.username} is not in the tournament.`)
    } else if (matchComplete && !matchID) {
        return message.channel.send(`The match result between ${winner.user.username} and ${loser.user.username} was already recorded.`)
    } else if (!matchComplete && !matchID) {
        return message.channel.send(`${winner.user.username} and ${loser.user.username} were not supposed to play a match.`)
    } else if (matchID) {
        challongeClient.matches.update({
            id: status['tournament'],
            matchId: matchID,
            match: {
              scoresCsv: score,
              winnerId: winnerID
            },
            callback: (err) => {
                if(err) {
                    return message.channel.send(`Error: The match between ${winner.user.username} and ${loser.user.username} could not be updated.`)
                } else {
                    const statsLoser = stats[loser.user.id];
                    const statsWinner = stats[winner.user.id];
                    backup[loser.user.id] = statsLoser;
                    backup[winner.user.id] = statsWinner;
                    fs.writeFile("./backup.json", JSON.stringify(backup), (err) => {
                        if (err) console.log(err)
                    })
            
                    stats[loser.user.id] += 20 * (0 - (1 / (1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
                    stats[winner.user.id] += 20 * (1 - (1 - 1 / ( 1 + (Math.pow(10, ((statsWinner - statsLoser) / 400))))))
                    fs.writeFile("./stats.json", JSON.stringify(stats), (err) => {
                        if (err) console.log(err)
                    })
            
                    losses[loser.user.id]++
                    fs.writeFile("./losses.json", JSON.stringify(losses), (err) => {
                        if (err) console.log(err)
                    })
            
                    wins[winner.user.id]++;
                    fs.writeFile("./wins.json", JSON.stringify(wins), (err) => {
                        if (err) console.log(err)
                    })
            
                    let json = JSON.parse(fs.readFileSync('./records.json'));
                    json.push({"Result":`${winner.user.id}>${loser.user.id}`});
                    fs.writeFile("./records.json", JSON.stringify(json), (err) => {
                        if (err) console.log(err)
                    })
                    
                    message.channel.send(`<@${loser.user.id}>, Your tournament loss to ${winner.user.username} has been recorded.`)
                    return setTimeout(function() {
                        getUpdatedMatchesObject(message, participants, matchID, loserID, winnerID, loser, winner)
                    }, 3000)	
                }
            }
        })
    }
}

const getUpdatedMatchesObject = (message, participants, matchID, loserID, winnerID, loser, winner) => {
    return challongeClient.matches.index({
        id: status['tournament'],
        callback: (err, data) => {
            if(err) {
                return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
            } else {
                return checkMatches(message, data, participants, matchID, loserID, winnerID, loser, winner)
            }
        }
    }) 
}

//CHECK MATCHES
const checkMatches = (message, matches, participants, matchID, loserID, winnerID, loser, winner) => {
    let newOppoIDLoser
    let newOppoLoser
    let matchWaitingOnLoser
    let matchWaitingOnLoserP1ID
    let matchWaitingOnLoserP2ID
    let matchWaitingOnLoserP1
    let matchWaitingOnLoserP2
    let newOppoIDWinner
    let newOppoWinner
    let matchWaitingOnWinner
    let matchWaitingOnWinnerP1ID
    let matchWaitingOnWinnerP2ID
    let matchWaitingOnWinnerP1
    let matchWaitingOnWinnerP2
    let keys = Object.keys(matches)
    let players = Object.keys(participants)

    keys.forEach(function(elem) {
        if ( (matches[elem].match.player1Id === winnerID || matches[elem].match.player2Id === winnerID) && (matches[elem].match.player1PrereqMatchId === matchID || matches[elem].match.player2PrereqMatchId === matchID) ) {
            if (matches[elem].match.state === 'pending') {
                matchWaitingOnWinner = (matches[elem].match.player1PrereqMatchId === matchID ? matches[elem].match.player2PrereqMatchId : matches[elem].match.player1PrereqMatchId)
            } else if (matches[elem].match.state === 'open') {
                newOppoIDWinner = (matches[elem].match.player1Id === winnerID ? matches[elem].match.player2Id : matches[elem].match.player1Id)
                newMatchIDWinner = matches[elem].match.id
            }
        } else if ( (matches[elem].match.player1Id === loserID || matches[elem].match.player2Id === loserID) && (matches[elem].match.player1PrereqMatchId === matchID || matches[elem].match.player2PrereqMatchId === matchID) ) {
            if (matches[elem].match.state === 'pending') {
                matchWaitingOnLoser = (matches[elem].match.player1PrereqMatchId === matchID ? matches[elem].match.player2PrereqMatchId : matches[elem].match.player1PrereqMatchId)
            } else if (matches[elem].match.state === 'open') {
                newOppoIDLoser = (matches[elem].match.player1Id === loserID ? matches[elem].match.player2Id : matches[elem].match.player1Id)
                newMatchIDLoser = matches[elem].match.id
            }
        }
    })

    keys.forEach(function(elem) {
        if (matches[elem].match.id === matchWaitingOnLoser) {
            matchWaitingOnLoserP1ID = matches[elem].match.player1Id
            matchWaitingOnLoserP2ID = matches[elem].match.player2Id
        }
        
        if (matches[elem].match.id === matchWaitingOnWinner) {
            matchWaitingOnWinnerP1ID = matches[elem].match.player1Id
            matchWaitingOnWinnerP2ID = matches[elem].match.player2Id
        }
    })

    players.forEach(function(elem) {
         if (participants[elem].participant.id === newOppoIDLoser) {
            newOppoLoser = discordIDs[participants[elem].participant.name]
         }

         if (participants[elem].participant.id === newOppoIDWinner) {
            newOppoWinner = discordIDs[participants[elem].participant.name]
         }
         
         if (participants[elem].participant.id === matchWaitingOnLoserP1ID) {
            matchWaitingOnLoserP1 = participants[elem].participant.name
         }
         
         if (participants[elem].participant.id === matchWaitingOnLoserP2ID) {
            matchWaitingOnLoserP2 = participants[elem].participant.name
         }
         
         if (participants[elem].participant.id === matchWaitingOnWinnerP1ID) {
            matchWaitingOnWinnerP1 = participants[elem].participant.name
         }
         
         if (participants[elem].participant.id === matchWaitingOnWinnerP2ID) {
            matchWaitingOnWinnerP2 = participants[elem].participant.name
         }
    })

    if (matchWaitingOnLoser) {
        message.channel.send(`${loser.user.username}, You are waiting for the result of ${matchWaitingOnLoserP1} vs ${matchWaitingOnLoserP2}.`)
    } else if (newOppoLoser) {
        message.channel.send(`New Match: <@${loser.user.id}> vs <@${newOppoLoser}>. Good luck to both duelists.`)
    } else if (matchWaitingOnLoser) {
        message.channel.send(`${loser.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
    } else {
        loser.removeRole(tourRole)
        message.channel.send(`${loser.user.username}, You are eliminated from the tournament. Better luck next time!`)
    }

    if (matchWaitingOnWinner) {
        message.channel.send(`${winner.user.username}, You are waiting for the result of ${matchWaitingOnWinnerP1} vs ${matchWaitingOnWinnerP2}.`)
    } else if (newOppoWinner) {
        message.channel.send(`New Match: <@${winner.user.id}> vs <@${newOppoWinner}>. Good luck to both duelists.`)
    } else if (matchWaitingOnWinner) {
        message.channel.send(`${winner.user.username}, You are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
    } else {
        winner.removeRole(tourRole)
        message.channel.send(`<@${winner.user.id}>, You won the tournament! Congratulations on your stellar performance!`)
    }
    
    return
}


//CLEAR REGISTRATION STATUS
const clearRegistrationStatus = (message, x) => {
    status['registration'] = 'waiting';
    fs.writeFile("./status.json", JSON.stringify(status), (err) => {
        if (err) console.log(err) });
    if (x) {
        return message.channel.send('The registration status has been manually reset.')
    }
}


//SEND TO TOURNAMENT CHANNEL
const sendToTournamentChannel = (player, deckList, deckType) => {
    return client.channels.get(registrationChannel).send(`<@${player}> submitted their ${deckType} deck list for the tournament. Please confirm this deck is legal and accurately labeled, then add ${names[player]} to the bracket using the **!signup** command:
${deckList}`)
}