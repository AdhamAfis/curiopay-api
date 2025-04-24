import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExportService } from './export.service';
import { ExportOptionsDto } from './dto/export-options.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('export')
@Controller('export')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Generate user data export',
    description: 'Generate a ZIP file containing user data based on specified options'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Export generated successfully',
    schema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Path to the generated export file'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid export options' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async generateExport(
    @GetUser('id') userId: string,
    @Body() options: ExportOptionsDto,
  ): Promise<{ filePath: string }> {
    const filePath = await this.exportService.generateUserDataExport(userId, options);
    return { filePath };
  }
} 