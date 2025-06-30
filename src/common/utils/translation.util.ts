import { Language } from '@prisma/client';

/**
 * Helper interface that defines the basic structure of a translatable entity
 */
export interface Translatable<T = any> {
  translations?: Array<{
    language: Language;
    [key: string]: any;
  }>;
}

/**
 * Utility functions for working with translations
 */
export class TranslationUtil {
  /**
   * Gets the best translation for a field based on the preferred language
   * 
   * @param entity The entity with translations
   * @param field The field name to get the translation for
   * @param preferredLanguage The preferred language
   * @param fallbackLanguage Optional fallback language if preferred is not available
   * @returns The translated value or the original if no translation exists
   */
  static getTranslation<T>(
    entity: Translatable & { [key: string]: any },
    field: keyof T,
    preferredLanguage: Language,
    fallbackLanguage: Language = Language.VI,
  ): any {
    if (!entity?.translations?.length) {
      return entity[field as string];
    }
    
    // First try to find the preferred language
    const preferredTranslation = entity.translations.find(
      (t) => t.language === preferredLanguage && t[field as string] !== undefined && t[field as string] !== null
    );
    
    if (preferredTranslation) {
      return preferredTranslation[field as string];
    }
    
    // Fall back to the fallback language if different from preferred
    if (fallbackLanguage !== preferredLanguage) {
      const fallbackTranslation = entity.translations.find(
        (t) => t.language === fallbackLanguage && t[field as string] !== undefined && t[field as string] !== null
      );
      
      if (fallbackTranslation) {
        return fallbackTranslation[field as string];
      }
    }
    
    // Fall back to the original value
    return entity[field as string];
  }
  
  /**
   * Gets available languages for an entity
   * 
   * @param entity The entity with translations
   * @returns Array of available languages
   */
  static getAvailableLanguages(entity: Translatable): Language[] {
    if (!entity?.translations?.length) {
      return [];
    }
    
    return Array.from(new Set(entity.translations.map((t) => t.language)));
  }
}
