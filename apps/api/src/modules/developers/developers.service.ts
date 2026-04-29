import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeveloperDto } from './dto/create-developer.dto';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

@Injectable()
export class DevelopersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.developer.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const dev = await this.prisma.developer.findFirst({ where: { id, deletedAt: null } });
    if (!dev) throw new NotFoundException(`Developer ${id} not found`);
    return dev;
  }

  create(data: CreateDeveloperDto) {
    return this.prisma.developer.create({ data });
  }

  async update(id: number, data: UpdateDeveloperDto) {
    await this.findOne(id);
    return this.prisma.developer.update({ where: { id }, data });
  }

  async delete(id: number) {
    await this.findOne(id);
    await this.prisma.developer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  findDeleted() {
    return this.prisma.developer.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async activateDeveloper(id: number) {
    const dev = await this.prisma.developer.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!dev) throw new NotFoundException(`Inactive developer ${id} not found`);
    const emailConflict = await this.prisma.developer.findFirst({
      where: { email: dev.email, deletedAt: null, id: { not: id } },
    });
    if (emailConflict)
      throw new ConflictException(
        `A developer with email "${dev.email}" already exists.`,
      );
    return this.prisma.developer.update({ where: { id }, data: { deletedAt: null } });
  }
}
