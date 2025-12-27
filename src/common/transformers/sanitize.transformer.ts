import { Transform, TransformFnParams } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/**
 * Options for HTML sanitization
 */
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [], // Strip all HTML tags by default
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

/**
 * Sanitizes a string value by removing all HTML tags and dangerous content.
 * @param value - The value to sanitize
 * @returns The sanitized string or original value if not a string
 */
export function sanitizeString(value: unknown): unknown {
  if (typeof value === 'string') {
    return sanitizeHtml(value.trim(), sanitizeOptions);
  }
  return value;
}

/**
 * Decorator that sanitizes string input by removing HTML tags and XSS vectors.
 * Apply to DTO properties that accept user input.
 *
 * @example
 * ```typescript
 * class CreatePostDto {
 *   @Sanitize()
 *   @IsString()
 *   title: string;
 * }
 * ```
 */
export function Sanitize(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => sanitizeString(value));
}

/**
 * Decorator that sanitizes string input while allowing specific safe HTML tags.
 * Use for fields that may contain formatted content (e.g., descriptions).
 *
 * @param allowedTags - Array of allowed HTML tags
 *
 * @example
 * ```typescript
 * class CreatePostDto {
 *   @SanitizeHtml(['b', 'i', 'p', 'br'])
 *   @IsString()
 *   content: string;
 * }
 * ```
 */
export function SanitizeHtml(
  allowedTags: string[] = ['b', 'i', 'em', 'strong', 'p', 'br'],
): PropertyDecorator {
  return Transform(({ value }: TransformFnParams) => {
    if (typeof value === 'string') {
      return sanitizeHtml(value.trim(), {
        allowedTags,
        allowedAttributes: {},
        disallowedTagsMode: 'discard',
      });
    }
    return value;
  });
}
