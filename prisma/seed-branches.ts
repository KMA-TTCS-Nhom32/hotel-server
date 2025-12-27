import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const provinces = [
    { name: 'Hà Nội', zip_code: '100000', slug: 'ha-noi' },
    { name: 'Hồ Chí Minh', zip_code: '700000', slug: 'ho-chi-minh' },
    { name: 'Đà Nẵng', zip_code: '550000', slug: 'da-nang' },
    { name: 'Nha Trang', zip_code: '650000', slug: 'nha-trang' },
    { name: 'Phú Quốc', zip_code: '920000', slug: 'phu-quoc' },
];

const hotelBranches = [
    // Hà Nội (5 chi nhánh)
    {
        name: 'AHomeVilla Hoàn Kiếm',
        slug: 'ahomevilla-hoan-kiem',
        description: 'Khách sạn sang trọng tọa lạc tại trung tâm quận Hoàn Kiếm, gần Hồ Gươm',
        phone: '024-1234-5678',
        address: '15 Hàng Bài, Hoàn Kiếm, Hà Nội',
        location: { latitude: '21.0285', longitude: '105.8542' },
        rating: 4.8,
        province: 'ha-noi',
    },
    {
        name: 'AHomeVilla Tây Hồ',
        slug: 'ahomevilla-tay-ho',
        description: 'Resort view hồ Tây tuyệt đẹp, không gian yên tĩnh và thư giãn',
        phone: '024-2345-6789',
        address: '88 Quảng An, Tây Hồ, Hà Nội',
        location: { latitude: '21.0673', longitude: '105.8235' },
        rating: 4.9,
        province: 'ha-noi',
    },
    {
        name: 'AHomeVilla Ba Đình',
        slug: 'ahomevilla-ba-dinh',
        description: 'Khách sạn boutique gần Lăng Bác và Văn Miếu',
        phone: '024-3456-7890',
        address: '25 Đội Cấn, Ba Đình, Hà Nội',
        location: { latitude: '21.0340', longitude: '105.8372' },
        rating: 4.6,
        province: 'ha-noi',
    },
    {
        name: 'AHomeVilla Cầu Giấy',
        slug: 'ahomevilla-cau-giay',
        description: 'Khách sạn hiện đại gần các trung tâm thương mại lớn',
        phone: '024-4567-8901',
        address: '168 Xuân Thủy, Cầu Giấy, Hà Nội',
        location: { latitude: '21.0380', longitude: '105.7829' },
        rating: 4.5,
        province: 'ha-noi',
    },
    {
        name: 'AHomeVilla Nội Bài',
        slug: 'ahomevilla-noi-bai',
        description: 'Khách sạn tiện lợi gần sân bay Nội Bài, phù hợp transit',
        phone: '024-5678-9012',
        address: '12 Đường Võ Nguyên Giáp, Sóc Sơn, Hà Nội',
        location: { latitude: '21.2187', longitude: '105.8072' },
        rating: 4.3,
        province: 'ha-noi',
    },

    // Hồ Chí Minh (5 chi nhánh)
    {
        name: 'AHomeVilla Quận 1',
        slug: 'ahomevilla-quan-1',
        description: 'Khách sạn 5 sao giữa trung tâm Sài Gòn, gần Nhà thờ Đức Bà',
        phone: '028-1234-5678',
        address: '99 Nguyễn Huệ, Quận 1, TP.HCM',
        location: { latitude: '10.7769', longitude: '106.7009' },
        rating: 4.9,
        province: 'ho-chi-minh',
    },
    {
        name: 'AHomeVilla Quận 3',
        slug: 'ahomevilla-quan-3',
        description: 'Khách sạn vintage phong cách Pháp, yên tĩnh và lãng mạn',
        phone: '028-2345-6789',
        address: '45 Võ Văn Tần, Quận 3, TP.HCM',
        location: { latitude: '10.7814', longitude: '106.6878' },
        rating: 4.7,
        province: 'ho-chi-minh',
    },
    {
        name: 'AHomeVilla Quận 7',
        slug: 'ahomevilla-quan-7',
        description: 'Resort hiện đại tại Phú Mỹ Hưng, dịch vụ cao cấp',
        phone: '028-3456-7890',
        address: '789 Nguyễn Văn Linh, Quận 7, TP.HCM',
        location: { latitude: '10.7293', longitude: '106.7218' },
        rating: 4.8,
        province: 'ho-chi-minh',
    },
    {
        name: 'AHomeVilla Thủ Đức',
        slug: 'ahomevilla-thu-duc',
        description: 'Khách sạn gần Đại học Quốc gia và Khu Công nghệ cao',
        phone: '028-4567-8901',
        address: '256 Xa lộ Hà Nội, Thủ Đức, TP.HCM',
        location: { latitude: '10.8565', longitude: '106.7830' },
        rating: 4.4,
        province: 'ho-chi-minh',
    },
    {
        name: 'AHomeVilla Tân Sơn Nhất',
        slug: 'ahomevilla-tan-son-nhat',
        description: 'Khách sạn sân bay tiện lợi, shuttle bus miễn phí',
        phone: '028-5678-9012',
        address: '18 Trường Sơn, Tân Bình, TP.HCM',
        location: { latitude: '10.8142', longitude: '106.6600' },
        rating: 4.5,
        province: 'ho-chi-minh',
    },

    // Đà Nẵng (4 chi nhánh)
    {
        name: 'AHomeVilla Mỹ Khê',
        slug: 'ahomevilla-my-khe',
        description: 'Resort biển 5 sao view biển Mỹ Khê tuyệt đẹp',
        phone: '0236-123-4567',
        address: '88 Võ Nguyên Giáp, Ngũ Hành Sơn, Đà Nẵng',
        location: { latitude: '16.0544', longitude: '108.2472' },
        rating: 4.9,
        province: 'da-nang',
    },
    {
        name: 'AHomeVilla Sơn Trà',
        slug: 'ahomevilla-son-tra',
        description: 'Resort nghỉ dưỡng trên bán đảo Sơn Trà, không gian thiên nhiên',
        phone: '0236-234-5678',
        address: '1 Hoàng Sa, Sơn Trà, Đà Nẵng',
        location: { latitude: '16.1178', longitude: '108.2778' },
        rating: 4.8,
        province: 'da-nang',
    },
    {
        name: 'AHomeVilla Hải Châu',
        slug: 'ahomevilla-hai-chau',
        description: 'Khách sạn trung tâm thành phố, gần cầu Rồng',
        phone: '0236-345-6789',
        address: '68 Bạch Đằng, Hải Châu, Đà Nẵng',
        location: { latitude: '16.0678', longitude: '108.2249' },
        rating: 4.6,
        province: 'da-nang',
    },
    {
        name: 'AHomeVilla Bà Nà',
        slug: 'ahomevilla-ba-na',
        description: 'Resort núi gần Bà Nà Hills, khí hậu mát mẻ',
        phone: '0236-456-7890',
        address: 'Thôn An Sơn, Hòa Ninh, Hòa Vang, Đà Nẵng',
        location: { latitude: '15.9972', longitude: '107.9942' },
        rating: 4.7,
        province: 'da-nang',
    },

    // Nha Trang (3 chi nhánh)
    {
        name: 'AHomeVilla Trần Phú',
        slug: 'ahomevilla-tran-phu',
        description: 'Resort biển sang trọng trên đường Trần Phú',
        phone: '0258-123-4567',
        address: '99 Trần Phú, Lộc Thọ, Nha Trang',
        location: { latitude: '12.2388', longitude: '109.1967' },
        rating: 4.9,
        province: 'nha-trang',
    },
    {
        name: 'AHomeVilla Vinpearl',
        slug: 'ahomevilla-vinpearl',
        description: 'Villa cao cấp trên đảo Hòn Tre, dịch vụ xuất sắc',
        phone: '0258-234-5678',
        address: 'Đảo Hòn Tre, Vĩnh Nguyên, Nha Trang',
        location: { latitude: '12.2122', longitude: '109.2364' },
        rating: 5.0,
        province: 'nha-trang',
    },
    {
        name: 'AHomeVilla Cam Ranh',
        slug: 'ahomevilla-cam-ranh',
        description: 'Resort biển yên tĩnh tại Bãi Dài Cam Ranh',
        phone: '0258-345-6789',
        address: 'Bãi Dài, Cam Lâm, Khánh Hòa',
        location: { latitude: '12.0627', longitude: '109.1819' },
        rating: 4.8,
        province: 'nha-trang',
    },

    // Phú Quốc (3 chi nhánh)
    {
        name: 'AHomeVilla Dương Đông',
        slug: 'ahomevilla-duong-dong',
        description: 'Resort trung tâm thị trấn Dương Đông, gần chợ đêm',
        phone: '0297-123-4567',
        address: '88 Trần Hưng Đạo, Dương Đông, Phú Quốc',
        location: { latitude: '10.2167', longitude: '103.9596' },
        rating: 4.7,
        province: 'phu-quoc',
    },
    {
        name: 'AHomeVilla Bãi Sao',
        slug: 'ahomevilla-bai-sao',
        description: 'Resort biển hạng sang tại Bãi Sao - bãi biển đẹp nhất Phú Quốc',
        phone: '0297-234-5678',
        address: 'Bãi Sao, An Thới, Phú Quốc',
        location: { latitude: '10.0442', longitude: '104.0281' },
        rating: 4.9,
        province: 'phu-quoc',
    },
    {
        name: 'AHomeVilla Sunset Town',
        slug: 'ahomevilla-sunset-town',
        description: 'Resort Địa Trung Hải tại Sunset Town, view hoàng hôn tuyệt đẹp',
        phone: '0297-345-6789',
        address: 'Sunset Town, An Thới, Phú Quốc',
        location: { latitude: '10.0153', longitude: '103.9697' },
        rating: 5.0,
        province: 'phu-quoc',
    },
];

