
const challonge = require('challonge')
const Discord = require('discord.js')
const { challongeAPIKey, discordBotToken} = require('../secrets.json')
const client = new Discord.Client()
const challongeClient = challonge.createClient({ apiKey: challongeAPIKey })
client.login(discordBotToken)

module.exports = {
    client,
    challongeClient
}