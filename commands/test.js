
const { SlashCommandBuilder } = require('discord.js')
const { isProgrammer } = require('../functions/utility')
const { Op } = require('sequelize')
const emojis = require('../static/emojis.json')
const { Format } = require('../db')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Performs a test. 🧪'),
    async execute(interaction) {
        if (isProgrammer(interaction.member)) {
            const roles = interaction.guild.roles.cache.values()
            
            for (const role of roles) {
                if (role.name.includes('Grinders')) {
                    const name = role.name.replace(' Grinders', '')
                    const format = await Format.findOne({
                        where: {
                            name: {[Op.iLike]: name}
                        }
                    })

                    if (!format) {
                        console.log(`could not find format for ${role.name}`)
                        continue
                    } else {
                        await format.update({ grinders: role.id }) 
                        console.log(`saved ${format.name} grinders roleId`)
                    }
                }
            }

            await interaction.reply(emojis.yellow)
        } else {
            await interaction.reply('🧪')
        }
    }
}