

const {google} = require('googleapis')
const {drive_token} = require('../secrets.json')
const {drive_credentials} = require('../credentials.json')
const fs = require('fs')

// const {client_secret, client_id, redirect_uris} = drive_credentials.installed
// const {access_token, refresh_token} = drive_token

// const oAuth2Client = new google.auth.OAuth2(
//     client_id, client_secret, redirect_uris[0], access_token, refresh_token)

// oAuth2Client.setCredentials(drive_token)

// const drive = google.drive({ version: 'v3', auth: oAuth2Client})

const uploadDeckFolder = async (name, allDecks) => {
  let folderId
  const fileMetadata = {
    'name': `${name} Decks`,
    'mimeType': 'application/vnd.google-apps.folder'
  }

  // try {
  //   await drive.files.create({
  //     resource: fileMetadata,
  //     fields: 'id'
  //   }, function (err, file) {
  //     if (err) {
  //       console.error(err)
  //     } else {
  //       folderId = file.data.id
  //       console.log(`Created folder with id: ${folderId}.`)
  //       for (let i = 0; i < allDecks.length; i++) {
  //           const player = allDecks[i].player.name

  //           const fileMetadata = {
  //           'name': `${name} - ${player}.ydk`,
  //           parents: [folderId]
  //           }
        
  //           const media = {
  //           mimeType: 'application/json',
  //           body: fs.createReadStream(`./decks/${player}.ydk`)
  //           }

  //           saveFile(fileMetadata, media, i) 
  //       }
  //     }
  //   })
  // } catch (err) {
  //   console.log(err)
  // }
}

// const saveFile = async (fileMetadata, media, i) => {
// 	return setTimeout(async function() {
//       await drive.files.create({
//         resource: fileMetadata,
//         media: media,
//         fields: 'id'
//       }, function (err) {
//         if (err) {
//           console.log(err)
//         } else {
//           console.log(`Saved a new file: ${fileMetadata.name}.`)
//         }
//       })  
//   }, (i+1)*1000)
// }

module.exports = {
  uploadDeckFolder
}