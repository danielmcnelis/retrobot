
//GOATBOT - A RANKINGS BOT FOR GOATFORMAT.COM
const Discord = require('discord.js')
const client = new Discord.Client()
const fs = require('fs')
const serverID = '682361248532398143'
const botRole = '682389567185223713'
const modRole = '682361608848015409'

const blank = require('./blank.json')
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
			return message.channel.send("I have added you to the Ranked Goats role."); }
		else {
            message.member.removeRole(goatRole);
            return message.channel.send("I have removed you from the Ranked Goats role."); }
        }


    //BOT USER GUIDE
    if(botcom.includes(cmd)) {
        const botEmbed = new Discord.RichEmbed()
	        .setColor('#38C368')
        	.setTitle('GoatBot')
	        .setDescription('A rankings bot for Goat Format.\n' )
	        .setURL('https://goatformat.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/93IC0Ua.png', 'https://formatlibrary.com/')
        	.setThumbnail('https://i.imgur.com/9lMCJJH.png')
        	.addField('How to Use This Guide', 'All commands begin with an "!". Commands may also use the following inputs: (blank) no input, (@user) mention a user, (n) a number, (link) a URL. ')
        	.addField('Ranked Commands', '\n!loss - (@user) - Report a loss to another player. \n!stats - (blank or @user) - Post a player’s stats. \n!top - (n) - Post the server’s top players (100 max). \n!h2h - (@user + @user) - Post the H2H record between 2 players. \n!role - Add or remove the Ranked Goats role. \n!undo - Undo the last loss if you reported it. \n')
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
	        .setDescription('A rankings bot for Goat Format.\n' )
	        .setURL('https://goatformat.com/')
	        .setAuthor('Jazz#2704', 'https://i.imgur.com/93IC0Ua.png', 'https://formatlibrary.com/')
        	.setThumbnail('https://i.imgur.com/9lMCJJH.png')
        	.addField('Mod Only Commands', 'All commands begin with an "!". Commands may also use the following inputs: (blank) no input, (@user) mention a user, (n) a number, (link) a URL. ')
        	.addField('Ranked Commands', '\n!manual - (@winner + @loser) - Manually record a match result. \n!undo - Undo the most recent loss, even if you did not report it. \n')
        	.addField('Server Commands', '\n!rename - (@user + new name) - Rename a user in the database.\n!census - Add missing names to the database.\n!recalc - Recaluate all Player Stats after manually deleting records.');

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
Wins: ${wins[player]}
Losses: ${losses[player]}
Elo Rating: ${stats[player].toFixed(2)}`)
    }


    //RANK
    if(rankcom.includes(cmd)) {
        let x = args[0]
        let j = 0;
        let medals = []
        let result = [`${goat} --- Top ${x} Goat Format Players --- ${goat}`]
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
                medals[k] = rock
            } else if (arr2[i] > 350 && arr2[i] <= 410) {
                medals[k] = bron
            } else if (arr2[i] > 410 && arr2[i] <= 470) {
                medals[k] = silv
            } else if (arr2[i] > 470 && arr2[i] <= 530) {
                medals[k] = gold
            } else if (arr2[i] > 530 && arr2[i] <= 590) {
                medals[k] = plat
            } else if (arr2[i] > 590 && arr2[i] <=650) {
                medals[k] = dia
            } else if (arr2[i] > 650 && arr2[i] <=710) {
                medals[k] = mast
            } else {
                medals[i] = lgnd
            }
        }
    
        for (let i = 0; i < x; i++) { 
            result[i+1] = `${(i+1)}. ${medals[i]} ${names[arr5[i]]}`
        }
    
       if (x == 1) {
           return message.channel.send(`${goat} --- The Best Goat Format Player --- ${goat}
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

        backup[maid] = statsLoser;
        backup[oppo] = statsWinner;
        fs.writeFile(backupfile, JSON.stringify(backup), (err) => {
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

        return message.reply(`Your Goat Format loss to ${names[rM]} has been recorded.`)
    }


    //MANUAL
    if(cmd === `!manual`) {
        const winner = messageArray[1].replace(/[\\<>@#&!]/g, "");
        const loser = messageArray[2].replace(/[\\<>@#&!]/g, "");
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

        backup[loser] = statsLoser;
        backup[winner] = statsWinner;
        fs.writeFile(backupfile, JSON.stringify(backup), (err) => {
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
            return message.channel.send(`Your last opponent, ${names[p1]}, has no backup stats. Please get a Moderator to help you.`)
        } else if(backup[loser] == "na" && maid !== loser) { 
            return message.channel.send(`${names[loser]} has no backup stats.`)
         } else if(backup[loser] == "na" && maid === loser) { 
            return message.channel.send("You have no backup stats. Please get a Moderator to help you.")
        }

        stats[winner] = backup[winner]
        stats[loser] = backup[loser]
        fs.writeFile(statsfile, JSON.stringify(stats), (err) => {
	        if (err) console.log(err) });

        losses[loser]--
        fs.writeFile(lossesfile, JSON.stringify(losses), (err) => {
	        if (err) console.log(err) });

        wins[winner]--
        fs.writeFile(winsfile, JSON.stringify(wins), (err) => {
	        if (err) console.log(err) });

        backup[winner] = "na";
        backup[loser] = "na";
        fs.writeFile(backupfile, JSON.stringify(backup), (err) => { 
	        if (err) console.log(err) }); 

        let newobj = rawobj.splice(0, rawobj.length-1);
        fs.writeFile(recordsfile, JSON.stringify(newobj), (err) => {
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

        if(!message.member.roles.has(modRole)) {
            return message.channel.send("You do not have permission to do that.")
        }

        message.channel.send(`Resetting the stats of ${len} players. Please wait...`);

        for (let j = 0; j < len; j++) { 
            reset(arr2[j], arr2[j], arr2[j], arr2[j], j)
        }
        
        for (let i = 0; i < rawRecords.length; i++) {
            let record = rawRecords[i].Result
            
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
            
            restore(message, winners[i], losers[i], i, rawRecords.length, rawStats.length)
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



