import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.worklog.deleteMany();
  await prisma.component.deleteMany();
  await prisma.developer.deleteMany();
  await prisma.project.deleteMany();

  // --- Developers ---
  await prisma.developer.createMany({
    data: [
      { name: 'Luis Castillo', email: 'luis.castillo@applydigital.com' },
      { name: 'Sebastian Espindola', email: 'sebastian.espindola@applydigital.com' },
      { name: 'Emilio Barboza', email: 'emilio.barboza@applydigital.com' },
      { name: 'Jonathan Hernandez', email: 'jonathan.hernandez@applydigital.com' },
      { name: 'Brayhan Villalba', email: 'brayhan.villalba@applydigital.com' },
      { name: 'Tamara Rivas', email: 'tamara.rivas@applydigital.com' },
      { name: 'Oscar Bustos', email: 'oscar.bustos@applydigital.com' },
      { name: 'Francisca Jorquera', email: 'francisca.jorquera@applydigital.com' },
      { name: 'Francisca Irribarra', email: 'francisca.irribarra@applydigital.com' },
      { name: 'Victor Araya', email: 'victor.araya@applydigital.com' },
    ],
  });

  // --- Projects + Components (one component per project) ---
  const projectsData = [
    {
      name: 'Tishman Studio',
      componentName: 'Tishman Studio',
      monthlyBudget: 292.0,
      isBillable: true,
    },
    {
      name: 'MgS-Black & Veatch',
      componentName: 'MgS-Black & Veatch',
      monthlyBudget: 80.0,
      isBillable: true,
    },
    {
      name: 'MgS-Star Trek',
      componentName: 'MgS-Star Trek',
      monthlyBudget: 50.0,
      isBillable: true,
    },
    {
      name: 'Tishman Corporate',
      componentName: 'Tishman-Corporate',
      monthlyBudget: 53.0,
      isBillable: true,
    },
    {
      name: 'MgS Hours - Others MgS (NB)',
      componentName: 'MgS Hours - Others MgS (NB)',
      monthlyBudget: 300.0,
      isBillable: false,
    },
    {
      name: 'MgS Hours - Others Apply (NB)',
      componentName: 'MgS Hours - Others Apply (NB)',
      monthlyBudget: 300.0,
      isBillable: false,
    },
    {
      name: 'MgS-Marketing',
      componentName: 'MgS-Marketing',
      monthlyBudget: 150.0,
      isBillable: true,
    },
  ];

  for (const p of projectsData) {
    const project = await prisma.project.create({
      data: { name: p.name, monthlyBudget: p.monthlyBudget },
    });
    await prisma.component.create({
      data: {
        name: p.componentName,
        isBillable: p.isBillable,
        projectId: project.id,
      },
    });
  }

  console.log('Seed completed:', {
    developers: 10,
    projects: projectsData.length,
    components: projectsData.length,
    worklogs: 0,
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
