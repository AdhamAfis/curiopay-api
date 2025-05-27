import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExportOptionsDto } from './dto/export-options.dto';
import * as archiver from 'archiver';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import * as dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  UserPreference,
  NewsletterSubscription,
  UserContact,
} from '@prisma/client';
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
  private readonly templatesDir = path.join(
    process.cwd(),
    'src',
    'modules',
    'export',
    'templates',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async generateUserDataExport(
    userId: string,
    options: ExportOptionsDto,
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Generating data export for user ${userId}`);

      // Ensure userId is a string and not an object
      const userIdString =
        typeof userId === 'object' && userId !== null
          ? (userId as any).id
          : userId;

      // Check if user has already requested an export in the last 24 hours
      const lastDayExports = await this.prisma.auditLog.findMany({
        where: {
          userId: userIdString,
          action: 'DATA_EXPORT',
          timestamp: {
            gte: dayjs().subtract(24, 'hours').toDate(),
          },
        },
      });

      if (lastDayExports.length > 0) {
        const nextAvailableTime = dayjs(lastDayExports[0].timestamp)
          .add(24, 'hours')
          .format('YYYY-MM-DD HH:mm:ss');
        return {
          success: false,
          message: `Rate limit reached. You can request another export after ${nextAvailableTime}`,
        };
      }

      // Create virtual file system for in-memory operations
      const vol = memfs.Volume.fromJSON({});
      const fs = memfs.createFsFromVolume(vol);

      // Create temp directory in virtual filesystem
      const exportId = uuidv4();
      const exportDir = `/temp/${exportId}`;
      const assetsDir = `${exportDir}/assets`;
      fs.mkdirSync(exportDir, { recursive: true });
      fs.mkdirSync(assetsDir, { recursive: true });

      // Get user data
      const user = await this.prisma.user.findUnique({
        where: {
          id: userIdString,
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
        this.logger.warn(
          `Could not decrypt user's first name: ${error.message}`,
        );
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
        zipBuffer,
      );

      // Log this export in audit logs
      await this.prisma.auditLog.create({
        data: {
          userId: userIdString,
          action: 'DATA_EXPORT',
          category: 'DATA_ACCESS',
          ipAddress: '0.0.0.0', // This should be replaced with actual IP if available
          userAgent: 'API Client', // This should be replaced with actual user agent if available
          status: 'SUCCESS',
          details: {
            exportType: 'USER_DATA',
            exportOptions: JSON.parse(JSON.stringify(options)),
            exportId,
          },
          isCritical: false,
        },
      });

      this.logger.log(`Export generated and sent via email to ${user.email}`);
      return {
        success: true,
        message: 'Export has been generated and sent to your email address',
      };
    } catch (error) {
      this.logger.error(
        `Error generating export: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async generateExpensesPage(
    fs: any,
    exportDir: string,
    userId: string,
  ): Promise<void> {
    const expenses = await this.prisma.expense.findMany({
      where: { userId },
      include: {
        category: true,
        paymentMethod: true,
      },
      orderBy: { date: 'desc' },
    });

    // Process expenses for display with decryption
    const formattedExpenses = await Promise.all(
      expenses.map(async (exp) => {
        // Decrypt description
        let decryptedDescription = '';
        try {
          if (exp.description) {
            decryptedDescription = await this.encryptionService.decrypt(
              exp.description,
            );
          }
        } catch (error) {
          this.logger.warn(
            `Could not decrypt expense description: ${error.message}`,
          );
          decryptedDescription = 'Data unavailable';
        }

        return {
          ...exp,
          date: dayjs(exp.date).format('YYYY-MM-DD'),
          amount: Number(exp.amount).toFixed(2),
          status: exp.isVoid ? 'voided' : 'active',
          description: decryptedDescription,
        };
      }),
    );

    // Calculate summary data
    const totalAmount = expenses.reduce(
      (sum, exp) => sum + Number(exp.amount),
      0,
    );

    // Create monthly aggregates for summary stats
    const monthlyAggregates = expenses.reduce(
      (acc, exp) => {
        const month = dayjs(exp.date).format('YYYY-MM');
        if (!acc[month]) {
          acc[month] = { amount: 0, date: month };
        }
        acc[month].amount += Number(exp.amount);
        return acc;
      },
      {} as Record<string, { amount: number; date: string }>,
    );

    const monthlyValues = Object.values(monthlyAggregates);
    const monthlyAverage =
      monthlyValues.length > 0
        ? (totalAmount / monthlyValues.length).toFixed(2)
        : '0.00';

    // Find highest and lowest months
    let highestMonth = { amount: '0.00', date: 'N/A' };
    let lowestMonth = { amount: '999999999.99', date: 'N/A' };

    if (monthlyValues.length > 0) {
      highestMonth = monthlyValues.reduce(
        (max, month) =>
          month.amount > Number(max.amount)
            ? { amount: month.amount.toString(), date: month.date }
            : max,
        { amount: '0', date: '' },
      );

      lowestMonth = monthlyValues.reduce(
        (min, month) =>
          month.amount < Number(min.amount)
            ? { amount: month.amount.toString(), date: month.date }
            : min,
        { amount: '999999999.99', date: '' },
      );

      // Convert amounts to formatted strings
      highestMonth.amount = Number(highestMonth.amount).toFixed(2);
      lowestMonth.amount = Number(lowestMonth.amount).toFixed(2);
    }

    // Calculate category totals with percentages
    const categoryTotals = Object.values(
      expenses.reduce<
        Record<string, { name: string; amount: number; percentage: number }>
      >((acc, exp) => {
        const categoryId = exp.category.id;
        if (!acc[categoryId]) {
          acc[categoryId] = {
            name: exp.category.name,
            amount: 0,
            percentage: 0,
          };
        }
        acc[categoryId].amount += Number(exp.amount);
        return acc;
      }, {}),
    ).map((cat) => ({
      ...cat,
      amount: cat.amount.toFixed(2),
      percentage: ((cat.amount / totalAmount) * 100).toFixed(1),
    }));

    const template = this.getTemplate('expenses');
    const html = template({
      expenses: formattedExpenses,
      title: 'Expenses',
      exportDate: dayjs().format('MMMM D, YYYY'),
      summary: {
        total: totalAmount.toFixed(2),
        monthlyAverage,
        highestMonth: {
          label: 'Highest Month',
          value: highestMonth.amount,
          date: highestMonth.date,
        },
        lowestMonth: {
          label: 'Lowest Month',
          value: lowestMonth.amount,
          date: lowestMonth.date,
        },
      },
      categoryTotals,
    });

    fs.writeFileSync(`${exportDir}/expenses.html`, html);
  }

  private async generateIncomePage(
    fs: any,
    exportDir: string,
    userId: string,
  ): Promise<void> {
    const incomes = await this.prisma.income.findMany({
      where: { userId },
      include: {
        category: true,
        paymentMethod: true,
      },
      orderBy: { date: 'desc' },
    });

    // Process income for display with decryption
    const formattedIncomes = await Promise.all(
      incomes.map(async (inc) => {
        // Decrypt description
        let decryptedDescription = '';
        try {
          if (inc.description) {
            decryptedDescription = await this.encryptionService.decrypt(
              inc.description,
            );
          }
        } catch (error) {
          this.logger.warn(
            `Could not decrypt income description: ${error.message}`,
          );
          decryptedDescription = 'Data unavailable';
        }

        return {
          ...inc,
          date: dayjs(inc.date).format('YYYY-MM-DD'),
          amount: Number(inc.amount).toFixed(2),
          status: inc.isVoid ? 'voided' : 'active',
          source: decryptedDescription, // Using decrypted description as source
          description: decryptedDescription,
        };
      }),
    );

    // Calculate summary data
    const totalAmount = incomes.reduce(
      (sum, inc) => sum + Number(inc.amount),
      0,
    );

    // Calculate category totals with percentages
    const categoryTotals = Object.values(
      incomes.reduce<
        Record<string, { name: string; amount: number; percentage: number }>
      >((acc, inc) => {
        const categoryId = inc.category.id;
        if (!acc[categoryId]) {
          acc[categoryId] = {
            name: inc.category.name,
            amount: 0,
            percentage: 0,
          };
        }
        acc[categoryId].amount += Number(inc.amount);
        return acc;
      }, {}),
    ).map((cat) => ({
      ...cat,
      amount: cat.amount.toFixed(2),
      percentage: ((cat.amount / totalAmount) * 100).toFixed(1),
    }));

    // Calculate source totals with percentages
    const sourceTotals = Object.values(
      incomes.reduce<
        Record<
          string,
          {
            name: string;
            amount: number;
            percentage: number;
            frequency: number;
          }
        >
      >((acc, inc) => {
        const source = inc.description;
        if (!acc[source]) {
          acc[source] = {
            name: source,
            amount: 0,
            percentage: 0,
            frequency: 1,
          };
        } else {
          acc[source].frequency += 1;
        }
        acc[source].amount += Number(inc.amount);
        return acc;
      }, {}),
    ).map((src) => ({
      ...src,
      amount: src.amount.toFixed(2),
      percentage: ((src.amount / totalAmount) * 100).toFixed(1),
    }));

    // Create monthly aggregates for summary stats
    const monthlyAggregates = incomes.reduce(
      (acc, inc) => {
        const month = dayjs(inc.date).format('YYYY-MM');
        if (!acc[month]) {
          acc[month] = { amount: 0, date: month };
        }
        acc[month].amount += Number(inc.amount);
        return acc;
      },
      {} as Record<string, { amount: number; date: string }>,
    );

    const monthlyValues = Object.values(monthlyAggregates);
    const monthlyAverage =
      monthlyValues.length > 0
        ? (totalAmount / monthlyValues.length).toFixed(2)
        : '0.00';

    // Find highest and lowest months
    let highestMonth = { amount: '0.00', date: 'N/A' };
    let lowestMonth = { amount: '999999999.99', date: 'N/A' };

    if (monthlyValues.length > 0) {
      highestMonth = monthlyValues.reduce(
        (max, month) =>
          month.amount > Number(max.amount)
            ? { amount: month.amount.toString(), date: month.date }
            : max,
        { amount: '0', date: '' },
      );

      lowestMonth = monthlyValues.reduce(
        (min, month) =>
          month.amount < Number(min.amount)
            ? { amount: month.amount.toString(), date: month.date }
            : min,
        { amount: '999999999.99', date: '' },
      );

      // Convert amounts to formatted strings
      highestMonth.amount = Number(highestMonth.amount).toFixed(2);
      lowestMonth.amount = Number(lowestMonth.amount).toFixed(2);
    }

    const template = this.getTemplate('income');
    const html = template({
      incomes: formattedIncomes,
      title: 'Income',
      exportDate: dayjs().format('MMMM D, YYYY'),
      summary: {
        total: totalAmount.toFixed(2),
        monthlyAverage,
        highestMonth: {
          label: 'Highest Month',
          value: highestMonth.amount,
          date: highestMonth.date,
        },
        lowestMonth: {
          label: 'Lowest Month',
          value: lowestMonth.amount,
          date: lowestMonth.date,
        },
      },
      categoryTotals,
      sourceTotals,
    });

    fs.writeFileSync(`${exportDir}/income.html`, html);
  }

  private async generateCategoriesPage(
    fs: any,
    exportDir: string,
    userId: string,
  ): Promise<void> {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      include: {
        type: true,
      },
    });

    // No need to decrypt descriptions since Category model doesn't have a description field
    const template = this.getTemplate('categories');
    const html = template({
      categories,
      title: 'Categories',
    });

    fs.writeFileSync(`${exportDir}/categories.html`, html);
  }

  private async generatePreferencesPage(
    fs: any,
    exportDir: string,
    user: UserWithRelations,
  ): Promise<void> {
    const template = this.getTemplate('preferences');
    const html = template({
      preferences: user.preferences,
      title: 'Preferences',
    });

    fs.writeFileSync(`${exportDir}/preferences.html`, html);
  }

  private async generateNewsletterPage(
    fs: any,
    exportDir: string,
    user: UserWithRelations,
  ): Promise<void> {
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
        --card-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        --success-color: #10b981;
        --warning-color: #f59e0b;
        --error-color: #ef4444;
        --border-radius: 8px;
        --spacing-sm: 0.5rem;
        --spacing-md: 1rem;
        --spacing-lg: 2rem;
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
        background: #f8fafc;
        padding: var(--spacing-lg);
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        background: var(--bg-color);
        border-radius: var(--border-radius);
        box-shadow: var(--card-shadow);
        overflow: hidden;
      }

      .header {
        text-align: center;
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-lg);
        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
        color: white;
        border-radius: var(--border-radius) var(--border-radius) 0 0;
      }

      .header h1 {
        margin-bottom: var(--spacing-sm);
        font-size: 2.5rem;
      }

      .nav {
        display: flex;
        justify-content: center;
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background: white;
        border-bottom: 1px solid #e5e7eb;
        flex-wrap: wrap;
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .nav a {
        padding: var(--spacing-sm) var(--spacing-md);
        text-decoration: none;
        color: var(--primary-color);
        font-weight: 500;
        border: 1px solid var(--primary-color);
        border-radius: var(--border-radius);
        transition: all 0.2s;
      }

      .nav a:hover {
        background: var(--primary-color);
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .card {
        background: white;
        border-radius: var(--border-radius);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
        box-shadow: var(--card-shadow);
      }

      .card h2 {
        margin-bottom: var(--spacing-md);
        color: var(--primary-color);
        border-bottom: 2px solid var(--accent-color);
        padding-bottom: var(--spacing-sm);
      }

      .table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin: var(--spacing-md) 0;
        border-radius: var(--border-radius);
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .table th,
      .table td {
        padding: 1rem;
        text-align: left;
      }

      .table th {
        background: var(--primary-color);
        color: white;
        font-weight: 600;
        position: sticky;
        top: 0;
      }

      .table tr:nth-child(even) {
        background: #f8fafc;
      }

      .table tr:hover {
        background: var(--accent-color);
        transition: background 0.2s;
      }

      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        background: var(--accent-color);
        border-radius: var(--border-radius);
        margin: var(--spacing-md) 0;
      }

      .summary-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--spacing-md);
        background: white;
        border-radius: var(--border-radius);
        box-shadow: var(--card-shadow);
      }

      .summary-item .label {
        color: var(--text-color);
        font-size: 0.875rem;
        margin-bottom: var(--spacing-sm);
      }

      .summary-item .value {
        color: var(--primary-color);
        font-size: 1.5rem;
        font-weight: bold;
      }

      .summary-item .date {
        font-size: 0.8rem;
        color: #64748b;
        margin-top: 0.25rem;
      }

      .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: uppercase;
      }

      .badge-active {
        background: var(--success-color);
        color: white;
      }

      .badge-voided {
        background: var(--error-color);
        color: white;
      }

      .chart-container {
        height: 300px;
        margin: var(--spacing-lg) 0;
      }

      .footer {
        text-align: center;
        padding: var(--spacing-lg);
        color: #64748b;
        border-top: 1px solid #e5e7eb;
        margin-top: var(--spacing-lg);
      }

      .pie-container {
        display: flex;
        gap: var(--spacing-lg);
        flex-wrap: wrap;
      }

      .pie-chart {
        flex: 1;
        min-width: 300px;
      }

      @media (max-width: 768px) {
        body {
          padding: var(--spacing-md);
        }

        .table {
          display: block;
          overflow-x: auto;
        }

        .summary {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  private async createInMemoryZipArchive(
    fs: any,
    sourceDir: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      // Create a PassThrough stream to collect the data
      const output = new PassThrough();
      const chunks: Buffer[] = [];

      // Create the archive
      const archive = archiver('zip', {
        zlib: { level: 9 },
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

  private getEntriesFromVirtualFs(
    fs: any,
    dir: string,
  ): Array<{ path: string; name: string }> {
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
            name: path.join(basePath, file),
          });
        }
      }
    }

    processDir(dir, '');
    return entries;
  }
}
