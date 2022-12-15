

const { SlashCommandBuilder } = require('discord.js')
const { Format, Iron, Player, Server } = require('../db')
const { hasFullAccess } = require('../functions/utility')
const { Op } = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iron')
        .setDescription('Join or leave the iron queue.'),
    async execute(interaction) {
        const server = !interaction.guildId ? {} : 
            await Server.findOne({ where: { id: interaction.guildId }}) || 
            await Server.create({ id: interaction.guildId, name: interaction.guild.name })
        
        const format = await Format.findOne({
            where: {
                [Op.or]: {
                    name: {[Op.iLike]: server.format },
                    channel: interaction.channelId
                }
            }
        })

        if (!hasFullAccess(server)) return interaction.reply({ content: `This feature is only available in Format Library. ${emojis.FL}`})
        if (!format) return interaction.reply({ content: `Try using **/iron** in channels like: <#414575168174948372> or <#629464112749084673>.`})
        
        const player = await Player.findOne({ where: { discordId: interaction.user.id }})
        const alreadyIn = await Iron.count({ 
            where: { 
                format: format.name,
                playerId: player.id
            } 
        })

        const isPending = await Iron.count({ where: { format: format.name, status: 'pending' }})
        const isConfirming = await Iron.count({ where: { format: format.name, status: 'confirming' }})
        const isDrafting = await Iron.count({ where: { format: format.name, status: 'drafting' }})
        const isActive = await Iron.count({ where: { format: format.name, status: 'active' }})
        if (isDrafting && !alreadyIn) return interaction.reply({ content: 'Please wait until after the drafting process is complete to join the iron.' })
        if (!isPending && alreadyIn) return interaction.reply({ content: 'Sorry, you cannot leave the iron after it has started.' })
        
        if (!alreadyIn) {
            const count = await Iron.count({ where: { format: format.name }})
            if (count >= 10) {
                return interaction.reply({ content: `Sorry, ${player.discordName}, the ${format.name} ${server.emoji || format.emoji} Iron is full.`})
            } else if (count < 10 && count >= 6) {
                if (isConfirming) {
                    await Iron.create({ 
                        name: player.discordName,
                        playerId: player.id,
                        format: format.name,
                        confirmed: true
                    })
    
                    return interaction.reply({ content: `You joined the Iron queue. ${emojis.iron}`})
                } else if (isActive) {
                    const teamACount = await Iron.count({ 
                        where: {
                            format: format.name,
                            team: 'A'
                        }
                    })

                    const teamAElim = await Iron.count({ 
                        where: {
                            format: format.name,
                            team: 'A',
                            eliminated: true
                        }
                    })

                    const teamBCount = await Iron.count({ 
                        where: {
                            format: format.name,
                            team: 'B'
                        }
                    })

                    const teamBElim = await Iron.count({ 
                        where: {
                            format: format.name,
                            team: 'B',
                            eliminated: true
                        }
                    })

                    if ((teamBCount === teamACount && teamBElim >= teamAElim) || teamBCount < teamACount) {
                        await Iron.create({ 
                            name: player.discordName,
                            playerId: player.id,
                            format: format.name,
                            team: 'B',
                            confirmed: true,
                            position: teamBCount + 1
                        })

                        //ADD FORMAT LIBRARY IRON ROLE
                        interaction.member.roles.add('948006324237643806')
                        return interaction.reply({ content: `You joined the Iron for Team B. ${emojis.iron}`})
                    } else {
                        await Iron.create({ 
                            name: player.discordName,
                            playerId: player.id,
                            format: format.name,
                            team: 'A',
                            confirmed: true,
                            position: teamACount + 1
                        })

                        // ADD FORMAT LIBRARY IRON ROLE
                        interaction.member.roles.add('948006324237643806')
                        return interaction.reply({ content: `You joined the Iron for Team A. ${emojis.iron}`})
                    }
                }
            } else {
                await Iron.create({ 
                    name: player.discordName,
                    playerId: player.id,
                    format: format.name
                })

                if (count === 5) confirmIron(interaction.channel, format)
                return interaction.reply({ content: `You joined the Iron queue. ${emojis.iron}`})
            }
        } else {
            const ironPerson = await Iron.findOne({ 
                where: {
                    name: player.discordName,
                    format: format.name,
                    playerId: player.id
                }
            })

            if (!ironPerson) return
            await ironPerson.destroy()
            return interaction.reply({ content: `You left the Iron queue. ${emojis.iron}`})
        }
    }
}