
    const { EmbedBuilder, SlashCommandBuilder } = require('discord.js')    
    const { getMedal } = require('../functions/utility')
    const emojis = require('../static/emojis.json')
    const { Deck, Event, Format, Player, Server, Stats } = require('../db')
    const { Op } = require('sequelize')

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('profile')
            .setDescription(`Post a player's profile. 🖼️`)
            .addUserOption(option =>
                option
                    .setName('player')
                    .setDescription('The player you want to check.')
                    .setRequired(false)
            ),
        async execute(interaction) {
            const server = !interaction.guildId ? {} : 
                await Server.findOne({ where: { id: interaction.guildId }}) || 
                await Server.create({ id: interaction.guildId, name: interaction.guild.name })

            const user = interaction.options.getUser('player') || interaction.user
            const discordId = user.id	
            const player = await Player.findOne({ where: { discordId: discordId } })
            if (!player) return interaction.reply({ content: "That user is not in the database."})

            const format = await Format.findOne({
                where: {
                    [Op.or]: {
                        name: { [Op.iLike]: server.format },
                        channel: interaction.channelId
                    }
                }
            })
    
            if (format) {
                const stats = await Stats.findOne({ 
                    where: { 
                        playerId: player.id, 
                        format: {[Op.iLike]: format.name}, 
                        [Op.or]: [
                            { wins: { [Op.not]: null } }, 
                            { losses: { [Op.not]: null } }, 
                        ],
                        internal: false
                    }
                })

                const trophies = [...await Deck.findAll({
                    where: {
                        playerId: player.id,
                        formatId: format.id,
                        event: {[Op.not]: null},
                        placement: {[Op.not]: null},
                        display: true
                    },
                    include: Event,
                    limit: 12,
                    order: [["placement", "ASC"], [Event, 'size', 'DESC']]
                })].map((d) => {
                    const badge = d.placement === 1 ? emojis.first :
                        d.placement === 2 ? emojis.second :
                        d.placement === 3 ? emojis.third :
                        emojis.placing

                    return `${d.eventName}: ${ordinalize(d.placement)} ${badge} of ${d.event.size}`
                })
                
            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`${user.name}'s ${format.name} ${format.emoji} Player Profile`)
                .setURL(`https://formatlibrary.com/players/${user.discordName}#${user.discriminator}`)
                // .setDescription('Some description here')
                .setThumbnail(`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.webp`)
                .addFields(
                    { name: `${format.name} Format Stats`, value: 
                        `Best Medal: ${getMedal(stats.bestElo, title = true)}` +
                        `\nHighest Elo: ${stats.bestElo.toFixed(2) || '500.00'}` +
                        `\nWinrate: ${winrate}` +
                        `\nVanquished Foes: ${stats.vanquished}` +
                        `\nLongest Streak: ${stats.streak}` },
                    { name: `${format.name} Format Trophies`, value: trophies }
                )
                // .setImage('https://i.imgur.com/AfFp7pu.png')
                // .setTimestamp()
                //.setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
        
                return interaction.reply({ embeds: [embed] })
            } else {
                const allStats = await Stats.findAll({ 
                    where: { 
                        playerId: player.id, 
                        [Op.or]: [
                            { wins: { [Op.not]: null } }, 
                            { losses: { [Op.not]: null } }, 
                        ],
                        internal: false
                    },
                    limit: 6,
                    order: [["elo", "DESC"]]
                })
                
                const medals = []
                
                for (let i = 0; i < allStats.length; i++) {
                    const stats = allStats[i]
                    const format = await Format.findOne({ where: { name: {[Op.iLike]: stats.format } }})
                    const medal = getMedal(stats.elo)
                    medals.push(`${format.emoji} ${format.name}: ${medal}`)
                }

                const trophies = [...await Deck.findAll({
                    where: {
                        playerId: player.id,
                        event: {[Op.not]: null},
                        eventId: {[Op.not]: null},
                        placement: {[Op.not]: null},
                        display: true
                    },
                    include: [Event, Format],
                    limit: 12,
                    order: [["placement", "ASC"], [Event, 'size', 'DESC']]
                })].map((d) => {
                    const badge = d.placement === 1 ? emojis.first :
                        d.placement === 2 ? emojis.second :
                        d.placement === 3 ? emojis.third :
                        emojis.placing

                    return `${d.format.emoji} ${d.eventName}: ${ordinalize(d.placement)} ${badge} of ${d.event.size}`
                })

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`${user.name}'s ${format.name} ${format.emoji} Player Profile`)
                .setURL(`https://formatlibrary.com/players/${user.discordName}#${user.discriminator}`)
                // .setDescription('Some description here')
                .setThumbnail(`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.webp`)
                .addFields(
                    { name: `Best Formats`, value: medals },
                    { name: `Best Finishes`, value: trophies }
                )
                // .setImage('https://i.imgur.com/AfFp7pu.png')
                // .setTimestamp()
                //.setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
        
                return interaction.reply({ embeds: [embed] })
            }
        }
    }

