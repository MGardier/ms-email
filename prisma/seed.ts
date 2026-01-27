import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TemplateInfo {
  slug: string;
  displayName: string;
  description: string;
  filePath: string;
}

function scanTemplates(dir: string, basePath: string = ''): TemplateInfo[] {
  const templates: TemplateInfo[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip excluded directories
      if (entry.name === 'excluded') continue;
      templates.push(...scanTemplates(fullPath, path.join(basePath, entry.name)));
    } else if (entry.isFile() && entry.name.endsWith('.hbs')) {
      const fileName = entry.name;
      const relativePath = basePath ? `${basePath}/${fileName }` : fileName ;
      const slug = relativePath.replace(/\//g, '-');

      const displayName = fileName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      templates.push({
        slug,
        displayName: basePath
          ? `${basePath.charAt(0).toUpperCase() + basePath.slice(1)} - ${displayName}`
          : displayName,
        description: `Email template for ${displayName.toLowerCase()}`,
        filePath: relativePath,
      });
    }
  }

  return templates;
}

async function main() {
  console.log('Seeding email templates...');

  const templatesDir = path.join(process.cwd(), 'src/modules/template/pages');

  if (!fs.existsSync(templatesDir)) {
    console.error(`Templates directory not found: ${templatesDir}`);
    process.exit(1);
  }

  const templates = scanTemplates(templatesDir);

  // Add special raw template for HTML content
  templates.push({
    slug: 'raw',
    displayName: 'Raw HTML',
    description: 'Template for raw HTML content passed directly',
    filePath: 'raw.hbs',
  });

  console.log(`Found ${templates.length} templates to seed`);

  for (const template of templates) {
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: { slug: template.slug },
    });

    if (existingTemplate) {
      console.log(`Template "${template.slug}" already exists, skipping...`);
      continue;
    }

    const createdTemplate = await prisma.emailTemplate.create({
      data: {
        slug: template.slug,
        displayName: template.displayName,
        description: template.description,
        versions: {
          create: {
            filePath: template.filePath,
            versionNumber: 1,
            isEnabled: true,
            versionNotes: 'Initial version',
          },
        },
      },
      include: {
        versions: true,
      },
    });

    console.log(
      `Created template "${createdTemplate.slug}" with version ID: ${createdTemplate.versions[0].id}`,
    );
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
