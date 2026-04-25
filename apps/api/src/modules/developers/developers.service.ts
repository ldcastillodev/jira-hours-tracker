import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DevelopersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.developer.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
