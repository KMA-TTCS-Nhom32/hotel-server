import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const thumbnail = {
        url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1766832081/ahomevilla/lmcauduixk1xilgjozyc.jpg',
        publicId: 'ahomevilla/lmcauduixk1xilgjozyc',
    };

    const images = [
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
        {
            url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1766832083/ahomevilla/cxpvqe6xnsk0dr2kcogm.jpg',
            publicId: 'ahomevilla/cxpvqe6xnsk0dr2kcogm',
        },
        {
            url: 'https://res.cloudinary.com/dzoykqusl/image/upload/v1766832083/ahomevilla/aycyfolfkg81vnpvnede.jpg',
            publicId: 'ahomevilla/aycyfolfkg81vnpvnede',
        },
    ];

    const result = await prisma.hotelBranch.updateMany({
        data: {
            thumbnail: thumbnail,
            images: images,
        },
    });

    console.log(`✅ Đã cập nhật ${result.count} bản ghi HotelBranch`);
}

main()
    .catch((e) => {
        console.error('❌ Lỗi:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
