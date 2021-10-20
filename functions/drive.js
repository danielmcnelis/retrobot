

const { google } = require('googleapis')
const { drive } = require('../secrets.json')    
const { access_token, refresh_token, token_type } = drive       
const { client_secret, client_id, redirect_uris } = require('../credentials.json')
const fs = require('fs')            

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0], access_token, refresh_token)
oAuth2Client.setCredentials({ 
  access_token, 
  refresh_token,
  token_type,
  scope:"https://www.googleapis.com/auth/drive"
 })

const drive = google.drive({ version: 'v3', auth: oAuth2Client})

const uploadDeckFolder = async (tournamentName) => {
  const fileMetadata = {
    'name': `${tournamentName} Decks`,
    'mimeType': 'application/vnd.google-apps.folder'
  }

  const folder = `./decks/${tournamentName}`
  const extensions = fs.readdirSync(folder)

  try {
    await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    }, function (err, file) {
      if (err) {
        console.error(err)
      } else {
        const folderId = file.data.id
        console.log(`Created folder with id: ${folderId}.`)
        for (let i = 0; i < extensions.length; i++) {
            const extension = extensions[i]

            const fileMetadata = {
              'name': `${extension}`,
              parents: [folderId]
            }

            const media = {
              mimeType: 'application/json',
              body: fs.createReadStream(`./decks/${tournamentName}/${extension}`)
            }

            saveFile(fileMetadata, media, i) 
        }
      }
    })
  } catch (err) {
    console.log(err)
  }
}

const saveFile = async (fileMetadata, media, i) => {
	return setTimeout(async function() {
      await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      }, function (err) {
        if (err) {
          console.log(err)
        } else {
          console.log(`Saved a new file: ${fileMetadata.name}.`)
        }
      })  
  }, (i+1)*1000)
}

module.exports = {
  uploadDeckFolder
}