import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { join } from 'path';
import * as fs from 'fs/promises';
import * as Handlebars from 'handlebars';

import { ErrorCode } from 'src/common/enums/error-codes.enum';
import { TemplateRepository } from './template.repository';
import { ITemplateVersion } from './types';
import { SendEmailDto } from '../email/dto/send-email.dto';

interface NodeError extends Error {
  code?: string;
}

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private partialsRegistered = false;

  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly configService: ConfigService,
  ) {}

  async buildTemplate(
    payload: SendEmailDto,
    templateVersion: ITemplateVersion,
  ): Promise<string> {
    // Compile partials templates like base-template
    await this.registerPartials();
    const templatePath = await this.getPathIfExist(templateVersion.filePath);

    if (payload.html) {
      // Compile html content first
      const compiledHtml = Handlebars.compile(payload.html)(
        payload.variables || {},
      );
      // Compile template html with variables second
      return this.compileTemplate(templatePath, {
        htmlContent: compiledHtml,
      });
    }

    return this.compileTemplate(templatePath, payload.variables || {});
  }

  async getTemplateVersionById(id: number): Promise<ITemplateVersion> {
    const templateVersion = await this.templateRepository.findVersionById(
      id,
      true,
    );

    if (!templateVersion) {
      throw new RpcException({
        code: ErrorCode.TEMPLATE_NOT_FOUND,
        context: {
          operation: 'getTemplateVersionById',
          templateVersionId: id,
        },
      });
    }

    return templateVersion as ITemplateVersion;
  }

  async getTemplateVersionBySlug(slug: string): Promise<ITemplateVersion> {
    const templateVersion = await this.templateRepository.findVersionBySlug(
      slug,
      true,
    );

    if (!templateVersion) {
      throw new RpcException({
        code: ErrorCode.TEMPLATE_NOT_FOUND,
        context: {
          operation: 'getTemplateVersionBySlug',
          slug,
        },
      });
    }

    return templateVersion as ITemplateVersion;
  }

  /** PRIVATE METHODS */

  private async registerPartials(): Promise<void> {
    if (this.partialsRegistered) return;

    const basePath = this.getBasePath();
    const baseTemplate = await fs.readFile(
      join(basePath, 'excluded/base-template.hbs'),
      'utf-8',
    );
    Handlebars.registerPartial('base-template', baseTemplate);
    this.partialsRegistered = true;
  }

  private getBasePath(): string {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    return join(
      process.cwd(),
      isProduction
        ? 'dist/modules/template/pages'
        : 'src/modules/template/pages',
    );
  }

  private async getPathIfExist(templatePath: string): Promise<string> {
    const path = this.getPath(templatePath);
    try {
      await fs.access(path);
      return path;
    } catch (error) {
      const nodeError = error as NodeError;
      throw new RpcException({
        code: this.getTemplateErrorCode(nodeError.code),
        context: {
          operation: 'getPathIfExist',
          path,
          templatePath,
        },
      });
    }
  }

  private getPath(templatePath: string): string {
    const basePath = this.getBasePath();
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

  private async compileTemplate(
    templatePath: string,
    variables: Record<string, unknown>,
  ): Promise<string> {
    try {
      const templateContent = await fs.readFile(`${templatePath}`, 'utf-8');
      const template = Handlebars.compile(templateContent);
      return template(variables);
    } catch (error) {
      this.logger.error(
        `Failed to compile template: ${(error as Error).message}`,
      );
      throw new RpcException({
        code: ErrorCode.TEMPLATE_UNKNOWN_ERROR,
        context: {
          operation: 'template-service-compileTemplate',
          templatePath,
          error: (error as Error).message,
        },
      });
    }
  }

  private getTemplateErrorCode(errorCode?: string): ErrorCode {
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
