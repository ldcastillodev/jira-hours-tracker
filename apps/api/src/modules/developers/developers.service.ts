import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DevelopersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.developer.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const dev = await this.prisma.developer.findUnique({ where: { id } });
    if (!dev) throw new NotFoundException(`Developer ${id} not found`);
    return dev;
  }

  create(data: {
    name: string;
    email: string;
    jiraAccountId: string;
    slackId?: string;
  }) {
    return this.prisma.developer.create({ data });
  }

  async update(
    id: number,
    data: {
      name?: string;
      email?: string;
      jiraAccountId?: string;
      slackId?: string | null;
    },
  ) {
    await this.findOne(id);
    return this.prisma.developer.update({ where: { id }, data });
  }

  async delete(id: number) {
    await this.findOne(id);
    try {
      await this.prisma.developer.delete({ where: { id } });
      return { deleted: true };
    } catch (err: any) {
      if (err.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete developer with existing worklogs',
        );
      }
      throw err;
    }
  }
}
