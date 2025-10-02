// prisma/seed.ts
import {
  PrismaClient,
  Role,
  BookingState,
  PaymentStatus,
  ContractStatus,
  NotificationType,
  ReviewStatus,
  User,
  State,
  Service,
  Photographer,
  Portfolio,
  Booking,
  Conversation,
  Message,
  Notification,
  Contract,
  Payment,
  Review,
  Favorite,
  Package,
  GalleryImage,
  CalendarEvent,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  NUM_STATES: 10,
  NUM_SERVICES: 10,
  NUM_CATEGORIES: 5,
  NUM_ADMIN_USERS: 1,
  NUM_CLIENT_USERS: 20,
  NUM_PHOTOGRAPHER_USERS: 10,
  NUM_PORTFOLIOS_PER_PHOTOGRAPHER: 2,
  NUM_IMAGES_PER_PORTFOLIO: 5,
  NUM_GALLERY_IMAGES_PER_PHOTOGRAPHER: 8,
  NUM_PACKAGES_PER_PHOTOGRAPHER: 3,
  NUM_CALENDAR_EVENTS_PER_PHOTOGRAPHER: 20,
  NUM_BOOKINGS_PER_PHOTOGRAPHER: 5,
  NUM_BOOKINGS_PER_CLIENT: 2,
  NUM_CONVERSATIONS_PER_USER: 5, // Avg conversations per user
  NUM_MESSAGES_PER_CONVERSATION: 5, // Avg messages per conversation
  NUM_REVIEWS_PER_PHOTOGRAPHER: 4,
  NUM_FAVORITES_PER_CLIENT: 5,
};

// Utility functions
async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

// Helper to pick random items from an array
function pickRandom<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Data generators using Faker
function generateStateData(count: number): { code: string; name: string }[] {
  const states = [];
  for (let i = 0; i < count; i++) {
    // Using a more generic code format for demo
    const code = `ST-${String(i + 1).padStart(2, '0')}`;
    const name = faker.location.state();
    states.push({ code, name });
  }
  return states;
}

function generateCategoryData(count: number): { slug: string; name: string; description: string | null }[] {
  const categories = [];
  for (let i = 0; i < count; i++) {
    const name = faker.commerce.department();
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    categories.push({
      slug,
      name,
      description: faker.lorem.sentence(),
    });
  }
  return categories;
}

function generateServiceData(count: number, categories: { id: string }[]): { slug: string; name: string; description: string | null; categoryId: string | undefined }[] {
  const services = [];
  for (let i = 0; i < count; i++) {
    const name = faker.lorem.words(2);
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    // Randomly assign a category or leave null
    const category = categories.length > 0 ? faker.helpers.arrayElement(categories) : null;
    services.push({
      slug,
      name,
      description: faker.lorem.sentence(),
      categoryId: category?.id,
    });
  }
  return services;
}

function generateUserData(count: number, role: Role, password: string): Promise<{ email: string; name: string; role: Role; locale: string; passwordHash: string; emailVerified: boolean; emailVerifiedAt: Date | null }>[] {
  return Array.from({ length: count }, async () => ({
    email: faker.internet.email().toLowerCase(),
    name: faker.person.fullName(),
    role,
    locale: 'en',
    passwordHash: await hashPassword(password),
    emailVerified: faker.datatype.boolean(),
    emailVerifiedAt: faker.datatype.boolean() ? faker.date.past() : null,
  }));
}

