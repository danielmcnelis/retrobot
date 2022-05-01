
const { google } = require('googleapis')
const token = require('../token')
const { access_token, refresh_token } = token   
const { installed } = require('../credentials.json')
const { client_secret, client_id, redirect_uris } = installed

const connectToSheets = async () => {
  const oAuth2Client = 
  new google.auth.OAuth2(
    client_id, 
    client_secret, 
    redirect_uris[0], 
    access_token, 
    refresh_token
  )

  oAuth2Client.setCredentials(token)
  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client})
  return {
    oAuth2Client,
    sheets
  }
}

async function makeSheet(sheets, title = 'Deck Lists', values = []) {
  try {
    const spreadsheet = await createNewSheet(sheets, title)
    const result = await writeToSheet(sheets, spreadsheet.spreadsheetId, 'Sheet1', 'RAW', values)
    console.log('%d cells updated.', result.updatedCells)
    return spreadsheet.spreadsheetId
  }
  catch (error) {
    console.log(error)
  }
}

async function createNewSheet(sheets, title) {
  const resource = {
    properties: {
      title
    },
  }
  return sheets.spreadsheets.create({ resource, fields: 'spreadsheetId' })
    .then(response => response.data)
}

async function writeToSheet(sheets, spreadsheetId, range, valueInputOption, values) {
  resource = {
    values
  }
  return sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption, resource })
    .then(response => response.data)
}

async function addSheet(sheets, oAuth2Client, spreadsheetId, title) {
  return sheets.spreadsheets.batchUpdate({
    auth: oAuth2Client,
    spreadsheetId: spreadsheetId,
    resource: {
      requests: [
        {
            'addSheet':{
                'properties':{
                    title
                }
            } 
        }
      ],
    }
})
    .then(response => response.data)
}


module.exports = {
  addSheet,
  connectToSheets,
  makeSheet,
  writeToSheet
}