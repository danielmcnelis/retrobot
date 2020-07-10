
const challonge = require('challonge')
const Discord = require('discord.js')
const client = new Discord.Client()
const challongeClient = challonge.createClient({ apiKey: '4oKfYy4eD7Yw8RUDsRzN5rzLQ4fqPPjvZzgLn7YC' })
client.login('NzMwOTIyMDAzMjk2NDE5ODUw.XweiXg.eXr2_PZNvN0B35lfbJNy5J-LUXE')


module.exports = {
    client,
    challongeClient
}