function generatePhotographerData(users: User[], states: State[], services: Service[]): { userId: string; bio: string; location: any; tags: string[]; priceBaseline: number; verified: boolean; stateId: string | null }[] {
  return users.map(user => {
    const photographerStates = states.filter(s => s.name.includes('Algiers') || s.name.includes('Oran') || s.name.includes('Jijel')); // Filter for demo states
    const state = photographerStates.length > 0 ? faker.helpers.arrayElement(photographerStates) : null;
    const numServices = faker.number.int({ min: 1, max: Math.min(4, services.length) });
    // Note: We cannot assign services here directly; they are connected later via upsert.
    // We'll just store the data structure for later use.
    return {
      userId: user.id,
      bio: faker.lorem.paragraphs(2),
      location: {
        address: faker.location.streetAddress(),
        lat: faker.location.latitude(),
        lon: faker.location.longitude(),
      },
      tags: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () => faker.lorem.word()),
      priceBaseline: faker.number.int({ min: 5000, max: 50000, multipleOf: 1000 }), // In cents
      verified: faker.datatype.boolean(0.7), // 70% chance of being verified
      stateId: state?.id || null,
    };
  });
}

function generatePortfolioData(photographers: Photographer[], countPerPhotographer: number): { photographerId: string; title: string; description: string | null }[] {
  const portfolios = [];
  for (const photog of photographers) {
    for (let i = 0; i < countPerPhotographer; i++) {
      portfolios.push({
        photographerId: photog.id,
        title: faker.lorem.words(3),
        description: faker.lorem.sentence(),
      });
    }
  }
  return portfolios;
}

function generateImageData(portfolios: Portfolio[], countPerPortfolio: number): { portfolioId: string; url: string; meta: any }[] {
  const images = [];
  for (const portfolio of portfolios) {
    for (let i = 0; i < countPerPortfolio; i++) {
      const width = faker.datatype.boolean() ? 1200 : 800;
      const height = width === 1200 ? 800 : 1200;
      images.push({
        portfolioId: portfolio.id,
        url: faker.image.url({ width, height }), // Use faker's image URL generator
        meta: { orientation: width > height ? 'landscape' : 'portrait', width, height },
      });
    }
  }
  return images;
}

function generateGalleryImageData(photographers: Photographer[], countPerPhotographer: number): { photographerId: string; url: string; meta: any }[] {
  const images = [];
  for (const photog of photographers) {
    for (let i = 0; i < countPerPhotographer; i++) {
      const width = faker.datatype.boolean() ? 1200 : 800;
      const height = width === 1200 ? 800 : 1200;
      images.push({
        photographerId: photog.id,
        url: faker.image.url({ width, height }), // Use faker's image URL generator
        meta: { orientation: width > height ? 'landscape' : 'portrait', width, height },
      });
    }
  }
  return images;
}

function generatePackageData(photographers: Photographer[], countPerPhotographer: number): { photographerId: string; title: string; description: string | null; priceCents: number }[] {
  const packages = [];
  for (const photog of photographers) {
    for (let i = 0; i < countPerPhotographer; i++) {
      packages.push({
        photographerId: photog.id,
        title: faker.lorem.words(2),
        description: faker.lorem.sentence(),
        priceCents: faker.number.int({ min: 10000, max: 100000, multipleOf: 5000 }), // In cents
      });
    }
  }
  return packages;
}

function generateCalendarEventData(photographers: Photographer[], countPerPhotographer: number): { photographerId: string; startAt: Date; endAt: Date; title: string | null; type: string }[] {
  const events = [];
  for (const photog of photographers) {
    for (let i = 0; i < countPerPhotographer; i++) {
      const start = faker.date.future({ years: 0.5 }); // Within next 6 months
      const end = new Date(start.getTime() + faker.number.int({ min: 2, max: 8 }) * 60 * 60 * 1000); // 2-8 hours duration
      const eventType = faker.helpers.arrayElement(['blocked', 'available', 'note']);
      let title = null;
      if (eventType === 'blocked') {
        title = faker.helpers.arrayElement(['Booked - Wedding', 'Booked - Portrait', 'Holiday', 'Personal Time']);
      } else if (eventType === 'note') {
        title = faker.lorem.sentence();
      }
      events.push({
        photographerId: photog.id,
        startAt: start,
        endAt: end,
        title,
        type: eventType,
      });
    }
  }
  return events;
}

