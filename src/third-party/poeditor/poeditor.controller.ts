import { Body, Controller, Post, UseGuards, Get } from '@nestjs/common';
import { 
  ApiOperation, 
  ApiTags, 
  ApiOkResponse, 
  ApiBadRequestResponse,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { PoeditorService } from './poeditor.service';
import { AddTranslationDto, GetTranslationsRequestDto, ListTranslationResponseDto } from './dtos';
import { Public, Roles } from '@/modules/auth/decorators';
import { RolesGuard } from '@/modules/auth/guards';
import { UserRole } from '@prisma/client';

@ApiTags('POEditor')
@Controller('poeditor')
export class PoeditorController {
  constructor(private readonly poeditorService: PoeditorService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Post('translations')
  @ApiOperation({ summary: 'Add translations to POEditor project' })
  @ApiOkResponse({
    description: 'Translations added successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async addTranslation(@Body() dto: AddTranslationDto) {
    return this.poeditorService.addTranslation(dto);
  }

  @Public()
  @Post('translations-list')
  @ApiOperation({ summary: 'Get translations from POEditor project' })
  @ApiOkResponse({
    description: 'Translations fetched successfully',
    type: ListTranslationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async getTranslations(
    @Body() dto: GetTranslationsRequestDto,
  ) {
    return this.poeditorService.getTranslations(dto.language);
  }
}
