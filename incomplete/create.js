
    // CREATE
    if (cmd === `!create`) {
        if (!hasPartnerAccess(server)) return message.channel.send({ content: `This feature is only available with partner access. ${emojis.legend}`})
        if (!isMod(server, message.member)) return message.channel.send({ content: `You do not have permission to do that.`})
        if (!args.length) return message.channel.send({ content: `Please provide a name for the new tournament.`})
        const format = await getTournamentFormat(server, message)
        if (!format) return message.channel.send({ content: `Please specify a valid format.`})
        const tournament_type = await getTournamentType(message)
        if (!tournament_type) return message.channel.send({ content: `Please select a valid tournament type.`})
        const channelId = await getTournamentChannel(server, format, message)
        if (!message.guild.channels.cache.get(channelId)) return message.channel.send({ content: `Please specify a valid tournament channel.`})

        const str = generateRandomString(10, '0123456789abcdefghijklmnopqrstuvwxyz')

        const input = args[0].replace(/[^\ws]/gi, "_").replace(/ /g,'')

        const name = input.startsWith('FLC') ? `Format Library Championship ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('YRS') ? `Yu-Gi-Oh! Retro Series ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('DLC') ? `Drama Llama Classic ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('DDS') ? `Digbic Dig Series ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('ETC') ? `Ellietincan Cup ${pparseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('ACS') ? `Format Library Championship ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('KGP') ? `Format Library Championship ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('DCT') ? `Duelist Crown Tournament ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('DSC') ? `Dark Side Cup ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('WWC') ? `Woawa World Cup ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('GASP') ? `Gigachad Advanced Sneak Preview ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('RWL') ? `Retro World Locals ${parseInt(input.replace(/[^0-9]/g,''))}` :
            input.startsWith('BC') ? `Blazing Cheaters ${parseInt(input.replace(/[^0-9]/g,''))}` : 
            input.startsWith('FWL') ? `Future World Locals ${parseInt(input.replace(/[^0-9]/g,''))}` : 
            input

        const logo = input.startsWith('FLC') ? emojis.FL :
            input.startsWith('YRS') ? emojis.mlady :
            input.startsWith('DLC') ? emojis.lmfao :
            input.startsWith('DDS') ? emojis.stoned :
            input.startsWith('ETC') ? emojis.lipton :
            input.startsWith('ACS') ? emojis.toad :
            input.startsWith('KGP') ? emojis.UredU :
            input.startsWith('DCT') ? emojis.king :
            input.startsWith('DSC') ? emojis.evil :
            input.startsWith('WWC') ? '🦉 ⚽' :
            input.startsWith('GASP') ? emojis.gigachad :
            input.startsWith('RWL') ? emojis.celtic :
            input.startsWith('FWL') ? emojis.farqred :
            input.startsWith('BC') ? emojis.speeder :
            server.logo || emojis.legend

        try {
            const { status, data } = await axios({
                method: 'post',
                url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeAPIKey}`,
                data: {
                    tournament: {
                        name: name,
                        url: input,
                        tournament_type: tournament_type,
                        game_name: 'Yu-Gi-Oh!',
                        pts_for_match_tie: "0.0"
                    }
                }
            })
            
            if (status === 200 && data) {
                await Tournament.create({ 
                    id: data.tournament.id,
                    name: name,
                    abbreviation: input,
                    state: 'pending',
                    type: tournament_type,
                    formatName: format.name,
                    logo: logo,
                    emoji: server.emoji || format.emoji,
                    url: data.tournament.url,
                    channelId: channelId,
                    serverId: mgid,
                    community: server.name
                })

                return message.channel.send({ content: 
                    `You created a new tournament:` + 
                    `\nName: ${name} ${logo}` + 
                    `\nFormat: ${format.name} ${server.emoji || format.emoji}` + 
                    `\nType: ${capitalize(data.tournament.tournament_type, true)}` +
                    `\nBracket: https://challonge.com/${data.tournament.url}`
                })
            } 
        } catch (err) {
            console.log(err)
            try {
                const { status, data } = await axios({
                    method: 'post',
                    url: `https://api.challonge.com/v1/tournaments.json?api_key=${server.challongeAPIKey}`,
                    data: {
                        tournament: {
                            name: name,
                            url: str,
                            tournament_type: tournament_type,
                            game_name: 'Yu-Gi-Oh!',
                            pts_for_match_tie: "0.0"
                        }
                    }
                })
                
                if (status === 200 && data) {
                    await Tournament.create({ 
                        id: data.tournament.id,
                        name: data.tournament.name,
                        state: data.tournament.state,
                        type: data.tournament.tournament_type,
                        formatName: format.name,
                        logo: logo,
                        emoji: server.emoji || format.emoji,
                        url: data.tournament.url,
                        channelId: channelId,
                        serverId: mgid,
                        community: server.name
                    })

                    return message.channel.send({ content: 
                        `You created a new tournament:` + 
                        `\nName: ${data.tournament.name} ${logo}` + 
                        `\nFormat: ${format.name} ${server.emoji || format.emoji}` + 
                        `\nType: ${capitalize(data.tournament.tournament_type, true)}` +
                        `\nBracket: https://challonge.com/${data.tournament.url}`
                    })
                } 
            } catch (err) {
                console.log(err)
                return message.channel.send({ content: `Unable to connect to Challonge account.`})
            }
        }
    }