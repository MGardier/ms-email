import { Injectable } from '@nestjs/common';
import { EmailTemplateVersion } from '@prisma/client';

import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TemplateRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findVersionBySlug(
    slug: string,
    versionNumber?: number,
    includeTemplate = false,
  ): Promise<EmailTemplateVersion | null> {
    return await this.prismaService.emailTemplateVersion.findFirst({
      where: {
        template: { slug },
        // A disabled version is never usable, even when a specific
        // versionNumber is requested.
        isEnabled: true,
        ...(versionNumber !== undefined ? { versionNumber } : {}),
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
