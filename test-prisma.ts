import { PrismaClient } from '@prisma/client'

async function main() {
    const prisma = new PrismaClient()
    console.log('Checking planningSession property...')
    if ('planningSession' in prisma) {
        console.log('SUCCESS: planningSession exists on prisma client')
    } else {
        console.log('FAILURE: planningSession NOT found on prisma client')
        console.log('Available properties:', Object.keys(prisma).filter(k => !k.startsWith('_')))
    }
    await prisma.$disconnect()
}

main().catch(console.error)
