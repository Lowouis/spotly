#!/usr/bin/env node

import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseConnection() {
    console.log('🔍 Test de connexion à la base de données...')

    try {
        // Test de connexion basique
        await prisma.$connect()
        console.log('✅ Connexion réussie!')

        // Test d'une requête simple
        const userCount = await prisma.user.count()
        console.log(`📊 Nombre d'utilisateurs dans la base: ${userCount}`)

        console.log('')
        console.log('🎉 Connexion à la base de données réussie!')
        console.log('Votre base Neon est prête pour Spotly.')

    } catch (error) {
        console.error('❌ Erreur de connexion:', error.message)
        console.log('')
        console.log('🔧 Solutions possibles:')
        console.log('1. Vérifiez que DATABASE_URL est correct')
        console.log('2. Vérifiez que DATABASE_PROVIDER="postgresql"')
        console.log('3. Assurez-vous que la base Neon est active')

        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

testDatabaseConnection() 