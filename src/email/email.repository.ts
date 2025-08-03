import { Injectable, Catch } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { email, EmailStatus, Services } from '@prisma/client';

import { PrismaService } from 'prisma/prisma.service';
import { EnumErrorCode } from 'src/enums/error-codes.enum';

import { UpdateEmailDto } from './dto/update-email.dto';
import { SendEmailDto } from './dto/send-email-dto';

@Injectable()
export class EmailRepository {
  constructor(private readonly prismaService: PrismaService) {}

  /** Responsability : create an email with prismaService */
  async create(dto: SendEmailDto, selectColumns?: (keyof email)[]) {
    try {
      return await this.prismaService.email.create({
        select: this.__getSelectColumns(selectColumns),
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
        code: EnumErrorCode.PRISMA_EMAIL_CREATE_ERROR,
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

  /** Responsability : update an email with prismaService */
  async update(
    id: number,
    dto: UpdateEmailDto,
    selectColumns?: (keyof email)[],
  ) {
    try {
      return await this.prismaService.email.update({
        select: this.__getSelectColumns(selectColumns),
        data: {
          ...dto,
        },
        where: {
          id,
        },
      });
    } catch (error) {
      throw new RpcException({
        code: EnumErrorCode.PRISMA_EMAIL_UPDATE_ERROR,
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

  /** Responsability : delete an email with prismaService */
  async delete(id: number, selectColumns?: (keyof email)[]) {
    try {
      return await this.prismaService.email.delete({
        select: this.__getSelectColumns(selectColumns),
        where: {
          id,
        },
      });
    } catch (error) {
      throw new RpcException({
        code: EnumErrorCode.PRISMA_EMAIL_DELETE_ERROR,
        context: {
          operation: 'email-repository-delete',
          id,
          prismaError: error.message,
        },
      });
    }
  }

  /************************* PRIVATE FUNCTIONS  ************************************************************/

  /** Responsability : Format an array of field of Email in Prisma select */
  private __getSelectColumns(
    columns?: (keyof email)[],
  ): Record<keyof email, boolean> | undefined {
    const select = columns?.reduce(
      (acc, column) => {
        acc[column] = true;
        return acc;
      },
      {} as Record<keyof email, boolean>,
    );
    return select;
  }
}
