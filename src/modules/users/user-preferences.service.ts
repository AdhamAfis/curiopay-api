import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserPreferencesDto } from './dto/user-preferences.dto';
import { UserPreferencesRepository } from './users-preferences.repository';

@Injectable()
export class UserPreferencesService {
  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository,
  ) {}

  async getUserPreferences(userId: string) {
    const preferences =
      await this.userPreferencesRepository.findByUserId(userId);

    if (!preferences) {
      return this.userPreferencesRepository.findOrCreate(userId);
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    updateUserPreferencesDto: UpdateUserPreferencesDto,
  ) {
    const preferences =
      await this.userPreferencesRepository.findByUserId(userId);

    if (!preferences) {
      return this.userPreferencesRepository.create(
        userId,
        updateUserPreferencesDto,
      );
    }

    return this.userPreferencesRepository.update(
      userId,
      updateUserPreferencesDto,
    );
  }

  async toggleAiFeatures(userId: string) {
    const preferences =
      await this.userPreferencesRepository.findByUserId(userId);

    if (!preferences) {
      return this.userPreferencesRepository.create(userId, {
        enableAiFeatures: true,
      });
    }

    const currentValue = (preferences as any).enableAiFeatures ?? true;

    return this.userPreferencesRepository.update(userId, {
      enableAiFeatures: !currentValue,
    });
  }

  async getPreferenceOptions() {
    const [currencies, languages, themes] = await Promise.all([
      this.userPreferencesRepository.getAllCurrencies(),
      this.userPreferencesRepository.getAllLanguages(),
      this.userPreferencesRepository.getAllThemes(),
    ]);

    return {
      currencies,
      languages,
      themes,
    };
  }
}
