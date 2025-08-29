// prisma/seed.ts
import { PrismaClient, Role, BookingState, PaymentStatus, ContractStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

async function main() {
  console.log('🌱 Seeding database...');

  // ----- USERS -----
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
        role: Role.ADMIN,
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
        role: Role.CLIENT,
        locale: 'en',
        passwordHash: await hashPassword('Client@123456'),
      },
    }),
    prisma.user.upsert({
      where: { email: photogEmail },
      update: {},
      create: {
        email: photogEmail,
        name: 'Photographer One',
        role: Role.PHOTOGRAPHER,
        locale: 'en',
        passwordHash: await hashPassword('Photog@123456'),
      },
    }),
  ]);

  // ----- PHOTOGRAPHER PROFILE -----
  const photographer = await prisma.photographer.upsert({
    where: { userId: photogUser.id },
    update: {},
    create: {
      userId: photogUser.id,
      bio: 'Lifestyle & wedding photographer with 6+ years of experience.',
      location: { address: 'Downtown', lat: 36.75, lon: 3.06 },
      tags: ['wedding', 'portrait', 'outdoor', 'sony-a7'],
      priceBaseline: 15000, // cents
      verified: true,
    },
  });

  // ----- PORTFOLIO + IMAGES -----
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

  // ----- BOOKING (requested) -----
  const start = new Date();
  start.setDate(start.getDate() + 7);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h

  const booking = await prisma.booking.create({
    data: {
      clientId: clientUser.id,
      photographerId: photographer.id,
      startAt: start,
      endAt: end,
      location: { address: 'Central Park', lat: 36.76, lon: 3.05 },
      priceCents: 20000,
      state: BookingState.requested,
      stateHistory: {
        create: {
          fromState: BookingState.draft,
          toState: BookingState.requested,
          reason: 'Client created request',
          byUserId: clientUser.id,
        },
      },
    },
    include: { stateHistory: true },
  });

  // ----- CONVERSATION + MESSAGE -----
  // Conversation between client (User) and photographer (User)
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
  });

  // ----- NOTIFICATION -----
  await prisma.notification.create({
    data: {
      userId: photogUser.id,
      type: NotificationType.BOOKING_REQUESTED,
      payload: { bookingId: booking.id, clientName: clientUser.name },
    },
  });

  // ----- CONTRACT + PAYMENT (placeholders) -----
  await prisma.contract.create({
    data: {
      bookingId: booking.id,
      status: ContractStatus.GENERATED,
      pdfUrl: 'https://example.com/contracts/demo-contract.pdf',
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      status: PaymentStatus.PENDING,
      amountCents: 20000,
      currency: 'USD',
      provider: 'stripe',
      providerPaymentIntentId: null,
    },
  });

  console.log('✅ Seed completed successfully.');
  console.log({
    admin: admin.email,
    client: clientUser.email,
    photographer: photogUser.email,
    portfolio: portfolio.title,
    bookingId: booking.id,
    conversationId: conversation.id,
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