function generateBookingData(clients: User[], photographers: Photographer[], countPerClient: number): { clientId: string; photographerId: string; startAt: Date; endAt: Date; location: any; priceCents: number; state: BookingState }[] {
  const bookings = [];
  for (const client of clients) {
    const selectedPhotogs = pickRandom(photographers, countPerClient);
    for (const photog of selectedPhotogs) {
      const start = faker.date.future({ years: 0.5 }); // Within next 6 months
      const end = new Date(start.getTime() + faker.number.int({ min: 1, max: 4 }) * 60 * 60 * 1000); // 1-4 hours duration
      const state = faker.helpers.arrayElement(Object.values(BookingState));
      bookings.push({
        clientId: client.id,
        photographerId: photog.id,
        startAt: start,
        endAt: end,
        location: {
          address: faker.location.streetAddress(),
          lat: faker.location.latitude(),
          lon: faker.location.longitude(),
        },
        priceCents: faker.number.int({ min: 5000, max: 50000, multipleOf: 1000 }), // In cents
        state,
      });
    }
  }
  return bookings;
}

function generateConversationData(users: User[], countPerUser: number): { participantAId: string; participantBId: string }[] {
  const conversations = new Set<string>(); // Use Set to avoid duplicates
  const userPairs = [];

  // Generate potential user pairs
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      userPairs.push([users[i].id, users[j].id]);
    }
  }

  // Randomly select pairs based on countPerUser
  const selectedPairs = pickRandom(userPairs, Math.min(countPerUser * users.length, userPairs.length));

  for (const [idA, idB] of selectedPairs) {
    const pairKey = [idA, idB].sort().join('-'); // Sort to ensure uniqueness regardless of order
    if (!conversations.has(pairKey)) {
      conversations.add(pairKey);
    }
  }

  return Array.from(conversations).map(pair => {
    const [idA, idB] = pair.split('-');
    return { participantAId: idA, participantBId: idB };
  });
}

function generateMessageData(conversations: Conversation[], avgCountPerConversation: number): { conversationId: string; senderId: string; content: string; readAt: Date | null }[] {
  const messages = [];
  for (const conv of conversations) {
    const messageCount = faker.number.int({ min: 1, max: avgCountPerConversation * 2 }); // Vary count around average
    const participants = [conv.participantAId, conv.participantBId];
    for (let i = 0; i < messageCount; i++) {
      const isRead = faker.datatype.boolean(0.8); // 80% chance of being read
      messages.push({
        conversationId: conv.id,
        senderId: faker.helpers.arrayElement(participants),
        content: faker.lorem.sentence(),
        readAt: isRead ? faker.date.recent({ days: 7 }) : null,
      });
    }
  }
  return messages;
}

function generateNotificationData(users: User[], countPerUser: number): { userId: string; type: NotificationType; payload: any }[] {
  const notifications = [];
  for (const user of users) {
    for (let i = 0; i < countPerUser; i++) {
      const type = faker.helpers.arrayElement(Object.values(NotificationType));
      let payload = {};
      switch (type) {
        case NotificationType.BOOKING_REQUESTED:
        case NotificationType.BOOKING_CONFIRMED:
        case NotificationType.CONTRACT_READY:
        case NotificationType.CONTRACT_SIGNED:
        case NotificationType.PAYMENT_SUCCEEDED:
        case NotificationType.PAYMENT_FAILED:
        case NotificationType.REVIEW_RECEIVED:
          payload = { id: faker.string.uuid(), message: faker.lorem.sentence() };
          break;
        case NotificationType.MESSAGE_RECEIVED:
          payload = { conversationId: faker.string.uuid(), senderName: faker.person.fullName() };
          break;
        case NotificationType.SYSTEM:
        default:
          payload = { title: faker.lorem.word(), description: faker.lorem.sentence() };
          break;
      }
      notifications.push({
        userId: user.id,
        type,
        payload,
      });
    }
  }
  return notifications;
}

function generateContractData(bookings: Booking[]): { bookingId: string; status: ContractStatus; pdfUrl: string }[] {
  return bookings.map(booking => ({
    bookingId: booking.id,
    status: faker.helpers.arrayElement(Object.values(ContractStatus)),
    pdfUrl: faker.internet.url({ protocol: 'https' }) + '/contracts/demo.pdf', // Placeholder URL
  }));
}

