import { prisma } from '../src/db/client'
import { seedPrismaDatabase } from '../src/data/bootstrap'

async function main() {
  await seedPrismaDatabase(prisma, { reset: true })
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
