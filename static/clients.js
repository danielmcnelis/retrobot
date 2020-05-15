
const challonge = require('challonge')
const Discord = require('discord.js')
const client = new Discord.Client()
const challongeClient = challonge.createClient({ apiKey: '5QwynojAFCCkm7jrXuZICZji314i5dLfnlpgRRYh' })
client.login('NjgyNDAxNzU1MTcwMDc4Nzcw.Xlcpag.XVeTLXJFH92QUrFZYhvjoKqg0QQ')


module.exports = {
    client,
    challongeClient
}