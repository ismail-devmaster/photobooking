"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// prisma/seed.ts
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function hashPassword(plain) {
    const salt = await bcryptjs_1.default.genSalt(12);
    return bcryptjs_1.default.hash(plain, salt);
}
async function main() {
    console.log('🌱 Seeding database...');
    // -------------------------
    // 1) STATES
    // -------------------------
    const statesData = [
        { code: 'DZ-01', name: 'Adrar' },
        { code: 'DZ-16', name: 'Algiers' },
        { code: 'DZ-31', name: 'Oran' },
        { code: 'DZ-18', name: 'Jijel' },
    ];
    const createdStates = await Promise.all(statesData.map((s) => prisma.state.upsert({
        where: { code: s.code },
        update: {},
        create: s,
    })));
    console.log(`  ✅ States seeded (${createdStates.length})`);
    // -------------------------
    // 2) SERVICES
    // -------------------------
    const servicesData = [
        { slug: 'wedding', name: 'Wedding Photography', description: 'Full-day wedding coverage' },
        { slug: 'portrait', name: 'Portrait Photography', description: 'Studio or outdoor portraits' },
        { slug: 'event', name: 'Event Photography', description: 'Events, concerts, parties' },
        { slug: 'product', name: 'Product Photography', description: 'E-commerce and product shoots' },
        { slug: 'drone', name: 'Drone Photography', description: 'Aerial photos and videos' },
    ];
    const createdServices = await Promise.all(servicesData.map((srv) => prisma.service.upsert({
        where: { slug: srv.slug },
        update: {},
        create: srv,
    })));
    console.log(`  ✅ Services seeded (${createdServices.length})`);
    // -------------------------
    // 3) USERS (admin, client, photographer)
    // -------------------------
    const adminEmail = 'admin@local.test';
    const clientEmail = 'client@local.test';
    const photogEmail = 'photog@local.test';
    const [admin, clientUser, photogUser] = await Promise.all([
        prisma.user.upsert({
            where: { email: adminEmail },
            update: {},
            create: {
                email: adminEmail,
                name: 'Admin',
                role: client_1.Role.ADMIN,
                locale: 'en',
                passwordHash: await hashPassword('Admin@123456'),
                emailVerified: true,
                emailVerifiedAt: new Date(),
            },
        }),
        prisma.user.upsert({
            where: { email: clientEmail },
            update: {},
            create: {
                email: clientEmail,
                name: 'Client One',
                role: client_1.Role.CLIENT,
                locale: 'en',
                passwordHash: await hashPassword('Client@123456'),
                // client intentionally left not emailVerified to test verification flow if needed
            },
        }),
        prisma.user.upsert({
            where: { email: photogEmail },
            update: {},
            create: {
                email: photogEmail,
                name: 'Photographer One',
                role: client_1.Role.PHOTOGRAPHER,
                locale: 'en',
                passwordHash: await hashPassword('Photog@123456'),
                emailVerified: true,
                emailVerifiedAt: new Date(),
            },
        }),
    ]);
    console.log('  ✅ Users upserted (admin, client, photographer)');
    // -------------------------
    // 4) PHOTOGRAPHER PROFILE (link state + services)
    // -------------------------
    // choose a state to link (Algiers)
    const algiers = createdStates.find((s) => s.code === 'DZ-16') ?? createdStates[0];
    // pick services for this photographer: wedding + portrait
    const weddingService = createdServices.find((s) => s.slug === 'wedding');
    const portraitService = createdServices.find((s) => s.slug === 'portrait');
    const photographer = await prisma.photographer.upsert({
        where: { userId: photogUser.id },
        update: {
            bio: 'Lifestyle & wedding photographer with 6+ years of experience.',
            stateId: algiers?.id,
            tags: ['wedding', 'portrait', 'outdoor', 'sony-a7'],
            priceBaseline: 15000,
            verified: true,
            // ensure services connected (replace with set may not be supported in upsert update block for relation arrays; use connect inside update)
            services: {
                connect: [
                    ...(weddingService ? [{ id: weddingService.id }] : []),
                    ...(portraitService ? [{ id: portraitService.id }] : []),
                ],
            },
        },
        create: {
            userId: photogUser.id,
            bio: 'Lifestyle & wedding photographer with 6+ years of experience.',
            stateId: algiers?.id,
            tags: ['wedding', 'portrait', 'outdoor', 'sony-a7'],
            priceBaseline: 15000,
            verified: true,
            services: {
                connect: [
                    ...(weddingService ? [{ id: weddingService.id }] : []),
                    ...(portraitService ? [{ id: portraitService.id }] : []),
                ],
            },
        },
    });
    console.log(`  ✅ Photographer profile ready (id=${photographer.id}) linked to state=${algiers?.name}`);
    // -------------------------
    // 5) PORTFOLIO + IMAGES
    // -------------------------
    // create a portfolio (if not existing)
    const portfolio = await prisma.portfolio.create({
        data: {
            photographerId: photographer.id,
            title: 'Featured Works',
            description: 'A curated selection of recent shoots.',
            images: {
                create: [
                    { url: 'https://picsum.photos/seed/1/1200/800', meta: { orientation: 'landscape' } },
                    { url: 'https://picsum.photos/seed/2/1200/800', meta: { orientation: 'landscape' } },
                    { url: 'https://picsum.photos/seed/3/800/1200', meta: { orientation: 'portrait' } },
                ],
            },
        },
    });
    // -------------------------
    // 6) BOOKING (requested) + BookingStateHistory
    // -------------------------
    const start = new Date();
    start.setDate(start.getDate() + 7); // one week from now
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h
    const booking = await prisma.booking.create({
        data: {
            clientId: clientUser.id,
            photographerId: photographer.id,
            startAt: start,
            endAt: end,
            location: { address: 'Central Park', lat: 36.76, lon: 3.05 },
            priceCents: 20000,
            state: client_1.BookingState.requested,
            stateHistory: {
                create: {
                    fromState: client_1.BookingState.draft,
                    toState: client_1.BookingState.requested,
                    reason: 'Client created request',
                    byUserId: clientUser.id,
                },
            },
        },
    });
    console.log(`  ✅ Booking created (id=${booking.id}) state=${booking.state}`);
    // -------------------------
    // 7) CONVERSATION + MESSAGES
    // -------------------------
    const conversation = await prisma.conversation.create({
        data: {
            participantAId: clientUser.id,
            participantBId: photogUser.id,
            messages: {
                create: [
                    {
                        senderId: clientUser.id,
                        content: 'Hi! Are you available for a photoshoot next week?',
                    },
                    {
                        senderId: photogUser.id,
                        content: 'Hello! Yes, I am available. Let’s discuss details.',
                    },
                ],
            },
        },
        include: { messages: true },
    });
    console.log(`  ✅ Conversation created (id=${conversation.id}) with ${conversation.messages.length} messages`);
    // -------------------------
    // 8) NOTIFICATION (in-app)
    // -------------------------
    await prisma.notification.create({
        data: {
            userId: photogUser.id,
            type: client_1.NotificationType.BOOKING_REQUESTED,
            payload: { bookingId: booking.id, clientName: clientUser.name },
        },
    });
    console.log('  ✅ Notification created for photographer');
    // -------------------------
    // 9) CONTRACT (placeholder PDF URL)
    // -------------------------
    await prisma.contract.create({
        data: {
            bookingId: booking.id,
            status: client_1.ContractStatus.GENERATED,
            pdfUrl: 'https://example.com/contracts/demo-contract.pdf',
        },
    });
    console.log('  ✅ Contract record created (placeholder pdfUrl)');
    // -------------------------
    // 10) PAYMENT (offline placeholder)
    // -------------------------
    await prisma.payment.create({
        data: {
            bookingId: booking.id,
            status: client_1.PaymentStatus.PENDING,
            amountCents: 20000,
            currency: 'USD',
            provider: 'offline', // payment happens off-site per product spec
            providerPaymentIntentId: null,
        },
    });
    console.log('  ✅ Payment placeholder created (offline)');
    // -------------------------
    // FINAL SUMMARY
    // -------------------------
    console.log('---------------------------------------');
    console.log('✅ Seed completed successfully.');
    console.log({
        admin: admin.email,
        client: clientUser.email,
        photographer: photogUser.email,
        photographerId: photographer.id,
        state: algiers?.name,
        services: createdServices.map((s) => s.name).join(', '),
        portfolio: portfolio.title,
        bookingId: booking.id,
        conversationId: conversation.id,
    });
    console.log('---------------------------------------');
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
