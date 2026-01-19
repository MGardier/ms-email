import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { join } from 'path';
import * as fs from 'fs/promises';
import { ErrorCode } from 'src/common/enums/error-codes.enum';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  async getPathIfExist(templatePath: string): Promise<string> {
    const path = this.getPath(templatePath);
    try {
      await fs.access(path);
      return path;
    } catch (error) {
      throw new RpcException({
        code: this.getTemplateErrorCode(error.code),
        context: {
          operation: 'getPathIfExist',
          path,
          templatePath,
        },
      });
    }
  }

  private getPath(templatePath: string): string {
    const basePath = join(
      process.cwd(),
      process.env.NODE_ENV === 'production'
        ? 'dist/modules/template/pages'
        : 'src/modules/template/pages',
    );
    const fullPath = join(basePath, templatePath);

    if (!fullPath.startsWith(basePath)) {
      throw new RpcException({
        code: ErrorCode.TEMPLATE_PATH_INVALID,
        context: {
          operation: 'getPath',
          templatePath,
          reason: 'Path traversal detected',
        },
      });
    }

    return fullPath;
  }

  private getTemplateErrorCode(errorCode: string): ErrorCode {
    switch (errorCode) {
      case 'ENOENT':
        return ErrorCode.TEMPLATE_NOT_FOUND;
      case 'EACCES':
        return ErrorCode.TEMPLATE_CANNOT_ACCESS;
      default:
        return ErrorCode.TEMPLATE_UNKNOWN_ERROR;
    }
  }
}
