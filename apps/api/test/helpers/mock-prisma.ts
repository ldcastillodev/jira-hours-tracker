function mockModel() {
  return {
    findMany: jest.fn() as jest.Mock<any>,
    findFirst: jest.fn() as jest.Mock<any>,
    findUnique: jest.fn() as jest.Mock<any>,
    create: jest.fn() as jest.Mock<any>,
    createMany: jest.fn() as jest.Mock<any>,
    update: jest.fn() as jest.Mock<any>,
    updateMany: jest.fn() as jest.Mock<any>,
    delete: jest.fn() as jest.Mock<any>,
    deleteMany: jest.fn() as jest.Mock<any>,
    count: jest.fn() as jest.Mock<any>,
  };
}

export function createMockPrismaService() {
  return {
    developer: mockModel(),
    project: mockModel(),
    component: mockModel(),
    worklog: mockModel(),
    $transaction: jest.fn() as jest.Mock<any>,
    $connect: jest.fn() as jest.Mock<any>,
    $disconnect: jest.fn() as jest.Mock<any>,
  };
}

export type MockPrismaService = ReturnType<typeof createMockPrismaService>;
