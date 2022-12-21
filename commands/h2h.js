

const { SlashCommandBuilder } = require('discord.js')    
const { hasAffiliateAccess } = require('../functions/utility')
const emojis = require('../static/emojis.json')
const { Format, Match, Player, Server } = require('../db')
const { Op } = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('h2h')
        .setDescription(`Post the record between 2 players. 🤼`)
        .addUserOption(option =>
            option
                .setName('player1')
                .setDescription('The first player.')
                .setRequired(true))
        .addUserOption(option =>
            option
                .setName('player2')
                .setDescription('The second player.')
                .setRequired(false)
        ),
    async execute(interaction) {
        const user1 = interaction.options.getUser('player1')
        const user2 = interaction.options.getUser('player2') || interaction.user

        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
    
        if (!hasAffiliateAccess(server)) return interaction.reply({ content: `This feature is only available with affiliate access. ${emojis.legend}`})
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: { [Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })
    
        if (!format) return interaction.reply({ content: `Try using **/h2h** in channels like: <#414575168174948372> or <#629464112749084673>.`})

        const player1DiscordId = user1.id	
        const player2DiscordId = user2.id
        if (player1DiscordId === player2DiscordId) return interaction.reply({ content: `Please specify 2 different players.`})

        const player1 = await Player.findOne({ where: { discordId: player1DiscordId } })
        const player2 = await Player.findOne({ where: { discordId: player2DiscordId } })
        
        if (!player1 && player2DiscordId === interaction.user.id) return interaction.reply({ content: `That user is not in the database.`})
        if (!player1 && player2DiscordId !== interaction.user.id) return interaction.reply({ content: `The first user is not in the database.`})
        if (!player2 && player2DiscordId === interaction.user.id) return interaction.reply({ content: `You are not in the database.`})
        if (!player2 && player2DiscordId !== interaction.user.id) return interaction.reply({ content: `The second user is not in the database.`})

        const p1Wins = await Match.count({ where: { winnerId: player1.id, loserId: player2.id, format: format.name } })
        const p2Wins = await Match.count({ where: { winnerId: player2.id, loserId: player1.id, format: format.name } })
        
        return interaction.reply({ content: 
            `${server.emoji || format.emoji} --- H2H ${format.name} Results --- ${server.emoji || format.emoji}`+
            `\n${player1.name} has won ${p1Wins}x`+
            `\n${player2.name} has won ${p2Wins}x`
        })	
    }
}
