import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExportService } from './export.service';
import { ExportOptionsDto } from './dto/export-options.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { EmailVerifiedGuard } from '../../common/guards/email-verified.guard';

@ApiTags('export')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @UseGuards(EmailVerifiedGuard)
  @ApiOperation({
    summary: 'Generate user data export',
    description:
      'Generate a ZIP file containing user data based on specified options and send it via email',
  })
  @ApiResponse({
    status: 201,
    description: 'Export generated and sent to user email',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the operation was successful',
        },
        message: {
          type: 'string',
          description: 'Status message about the export',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid export options' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or email not verified',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async generateExport(
    @GetUser('id') userId: string,
    @Body() options: ExportOptionsDto,
  ) {
    return this.exportService.generateUserDataExport(userId, options);
  }
}
