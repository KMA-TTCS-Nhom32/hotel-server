import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { CacheService } from './common/cache';
import { Public } from './modules/auth/decorators';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ============================================================
  // TEST ENDPOINTS - FOR DEBUGGING CACHE ISSUES
  // Remove in production!
  // ============================================================

  @Public()
  @Get('debug/cache-keys')
  @ApiOperation({ summary: '[DEBUG] List all Redis cache keys' })
  @ApiQuery({ name: 'pattern', required: false, description: 'Pattern to match (default: *)' })
  async listCacheKeys(@Query('pattern') pattern?: string) {
    const keys = await this.cacheService.listKeys(pattern || '*');
    return {
      count: keys.length,
      pattern: pattern || '*',
      keys: keys.sort(),
    };
  }

  @Public()
  @Get('debug/cache-clear')
  @ApiOperation({ summary: '[DEBUG] Clear cache by pattern' })
  @ApiQuery({
    name: 'pattern',
    required: true,
    description: 'Pattern to delete (e.g., provinces:*)',
  })
  async clearCacheByPattern(@Query('pattern') pattern: string) {
    const deleted = await this.cacheService.delByPattern(pattern);
    return {
      deleted,
      pattern,
    };
  }
}
