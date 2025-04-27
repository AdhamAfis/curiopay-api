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
    return this.prisma.currency.findFirst({
      where: { code: 'USD' },
    });
  }

  async getDefaultLanguage() {
    return this.prisma.language.findFirst({
      where: { code: 'en' },
    });
  }

  async getDefaultTheme() {
    return this.prisma.theme.findFirst({
      where: { name: 'light' },
    });
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

    const defaultCurrency = await this.getDefaultCurrency();
    const defaultLanguage = await this.getDefaultLanguage();
    const defaultTheme = await this.getDefaultTheme();

    if (!defaultCurrency || !defaultLanguage || !defaultTheme) {
      throw new Error('Default preferences not found');
    }

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
} 