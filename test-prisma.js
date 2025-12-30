const { PrismaClient } = require('@prisma/client')

async function main() {
    const prisma = new PrismaClient()
    console.log('--- PRISMA RUNTIME CHECK ---')
    const keys = Object.keys(prisma)
    const hasPlanningSession = keys.includes('planningSession') || (prisma.planningSession !== undefined)

    if (hasPlanningSession) {
        console.log('SUCCESS: "planningSession" is defined on the prisma client.')
    } else {
        console.log('FAILURE: "planningSession" is NOT defined on the prisma client.')
        console.log('Available models:', keys.filter(k => !k.startsWith('$') && !k.startsWith('_')))
    }
    await prisma.$disconnect()
}

main().catch(err => {
    console.error('ERROR during runtime check:', err.message)
    process.exit(1)
})
