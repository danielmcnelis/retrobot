

const {google} = require('googleapis')
const token = require('./secrets.json')
const credentials = require('./credentials.json')

const {client_secret, client_id, redirect_uris} = credentials.installed
const {access_token, refresh_token} = token
const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0], access_token, refresh_token)

oAuth2Client.setCredentials(token)

const sheets = google.sheets({ version: 'v4', auth: oAuth2Client})

async function makeSheet(title = 'Deck Lists', values = []) {
  try {
    const spreadsheet = await createNewSheet(title)
    const result = await writeToSheet(spreadsheet.spreadsheetId, 'Sheet1', 'RAW', values)
    console.log('%d cells updated.', result.updatedCells)
    return spreadsheet.spreadsheetId
  }
  catch (error) {
    console.log(error)
  }
}

async function createNewSheet(title) {
  const resource = {
    properties: {
      title
    },
  }
  return sheets.spreadsheets.create({ resource, fields: 'spreadsheetId' })
    .then(response => response.data)
}

async function writeToSheet(spreadsheetId, range, valueInputOption, values) {
  resource = {
    values
  }
  return sheets.spreadsheets.values.update({ spreadsheetId, range, valueInputOption, resource })
    .then(response => response.data)
}

async function addSheet(spreadsheetId, title) {
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
  makeSheet,
  writeToSheet
}