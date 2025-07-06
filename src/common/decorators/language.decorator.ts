import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Language } from '@prisma/client';

/**
 * Parameter decorator that extracts the preferred language from the request object.
 * 
 * This decorator works in conjunction with the LanguageInterceptor
 * to provide easy access to the user's language preference.
 * 
 * @example
 * ```typescript
 * @Get()
 * findAll(@PreferredLanguage() language: Language) {
 *   console.log(`User prefers ${language} language`);
 *   return this.service.findAll();
 * }
 * ```
 */
export const PreferredLanguage = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Language => {
    const request = ctx.switchToHttp().getRequest();
    return request.preferredLanguage || Language.VI;
  },
);
