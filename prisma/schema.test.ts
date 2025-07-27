print(default_api.run_terminal_command(command="npm cache clean --force"))
import { PrismaClient } from '@prisma/client';

describe('Prisma Schema', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should have the CommonArea model', () => {
    expect(prisma.commonArea).toBeDefined();
  });

  test('should have the WorkOrder model', () => {
    expect(prisma.workOrder).toBeDefined();
  });

  test('should have the User model', () => {
    expect(prisma.user).toBeDefined();
  });

  // Agrega más pruebas aquí para otros modelos importantes
});