import {expect, test} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const passwordHash = bcrypt.hashSync('password', 10);
const runId = Date.now();

async function ensureAdmin() {
    return prisma.user.upsert({
        where: {username: 'e2e.admin'},
        update: {
            name: 'E2E',
            surname: 'Admin',
            email: 'e2e.admin@spotly.test',
            role: 'SUPERADMIN',
            external: false,
            password: passwordHash,
        },
        create: {
            username: 'e2e.admin',
            name: 'E2E',
            surname: 'Admin',
            email: 'e2e.admin@spotly.test',
            role: 'SUPERADMIN',
            external: false,
            password: passwordHash,
        },
    });
}

async function ensurePickable() {
    return prisma.pickable.upsert({
        where: {name: 'E2E_CRUD_FLUENT'},
        update: {
            distinguishedName: 'E2E CRUD sans protection',
            description: 'Protection utilisée par les tests CRUD admin',
            cgu: 'CGU e2e CRUD',
        },
        create: {
            name: 'E2E_CRUD_FLUENT',
            distinguishedName: 'E2E CRUD sans protection',
            description: 'Protection utilisée par les tests CRUD admin',
            cgu: 'CGU e2e CRUD',
        },
    });
}

async function cleanupCrudData() {
    const resources = await prisma.resource.findMany({
        where: {name: {startsWith: 'E2E CRUD'}},
        select: {id: true},
    });
    await prisma.entry.deleteMany({where: {resourceId: {in: resources.map((resource) => resource.id)}}});
    await prisma.resource.deleteMany({where: {name: {startsWith: 'E2E CRUD'}}});
    await prisma.category.deleteMany({where: {name: {startsWith: 'E2E CRUD'}}});
    await prisma.domain.deleteMany({where: {name: {startsWith: 'E2E CRUD'}}});
}

async function loginAsAdmin(page) {
    await page.goto('/login');
    await page.getByPlaceholder("Entrer votre nom d'utilisateur").fill('e2e.admin');
    await page.getByPlaceholder('Entrer votre mot de passe').fill('password');
    await page.getByRole('button', {name: 'Se connecter'}).click();
    await expect(page.getByText('Ouverture de votre espace...')).toBeVisible();
    await page.waitForURL((url) => !url.pathname.includes('/login'), {waitUntil: 'load'});
    await expect.poll(async () => {
        const response = await page.request.get('/api/auth/session');
        if (response.status() !== 200) return null;
        const session = await response.json();
        return session?.user?.role;
    }).toBe('SUPERADMIN');
}

