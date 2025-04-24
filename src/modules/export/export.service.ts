import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportOptionsDto } from './dto/export-options.dto';
import * as archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import * as dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { User, UserPreference, NewsletterSubscription, UserContact } from '@prisma/client';

interface UserWithRelations extends User {
  preferences?: UserPreference | null;
  newsletterSubscription?: NewsletterSubscription | null;
  contactInfo?: UserContact | null;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly templatesDir = path.join(__dirname, 'templates');

  constructor(private readonly prisma: PrismaService) {}

  async generateUserDataExport(userId: string, options: ExportOptionsDto): Promise<string> {
    try {
      // Create temp directory for export
      const exportId = uuidv4();
      const exportDir = path.join(process.cwd(), 'temp', exportId);
      fs.mkdirSync(exportDir, { recursive: true });

      // Copy static assets
      await this.copyStaticAssets(exportDir);

      // Generate HTML files
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          contactInfo: true,
          preferences: {
            include: {
              currency: true,
              language: true,
              theme: true,
            },
          },
          newsletterSubscription: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate index page
      await this.generateIndexPage(exportDir, user);

      // Generate data pages based on options
      if (options.includeExpenses) {
        await this.generateExpensesPage(exportDir, userId);
      }
      if (options.includeIncome) {
        await this.generateIncomePage(exportDir, userId);
      }
      if (options.includeCategories) {
        await this.generateCategoriesPage(exportDir, userId);
      }
      if (options.includePreferences) {
        await this.generatePreferencesPage(exportDir, user);
      }
      if (options.includeNewsletter) {
        await this.generateNewsletterPage(exportDir, user);
      }

      // Create zip file
      const zipPath = path.join(process.cwd(), 'temp', `${exportId}.zip`);
      await this.createZipArchive(exportDir, zipPath);

      // Cleanup temp directory
      fs.rmSync(exportDir, { recursive: true, force: true });

      return zipPath;
    } catch (error) {
      this.logger.error(`Error generating export: ${error.message}`);
      throw error;
    }
  }

  private async copyStaticAssets(exportDir: string): Promise<void> {
    const assetsDir = path.join(exportDir, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    // Copy CSS file
    const cssContent = this.generateCSS();
    fs.writeFileSync(path.join(assetsDir, 'styles.css'), cssContent);
  }

  private async generateIndexPage(exportDir: string, user: UserWithRelations): Promise<void> {
    const template = this.getTemplate('index');
    const html = template({
      user,
      exportDate: dayjs().format('MMMM D, YYYY'),
      title: 'Data Export',
    });

    fs.writeFileSync(path.join(exportDir, 'index.html'), html);
  }

  private async generateExpensesPage(exportDir: string, userId: string): Promise<void> {
    const expenses = await this.prisma.expense.findMany({
      where: { userId },
      include: {
        category: true,
        paymentMethod: true,
      },
      orderBy: { date: 'desc' },
    });

    const template = this.getTemplate('expenses');
    const html = template({
      expenses,
      title: 'Expenses',
      totalAmount: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
    });

    fs.writeFileSync(path.join(exportDir, 'expenses.html'), html);
  }

  private async generateIncomePage(exportDir: string, userId: string): Promise<void> {
    const incomes = await this.prisma.income.findMany({
      where: { userId },
      include: {
        category: true,
        paymentMethod: true,
      },
      orderBy: { date: 'desc' },
    });

    const template = this.getTemplate('income');
    const html = template({
      incomes,
      title: 'Income',
      totalAmount: incomes.reduce((sum, inc) => sum + Number(inc.amount), 0),
    });

    fs.writeFileSync(path.join(exportDir, 'income.html'), html);
  }

  private async generateCategoriesPage(exportDir: string, userId: string): Promise<void> {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      include: {
        type: true,
      },
    });

    const template = this.getTemplate('categories');
    const html = template({
      categories,
      title: 'Categories',
    });

    fs.writeFileSync(path.join(exportDir, 'categories.html'), html);
  }

  private async generatePreferencesPage(exportDir: string, user: UserWithRelations): Promise<void> {
    const template = this.getTemplate('preferences');
    const html = template({
      preferences: user.preferences,
      title: 'Preferences',
    });

    fs.writeFileSync(path.join(exportDir, 'preferences.html'), html);
  }

  private async generateNewsletterPage(exportDir: string, user: UserWithRelations): Promise<void> {
    const template = this.getTemplate('newsletter');
    const html = template({
      newsletter: user.newsletterSubscription,
      title: 'Newsletter Preferences',
    });

    fs.writeFileSync(path.join(exportDir, 'newsletter.html'), html);
  }

  private getTemplate(name: string): handlebars.TemplateDelegate {
    const templatePath = path.join(this.templatesDir, `${name}.hbs`);
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    return handlebars.compile(templateContent);
  }

  private generateCSS(): string {
    return `
      :root {
        --primary-color: #2563eb;
        --secondary-color: #3b82f6;
        --text-color: #1f2937;
        --bg-color: #ffffff;
        --accent-color: #dbeafe;
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        color: var(--text-color);
        background: var(--bg-color);
        padding: 2rem;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .header {
        text-align: center;
        margin-bottom: 3rem;
        padding: 2rem;
        background: var(--accent-color);
        border-radius: 8px;
      }

      .nav {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .nav a {
        padding: 0.5rem 1rem;
        text-decoration: none;
        color: var(--primary-color);
        border: 1px solid var(--primary-color);
        border-radius: 4px;
        transition: all 0.2s;
      }

      .nav a:hover {
        background: var(--primary-color);
        color: white;
      }

      .card {
        background: white;
        border-radius: 8px;
        padding: 2rem;
        margin-bottom: 2rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
      }

      .table th,
      .table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e5e7eb;
      }

      .table th {
        background: var(--accent-color);
        font-weight: 600;
      }

      .table tr:hover {
        background: #f9fafb;
      }

      .summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: var(--accent-color);
        border-radius: 4px;
        margin: 1rem 0;
      }

      .badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        background: var(--primary-color);
        color: white;
        border-radius: 9999px;
        font-size: 0.875rem;
      }

      @media (max-width: 768px) {
        body {
          padding: 1rem;
        }

        .table {
          display: block;
          overflow-x: auto;
        }
      }
    `;
  }

  private async createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }
} 