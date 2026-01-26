import { Injectable } from '@nestjs/common';
import { EmailTemplateVersion } from '@prisma/client';

import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TemplateRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findVersionById(
    id: number,
    includeTemplate = false,
  ): Promise<EmailTemplateVersion | null> {
    return await this.prismaService.emailTemplateVersion.findUnique({
      where: { id },
      include: {
        template: includeTemplate,
      },
    });
  }

  async findVersionBySlug(
    slug: string,
    includeTemplate = false,
  ): Promise<EmailTemplateVersion | null> {
    return await this.prismaService.emailTemplateVersion.findFirst({
      where: {
        template: { slug },
        isEnabled: true,
      },
      include: {
        template: includeTemplate,
      },
      orderBy: {
        versionNumber: 'desc',
      },
    });
  }
}
