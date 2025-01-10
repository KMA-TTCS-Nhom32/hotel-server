import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PoeditorService } from './poeditor.service';
import { AddTranslationDto, GetTranslationsRequestDto, ListTranslationResponseDto } from './dtos';
import { Public } from '@/modules/auth/decorators';

@ApiTags('POEditor')
@Controller('poeditor')
export class PoeditorController {
  constructor(private readonly poeditorService: PoeditorService) {}

  @Post('translations')
  @ApiOperation({ summary: 'Add translations to POEditor project' })
  @ApiResponse({
    status: 200,
    description: 'Translations added successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async addTranslation(@Body() dto: AddTranslationDto) {
    return this.poeditorService.addTranslation(dto);
  }

  @Public()
  @Post('translations-list')
  @ApiOperation({ summary: 'Get translations from POEditor project' })
  @ApiResponse({
    status: 200,
    description: 'Translations fetched successfully',
    type: ListTranslationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async getTranslations(
    @Body() dto: GetTranslationsRequestDto,
  ): Promise<ListTranslationResponseDto> {
    return this.poeditorService.getTranslations(dto.language);
  }
}
