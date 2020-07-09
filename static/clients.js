
const challonge = require('challonge')
const Discord = require('discord.js')
const client = new Discord.Client()
const challongeClient = challonge.createClient({ apiKey: '4oKfYy4eD7Yw8RUDsRzN5rzLQ4fqPPjvZzgLn7YC' })
client.login('NTc5NzM3NDg5ODU4NzU2NjM5.XOMatg.R66IEdOS9a3lsJvyT9gZpDxlxgs')


module.exports = {
    client,
    challongeClient
}