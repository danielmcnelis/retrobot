
const { db } = require('../db/index.js')

const seed = async () => {
  await db.sync({force: true})
  db.close()
  console.log(`
    Seeding successful!
    FormatLibrary is now ready to rock!
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