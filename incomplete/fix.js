


    // FIX
    if (cmd === `!fix`) {
        if (isProgrammer(message.member)) {
            const tournaments = await Tournament.findAll({
                where: {
                    serverId: interaction.guildId,
                    createdAt: { [Op.gte]: "2022-07-01 00:00:00.000+00" },
                },
                order: [["createdAt", "ASC"]],
            })

            const tournament = await selectTournament(message, tournaments, maid)
            if (!tournament) return message.channel.send({ content: `There are no tournaments.` })

            const decks = await Deck.findAll({
                where: {
                    eventName: {
                        [Op.or]: [tournament.abbreviation, tournament.name]
                    }
                },
                include: Player
            })

            const { name } = tournament

            try {
                await checkExpiryDate(server)
                await uploadDeckFolder(server, name, decks)
                return message.channel.send({ content: `Your tournament files have been uploaded! ${server.logo}` })
            } catch (err) {
                console.log(err)
                return message.channel.send({ content: `Error. Check bot logs.` })
            }
        } else {
            return message.channel.send({ content: `🛠️` })
        }
    }
