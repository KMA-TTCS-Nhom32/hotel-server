import { BadRequestException } from '@nestjs/common';
import { Transform, plainToInstance } from 'class-transformer';

export function JsonTransform<T>(classType: new () => T): (target: unknown, key: string) => void {
  return Transform(({ value }) => {
    if (!value) return undefined;
    
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return Array.isArray(parsed)
        ? parsed.map(item => plainToInstance(classType, item))
        : plainToInstance(classType, parsed);
    } catch (error) {
      throw new BadRequestException(`Invalid JSON format for ${classType.name}`);
    }
  });
}
