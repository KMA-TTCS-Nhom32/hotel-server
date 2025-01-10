import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AddTranslationDto } from './dtos/add-translation.dto';

@Injectable()
export class PoeditorService {
  private readonly logger = new Logger(PoeditorService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly projectId: number;
  private readonly baseOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

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
    try {
      this.logger.debug('Adding terms:', terms);

      // Create URLSearchParams instead of FormData
      const formData = new URLSearchParams();
      formData.append('api_token', this.apiKey);
      formData.append('id', this.projectId.toString());
      formData.append('data', JSON.stringify(terms));

      const response = await fetch(`${this.apiUrl}/terms/add`, {
        ...this.baseOptions,
        body: formData,
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
      const terms = dto.data.map((item) => ({
        term: item.term,
        context: item.context,
      }));

      await this.addTerms(terms);
      this.logger.debug('Terms added successfully');

      // Create URLSearchParams for translations
      const formData = new URLSearchParams();
      formData.append('api_token', this.apiKey);
      formData.append('id', this.projectId.toString());
      formData.append('language', dto.language);
      formData.append('data', JSON.stringify(dto.data));

      const response = await fetch(`${this.apiUrl}/translations/add`, {
        ...this.baseOptions,
        body: formData,
      });

      const result = await this.handlePoEditorResponse(response);
      this.logger.debug('Translation add result:', result);
      return result;
    } catch (error) {
      this.logger.error('Failed to add translations:', error);
      throw new Error(`POEditor API Error: ${error.message}`);
    }
  }

  async getTranslations(language?: string) {
    try {
      const formData = new URLSearchParams();
      formData.append('api_token', this.apiKey);
      formData.append('id', this.projectId.toString());
      formData.append('language', language ?? 'vi');

      const response = await fetch(`${this.apiUrl}/terms/list`, {
        ...this.baseOptions,
        body: formData,
      });

      return await this.handlePoEditorResponse(response);
    } catch (error) {
      this.logger.error('Failed to get translations:', error);
      throw new Error(`POEditor API Error: ${error.message}`);
    }
  }
}
