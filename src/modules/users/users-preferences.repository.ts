import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserPreferencesDto } from './dto/user-preferences.dto';

@Injectable()
export class UserPreferencesRepository {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    return this.prisma.userPreference.findUnique({
      where: { userId },
      include: {
        currency: true,
        language: true,
        theme: true,
      },
    });
  }

  async update(userId: string, data: UpdateUserPreferencesDto) {
    return this.prisma.userPreference.update({
      where: { userId },
      data,
      include: {
        currency: true,
        language: true,
        theme: true,
      },
    });
  }

  async getDefaultCurrency() {
    const defaultCurrency = await this.prisma.currency.findFirst({
      where: { code: 'USD' },
    });
    
    if (!defaultCurrency) {
      // Create default currency if it doesn't exist
      return this.prisma.currency.create({
        data: {
          code: 'USD',
          symbol: '$',
          name: 'US Dollar',
        },
      });
    }
    
    return defaultCurrency;
  }

  async getDefaultLanguage() {
    const defaultLanguage = await this.prisma.language.findFirst({
      where: { code: 'en' },
    });
    
    if (!defaultLanguage) {
      // Create default language if it doesn't exist
      return this.prisma.language.create({
        data: {
          code: 'en',
          name: 'English',
        },
      });
    }
    
    return defaultLanguage;
  }

  async getDefaultTheme() {
    const defaultTheme = await this.prisma.theme.findFirst({
      where: { name: 'light' },
    });
    
    if (!defaultTheme) {
      // Create default theme if it doesn't exist
      return this.prisma.theme.create({
        data: {
          name: 'light',
        },
      });
    }
    
    return defaultTheme;
  }

  async create(userId: string, data: UpdateUserPreferencesDto) {
    const defaultCurrency = await this.getDefaultCurrency();
    const defaultLanguage = await this.getDefaultLanguage();
    const defaultTheme = await this.getDefaultTheme();

    if (!defaultCurrency || !defaultLanguage || !defaultTheme) {
      throw new Error('Default preferences not found');
    }

    const createData: any = {
      userId,
      currencyId: data.currencyId || defaultCurrency.id,
      languageId: data.languageId || defaultLanguage.id,
      themeId: data.themeId || defaultTheme.id,
      monthlyBudget: data.monthlyBudget || 0,
    };
    
    if (data.enableAiFeatures !== undefined) {
      createData.enableAiFeatures = data.enableAiFeatures;
    }

    return this.prisma.userPreference.create({
      data: createData,
      include: {
        currency: true,
        language: true,
        theme: true,
      },
    });
  }

  async findOrCreate(userId: string) {
    const existingPreferences = await this.findByUserId(userId);
    
    if (existingPreferences) {
      return existingPreferences;
    }

    // Ensure default preferences exist in the database
    await this.ensureDefaultsExist();

    // Now get the defaults that we're sure exist
    const defaultCurrency = await this.getDefaultCurrency();
    const defaultLanguage = await this.getDefaultLanguage();
    const defaultTheme = await this.getDefaultTheme();

    const createData: any = {
      userId,
      currencyId: defaultCurrency.id,
      languageId: defaultLanguage.id,
      themeId: defaultTheme.id,
      monthlyBudget: 0,
      enableAiFeatures: true,
    };

    return this.prisma.userPreference.create({
      data: createData,
      include: {
        currency: true,
        language: true,
        theme: true,
      },
    });
  }

  async getAllCurrencies() {
    return this.prisma.currency.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async getAllLanguages() {
    return this.prisma.language.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async getAllThemes() {
    return this.prisma.theme.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async ensureDefaultsExist() {
    try {
      // Ensure default currency exists
      let defaultCurrency = await this.prisma.currency.findFirst({
        where: { code: 'USD' },
      });
      
      if (!defaultCurrency) {
        defaultCurrency = await this.prisma.currency.create({
          data: {
            code: 'USD',
            symbol: '$',
            name: 'US Dollar',
          },
        });
        console.log('Created default currency');
      }

      // Ensure default language exists
      let defaultLanguage = await this.prisma.language.findFirst({
        where: { code: 'en' },
      });
      
      if (!defaultLanguage) {
        defaultLanguage = await this.prisma.language.create({
          data: {
            code: 'en',
            name: 'English',
          },
        });
        console.log('Created default language');
      }

      // Ensure default theme exists
      let defaultTheme = await this.prisma.theme.findFirst({
        where: { name: 'light' },
      });
      
      if (!defaultTheme) {
        defaultTheme = await this.prisma.theme.create({
          data: {
            name: 'light',
          },
        });
        console.log('Created default theme');
      }
      
      // Add dark theme as well
      let darkTheme = await this.prisma.theme.findFirst({
        where: { name: 'dark' },
      });
      
      if (!darkTheme) {
        darkTheme = await this.prisma.theme.create({
          data: {
            name: 'dark',
          },
        });
        console.log('Created dark theme');
      }
      
      return { defaultCurrency, defaultLanguage, defaultTheme, darkTheme };
    } catch (error) {
      console.error('Error creating default preferences:', error);
      throw error;
    }
  }
} 