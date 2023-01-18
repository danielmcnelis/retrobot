


    const { SlashCommandBuilder } = require('discord.js')    
    const { isMod, hasFullAccess } = require('../functions/utility')
    const emojis = require('../static/emojis.json')
    const { Match, Player, Server } = require('../../formatlibrary/libs/models/src/lib/index.js')
    const { Op } = require('sequelize')

    // COMBINE
    // Use this command to combine two Discord accounts into one.
    // Arguments required: @Old_User, @New_User
    // The old user's records will be overwritten with the new user's. 
    // In the record of matches, the old user id will be replaced by the new user id.
    // After this is done, there is no way to tell which matches were played on the old account.
    // So be careful with this command. Make sure the accounts are definitely shared.
    // When this command is finished, use the **!recalc** command to update everyone's stats.
    module.exports = {
        data: new SlashCommandBuilder()
            .setName('combine')
            .setDescription(`Combine two user accounts. 🏭`)
            .addUserOption(option =>
                option
                    .setName('olduser')
                    .setDescription('The old user.')
                    .setRequired(true))
            .addUserOption(option =>
                option
                    .setName('newuser')
                    .setDescription('The new user.')
                    .setRequired(true)
            ),
        async execute(interaction) {
            const server = !interaction.guildId ? {} : 
                await Server.findOne({ where: { id: interaction.guildId }}) || 
                await Server.create({ id: interaction.guildId, name: interaction.guild.name })

            if (!hasFullAccess(server)) return interaction.reply({ content: `This feature is only available in Format Library. ${emojis.FL}`}) 
            if (!isMod(server, interaction.member)) return interaction.reply({ content: "You do not have permission to do that."})
    
            const oldUser = interaction.options.getUser('olduser')
            const newUser = interaction.options.getUser('newuser')

            const oldDiscordId = oldUser.id
            const newDiscordId = newUser.id
            if (oldDiscordId === newDiscordId) return interaction.reply({ content: "Please specify 2 different players."})

            const oldPlayer = await Player.findOne({ where: { discordId: oldDiscordId } })
            if (!oldPlayer) return interaction.reply({ content: `<@${oldDiscordId}> is not in the database.`})

            const newPlayer = await Player.findOne({ where: { discordId: newDiscordId } })
            if (!newPlayer) return interaction.reply({ content: `<@${newDiscordId}> is not in the database.`})

            const matches = await Match.findAll({
                where: {
                    [Op.or]: [
                        { winnerId: oldPlayer.id },
                        { loserId: oldPlayer.id }
                        ]
                }
            })
    
            let violations = 0
            let count = 0
            let formats = []

            for (let i = 0; i < matches.length; i++) {
                const match = matches[i]
                const format = match.format
                if (!formats.includes(format)) formats.push(format)
                
                if (
                    (match.winnerId === oldPlayer.id && match.loserId === newPlayer.id) || 
                    (match.loserId === oldPlayer.id && match.winnerId === newPlayer.id)
                ) {
                    violations++
                    await match.destroy()
                } else if (match.winnerId === oldPlayer.id) {     
                    await match.update({
                        winnerId: newPlayer.id,
                        winner: newPlayer.name
                    })
                    count++
                } else if (match.loserId === oldPlayer.id) {
                    await match.update({
                        loserId: newPlayer.id,
                        loser: newPlayer.name
                    })
                    count++
                }
            }

            return interaction.reply({ content: 
                `<@${oldPlayer.discordId}>'s ID was replaced with <@${newPlayer.discordId}>'s ID in ${count} match records.` +
                ` ${violations} boosting violation(s) occurred.` +
                `\n\nStats in the following formats need to be recalculated:\n${formats.join("\n")}`
            })
        }
    }
