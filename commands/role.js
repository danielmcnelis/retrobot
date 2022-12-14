
    const { SlashCommandBuilder } = require('discord.js')    
    const { hasAffiliateAccess, hasFullAccess } = require('../functions/utility')
    const emojis = require('../static/emojis.json')
    const { Format, Player, Membership, Role, Server } = require('../db')
    const { Op } = require('sequelize')

    module.exports = {
        data: new SlashCommandBuilder()
            .setName('role')
            .setDescription(`Add or remove a format role.`),
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
    
            if (!format) return interaction.reply({ content: `Try using **/role** in channels like: <#414575168174948372> or <#629464112749084673>.`})
            
            const roleId = hasFullAccess(server) ? format.role : server.rankedRole
            if (!roleId) return

            const roleName = hasFullAccess(server) ? `${format.name} Players` : 
                server.name === 'GoatFormat.com' ? 'Ranked Players' :
                server.name === 'Lab' ? 'Ranked Players' :
                server.name === 'Crows Nest' ? 'Crows' :
                server.name === 'Goat Format War League' ? 'Warheads' :
                server.name === 'Vegas (April 2014) Format' ? 'Duelist' :
                ''
    
            const membership = await Membership.findOne({ where: { '$player.discordId$': interaction.user.id, serverId: interaction.guildId }, include: Player })
            if (!membership) return interaction.reply({ content: `You are not in the database.`})
    
            if (!interaction.member.roles.cache.some(role => role.id === roleId)) {
                try {
                    await interaction.member.roles.add(roleId)
                    const count = await Role.count({ where: { membershipId: membership.id, roleId: roleId } })
                    if (!count) {
                        await Role.create({ 
                            membershipId: membership.id,
                            roleId: roleId,
                            roleName: roleName
                        })
                    }
                    return interaction.reply({ content: `You now have the ${roleName} role.`})
                } catch (err) {
                    console.log(err)
                    return interaction.reply({ content: `Error: Unable to add ${roleName} role.`})
                }
            } else {
                try {
                    await interaction.member.roles.remove(roleId)
                    const role = await Role.findOne({ where: { membershipId: membership.id, roleId: roleId } })
                    await role.destroy()
                    return interaction.reply({ content: `You no longer have the ${roleName} role.`})
                } catch (err) {
                    console.log(err)
                    return interaction.reply({ content: `Error: Unable to remove ${roleName} role.`})
                }
            }
        }
    }
