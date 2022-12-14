

const { SlashCommandBuilder } = require('discord.js')
const { BlogPost, Event } = require('../db')
const { isProgrammer } = require('../functions/utility')
const { Op } = require('sequelize')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coverage')
        .setDescription('Post tournament coverage.')
		.addStringOption(str =>
            str
                .setName('string')
                .setDescription('Enter tournament name.')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!isProgrammer(interaction.member)) return interaction.reply({ content: "You do not have permission to do that."})
        const input = args[0]
        const event = await Event.findOne({ where: { abbreviation: input }})
        if (!event) return interaction.reply(`No event found.`)
        await composeThumbnails(interaction, event.abbreviation)

        const blogpost = await BlogPost.findOne({
            where: {
                title: {
                    [Op.or]: {
                        [Op.substring]: event.name,
                        [Op.substring]: event.abbreviation
                    }
                }
            }
        })

        if (blogpost) {
            return interaction.reply(`Blog coverage for ${input} already exists.`)
        } else {
            return composeBlogPost(interaction, event.abbreviation)
        }
    }
}