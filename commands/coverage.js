

const { SlashCommandBuilder } = require('discord.js')
const { BlogPost, Event } = require('../db')
const { isProgrammer } = require('../functions/utility')
const { Op } = require('sequelize')
const { composeBlogPost, composeThumbnails } = require('../functions/coverage')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('coverage')
        .setDescription('Post tournament coverage. 🖊️')
		.addStringOption(str =>
            str
                .setName('tournament')
                .setDescription('Enter tournament name.')
                .setRequired(true)
        ),
    async execute(interaction) {
        if (!isProgrammer(interaction.member)) return interaction.reply({ content: "You do not have permission to do that."})
        const name = interaction.options.getString('tournament')        
        const event = await Event.findOne({ where: { abbreviation: name }})
        if (!event) return interaction.reply(`No event found.`)

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
            return interaction.reply(`Coverage for ${name} already exists.`)
        } else if (event.community === 'Konami' || event.community === 'Upper Deck Entertainment') {
            interaction.reply(`Generating coverage for ${name}. Please wait.`)
            await composeThumbnails(interaction, event.abbreviation)
            return
        } else {
            interaction.reply(`Generating coverage for ${name}. Please wait.`)
            await composeThumbnails(interaction, event.abbreviation)
            await composeBlogPost(interaction, event.abbreviation)
            return
        }
    }
}