

const { google } = require('googleapis')
const { installed } = require('../credentials.json')
const { client_secret, client_id, redirect_uris } = installed
const fs = require('fs')            
const axios = require('axios')

const generateNewToken = async (server) => {
  const { refresh_token } = JSON.parse(server.googleToken)
  try {
    const { data } = await axios.post('https://www.googleapis.com/oauth2/v4/token', {
      "client_id": client_id,
      "client_secret": client_secret,
      "refresh_token": refresh_token,
      "grant_type": "refresh_token"
    })

    return data.access_token
  } catch (err) {
    console.log(err)
    return false
  }
}

const checkExpiryDate = async (server) => {
  const { access_token, expiry_date } = JSON.parse(server.googleToken)
  const currentTime = Date.now()
  if (currentTime > expiry_date) {
    console.log('generating new token')
    const newAccessToken = await generateNewToken(server)
    return newAccessToken
  } else {
    console.log('access token not expired')
    return access_token
  }
}

const uploadDeckFolder = async (server, tournamentName) => {
  try {
    const { access_token, refresh_token } = JSON.parse(server.googleToken)
    console.log('access_token', access_token)
    console.log('refresh_token', refresh_token)

    const oAuth2Client = new google.auth.OAuth2(
      client_id, 
      client_secret, 
      redirect_uris[0], 
      access_token, 
      refresh_token
    )
  
    oAuth2Client.setCredentials(JSON.parse(server.googleToken))
    const drive = google.drive({ version: 'v3', auth: oAuth2Client})
  
    const fileMetadata = {
      'name': `${tournamentName} Decks`,
      'mimeType': 'application/vnd.google-apps.folder'
    }
  
    const folder = `./decks/${server.name}/${tournamentName}`
    const extensions = fs.readdirSync(folder)

    try {
      drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      }, function (err, file) {
        if (err) {
          console.error('line 73 error:\n', err)
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
                body: fs.createReadStream(`./decks/${server.name}/${tournamentName}/${extension}`)
              }
  
              saveFile(drive, fileMetadata, media, i) 
          }
        }
      })
    } catch (err) {
      console.log(err)
    }
  } catch (err) {
    console.log(err)
  }
}

const saveFile = async (drive, fileMetadata, media, i) => {
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
  checkExpiryDate,
  generateNewToken,
  uploadDeckFolder
}