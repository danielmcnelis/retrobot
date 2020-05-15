
const fs = require('fs')
const { Op } = require('sequelize')
const Sequelize = require('sequelize')
const { yescom, nocom } = require('../static/commands.json')
const { Replay }  = require('../db/index.js')
const types = require('../static/types.json')
const classes = require('../static/types.json')

//GET REPLAY INFO 1
const getReplayInfo1 = async (message, member, url) => {
	const filter = m => m.author.id === member.user.id
	message.channel.send(`Okay, ${member.user.username}, did you play in this replay?`)
	message.channel.awaitMessages(filter, {
		max: 1,
        time: 10000
    }).then(collected => {
        if (yescom.includes(collected.first().content.toLowerCase())) {
            const replay = { p1: member.user.id, url }
            return getReplayInfo2(message, dude, replay, 'you')
        } else if (nocom.includes(collected.first().content.toLowerCase())) {
            const replay = { url }
            return getReplayAltP1(message, member, replay)
        } else {
            return message.channel.send('I need a yes or no answer. Please try again.')
        }
    }).catch(err => {    
        console.log(err)
        return message.channel.send(`Perhaps another time would be better.`)
    })
}


//GET REPLAY ALT P1
const getReplayAltP1 = async (message, member, replay) => {
	const filter = m => m.author.id === member.user.id
	message.channel.send(`Please tag the first player in this replay, or type their name.`)
	message.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(collected => {

        const val = collected.first().content.replace(/[\\<>@#&!]/g, "")
        if(/^\d+$/.test(val)) {
            const member = message.guild.members.cache.get(val)
            replay.p1Id = val
            replay.p1Name = member.user.name
        } else {
            replay.p1Name = val
        }
            replay.p1 = collected.first().content.replace(/[\\<>@#&!]/g, "")
            return getReplayInfo2(message, member, replay, 'they')
    }).catch(err => {    
        console.log(err)
        return message.channel.send(`Sorry, you took too long. You'll have to start over from the beginning.`)
    })
}


//GET REPLAY INFO 2
const getReplayInfo2 = async (message, member, replay, pronoun) => {
    let keys = Object.keys(types)
    let success
	const filter = m => m.author.id === dude
	message.channel.send(`What deck did ${pronoun} play?`)
	message.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(collected => {
        keys.forEach(function(elem) {
            if (types[elem].includes(collected.first().content.toLowerCase())) {
                success = true
                replay.deck1 = elem
                message.channel.send(`Okay, so ${pronoun} played ${types[elem][0]}.`)
                return getReplayInfo3(message, member, replay)
            }
        })

        if (!success) {
            replay.deck1 = 'other'
            message.channel.send(`Hmm... ${collected.first().content}? I'll have to record that as "Other" for now.`)
            return getReplayInfo3(message, member, replay) 
        }
    }).catch(err => {    
        console.log(err)
        return message.channel.send(`Sorry, you took too long. You'll have to start over from the beginning.`)
    })
}


//GET REPLAY INFO 3
const getReplayInfo3 = async (message, member, replay) => {
	const filter = m => m.author.id === dude
	message.channel.send(`Please tag the other player in this replay, or type their name.`)
	message.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(collected => {
            replays[dude][slot].p2 =
            fs.writeFile("./replays.json", JSON.stringify(replays), (err) => {
                if (err) console.log(err)
            })

            replay.p2 =  collected.first().content.replace(/[\\<>@#&!]/g, "")

            return getReplayInfo4(message, dude, slot)
    }).catch(err => {    
        console.log(err)
        return message.channel.send(`Sorry, you took too long. I will save this replay with the info that I have so far.`)
    })
}


//GET REPLAY INFO 4
const getReplayInfo4 = async (message, dude, slot) => {
    let keys = Object.keys(types)
    let success = false
	const filter = m => m.author.id === dude
	message.channel.send(`What deck did they play?`)
	message.channel.awaitMessages(filter, {
		max: 1,
        time: 15000
    }).then(collected => {
        keys.forEach(function(elem) {
            if (types[elem].includes(collected.first().content.toLowerCase())) {
                success = true
                replays[dude][slot].deck2 = elem
                fs.writeFile("./replays.json", JSON.stringify(replays), (err) => {
                    if (err) console.log(err)
                })

                return message.channel.send(`Okay, so they played ${types[elem][0]}. I saved this replay to the public database. Thanks!`)
            }
        })

        if (!success) {
            replays[dude][slot].deck2 = 'other'
            fs.writeFile("./replays.json", JSON.stringify(replays), (err) => {
                if (err) console.log(err)
            })
            
            return message.channel.send(`Hmm... ${collected.first().content}? I'll have to record that as "Other" for now. Thanks!`)    
        }
    }).catch(err => {    
        console.log(err)
        return message.channel.send(`Sorry, you took too long. I will save this replay with the info that I have so far.`)
    })
}

module.exports = {
    getReplayInfo1,
    getReplayAltP1,
    getReplayInfo2,
    getReplayInfo3,
    getReplayInfo4
}
