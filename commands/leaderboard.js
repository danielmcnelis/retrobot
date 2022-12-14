
const { SlashCommandBuilder } = require('discord.js')    
const { hasAffiliateAccess, getMedal, urlize } = require('../functions/utility')
const emojis = require('../static/emojis.json')
const { Format, Player, Server, Stats } = require('../db')
const { Op } = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription(`Post the leaderboard.`)
        .addNumberOption(num =>
            num
                .setName('number')
                .setDescription('Show how many players?')
                .setRequired(false)
        ),
    async execute(interaction) {
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

        if (!format) return interaction.reply({ content: `Try using **/leaderboard** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            
        const x = interaction.options.getNumber('number') || 10
        if (x < 1) return interaction.reply({ content: "Please provide a number greater than 0."})
        if (x > 100 || isNaN(x)) return interaction.reply({ content: "Please provide a number less than or equal to 100."})
        const serverId = server.internalLadder ? server.id : '414551319031054346'

        const allStats = await Stats.findAll({ 
            where: {
                format: {[Op.iLike]: format.name}, 
                games: { [Op.gte]: 3 },
                serverId: serverId,
                inactive: false,
                '$player.hidden$': false
            },
            include: Player,
            order: [['elo', 'DESC']] 
        })
        
        const topStats = allStats.slice(0, x)
        if (!topStats.length) return interaction.reply({ content: `I'm sorry, we don't have any ${format.name} players.`})
        const results = []
        topStats.length === 1 ? results[0] = `${server.emoji || format.emoji} --- The Best ${server.internalLadder ? 'Internal ' : ''}${format.name} Player --- ${server.emoji || format.emoji}`
        : results[0] = `${server.emoji || format.emoji} --- Top ${topStats.length} ${server.internalLadder ? 'Internal ' : ''}${format.name} Players --- ${server.emoji || format.emoji}`
        for (let i = 0; i < topStats.length; i++) results[i+1] = `${(i+1)}. ${getMedal(topStats[i].elo)} ${topStats[i].player.name}`
        if (!server.internalLadder) results.push(`\nFull Leaderboard: https://formatlibrary.com/leaderboards/${urlize(format.name)}`)
        for (let i = 0; i < results.length; i += 30) await interaction.reply({ content: results.slice(i, i+30).join('\n').toString() })
    }
}

    