function generatePaymentData(bookings: Booking[]): { bookingId: string; status: PaymentStatus; amountCents: number; currency: string; provider: string; providerPaymentIntentId: string | null }[] {
  return bookings.map(booking => ({
    bookingId: booking.id,
    status: faker.helpers.arrayElement(Object.values(PaymentStatus)),
    amountCents: booking.priceCents, // Assume payment amount matches booking price
    currency: 'USD',
    provider: faker.helpers.arrayElement(['stripe', 'paypal', 'offline']),
    providerPaymentIntentId: faker.datatype.boolean() ? faker.string.uuid() : null,
  }));
}

function generateReviewData(photographers: Photographer[], bookings: Booking[], countPerPhotographer: number): { bookingId: string; photographerId: string; reviewerId: string; rating: number; text: string | null; status: ReviewStatus }[] {
  const reviews = [];
  const bookingMap = new Map(bookings.map(b => [b.id, b])); // Map bookingId to booking object for quick lookup

  for (const photog of photographers) {
    const photogBookings = bookings.filter(b => b.photographerId === photog.id);
    const selectedBookings = pickRandom(photogBookings, countPerPhotographer);

    for (const booking of selectedBookings) {
      // Ensure the reviewer is the client who made the booking
      if (booking.clientId) {
        reviews.push({
          bookingId: booking.id,
          photographerId: photog.id,
          reviewerId: booking.clientId,
          rating: faker.number.int({ min: 1, max: 5 }),
          text: faker.datatype.boolean(0.8) ? faker.lorem.paragraph() : null, // 80% chance of having text
          status: faker.helpers.arrayElement(Object.values(ReviewStatus)), // Could add logic to default to APPROVED
        });
      }
    }
  }
  return reviews;
}

function generateFavoriteData(clients: User[], photographers: Photographer[], countPerClient: number): { userId: string; photographerId: string }[] {
  const favorites = [];
  for (const client of clients) {
    const selectedPhotogs = pickRandom(photographers, countPerClient);
    for (const photog of selectedPhotogs) {
      favorites.push({
        userId: client.id,
        photographerId: photog.id,
      });
    }
  }
  return favorites;
}


