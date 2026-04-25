import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.worklog.deleteMany();
  await prisma.component.deleteMany();
  await prisma.developer.deleteMany();
  await prisma.project.deleteMany();

  // --- Projects ---
  const tishmanStudio = await prisma.project.create({
    data: { name: 'Tishman Studio', monthlyBudget: 292 },
  });
  const mgsMarketing = await prisma.project.create({
    data: { name: 'MgS-Marketing', monthlyBudget: 150 },
  });
  const kraftHeinz = await prisma.project.create({
    data: { name: 'Kraft Heinz - AFH', monthlyBudget: 100 },
  });

  // --- Components ---
  const tishmanWeb = await prisma.component.create({
    data: { name: 'Tishman Web', isBillable: true, projectId: tishmanStudio.id },
  });
  const tishmanMobile = await prisma.component.create({
    data: { name: 'Tishman Mobile', isBillable: true, projectId: tishmanStudio.id },
  });
  const tishmanInternal = await prisma.component.create({
    data: { name: 'Tishman Internal', isBillable: false, projectId: tishmanStudio.id },
  });
  const mgsWebsite = await prisma.component.create({
    data: { name: 'MgS Website', isBillable: true, projectId: mgsMarketing.id },
  });
  const mgsSocial = await prisma.component.create({
    data: { name: 'MgS Social', isBillable: false, projectId: mgsMarketing.id },
  });
  const kraftDashboard = await prisma.component.create({
    data: { name: 'Kraft Dashboard', isBillable: true, projectId: kraftHeinz.id },
  });

  const components = [tishmanWeb, tishmanMobile, tishmanInternal, mgsWebsite, mgsSocial, kraftDashboard];

  // --- Developers ---
  const devMaria = await prisma.developer.create({
    data: { name: 'María López', email: 'maria@mgs.com', jiraAccountId: 'jira-maria-001' },
  });
  const devCarlos = await prisma.developer.create({
    data: { name: 'Carlos García', email: 'carlos@mgs.com', jiraAccountId: 'jira-carlos-002' },
  });
  const devLuis = await prisma.developer.create({
    data: { name: 'Luis Castillo', email: 'luis@mgs.com', jiraAccountId: 'jira-luis-003', slackId: 'U_LUIS' },
  });
  const devAna = await prisma.developer.create({
    data: { name: 'Ana Martínez', email: 'ana@mgs.com', jiraAccountId: 'jira-ana-004' },
  });

  const developers = [devMaria, devCarlos, devLuis, devAna];

  // --- Worklogs for current and previous month ---
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const worklogs: Array<{
    jiraIssueId: string;
    date: Date;
    hours: number;
    jiraAccountId: string;
    componentId: number;
  }> = [];

  let wlCounter = 0;

  function generateMonth(y: number, m: number) {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (const dev of developers) {
      const devComps = components
        .sort(() => Math.random() - 0.5)
        .slice(0, 2 + Math.floor(Math.random() * 3));

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(y, m, day);
        const dow = date.getDay();
        if (dow === 0 || dow === 6) continue;

        const entriesPerDay = 1 + Math.floor(Math.random() * 2);
        for (let e = 0; e < entriesPerDay; e++) {
          const comp = devComps[Math.floor(Math.random() * devComps.length)];
          const hours = [0.5, 1, 1.5, 2, 2.5, 3, 4][Math.floor(Math.random() * 7)];
          wlCounter++;
          worklogs.push({
            jiraIssueId: `seed-wl-${wlCounter}`,
            date,
            hours,
            jiraAccountId: dev.jiraAccountId,
            componentId: comp.id,
          });
        }
      }
    }
  }

  // Current month
  generateMonth(year, month);

  // Previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  generateMonth(prevYear, prevMonth);

  await prisma.worklog.createMany({ data: worklogs });

  console.log('Seed completed:', {
    projects: 3,
    components: components.length,
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
