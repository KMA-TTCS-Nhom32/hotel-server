import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AddTranslationDto } from './dtos/add-translation.dto';
import * as FormData from 'form-data';

@Injectable()
export class PoeditorService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly projectId: number;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('POEDITOR_API_URL');
    this.apiKey = this.configService.get<string>('POEDITOR_API_KEY');
    this.projectId = this.configService.get<number>('POEDITOR_PROJECT_ID');
  }

  private isMissingTermError(error: any): boolean {
    return error.message.includes('Cannot read properties of undefined');
  }

  async addTerm(term: string, context: string) {
    const form = new FormData();
    form.append('api_token', this.apiKey);
    form.append('id', this.projectId.toString());
    form.append(
      'data',
      JSON.stringify([
        {
          term,
          context,
        },
      ]),
    );

    try {
      const response = await fetch(`${this.apiUrl}/terms/add`, {
        method: 'POST',
        body: form as any,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`POEditor API Error: ${error.message}`);
    }
  }

  async addTranslation(dto: AddTranslationDto) {
    const form = new FormData();
    form.append('api_token', this.apiKey);
    form.append('id', this.projectId.toString());
    form.append('language', dto.language);
    form.append('data', JSON.stringify(dto.data));

    try {
      const response = await fetch(`${this.apiUrl}/translations/add`, {
        method: 'POST',
        body: form as any,
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If error is due to missing terms, add them and retry
        if (this.isMissingTermError(errorData)) {
          // Add all terms first
          const addTermPromises = dto.data.map(item => 
            this.addTerm(item.term, item.context || '')
          );
          await Promise.all(addTermPromises);

          // Retry the translation request
          const retryResponse = await fetch(`${this.apiUrl}/translations/add`, {
            method: 'POST',
            body: form as any,
          });

          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }

          return await retryResponse.json();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`POEditor API Error: ${error.message}`);
    }
  }

  async getTranslations(language: string) {
    const form = new FormData();
    form.append('api_token', this.apiKey);
    form.append('id', this.projectId.toString());
    form.append('language', language);

    try {
      const response = await fetch(`${this.apiUrl}/terms/list`, {
        method: 'POST',
        body: form as any,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`POEditor API Error: ${error.message}`);
    }
  }
}
