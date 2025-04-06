import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { DatabaseService } from '@/database/database.service';
import { PoeditorService } from '@/third-party/poeditor/poeditor.service';
import { Language } from '@prisma/client';
import { Province } from './models';
import { CreateProvinceDto } from './dtos/create-update-province.dto';

describe('ProvincesService', () => {
  let service: ProvincesService;
  let databaseService: DatabaseService;
  let poeditorService: PoeditorService;

  // Mock data
  const mockProvince = {
    id: 'province-id-1',
    name: 'Ha Noi',
    slug: 'ha-noi',
    zip_code: '100000',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    _count: { branches: 2 },
    translations: [
      { language: 'EN', name: 'Hanoi' },
      { language: 'VI', name: 'Hà Nội' },
    ],
  };

  const mockProvinces = [
    mockProvince,
    {
      id: 'province-id-2',
      name: 'Ho Chi Minh',
      slug: 'ho-chi-minh',
      zip_code: '700000',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      _count: { branches: 5 },
      translations: [
        { language: 'EN', name: 'Ho Chi Minh City' },
        { language: 'VI', name: 'Thành phố Hồ Chí Minh' },
      ],
    },
  ];

  const mockCreateProvinceDto: CreateProvinceDto = {
    name: 'Da Nang',
    slug: 'da-nang',
    zip_code: '550000',
    translations: [
      { language: Language.EN, name: 'Da Nang' },
      { language: Language.VI, name: 'Đà Nẵng' },
    ],
  };

  // Mock database service
  const mockDatabaseService = {
    province: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  // Mock poeditor service
  const mockPoeditorService = {
    addTranslation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvincesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: PoeditorService,
          useValue: mockPoeditorService,
        },
      ],
    }).compile();

    service = module.get<ProvincesService>(ProvincesService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    poeditorService = module.get<PoeditorService>(PoeditorService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new province with translations', async () => {
      mockDatabaseService.province.create.mockResolvedValue({
        ...mockCreateProvinceDto,
        id: 'new-province-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        deletedAt: null,
        _count: { branches: 0 },
        translations: mockCreateProvinceDto.translations,
      });

      mockPoeditorService.addTranslation.mockResolvedValue(undefined);

      const result = await service.create(mockCreateProvinceDto);

      expect(poeditorService.addTranslation).toHaveBeenCalledWith({
        language: 'vi',
        data: [
          {
            term: 'province_name',
            context: mockCreateProvinceDto.slug,
            translation: {
              content: mockCreateProvinceDto.name,
            },
          },
        ],
      });

      expect(databaseService.province.create).toHaveBeenCalledWith({
        data: {
          name: mockCreateProvinceDto.name,
          slug: mockCreateProvinceDto.slug,
          zip_code: mockCreateProvinceDto.zip_code,
          translations: {
            create: mockCreateProvinceDto.translations || [],
          },
        },
        include: {
          _count: true,
          translations: true,
        },
      });

      expect(result).toBeInstanceOf(Province);
      expect(result.name).toBe(mockCreateProvinceDto.name);
      expect(result.translations).toHaveLength(mockCreateProvinceDto.translations.length);
    });

    it('should handle errors during creation', async () => {
      mockDatabaseService.province.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(mockCreateProvinceDto)).rejects.toThrow();
    });
  });

  describe('findMany', () => {
    it('should return a paginated list of provinces with translations', async () => {
      mockDatabaseService.$transaction.mockResolvedValue([mockProvinces, mockProvinces.length]);

      const result = await service.findMany({ page: 1, pageSize: 10 });

      expect(databaseService.$transaction).toHaveBeenCalled();
      expect(result.data).toHaveLength(mockProvinces.length);
      expect(result.data[0].translations).toBeDefined();
      expect(result.data[0]).toBeInstanceOf(Province);
      expect(result.meta.total).toBe(mockProvinces.length);
    });
  });

  describe('findById', () => {
    it('should return a province by ID with translations', async () => {
      mockDatabaseService.province.findFirst.mockResolvedValue(mockProvince);

      const result = await service.findById('province-id-1');

      expect(databaseService.province.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({ id: 'province-id-1' }),
        include: {
          _count: true,
          translations: true,
        },
      });

      expect(result).toBeInstanceOf(Province);
      expect(result.id).toBe(mockProvince.id);
      expect(result.translations).toHaveLength(mockProvince.translations.length);
    });

    it('should throw an error if province is not found', async () => {
      mockDatabaseService.province.findFirst.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(HttpException);
    });
  });

  describe('update', () => {
    it('should update a province with its translations', async () => {
      const updateDto = {
        name: 'Updated Name',
        slug: 'updated-slug',
        zip_code: '123456',
        translations: [
          { language: Language.EN, name: 'Updated EN Name' },
          { language: Language.VI, name: 'Updated VI Name' },
        ],
      };

      mockDatabaseService.province.findFirst.mockResolvedValue(mockProvince);
      mockDatabaseService.province.update.mockResolvedValue({
        ...mockProvince,
        ...updateDto,
      });

      const result = await service.update('province-id-1', updateDto);

      expect(databaseService.province.update).toHaveBeenCalledWith({
        where: { id: 'province-id-1' },
        include: {
          _count: true,
          translations: true,
        },
        data: expect.objectContaining({
          name: updateDto.name,
          translations: expect.any(Object),
        }),
      });

      expect(result).toBeInstanceOf(Province);
      expect(result.name).toBe(updateDto.name);
    });
  });

  describe('remove', () => {
    it('should soft delete a province', async () => {
      mockDatabaseService.province.findUnique.mockResolvedValue({
        ...mockProvince,
        branches: [],
      });

      await service.remove('province-id-1');

      // The softDelete method is called internally, so we need to verify the precondition check
      expect(databaseService.province.findUnique).toHaveBeenCalledWith({
        where: { id: 'province-id-1' },
        include: expect.objectContaining({
          branches: expect.any(Object),
        }),
      });
    });

    it('should throw an error if province has branches', async () => {
      mockDatabaseService.province.findUnique.mockResolvedValue({
        ...mockProvince,
        branches: [{ id: 'branch-1', isDeleted: false }],
      });

      await expect(service.remove('province-id-1')).rejects.toThrow(HttpException);
    });
  });

  describe('mapProvinceWithTranslations', () => {
    it('should correctly map province with translations', () => {
      const result = service['mapProvinceWithTranslations'](mockProvince as any);

      expect(result).toBeInstanceOf(Province);
      expect(result.translations).toHaveLength(mockProvince.translations.length);
      expect(result.translations[0]).toHaveProperty('language');
      expect(result.translations[0]).toHaveProperty('name');
    });

    it('should handle provinces without translations', () => {
      const provinceWithoutTranslations = { ...mockProvince, translations: undefined };
      const result = service['mapProvinceWithTranslations'](provinceWithoutTranslations as any);

      expect(result).toBeInstanceOf(Province);
      expect(result.translations).toEqual([]);
    });
  });
});
