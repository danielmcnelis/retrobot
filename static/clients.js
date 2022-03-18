
const { discordBotToken} = require('../secrets.json')
const { Client } = require('discord.js')
const client = new Client({ 
    intents: [ 
        'GUILDS', 
        'GUILD_MEMBERS', 
        'GUILD_PRESENCES',
        'GUILD_MESSAGES', 
        'GUILD_MESSAGE_REACTIONS',
        'DIRECT_MESSAGES'
    ],
    partials: [
        'MESSAGE',
        'CHANNEL',
        'REACTION',
        'GUILD_MEMBER',
        'USER'
    ]
})

setTimeout(() => {
    client.login(discordBotToken)
}, 8000)

module.exports = {
    client
}