async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // 1. STATES
  console.log('  - Seeding States...');
  const statesData = generateStateData(CONFIG.NUM_STATES);
  const createdStates = await prisma.state.createMany({
    data: statesData,
    skipDuplicates: true, // Use skipDuplicates for upsert-like behavior in bulk
  });
  const allStates = await prisma.state.findMany(); // Fetch all after creation to get IDs
  console.log(`    ✅ Seeded ${allStates.length} States`);

  // 2. CATEGORIES
  console.log('  - Seeding Categories...');
  const categoryData = generateCategoryData(CONFIG.NUM_CATEGORIES);
  const createdCategories = await prisma.category.createMany({
    data: categoryData,
    skipDuplicates: true,
  });
  const allCategories = await prisma.category.findMany();
  console.log(`    ✅ Seeded ${allCategories.length} Categories`);

  // 3. SERVICES
  console.log('  - Seeding Services...');
  const serviceData = generateServiceData(CONFIG.NUM_SERVICES, allCategories.map(c => ({ id: c.id })));
  const createdServices = await prisma.service.createMany({
    data: serviceData,
    skipDuplicates: true,
  });
  const allServices = await prisma.service.findMany();
  console.log(`    ✅ Seeded ${allServices.length} Services`);

  // 4. USERS
  console.log('  - Seeding Users...');
  const adminUsers = await Promise.all(generateUserData(CONFIG.NUM_ADMIN_USERS, Role.ADMIN, 'Admin@123456'));
  const clientUsers = await Promise.all(generateUserData(CONFIG.NUM_CLIENT_USERS, Role.CLIENT, 'Client@123456'));
  const photographerUsers = await Promise.all(generateUserData(CONFIG.NUM_PHOTOGRAPHER_USERS, Role.PHOTOGRAPHER, 'Photog@123456'));

  const allUserPromises = [
    ...adminUsers.map(data => prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: data,
    })),
    ...clientUsers.map(data => prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: data,
    })),
    ...photographerUsers.map(data => prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: data,
    })),
  ];
  await Promise.all(allUserPromises);
  const allUsers = await prisma.user.findMany();
  const clientUsersDB = allUsers.filter(u => u.role === Role.CLIENT);
  const photographerUsersDB = allUsers.filter(u => u.role === Role.PHOTOGRAPHER);
  console.log(`    ✅ Seeded ${allUsers.length} Users (${clientUsersDB.length} Clients, ${photographerUsersDB.length} Photographers)`);

  // 5. PHOTOGRAPHER PROFILES
  console.log('  - Seeding Photographer Profiles...');
  const photographerData = generatePhotographerData(photographerUsersDB, allStates, allServices);
  const createdPhotographers = await Promise.all(
    photographerData.map(data => prisma.photographer.upsert({
      where: { userId: data.userId },
      update: {
        bio: data.bio,
        location: data.location,
        tags: data.tags,
        priceBaseline: data.priceBaseline,
        verified: data.verified,
        stateId: data.stateId,
      },
      create: data,
    }))
  );
  // Connect Services after Photographer is created
  for (const photog of createdPhotographers) {
    const numServicesToConnect = faker.number.int({ min: 1, max: Math.min(4, allServices.length) });
    const servicesToConnect = pickRandom(allServices, numServicesToConnect).map(s => ({ id: s.id }));
    await prisma.photographer.update({
      where: { id: photog.id },
      data: {
        services: {
          connect: servicesToConnect,
        }
      }
    });
  }
  console.log(`    ✅ Seeded ${createdPhotographers.length} Photographer Profiles with Services`);

  // 6. PORTFOLIOS & IMAGES
  console.log('  - Seeding Portfolios and Images...');
  const portfolioData = generatePortfolioData(createdPhotographers, CONFIG.NUM_PORTFOLIOS_PER_PHOTOGRAPHER);
  const createdPortfolios = await prisma.portfolio.createMany({
    data: portfolioData,
    skipDuplicates: true,
  });
  const allPortfolios = await prisma.portfolio.findMany();
  const imageData = generateImageData(allPortfolios, CONFIG.NUM_IMAGES_PER_PORTFOLIO);
  const createdImages = await prisma.image.createMany({
    data: imageData,
    skipDuplicates: true,
  });
  console.log(`    ✅ Seeded ${allPortfolios.length} Portfolios and ${createdImages.count} Images`);

  // 7. GALLERY IMAGES
  console.log('  - Seeding Gallery Images...');
  const galleryImageData = generateGalleryImageData(createdPhotographers, CONFIG.NUM_GALLERY_IMAGES_PER_PHOTOGRAPHER);
  const createdGalleryImages = await prisma.galleryImage.createMany({
    data: galleryImageData,
    skipDuplicates: true,
  });
  console.log(`    ✅ Seeded ${createdGalleryImages.count} Gallery Images`);

  // 8. PACKAGES
  console.log('  - Seeding Packages...');
  const packageData = generatePackageData(createdPhotographers, CONFIG.NUM_PACKAGES_PER_PHOTOGRAPHER);
  const createdPackages = await prisma.package.createMany({
    data: packageData,
    skipDuplicates: true,
  });
  console.log(`    ✅ Seeded ${createdPackages.count} Packages`);

  // 9. CALENDAR EVENTS
  console.log('  - Seeding Calendar Events...');
  const calendarEventData = generateCalendarEventData(createdPhotographers, CONFIG.NUM_CALENDAR_EVENTS_PER_PHOTOGRAPHER);
  const createdCalendarEvents = await prisma.calendarEvent.createMany({
    data: calendarEventData,
    skipDuplicates: true,
  });
  console.log(`    ✅ Seeded ${createdCalendarEvents.count} Calendar Events`);

  // 10. BOOKINGS
  console.log('  - Seeding Bookings...');
  const bookingData = generateBookingData(clientUsersDB, createdPhotographers, CONFIG.NUM_BOOKINGS_PER_CLIENT);
  const createdBookings = await prisma.booking.createMany({
    data: bookingData,
    skipDuplicates: true,
  });
  const allBookings = await prisma.booking.findMany();
  console.log(`    ✅ Seeded ${allBookings.length} Bookings`);

  // 11. CONVERSATIONS & MESSAGES
  console.log('  - Seeding Conversations and Messages...');
  const conversationData = generateConversationData(allUsers, CONFIG.NUM_CONVERSATIONS_PER_USER);
  const createdConversations = await prisma.conversation.createMany({
    data: conversationData,
    skipDuplicates: true,
  });
  const allConversations = await prisma.conversation.findMany();
  const messageData = generateMessageData(allConversations, CONFIG.NUM_MESSAGES_PER_CONVERSATION);
  const createdMessages = await prisma.message.createMany({
    data: messageData,
    skipDuplicates: true,
  });
  console.log(`    ✅ Seeded ${allConversations.length} Conversations and ${createdMessages.count} Messages`);

  // 12. NOTIFICATIONS
  console.log('  - Seeding Notifications...');
  const notificationData = generateNotificationData(allUsers, 3); // Avg 3 notifications per user
  const createdNotifications = await prisma.notification.createMany({
    data: notificationData,
    skipDuplicates: true,
  });
  console.log(`    ✅ Seeded ${createdNotifications.count} Notifications`);

  // 13. CONTRACTS
  console.log('  - Seeding Contracts...');
  const contractData = generateContractData(allBookings);
  const createdContracts = await prisma.contract.createMany({
    data: contractData,
    skipDuplicates: true,
  });
  console.log(`    ✅ Seeded ${createdContracts.count} Contracts`);

  // 14. PAYMENTS
  console.log('  - Seeding Payments...');
  const paymentData = generatePaymentData(allBookings);
  const createdPayments = await prisma.payment.createMany({
    data: paymentData,
    skipDuplicates: true,
  });
  console.log(`    ✅ Seeded ${createdPayments.count} Payments`);

  // 15. REVIEWS
  console.log('  - Seeding Reviews...');
  const reviewData = generateReviewData(createdPhotographers, allBookings, CONFIG.NUM_REVIEWS_PER_PHOTOGRAPHER);
  const createdReviews = await prisma.review.createMany({
    data: reviewData,
    skipDuplicates: true,
  });
  console.log(`    ✅ Seeded ${createdReviews.count} Reviews`);

  // 16. FAVORITES
  console.log('  - Seeding Favorites...');
  const favoriteData = generateFavoriteData(clientUsersDB, createdPhotographers, CONFIG.NUM_FAVORITES_PER_CLIENT);
  const createdFavorites = await prisma.favorite.createMany({
    data: favoriteData,
    skipDuplicates: true,
  });
  console.log(`    ✅ Seeded ${createdFavorites.count} Favorites`);

  // FINAL SUMMARY
  console.log('---------------------------------------');
  console.log('✅ Comprehensive seeding completed successfully.');
  console.log({
    states: allStates.length,
    categories: allCategories.length,
    services: allServices.length,
    users: allUsers.length,
    photographers: createdPhotographers.length,
    portfolios: allPortfolios.length,
    images: createdImages.count,
    galleryImages: createdGalleryImages.count,
    packages: createdPackages.count,
    calendarEvents: createdCalendarEvents.count,
    bookings: allBookings.length,
    conversations: allConversations.length,
    messages: createdMessages.count,
    notifications: createdNotifications.count,
    contracts: createdContracts.count,
    payments: createdPayments.count,
    reviews: createdReviews.count,
    favorites: createdFavorites.count,
  });
  console.log('---------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });