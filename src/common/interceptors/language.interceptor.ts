import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Language } from '@prisma/client';

/**
 * Intercepts incoming HTTP requests and extracts the preferred language
 * from the Accept-Language header.
 * 
 * Attaches the language preference to the request object for use in
 * controllers and services.
 */
@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  /**
   * Intercepts the incoming request and extracts language preference
   * @param context The execution context
   * @param next The next handler in the chain
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Extract language from headers with fallback to default
    const acceptLanguage = request.headers['accept-language'] || '';
    
    // Parse the Accept-Language header
    const language = this.parseAcceptLanguage(acceptLanguage);
    
    // Attach language to request object for use in controllers/services
    request.preferredLanguage = language;
    
    return next.handle();
  }
  
  /**
   * Parses the Accept-Language header to determine the best language match
   * @param acceptLanguage The Accept-Language header value
   * @returns The matching Language enum value
   */
  private parseAcceptLanguage(acceptLanguage: string): Language {
    if (!acceptLanguage) {
      return Language.VI; // Default language if none specified
    }
    
    // Handle language codes with regional variants (en-US, en-GB, etc.)
    // Split by comma for multiple preferences (en-US,fr;q=0.8,en;q=0.7)
    const languages = acceptLanguage.split(',')
      .map(lang => lang.trim().split(';')[0]) // Remove quality values
      .map(lang => lang.toLowerCase().substring(0, 2)); // Take just the language code
    
    // Map the first matching language to our enum
    if (languages.includes('en')) {
      return Language.EN;
    }
    
    if (languages.includes('vi')) {
      return Language.VI;
    }
    
    // Default to Vietnamese if no match
    return Language.VI;
  }
}
