import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { email, EmailStatus, Services } from '@prisma/client';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { UpdateEmailRequestDto } from './dto/request/update-email.request.dto';
import { SendEmailRequestDto } from './dto/request/send-email.request.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class EmailRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    dto: SendEmailRequestDto,
    selectColumns?: (keyof email)[],
  ): Promise<Partial<email>> {
    try {
      return await this.prismaService.email.create({
        select: this.getSelectColumns(selectColumns),
        data: {
          ...dto,
          sender: dto.sender || process.env.MAILER_SENDER,
          status: EmailStatus.IS_PENDING,
          services: Services.NODEJS_MAILER,
          templateVariables: JSON.stringify(dto.templateVariables),
        },
      });
    } catch (error) {
      throw new RpcException({
        code: ErrorCode.PRISMA_EMAIL_CREATE_ERROR,
        context: {
          operation: 'email-repository-create',
          data: {
            ...dto,
            sender: dto.sender || process.env.MAILER_SENDER,
            status: EmailStatus.IS_PENDING,
            services: Services.NODEJS_MAILER,
            templateVariables: JSON.stringify(dto.templateVariables),
          },
          prismaError: error.message,
        },
      });
    }
  }

  async update(
    id: number,
    dto: UpdateEmailRequestDto,
    selectColumns?: (keyof email)[],
  ): Promise<Partial<email>> {
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
          prismaError: error.message,
        },
      });
    }
  }

  async delete(
    id: number,
    selectColumns?: (keyof email)[],
  ): Promise<Partial<email>> {
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
          prismaError: error.message,
        },
      });
    }
  }

  private getSelectColumns(
    columns?: (keyof email)[],
  ): Record<keyof email, boolean> | undefined {
    if (!columns) return undefined;
    return columns.reduce(
      (acc, column) => {
        acc[column] = true;
        return acc;
      },
      {} as Record<keyof email, boolean>,
    );
  }
}
