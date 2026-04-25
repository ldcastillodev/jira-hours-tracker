import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- Top-level projects (clients) ---
  const tishmanStudio = await prisma.project.upsert({
    where: { id: 'seed-tishman-studio' },
    update: {},
    create: {
      id: 'seed-tishman-studio',
      name: 'Tishman Studio',
      monthlyBudget: 292,
    },
  });

  const mgsMarketing = await prisma.project.upsert({
    where: { id: 'seed-mgs-marketing' },
    update: {},
    create: {
      id: 'seed-mgs-marketing',
      name: 'MgS-Marketing',
      monthlyBudget: 150,
    },
  });

  const mgsParkland = await prisma.project.upsert({
    where: { id: 'seed-mgs-parkland' },
    update: {},
    create: {
      id: 'seed-mgs-parkland',
      name: 'MgS-Parkland',
      monthlyBudget: 150,
    },
  });

  const mgsStarTrek = await prisma.project.upsert({
    where: { id: 'seed-mgs-startrek' },
    update: {},
    create: {
      id: 'seed-mgs-startrek',
      name: 'MgS-Star Trek',
      monthlyBudget: 50,
    },
  });

  const tinyBlueDot = await prisma.project.upsert({
    where: { id: 'seed-tiny-blue-dot' },
    update: {},
    create: {
      id: 'seed-tiny-blue-dot',
      name: 'Tiny Blue Dot',
      monthlyBudget: 20,
    },
  });

  const mgsBV = await prisma.project.upsert({
    where: { id: 'seed-mgs-bv' },
    update: {},
    create: {
      id: 'seed-mgs-bv',
      name: 'MgS-Black & Veatch',
      monthlyBudget: 80,
    },
  });

  const tishmanCorporate = await prisma.project.upsert({
    where: { id: 'seed-tishman-corporate' },
    update: {},
    create: {
      id: 'seed-tishman-corporate',
      name: 'Tishman-Corporate',
      monthlyBudget: 53,
    },
  });

  const kraftHeinz = await prisma.project.upsert({
    where: { id: 'seed-kraft-heinz' },
    update: {},
    create: {
      id: 'seed-kraft-heinz',
      name: 'Kraft Heinz - AFH',
      monthlyBudget: 100,
    },
  });

  const mgsAlltech = await prisma.project.upsert({
    where: { id: 'seed-mgs-alltech' },
    update: {},
    create: {
      id: 'seed-mgs-alltech',
      name: 'MgS-Alltech',
      monthlyBudget: 50,
    },
  });

  const mgsAzek = await prisma.project.upsert({
    where: { id: 'seed-mgs-azek' },
    update: {},
    create: {
      id: 'seed-mgs-azek',
      name: 'MgS - Azek',
      monthlyBudget: 18,
    },
  });

  const bv = await prisma.project.upsert({
    where: { id: 'seed-bv' },
    update: {},
    create: {
      id: 'seed-bv',
      name: 'BV',
      monthlyBudget: 80,
    },
  });

  const efTours = await prisma.project.upsert({
    where: { id: 'seed-ef-tours' },
    update: {},
    create: {
      id: 'seed-ef-tours',
      name: 'EF Tours',
      monthlyBudget: 50,
    },
  });

  const mgsWami = await prisma.project.upsert({
    where: { id: 'seed-mgs-wami' },
    update: {},
    create: {
      id: 'seed-mgs-wami',
      name: 'MgS-WAMI',
      monthlyBudget: 120,
    },
  });

  const mgsFocusFeatures = await prisma.project.upsert({
    where: { id: 'seed-mgs-focus-features' },
    update: {},
    create: {
      id: 'seed-mgs-focus-features',
      name: 'MgS-Focus Features',
      monthlyBudget: 50,
    },
  });

  const mgsUpah = await prisma.project.upsert({
    where: { id: 'seed-mgs-upah' },
    update: {},
    create: {
      id: 'seed-mgs-upah',
      name: 'MgS-UPAH',
      monthlyBudget: 50,
    },
  });

  // --- Sample developer ---
  const devSample = await prisma.developer.upsert({
    where: { email: 'dev@mgs.com' },
    update: {},
    create: {
      id: 'seed-dev-sample',
      name: 'Sample Developer',
      email: 'dev@mgs.com',
    },
  });

  console.log('Seed completed:', {
    projects: 15,
    developers: 1,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
