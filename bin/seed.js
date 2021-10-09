
const { db, db2, Card, Entry, Match, Player, Status, Tournament } = require('../db/index.js')

const seed = async () => {
  await db.sync({force: true})
  db.close()
  console.log(`
    Seeding successful!
    RetroBot is now ready to rock!
  `)

  await db2.sync({force: true})
  db2.close()
  console.log(`
    Seeding successful!
    Format Library is now ready to rock!
  `)
}

seed().catch(err => {
  db.close()
  console.log(`
    Error seeding:
    ${err.message}
    ${err.stack}
  `)
})