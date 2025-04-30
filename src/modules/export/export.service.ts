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
import { EmailService } from '../../common/services/email.service';
import { PassThrough } from 'stream';
import * as memfs from 'memfs';
import { EncryptionService } from '../../common/services/encryption.service';

interface UserWithRelations extends User {
  preferences?: UserPreference | null;
  newsletterSubscription?: NewsletterSubscription | null;
  contactInfo?: UserContact | null;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private readonly templatesDir = path.join(process.cwd(), 'src', 'modules', 'export', 'templates');

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly encryptionService: EncryptionService
  ) {}

  async generateUserDataExport(userId: string, options: ExportOptionsDto): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Generating data export for user ${userId}`);
      
      // Create virtual file system for in-memory operations
      const vol = memfs.Volume.fromJSON({});
      const fs = memfs.createFsFromVolume(vol);
      
      // Ensure userId is a string and not an object
      const userIdString = typeof userId === 'object' && userId !== null 
        ? (userId as any).id 
        : userId;
      
      // Create temp directory in virtual filesystem
      const exportId = uuidv4();
      const exportDir = `/temp/${exportId}`;
      const assetsDir = `${exportDir}/assets`;
      fs.mkdirSync(exportDir, { recursive: true });
      fs.mkdirSync(assetsDir, { recursive: true });

      // Get user data
      const user = await this.prisma.user.findUnique({
        where: { 
          id: userIdString
        },
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
        throw new Error(`User not found with ID: ${userId}`);
      }

      // Decrypt user's name if encrypted
      let firstName = '';
      try {
        if (user.firstName) {
          firstName = await this.encryptionService.decrypt(user.firstName);
        }
      } catch (error) {
        this.logger.warn(`Could not decrypt user's first name: ${error.message}`);
        firstName = 'User';
      }

      // Write CSS to virtual filesystem
      const cssContent = this.generateCSS();
      fs.writeFileSync(`${assetsDir}/styles.css`, cssContent);

      // Generate index page
      const indexTemplate = this.getTemplate('index');
      const indexHtml = indexTemplate({
        user,
        exportDate: dayjs().format('MMMM D, YYYY'),
        title: 'Data Export',
      });
      fs.writeFileSync(`${exportDir}/index.html`, indexHtml);

      // Generate data pages based on options
      if (options.includeExpenses) {
        await this.generateExpensesPage(fs, exportDir, userIdString);
      }
      if (options.includeIncome) {
        await this.generateIncomePage(fs, exportDir, userIdString);
      }
      if (options.includeCategories) {
        await this.generateCategoriesPage(fs, exportDir, userIdString);
      }
      if (options.includePreferences) {
        await this.generatePreferencesPage(fs, exportDir, user);
      }
      if (options.includeNewsletter) {
        await this.generateNewsletterPage(fs, exportDir, user);
      }

      // Create zip buffer in memory
      const zipBuffer = await this.createInMemoryZipArchive(fs, exportDir);
      
      // Send email with the zip file as attachment
      await this.emailService.sendDataExportEmail(
        user.email,
        firstName,
        zipBuffer
      );

      this.logger.log(`Export generated and sent via email to ${user.email}`);
      return { 
        success: true, 
        message: 'Export has been generated and sent to your email address'
      };
    } catch (error) {
      this.logger.error(`Error generating export: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateExpensesPage(fs: any, exportDir: string, userId: string): Promise<void> {
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

    fs.writeFileSync(`${exportDir}/expenses.html`, html);
  }

  private async generateIncomePage(fs: any, exportDir: string, userId: string): Promise<void> {
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

    fs.writeFileSync(`${exportDir}/income.html`, html);
  }

  private async generateCategoriesPage(fs: any, exportDir: string, userId: string): Promise<void> {
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

    fs.writeFileSync(`${exportDir}/categories.html`, html);
  }

  private async generatePreferencesPage(fs: any, exportDir: string, user: UserWithRelations): Promise<void> {
    const template = this.getTemplate('preferences');
    const html = template({
      preferences: user.preferences,
      title: 'Preferences',
    });

    fs.writeFileSync(`${exportDir}/preferences.html`, html);
  }

  private async generateNewsletterPage(fs: any, exportDir: string, user: UserWithRelations): Promise<void> {
    const template = this.getTemplate('newsletter');
    const html = template({
      newsletter: user.newsletterSubscription,
      title: 'Newsletter Preferences',
    });

    fs.writeFileSync(`${exportDir}/newsletter.html`, html);
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

  private async createInMemoryZipArchive(fs: any, sourceDir: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // Create a PassThrough stream to collect the data
      const output = new PassThrough();
      const chunks: Buffer[] = [];
      
      // Create the archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      // Listen for archive data
      output.on('data', (chunk) => chunks.push(chunk as Buffer));
      output.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Handle errors
      archive.on('error', (err) => reject(err));
      
      // Pipe archive to the output stream
      archive.pipe(output);
      
      // Add virtual directory to archive
      const entries = this.getEntriesFromVirtualFs(fs, sourceDir);
      
      // Add each file to the archive
      for (const entry of entries) {
        const content = fs.readFileSync(entry.path);
        archive.append(content, { name: entry.name });
      }
      
      // Finalize the archive
      archive.finalize();
    });
  }

  private getEntriesFromVirtualFs(fs: any, dir: string): Array<{ path: string; name: string }> {
    const entries: Array<{ path: string; name: string }> = [];
    const baseDir = dir.replace(/^\//, ''); // Remove leading slash
    
    function processDir(currentDir: string, basePath: string) {
      const files = fs.readdirSync(currentDir);
      
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          processDir(filePath, path.join(basePath, file));
        } else {
          entries.push({
            path: filePath,
            name: path.join(basePath, file)
          });
        }
      }
    }
    
    processDir(dir, '');
    return entries;
  }
} 