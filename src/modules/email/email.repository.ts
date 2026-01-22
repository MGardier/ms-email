import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Email, Prisma } from '@prisma/client';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { UpdateEmailDto } from './dto/update-email.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class EmailRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    dto: SendEmailDto,
    selectColumns?: (keyof Email)[],
  ): Promise<Partial<Email>> {
    try {
      return await this.prismaService.email.create({
        select: this.getSelectColumns(selectColumns),
        data: {
          recipients: dto.recipients,
          cc: dto.cc ?? [],
          bcc: dto.bcc ?? [],
          subject: dto.subject,
          html: dto.html,
          templateVersionId: dto.templateVersionId,
          variables: dto.variables as Prisma.InputJsonValue,
          userId: dto.userId,
          origin: dto.origin,
          isApproved: dto.isApproved ?? true,
          metadata: dto.metadata as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      throw new RpcException({
        code: ErrorCode.PRISMA_EMAIL_CREATE_ERROR,
        context: {
          operation: 'email-repository-create',
          data: {
            recipients: dto.recipients,
            subject: dto.subject,
            userId: dto.userId,
            origin: dto.origin,
          },
          prismaError: (error as Error).message,
        },
      });
    }
  }

  async update(
    id: string,
    dto: UpdateEmailDto,
    selectColumns?: (keyof Email)[],
  ): Promise<Partial<Email>> {
    try {
      return await this.prismaService.email.update({
        select: this.getSelectColumns(selectColumns),
        data: {
          ...dto,
        },
        where: {
          id,
        },
      });
    } catch (error) {
      throw new RpcException({
        code: ErrorCode.PRISMA_EMAIL_UPDATE_ERROR,
        context: {
          operation: 'email-repository-update',
          data: {
            ...dto,
          },
          id,
          prismaError: (error as Error).message,
        },
      });
    }
  }

  async delete(
    id: string,
    selectColumns?: (keyof Email)[],
  ): Promise<Partial<Email>> {
    try {
      return await this.prismaService.email.delete({
        select: this.getSelectColumns(selectColumns),
        where: {
          id,
        },
      });
    } catch (error) {
      throw new RpcException({
        code: ErrorCode.PRISMA_EMAIL_DELETE_ERROR,
        context: {
          operation: 'email-repository-delete',
          id,
          prismaError: (error as Error).message,
        },
      });
    }
  }

  private getSelectColumns(
    columns?: (keyof Email)[],
  ): Record<keyof Email, boolean> | undefined {
    if (!columns) return undefined;
    return columns.reduce(
      (acc, column) => {
        acc[column] = true;
        return acc;
      },
      {} as Record<keyof Email, boolean>,
    );
  }
}
