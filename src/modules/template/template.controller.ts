import { Controller, Logger } from '@nestjs/common';

import { TemplateService } from './template.service';

@Controller()
export class TemplateController {
  private readonly logger = new Logger(TemplateController.name);

  constructor(private readonly templateService: TemplateService) {}
}
