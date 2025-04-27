import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserPreferencesService } from './user-preferences.service';
import { UpdateUserPreferencesDto, UserPreferencesResponseDto } from './dto/user-preferences.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IUser } from './interfaces/user.interface';

@ApiTags('user-preferences')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user preferences' })
  @ApiResponse({
    status: 200,
    description: 'Returns user preferences',
    type: UserPreferencesResponseDto,
  })
  async getUserPreferences(@CurrentUser() user: IUser) {
    return this.userPreferencesService.getUserPreferences(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update user preferences' })
  @ApiResponse({
    status: 200,
    description: 'Updates user preferences',
    type: UserPreferencesResponseDto,
  })
  async updateUserPreferences(
    @CurrentUser() user: IUser,
    @Body() updateUserPreferencesDto: UpdateUserPreferencesDto,
  ) {
    return this.userPreferencesService.updateUserPreferences(user.id, updateUserPreferencesDto);
  }

  @Get('toggle-ai-features')
  @ApiOperation({ summary: 'Toggle AI features' })
  @ApiResponse({
    status: 200,
    description: 'Toggles AI features',
    type: UserPreferencesResponseDto,
  })
  async toggleAiFeatures(@CurrentUser() user: IUser) {
    return this.userPreferencesService.toggleAiFeatures(user.id);
  }

  @Get('options')
  @ApiOperation({ summary: 'Get preference options' })
  @ApiResponse({
    status: 200,
    description: 'Returns all available options for preferences',
    schema: {
      type: 'object',
      properties: {
        currencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              code: { type: 'string' },
              symbol: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
        languages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              code: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
        themes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getPreferenceOptions() {
    return this.userPreferencesService.getPreferenceOptions();
  }
} 