
const { BlogPost, Player } = require('../../formatlibrary/libs/models/src/lib/index.js')
const Canvas = require('canvas')
const fs = require('fs')
const axios = require('axios')
const sharp = require('sharp')

// SAVE PFPs
const savePfps = async () => {
    let count = 0
    const blogposts = await BlogPost.findAll()
    for (let s = 0; s < blogposts.length; s++) {
        try {
            const bp = blogposts[s]
            const index = bp.content.indexOf('/images/pfps/')

            const discordId_17 = bp.content.slice(index + 13, index + 13 + 17)
            const discordId_18 = bp.content.slice(index + 13, index + 13 + 18)

            const player_17 = await Player.findOne({
                where: {
                    discordId: discordId_17
                }
            })
                  
            const player_18 = await Player.findOne({
                where: {
                    discordId: discordId_18
                }
            })

            if (player_17 && !player_18) {
                const {data} = await axios.get(
                    `https://cdn.discordapp.com/avatars/${player_17.discordId}/${player_17.discordPfp}.webp`, {
                        responseType: 'arraybuffer',
                    }
                )

                const png = await sharp(data).toFormat('png').toBuffer()
                const canvas = Canvas.createCanvas(128, 128)
                const context = canvas.getContext('2d')
                const image = await Canvas.loadImage(png)
                context.drawImage(image, 0, 0, 128, 128)
                const buffer = canvas.toBuffer('image/png')
                fs.writeFileSync(`./pfps/${player_17.discordId}.png`, buffer)
                console.log(`saved new pfp for ${player_17.name}`)
                count++
            } else if (!player_17 && player_18) {
                const {data} = await axios.get(
                    `https://cdn.discordapp.com/avatars/${player_18.discordId}/${player_18.discordPfp}.webp`, {
                        responseType: 'arraybuffer',
                    }
                )

                const png = await sharp(data).toFormat('png').toBuffer()
                const canvas = Canvas.createCanvas(128, 128)
                const context = canvas.getContext('2d')
                const image = await Canvas.loadImage(png)
                context.drawImage(image, 0, 0, 128, 128)
                const buffer = canvas.toBuffer('image/png')
                fs.writeFileSync(`./pfps/${player_18.discordId}.png`, buffer)
                console.log(`saved new pfp for ${player_18.name}`)
                count++
            } else {
                console.log('BOTH ???')
            }
        } catch (err) {
            console.log(err)
        }

        console.log(`saved ${count} pfps for the blogs`)
    }
}

savePfps()