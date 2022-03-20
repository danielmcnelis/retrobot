

const { google } = require('googleapis')
const token = require('../token.json')
const { access_token, refresh_token, expiry_date, scope, token_type } = token
const { installed } = require('../credentials.json')
const { client_secret, client_id, redirect_uris } = installed
const fs = require('fs')            
const axios = require('axios')

const generateNewToken = async (currentTime) => {
  const { data } = await axios.post('https://www.googleapis.com/oauth2/v4/token', {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
     })

  const regeneratedToken = {
    access_token: data.access_token,
    refresh_token: refresh_token,
    scope: data.scope,
    token_type: data.token_type,
    expiry_date: currentTime + data.expires_in
  }

  console.log('regeneratedToken', regeneratedToken)
  const tokenString = JSON.stringify(regeneratedToken);
  fs.writeFileSync('../token.json', tokenString);
}

const checkExpiryDate = async () => {
  const currentTime = Date.now()
  if (currentTime > expiry_date) {
    console.log('generating new token')
    await generateNewToken(currentTime) 
  } else {
    console.log('access token has not expired')
  }
}

const uploadDeckFolder = async (tournamentName) => {
  console.log('line 43')
  const oAuth2Client = new google.auth.OAuth2(
    client_id, 
    client_secret, 
    redirect_uris[0], 
    access_token, 
    refresh_token
  )

  console.log('oAuth2Client', oAuth2Client)

  oAuth2Client.setCredentials(token)
  console.log('line 55')
  const drive = google.drive({ version: 'v3', auth: oAuth2Client})
  console.log('drive', drive)

  const fileMetadata = {
    'name': `${tournamentName} Decks`,
    'mimeType': 'application/vnd.google-apps.folder'
  }

  const folder = `./decks/${tournamentName}`
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
              body: fs.createReadStream(`./decks/${tournamentName}/${extension}`)
            }

            saveFile(drive, fileMetadata, media, i) 
        }
      }
    })
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
  uploadDeckFolder
}