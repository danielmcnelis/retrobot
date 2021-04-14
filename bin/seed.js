
const { db } = require('../db/index.js')

const seed = async () => {
  await db.sync()
  db.close()
  console.log(`
    Seeding successful!
    RB is now ready to rock!
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
