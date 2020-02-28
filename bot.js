
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
const challongeClient = challonge.createClient({
    apiKey: 'JE7pFfKV8XhdZXshqHNjVySDfoVUZeAtDRcULUln'
});

const blank = require('./blank.json')
const status = require('./status.json')
const discordIDs = require('./discordIDs.json')
const names = require('./names.json')
const decks = require('./decks.json') 
const stats = require('./stats.json')
const backup = require('./backup.json') 
const wins = require('./wins.json') 
const losses = require('./losses.json')

const pfpcom = ['!pfp', '!profile', '!avatar']
const botcom = ['!bot', '!help', '!info']
const rolecom = ['!role', '!rankedgoats']
const statscom = ['!stats', '!mystats', '!goatstats']
const losscom = ['!lossvs','!loss','!lose','!goatloss','!goatlossvs','!goatlose']
const h2hcom = ['!h2h', '!head2head', '!headtohead']
const undocom = ['!undolast', '!undo', '!undoloss']
const rankcom = ['!rank', '!top', '!ladder']

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

    if (message.guild.id !== serverID) { 
        return
    } else if (message.member.roles.has(botRole)) {
        return
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
        console.log(args[0])
        console.log(status['tournament'])
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
                    return message.channel.send(`Let's go! Your tournament is starting now: https://challonge.com/${name}.`)
                }
            }
          });  
    }


    //CHALLONGE - SIGNUP
    if(cmd === `!signup`) {
        let name = status['tournament']
        let person = message.mentions.users.first()

        if (!name) {
            return message.channel.send('There is no active tournament.')
        } else if (!person) {
            return message.channel.send('Please provide an @ mention of the player you wish to sign-up for the tournament.')
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

        if (!name) {
            return message.channel.send('There is no active tournament.')
        } else if (!person) {
            return message.channel.send('Please provide an @ mention of the player you wish to sign-up for the tournament.')
        }
        
        challongeClient.participants.index({
            id: name,
            callback: (err, data) => {
                if(err) {
                    return message.channel.send(`Error: the current tournament, "${name}", could not be accessed.`)
                } else {
                    console.log('ok...')
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


    //AVATAR
    if(pfpcom.includes(cmd)) {
        let person = message.mentions.users.first()
        if (person) {
            return message.channel.send(person.avatarURL)
     } else {
            return message.channel.send(message.author.avatarURL)
        }
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
    console.log('restoring...')
	return setTimeout(function(){
        console.log('restoring timeout running...')
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
            
	if(!decks[player]) {
		decks[player] = {};
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


//REMOVE PARTICIPANT
const removeParticipant = (message, participants, name, person, drop = false) => {    
    let participantID
    let keys = Object.keys(participants)
    keys.forEach(function(elem) {
        if (participants[elem].participant.name === person.username) {
            participantID = participants[elem].participant.id
        }
    })

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
    let newMatchIDLoser
    let matchWaitingOnLoser
    let matchWaitingOnLoserP1ID
    let matchWaitingOnLoserP2ID
    let matchWaitingOnLoserP1
    let matchWaitingOnLoserP2
    let newOppoIDWinner
    let newOppoWinner
    let newMatchIDWinner
    let matchWaitingOnWinner
    let matchWaitingOnWinnerP1ID
    let matchWaitingOnWinnerP2ID
    let matchWaitingOnWinnerP1
    let matchWaitingOnWinnerP2
    let keys = Object.keys(matches)
    let players = Object.keys(participants)

    console.log(participants)

    console.log('matchID is', matchID)
    console.log('loserID is', loserID)
    console.log('winnerID is', winnerID)

    keys.forEach(function(elem) {
        console.log('checking a match...')
        console.log('player1Id is', matches[elem].match.player1Id)
        console.log('player2Id is', matches[elem].match.player2Id)
        console.log('player1PrereqMatchId is', matches[elem].match.player1PrereqMatchId)
        console.log('player2PrereqMatchId is', matches[elem].match.player2PrereqMatchId)
        if ( (matches[elem].match.player1Id === winnerID || matches[elem].match.player2Id === winnerID) && (matches[elem].match.player1PrereqMatchId === matchID || matches[elem].match.player2PrereqMatchId === matchID) ) {
            if (matches[elem].match.state === 'pending') {
                console.log('this matching match is PENDING...')
                matchWaitingOnWinner = (matches[elem].match.player1PrereqMatchId === matchID ? matches[elem].match.player2PrereqMatchId : matches[elem].match.player1PrereqMatchId)
            } else if (matches[elem].match.state === 'open') {
                console.log('this matching match is OPEN...')
                newOppoIDWinner = (matches[elem].match.player1Id === winnerID ? matches[elem].match.player2Id : matches[elem].match.player1Id)
                newMatchIDWinner = matches[elem].match.id
            }
        } else if ( (matches[elem].match.player1Id === loserID || matches[elem].match.player2Id === loserID) && (matches[elem].match.player1PrereqMatchId === matchID || matches[elem].match.player2PrereqMatchId === matchID) ) {
            if (matches[elem].match.state === 'pending') {
                console.log('this matching match is PENDING...')
                matchWaitingOnLoser = (matches[elem].match.player1PrereqMatchId === matchID ? matches[elem].match.player2PrereqMatchId : matches[elem].match.player1PrereqMatchId)
            } else if (matches[elem].match.state === 'open') {
                console.log('this matching match is OPEN...')
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

    console.log('done checking matches...')
    console.log(`loser is about to play in ${newMatchIDLoser} against ${newOppoIDLoser}`)
    console.log(`loser is waiting on ${matchWaitingOnLoser}: ${matchWaitingOnLoserP1ID} vs ${matchWaitingOnLoserP2ID}`)
    console.log(`winner is about to play in ${newMatchIDWinner} against ${newOppoIDWinner}`)
    console.log(`winner is waiting on ${matchWaitingOnWinner}: ${matchWaitingOnWinnerP1ID} vs ${matchWaitingOnWinnerP2ID}`)

    players.forEach(function(elem) {
        console.log('checking a participant:', participants[elem].participant.id)
         if (participants[elem].participant.id === newOppoIDLoser) {
            console.log('^ this is the new opponent for the loser')
            newOppoLoser = discordIDs[participants[elem].participant.name]
         }

         if (participants[elem].participant.id === newOppoIDWinner) {
            console.log('^ this is the new opponent for the winner')
            newOppoWinner = discordIDs[participants[elem].participant.name]
         }
         
         if (participants[elem].participant.id === matchWaitingOnLoserP1ID) {
            console.log('^ this is p1 that the loser is waiting on')
            matchWaitingOnLoserP1 = participants[elem].participant.name
         }
         
         if (participants[elem].participant.id === matchWaitingOnLoserP2ID) {
            console.log('^ this is p2 that the loser is waiting on')
            matchWaitingOnLoserP2 = participants[elem].participant.name
         }
         
         if (participants[elem].participant.id === matchWaitingOnWinnerP1ID) {
            console.log('^ this is p1 that the winner is waiting on')
            matchWaitingOnWinnerP1 = participants[elem].participant.name
         }
         
         if (participants[elem].participant.id === matchWaitingOnWinnerP2ID) {
            console.log('^ this is p2 that the winner is waiting on')
            matchWaitingOnWinnerP2 = participants[elem].participant.name
         }
    })


    console.log('newOppoLoser is', newOppoLoser)
    console.log('newOppoWinner is', newOppoWinner)
    console.log('matchWaitingOnLoserP1 is', matchWaitingOnLoserP1)
    console.log('matchWaitingOnLoserP2 is', matchWaitingOnLoserP2)
    console.log('matchWaitingOnWinnerP1 is', matchWaitingOnWinnerP1)
    console.log('matchWaitingOnWinnerP2 is', matchWaitingOnWinnerP2)

    if (matchWaitingOnLoser) {
        message.channel.send(`${loser.user.id}, you are waiting for the result of ${matchWaitingOnLoserP1} vs ${matchWaitingOnLoserP2}.`)
    } else if (newOppoLoser) {
        message.channel.send(`New Match: <@${loser.user.id}> vs <@${newOppoLoser}>. Good luck to both duelists.`)
    } else if (matchWaitingOnLoser) {
        message.channel.send(`${loser.user.username}, you are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
    } else {
        message.channel.send(`<@${loser.user.id}>, you are eliminated from the tournament. Better luck next time!`)
    }

    if (matchWaitingOnWinner) {
        message.channel.send(`${winner.user.username}, you are waiting for the result of ${matchWaitingOnWinnerP1} vs ${matchWaitingOnWinnerP2}.`)
    } else if (newOppoWinner) {
        message.channel.send(`New Match: <@${winner.user.id}> vs <@${newOppoWinner}>. Good luck to both duelists.`)
    } else if (matchWaitingOnWinner) {
        message.channel.send(`${winner.user.username}, you are waiting for multiple matches to finish. Grab a snack and stay hydrated.`)
    } else {
        message.channel.send(`<@${winner.user.id}>, congratulations, you won the tournament!`)
    }
    
    return
}