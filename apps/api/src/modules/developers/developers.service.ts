import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DevelopersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.developer.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const dev = await this.prisma.developer.findUnique({ where: { id } });
    if (!dev) throw new NotFoundException(`Developer ${id} not found`);
    return dev;
  }

  create(data: {
    name: string;
    email: string;
    jiraAccountId?: string;
    slackId?: string;
  }) {
    return this.prisma.developer.create({ data });
  }

  async update(
    id: string,
    data: {
      name?: string;
      email?: string;
      jiraAccountId?: string | null;
      slackId?: string | null;
    },
  ) {
    await this.findOne(id);
    return this.prisma.developer.update({ where: { id }, data });
  }
}