async function openAdminSection(page, sectionName) {
    await page.goto('/admin');
    await page.getByRole('button', {name: sectionName}).click();
    await expect(page.getByRole('heading', {name: sectionName})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Créer un nouvel élément'})).toBeEnabled();
}

async function selectOption(page, fieldName, optionName) {
    await page.getByRole('combobox', {name: fieldName}).click();
    await page.getByRole('option', {name: optionName}).click();
}

async function searchTable(page, value) {
    await page.getByPlaceholder(/Rechercher/).fill(value);
    await expect(page.getByText(value).first()).toBeVisible();
}

async function waitForDomain(name) {
    await expect.poll(async () => prisma.domain.findFirst({where: {name}})).not.toBeNull();
    return prisma.domain.findFirstOrThrow({where: {name}, include: {pickable: true}});
}

async function waitForCategory(name) {
    await expect.poll(async () => prisma.category.findFirst({where: {name}})).not.toBeNull();
    return prisma.category.findFirstOrThrow({where: {name}});
}

async function waitForResource(name) {
    await expect.poll(async () => prisma.resource.findFirst({where: {name}})).not.toBeNull();
    return prisma.resource.findFirstOrThrow({where: {name}, include: {domains: true, category: true}});
}

async function expectDeleted(model, name) {
    await expect.poll(async () => prisma[model].findFirst({where: {name}})).toBeNull();
}

test.beforeAll(async () => {
    await cleanupCrudData();
    await ensureAdmin();
    await ensurePickable();
});

test.afterAll(async () => {
    await cleanupCrudData();
    await prisma.$disconnect();
});

test.beforeEach(async ({page}) => {
    await loginAsAdmin(page);
});

test('admin peut créer, modifier et supprimer un site', async ({page}) => {
    const createdName = `E2E CRUD Site ${runId}`;
    const updatedName = `E2E CRUD Site modifié ${runId}`;

    await openAdminSection(page, 'Sites');
    await page.getByRole('button', {name: 'Créer un nouvel élément'}).click();
    await page.locator('#name').fill(createdName);
    await selectOption(page, 'Niveau de protection', 'E2E CRUD sans protection');
    await page.getByRole('button', {name: 'Créer', exact: true}).click();

    const createdDomain = await waitForDomain(createdName);
    expect(createdDomain.pickable.distinguishedName).toBe('E2E CRUD sans protection');

    await page.getByRole('button', {name: 'Rafraîchir les données'}).click();
    await searchTable(page, createdName);
    await page.getByRole('button', {name: `Modifier ${createdName}`, exact: true}).click();
    await page.locator('#name').fill(updatedName);
    await page.getByRole('button', {name: 'Modifier', exact: true}).click();

    await waitForDomain(updatedName);
    await expect.poll(async () => prisma.domain.findUnique({where: {id: createdDomain.id}})).toMatchObject({name: updatedName});

    await page.getByRole('button', {name: 'Rafraîchir les données'}).click();
    await searchTable(page, updatedName);
    await page.getByRole('button', {name: `Supprimer ${updatedName}`, exact: true}).click();
    await page.getByRole('button', {name: 'Oui', exact: true}).click();

    await expectDeleted('domain', updatedName);
});

test('admin peut créer, modifier et supprimer une catégorie', async ({page}) => {
    const createdName = `E2E CRUD Catégorie ${runId}`;
    const updatedName = `E2E CRUD Catégorie modifiée ${runId}`;

    await openAdminSection(page, 'Catégories');
    await page.getByRole('button', {name: 'Créer un nouvel élément'}).click();
    await page.locator('#name').fill(createdName);
    await page.locator('#description').fill('Description courte de catégorie e2e');
    await page.getByRole('button', {name: 'Créer', exact: true}).click();

    const createdCategory = await waitForCategory(createdName);
    expect(createdCategory.description).toBe('Description courte de catégorie e2e');

    await page.getByRole('button', {name: 'Rafraîchir les données'}).click();
    await searchTable(page, createdName);
    await page.getByRole('button', {name: `Modifier ${createdName}`, exact: true}).click();
    await page.locator('#name').fill(updatedName);
    await page.locator('#description').fill('Description modifiée de catégorie e2e');
    await page.getByRole('button', {name: 'Modifier', exact: true}).click();

    await waitForCategory(updatedName);
    await expect.poll(async () => prisma.category.findUnique({where: {id: createdCategory.id}})).toMatchObject({
        name: updatedName,
        description: 'Description modifiée de catégorie e2e',
    });

    await page.getByRole('button', {name: 'Rafraîchir les données'}).click();
    await searchTable(page, updatedName);
    await page.getByRole('button', {name: `Supprimer ${updatedName}`, exact: true}).click();
    await page.getByRole('button', {name: 'Oui', exact: true}).click();

    await expectDeleted('category', updatedName);
});

test('admin peut créer, modifier et supprimer une ressource', async ({page}) => {
    const pickable = await ensurePickable();
    const domain = await prisma.domain.create({
        data: {name: `E2E CRUD Site ressource ${runId}`, pickableId: pickable.id},
    });
    const category = await prisma.category.create({
        data: {name: `E2E CRUD Catégorie ressource ${runId}`, description: 'Support ressource e2e'},
    });
    const createdName = `E2E CRUD Ressource ${runId}`;
    const updatedName = `E2E CRUD Ressource modifiée ${runId}`;

    await openAdminSection(page, 'Ressources');
    await page.getByRole('button', {name: 'Créer un nouvel élément'}).click();
    await page.locator('#name').fill(createdName);
    await page.locator('#description').fill('Description courte de ressource e2e');
    await selectOption(page, 'Site', domain.name);
    await selectOption(page, 'Catégorie', category.name);
    await page.getByRole('button', {name: 'Créer', exact: true}).click();

    const createdResource = await waitForResource(createdName);
    expect(createdResource.description).toBe('Description courte de ressource e2e');
    expect(createdResource.domains.name).toBe(domain.name);
    expect(createdResource.category.name).toBe(category.name);

    await page.getByRole('button', {name: 'Rafraîchir les données'}).click();
    await searchTable(page, createdName);
    await page.getByRole('button', {name: `Modifier ${createdName}`, exact: true}).click();
    await page.locator('#name').fill(updatedName);
    await page.locator('#description').fill('Description modifiée de ressource e2e');
    await page.getByText('Disponible', {exact: true}).click();
    await page.getByRole('button', {name: 'Modifier', exact: true}).click();

    await waitForResource(updatedName);
    await expect.poll(async () => prisma.resource.findUnique({where: {id: createdResource.id}})).toMatchObject({
        name: updatedName,
        description: 'Description modifiée de ressource e2e',
        status: 'AVAILABLE',
    });

    await page.getByRole('button', {name: 'Rafraîchir les données'}).click();
    await searchTable(page, updatedName);
    await page.getByRole('button', {name: `Supprimer ${updatedName}`, exact: true}).click();
    await page.getByRole('button', {name: 'Oui', exact: true}).click();

    await expectDeleted('resource', updatedName);
});