const defaultThumbnail = {
    publicId: 'ahomevilla/branches/default-thumbnail',
    url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1700000000/ahomevilla/branches/default-hotel.webp',
};

const defaultImages = [
    {
        publicId: 'ahomevilla/branches/lobby',
        url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1700000001/ahomevilla/branches/lobby.webp',
    },
    {
        publicId: 'ahomevilla/branches/room',
        url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1700000002/ahomevilla/branches/room.webp',
    },
    {
        publicId: 'ahomevilla/branches/pool',
        url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1700000003/ahomevilla/branches/pool.webp',
    },
];

async function main() {
    console.log('🌱 Bắt đầu seed dữ liệu...\n');

    // 1. Tạo Provinces
    console.log('📍 Đang tạo các tỉnh/thành phố...');
    for (const province of provinces) {
        await prisma.province.upsert({
            where: { name_zip_code_slug: { name: province.name, zip_code: province.zip_code, slug: province.slug } },
            update: {},
            create: {
                ...province,
                translations: {
                    create: [
                        { language: 'EN', name: province.name },
                        { language: 'VI', name: province.name },
                    ],
                },
            },
        });
    }
    console.log(`✅ Đã tạo ${provinces.length} tỉnh/thành phố\n`);

    // 2. Lấy danh sách province IDs
    const provinceRecords = await prisma.province.findMany();
    const provinceMap = new Map(provinceRecords.map((p) => [p.slug, p.id]));

    // 3. Tạo Hotel Branches
    console.log('🏨 Đang tạo các chi nhánh khách sạn...');
    let createdCount = 0;

    for (const branch of hotelBranches) {
        const provinceId = provinceMap.get(branch.province);
        if (!provinceId) {
            console.log(`⚠️  Không tìm thấy province: ${branch.province}`);
            continue;
        }

        const existingBranch = await prisma.hotelBranch.findFirst({
            where: { slug: branch.slug },
        });

        if (existingBranch) {
            console.log(`⏭️  Chi nhánh đã tồn tại: ${branch.name}`);
            continue;
        }

        await prisma.hotelBranch.create({
            data: {
                name: branch.name,
                slug: branch.slug,
                description: branch.description,
                phone: branch.phone,
                address: branch.address,
                location: branch.location,
                rating: branch.rating,
                thumbnail: defaultThumbnail,
                images: defaultImages,
                is_active: true,
                provinceId: provinceId,
                translations: {
                    create: [
                        {
                            language: 'EN',
                            name: branch.name,
                            description: branch.description,
                            address: branch.address,
                        },
                        {
                            language: 'VI',
                            name: branch.name,
                            description: branch.description,
                            address: branch.address,
                        },
                    ],
                },
            },
        });

        createdCount++;
        console.log(`✅ Đã tạo: ${branch.name}`);
    }

    console.log(`\n🎉 Hoàn thành! Đã tạo ${createdCount} chi nhánh khách sạn.`);
}

main()
    .catch((e) => {
        console.error('❌ Lỗi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
