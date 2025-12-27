import { PrismaClient, HotelRoomType, HotelRoomBedType, HotelRoomStatus } from '@prisma/client';

const prisma = new PrismaClient();

const roomThumbnail = {
    url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1766832081/ahomevilla/lmcauduixk1xilgjozyc.jpg',
    publicId: 'ahomevilla/lmcauduixk1xilgjozyc',
};

const roomImages = [
    {
        url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1766832083/ahomevilla/jynbmzijvttrliki0kpg.jpg',
        publicId: 'ahomevilla/jynbmzijvttrliki0kpg',
    },
    {
        url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1766832083/ahomevilla/jaqdza5oeiexgrrltequ.jpg',
        publicId: 'ahomevilla/jaqdza5oeiexgrrltequ',
    },
    {
        url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1766832083/ahomevilla/ttyj4ko0tll3deiwwxfs.jpg',
        publicId: 'ahomevilla/ttyj4ko0tll3deiwwxfs',
    },
];

// Cấu hình các loại phòng
const roomTypeConfigs = [
    {
        type: HotelRoomType.STANDARD,
        name: 'Phòng Standard',
        nameEn: 'Standard Room',
        description: 'Phòng tiêu chuẩn với đầy đủ tiện nghi cơ bản, phù hợp cho khách du lịch tiết kiệm',
        descriptionEn: 'Standard room with basic amenities, perfect for budget travelers',
        bed_type: HotelRoomBedType.DOUBLE,
        area: 25,
        base_price_per_hour: 150000,
        base_price_per_night: 500000,
        base_price_per_day: 800000,
        max_adults: 2,
        max_children: 1,
        quantity: 10,
    },
    {
        type: HotelRoomType.SUPERIOR,
        name: 'Phòng Superior',
        nameEn: 'Superior Room',
        description: 'Phòng cao cấp với không gian rộng rãi, view đẹp và dịch vụ tốt hơn',
        descriptionEn: 'Superior room with spacious layout, nice view and better service',
        bed_type: HotelRoomBedType.QUEEN,
        area: 35,
        base_price_per_hour: 250000,
        base_price_per_night: 800000,
        base_price_per_day: 1200000,
        max_adults: 2,
        max_children: 2,
        quantity: 8,
    },
    {
        type: HotelRoomType.DELUXE,
        name: 'Phòng Deluxe',
        nameEn: 'Deluxe Room',
        description: 'Phòng sang trọng với nội thất cao cấp, view panorama và dịch vụ VIP',
        descriptionEn: 'Luxury room with premium furniture, panorama view and VIP service',
        bed_type: HotelRoomBedType.KING,
        area: 50,
        base_price_per_hour: 400000,
        base_price_per_night: 1500000,
        base_price_per_day: 2000000,
        max_adults: 3,
        max_children: 2,
        quantity: 5,
    },
];

function generateSlug(branchSlug: string, roomType: string): string {
    return `${branchSlug}-${roomType.toLowerCase()}`;
}

async function main() {
    console.log('🛏️  Bắt đầu tạo loại phòng cho các chi nhánh...\n');

    // Lấy tất cả chi nhánh
    const branches = await prisma.hotelBranch.findMany({
        where: { isDeleted: false },
        orderBy: { name: 'asc' },
    });

    console.log(`📍 Tìm thấy ${branches.length} chi nhánh\n`);

    let totalRoomDetails = 0;
    let totalFlatRooms = 0;

    for (const branch of branches) {
        console.log(`\n🏨 Đang xử lý: ${branch.name}`);

        for (const config of roomTypeConfigs) {
            const roomDetailSlug = generateSlug(branch.slug, config.type);

            // Kiểm tra xem loại phòng đã tồn tại chưa
            const existingDetail = await prisma.roomDetail.findFirst({
                where: { slug: roomDetailSlug, branchId: branch.id },
            });

            if (existingDetail) {
                console.log(`   ⏭️  ${config.name} đã tồn tại`);
                continue;
            }

            // Tạo RoomDetail
            const roomDetail = await prisma.roomDetail.create({
                data: {
                    name: config.name,
                    slug: roomDetailSlug,
                    description: config.description,
                    branchId: branch.id,
                    thumbnail: roomThumbnail,
                    images: roomImages,
                    room_type: config.type,
                    bed_type: config.bed_type,
                    area: config.area,
                    base_price_per_hour: config.base_price_per_hour,
                    base_price_per_night: config.base_price_per_night,
                    base_price_per_day: config.base_price_per_day,
                    max_adults: config.max_adults,
                    max_children: config.max_children,
                    quantity: config.quantity,
                    is_available: true,
                    rating: 4.5 + Math.random() * 0.5, // Random 4.5 - 5.0
                    translations: {
                        create: [
                            {
                                language: 'VI',
                                name: config.name,
                                description: config.description,
                            },
                            {
                                language: 'EN',
                                name: config.nameEn,
                                description: config.descriptionEn,
                            },
                        ],
                    },
                },
            });

            totalRoomDetails++;

            // Tạo các phòng cụ thể (flat_rooms / HotelRoom)
            const roomsToCreate = [];
            for (let i = 1; i <= config.quantity; i++) {
                const roomNumber = `${config.type.charAt(0)}${i.toString().padStart(2, '0')}`; // S01, P01, D01...
                roomsToCreate.push({
                    name: `${config.name} - ${roomNumber}`,
                    slug: `${roomDetailSlug}-${roomNumber.toLowerCase()}`,
                    status: HotelRoomStatus.AVAILABLE,
                    detailId: roomDetail.id,
                });
            }

            await prisma.hotelRoom.createMany({
                data: roomsToCreate,
            });

            totalFlatRooms += config.quantity;
            console.log(`   ✅ ${config.name}: ${config.quantity} phòng`);
        }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Hoàn thành!`);
    console.log(`   📊 Tổng loại phòng (RoomDetail): ${totalRoomDetails}`);
    console.log(`   🚪 Tổng phòng cụ thể (HotelRoom): ${totalFlatRooms}`);
}

main()
    .catch((e) => {
        console.error('❌ Lỗi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
