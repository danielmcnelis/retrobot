
const { discordBotToken} = require('../secrets')
const { Client, GatewayIntentBits } = require('discord.js')

const client = new Client({ 
    intents: [ 
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions, 
        GatewayIntentBits.DirectMessages
    ],
    partials: [
        'MESSAGE',
        'CHANNEL',
        'REACTION',
        'GUILD_MEMBER',
        'USER'
    ]
})

client.login(discordBotToken)
module.exports = { client }
