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

  // --- More developers ---
  const devMaria = await prisma.developer.upsert({
    where: { email: 'maria@mgs.com' },
    update: {},
    create: { id: 'seed-dev-maria', name: 'María López', email: 'maria@mgs.com' },
  });

  const devCarlos = await prisma.developer.upsert({
    where: { email: 'carlos@mgs.com' },
    update: {},
    create: { id: 'seed-dev-carlos', name: 'Carlos García', email: 'carlos@mgs.com' },
  });

  const devAna = await prisma.developer.upsert({
    where: { email: 'ana@mgs.com' },
    update: {},
    create: { id: 'seed-dev-ana', name: 'Ana Martínez', email: 'ana@mgs.com' },
  });

  const devLuis = await prisma.developer.upsert({
    where: { email: 'luis@mgs.com' },
    update: {},
    create: { id: 'seed-dev-luis', name: 'Luis Castillo', email: 'luis@mgs.com' },
  });

  const devSofia = await prisma.developer.upsert({
    where: { email: 'sofia@mgs.com' },
    update: {},
    create: { id: 'seed-dev-sofia', name: 'Sofía Rivera', email: 'sofia@mgs.com' },
  });

  // --- Sample worklogs for current month ---
  const developers = [devSample, devMaria, devCarlos, devAna, devLuis, devSofia];
  const projects = [
    tishmanStudio, mgsMarketing, mgsParkland, mgsStarTrek, tinyBlueDot,
    mgsBV, tishmanCorporate, kraftHeinz, mgsAlltech, mgsAzek,
    bv, efTours, mgsWami, mgsFocusFeatures, mgsUpah,
  ];

  // Generate worklogs for the current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Delete existing seed worklogs to avoid duplicates
  await prisma.worklog.deleteMany({
    where: { jiraIssueId: { startsWith: 'seed-wl-' } },
  });

  const worklogs: Array<{
    jiraIssueId: string;
    date: Date;
    hours: number;
    isBillable: boolean;
    projectId: string;
    developerId: string;
  }> = [];

  let wlCounter = 0;

  for (const dev of developers) {
    // Each dev works on 3-5 random projects
    const devProjects = projects
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 3));

    // Generate entries for ~18-22 working days
    for (let day = 1; day <= Math.min(daysInMonth, 25); day++) {
      const date = new Date(year, month, day);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends

      // 1-3 entries per day per dev
      const entriesPerDay = 1 + Math.floor(Math.random() * 3);
      for (let e = 0; e < entriesPerDay; e++) {
        const proj = devProjects[Math.floor(Math.random() * devProjects.length)];
        const hours = [0.5, 1, 1.5, 2, 2.5, 3, 4][Math.floor(Math.random() * 7)];
        const isBillable = Math.random() > 0.2; // 80% billable

        wlCounter++;
        worklogs.push({
          jiraIssueId: `seed-wl-${wlCounter}`,
          date,
          hours,
          isBillable,
          projectId: proj.id,
          developerId: dev.id,
        });
      }
    }
  }

  // Also generate last month's data for comparison
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDaysInMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

  for (const dev of developers) {
    const devProjects = projects
      .sort(() => Math.random() - 0.5)
      .slice(0, 3 + Math.floor(Math.random() * 3));

    for (let day = 1; day <= prevDaysInMonth; day++) {
      const date = new Date(prevYear, prevMonth, day);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue;

      const entriesPerDay = 1 + Math.floor(Math.random() * 2);
      for (let e = 0; e < entriesPerDay; e++) {
        const proj = devProjects[Math.floor(Math.random() * devProjects.length)];
        const hours = [0.5, 1, 1.5, 2, 3, 4][Math.floor(Math.random() * 6)];
        const isBillable = Math.random() > 0.25;

        wlCounter++;
        worklogs.push({
          jiraIssueId: `seed-wl-${wlCounter}`,
          date,
          hours,
          isBillable,
          projectId: proj.id,
          developerId: dev.id,
        });
      }
    }
  }

  // Bulk insert all worklogs
  await prisma.worklog.createMany({ data: worklogs });

  console.log('Seed completed:', {
    projects: 15,
    developers: developers.length,
    worklogs: worklogs.length,
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
