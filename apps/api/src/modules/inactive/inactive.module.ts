import { Module } from '@nestjs/common';
import { InactiveController } from './inactive.controller';
import { InactiveService } from './inactive.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InactiveController],
  providers: [InactiveService],
})
export class InactiveModule {}
