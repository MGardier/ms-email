import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { join } from 'path';
import * as fs from 'fs/promises';
import { EnumErrorCode } from '../enums/error-codes.enum';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  async getPathIfExist(templatePath: string): Promise<string> {
    const path = this.__getPath(templatePath);
    try {
      await fs.access(path);
      return path;
    } catch (error) {
      throw new RpcException({
        code: this.__getTemplateErrorCode(error.code),
        context: {
          operation: 'getPathIfExist',
          path,
          templatePath,
        },
      });
    }
  }

  /************************* PRIVATE FUNCTIONS  ************************************************************/

  private __getPath(templatePath: string): string {
    const basePath = join(
      process.cwd(),
      process.env.NODE_ENV === 'production'
        ? 'dist/template/pages'
        : 'src/template/pages',
    );
    const fullPath = join(basePath, templatePath);

    if (!fullPath.startsWith(basePath)) {
      throw new RpcException({
        code: EnumErrorCode.TEMPLATE_PATH_INVALID,
        context: {
          operation: '__getPath',
          templatePath,
          reason: 'Path traversal detected',
        },
      });
    }

    return fullPath;
  }

  private __getTemplateErrorCode(errorCode: string): EnumErrorCode {
    switch (errorCode) {
      case 'ENOENT':
        return EnumErrorCode.TEMPLATE_NOT_FOUND;
      case 'EACCES':
        return EnumErrorCode.TEMPLATE_CANNOT_ACCESS;
      default:
        return EnumErrorCode.TEMPLATE_UNKNOWN_ERROR;
    }
  }
}
