import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AddTranslationDto } from './dtos/add-translation.dto';
import * as FormData from 'form-data';

@Injectable()
export class PoeditorService {
  private readonly logger = new Logger(PoeditorService.name);
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

  private async handlePoEditorResponse(response: Response) {
    const data = await response.json();
    this.logger.debug('POEditor response:', data);
    
    if (!response.ok || data.response.status !== 'success') {
      this.logger.error('POEditor API Error:', data);
      throw new Error(data.response.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  }

  async addTerms(terms: Array<{ term: string; context?: string }>) {
    const form = new FormData();
    form.append('api_token', this.apiKey);
    form.append('id', this.projectId.toString());
    form.append('data', JSON.stringify(terms));

    try {
      this.logger.debug('Adding terms:', terms);
      
      const response = await fetch(`${this.apiUrl}/terms/add`, {
        method: 'POST',
        body: form as any,
      });

      return await this.handlePoEditorResponse(response);
    } catch (error) {
      this.logger.error('Failed to add terms:', error);
      throw new Error(`POEditor API Error: ${error.message}`);
    }
  }

  async addTranslation(dto: AddTranslationDto) {
    try {
      // First add all terms in a single batch request
      const terms = dto.data.map(item => ({
        term: item.term,
        context: item.context,
      }));
      
      await this.addTerms(terms);
      this.logger.debug('Terms added successfully');

      // Then add translations
      const form = new FormData();
      form.append('api_token', this.apiKey);
      form.append('id', this.projectId.toString());
      form.append('language', dto.language);
      form.append('data', JSON.stringify(dto.data));

      const response = await fetch(`${this.apiUrl}/translations/add`, {
        method: 'POST',
        body: form as any,
      });

      const result = await this.handlePoEditorResponse(response);
      this.logger.debug('Translation add result:', result);
      return result;
    } catch (error) {
      this.logger.error('Failed to add translations:', error);
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
