export interface ITemplateVersion {
  id: number;
  templateId: number;
  filePath: string;
  versionNumber: number;
  isEnabled: boolean;
  versionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  template?: ITemplate;
}

export interface ITemplate {
  id: number;
  slug: string;
  displayName: string;
  description: string | null;
}

export interface ITemplateContext {
  operation: string;
  path?: string;
  templatePath?: string;
  reason?: string;
}
