import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database...');
  await prisma.token.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  console.log('Database cleaned.');
  console.log('Seeding database...');

  // Seed Users
  const users = await Promise.all(
    Array.from({ length: 1000 }).map(async (_, i) => {
      return await prisma.user.create({
        data: {
          email: `user${i}_${faker.internet.email()}`,
          password: 'azerty',
          status: faker.helpers.arrayElement([
            'NOT_VERIFIED',
            'VERIFIED',
            'BANNED',
          ]),
          profile: {
            create: {
              firstname: faker.person.firstName(),
              lastname: faker.person.lastName(),
              birthdate: faker.date
                .birthdate({ mode: 'age', min: 18, max: 60 })
                .toISOString()
                .split('T')[0],
              pathPicture: faker.image.avatarGitHub(),
              gender: faker.helpers.arrayElement(['MALE', 'FEMALE', 'OTHER']),
              description: faker.lorem.paragraph(),
              budget: faker.helpers.arrayElement([
                'LOW',
                'MIDDLE',
                'HIGH',
                'LUXURY',
              ]),
              availableFrom: faker.date.soon(),
              availableTo: faker.date.future(),
              lodgings: {
                createMany: {
                  data: faker.helpers
                    .shuffle([
                      'YOUTH_HOTEL',
                      'HOTEL',
                      'AIRBNB',
                      'CAMPING',
                      'ECOLODGE',
                      'LUXURY',
                    ])
                    .slice(0, 3) // Picks 3 unique values
                    .map((lodging) => ({ lodging })),
                },
              },
              travelTypes: {
                createMany: {
                  data: faker.helpers
                    .shuffle([
                      'RELAXATION',
                      'ADVENTURE',
                      'CULTURAL',
                      'HIKING',
                      'BEACH',
                      'GASTRONOMIC',
                      'ROAD_TRIP',
                      'CRUISE',
                      'FAMILY_TRIP',
                      'FRIENDS_TRIP',
                      'ECO_FRIENDLY',
                    ])
                    .slice(0, 3) // Picks 3 unique values
                    .map((travelType) => ({ travelType })),
                },
              },

              interests: {
                createMany: {
                  data: faker.helpers
                    .shuffle([
                      'ADVENTURE_SPORTS',
                      'CULTURAL_ARTS',
                      'GASTRONOMIC',
                      'NATURE',
                      'WELLNESS',
                      'PARTY',
                      'AMUSEMENT_PARK',
                      'BOARD_GAMES',
                      'TECHNOLOGIES',
                      'HISTORY',
                      'WATER_ACTIVITIES',
                      'SHOPPING',
                      'FAMILY_ACTIVITIES',
                    ])
                    .slice(0, 3) // Picks 3 unique values
                    .map((interest) => ({ interest })),
                },
              },
              languages: {
                createMany: {
                  data: faker.helpers
                    .shuffle([
                      'FRENCH',
                      'ENGLISH',
                      'SPANISH',
                      'PORTUGUESE',
                      'ARABIC',
                      'ITALIAN',
                      'JAPANESE',
                      'MANDARIN',
                      'DEUTSCH',
                      'DUTCH',
                      'RUSSIAN',
                      'HINDI',
                      'GREEK',
                    ])
                    .slice(0, 3) // Picks 3 unique values
                    .map((language) => ({ language })),
                },
              },
              tripDurations: {
                createMany: {
                  data: faker.helpers
                    .shuffle(['SHORT_TRIP', 'MEDIUM_TRIP', 'LONG_TRIP'])
                    .slice(0, 3) // Picks 3 unique values
                    .map((tripDuration) => ({ tripDuration })),
                },
              },
            },
          },
        },
      });
    }),
  );

  console.log(`${users.length} users seeded.`);

  // Seed Groups
  const groups = await Promise.all(
    Array.from({ length: 250 }).map(async () => {
      return await prisma.group.create({
        data: {
          title: faker.lorem.words(3),
          description: faker.lorem.paragraph(),
          location: faker.address.city(),
          dateFrom: faker.date.soon(),
          dateTo: faker.date.future(),
          pathPicture: faker.image.url(),
          status: faker.helpers.arrayElement([
            'PENDING',
            'IN_PROGRESS',
            'FINISHED',
          ]),
          gender: faker.helpers.arrayElement([
            'MALE',
            'FEMALE',
            'OTHER',
            'MIXED',
          ]),
          budget: faker.helpers.arrayElement([
            'LOW',
            'MIDDLE',
            'HIGH',
            'LUXURY',
          ]),
          lodgings: {
            createMany: {
              data: faker.helpers
                .shuffle([
                  'YOUTH_HOTEL',
                  'HOTEL',
                  'AIRBNB',
                  'CAMPING',
                  'ECOLODGE',
                  'LUXURY',
                ])
                .slice(0, 3) // Picks 3 unique values
                .map((lodging) => ({ lodging })),
            },
          },
          travelTypes: {
            createMany: {
              data: faker.helpers
                .shuffle([
                  'RELAXATION',
                  'ADVENTURE',
                  'CULTURAL',
                  'HIKING',
                  'BEACH',
                  'GASTRONOMIC',
                  'ROAD_TRIP',
                  'CRUISE',
                  'FAMILY_TRIP',
                  'FRIENDS_TRIP',
                  'ECO_FRIENDLY',
                ])
                .slice(0, 3) // Picks 3 unique values
                .map((travelType) => ({ travelType })),
            },
          },
          languages: {
            createMany: {
              data: faker.helpers
                .shuffle([
                  'FRENCH',
                  'ENGLISH',
                  'SPANISH',
                  'PORTUGUESE',
                  'ARABIC',
                  'ITALIAN',
                  'JAPANESE',
                  'MANDARIN',
                  'DEUTSCH',
                  'DUTCH',
                  'RUSSIAN',
                  'HINDI',
                  'GREEK',
                ])
                .slice(0, 3) // Picks 3 unique values
                .map((language) => ({ language })),
            },
          },
          members: {
            create: (() => {
              const usedUserIds = new Set<number>(); // Keeping track of previously added users

              return Array.from({
                length: faker.number.int({ min: 1, max: 6 }),
              }).map(() => {
                let randomUser;
                // Loop until a unique user is returned for this group
                do {
                  randomUser = faker.helpers.arrayElement(users);
                } while (usedUserIds.has(randomUser.id));
                usedUserIds.add(randomUser.id); // Adding this user to the set

                return {
                  userId: randomUser.id,
                  role: faker.helpers.arrayElement([
                    'TRAVELER',
                    'ORGANIZER',
                    'AUTHOR',
                  ]),
                  status: faker.helpers.arrayElement([
                    'PENDING',
                    'ACCEPTED',
                    'DENIED',
                  ]),
                };
              });
            })(), // Calling this function to generate group members
          },
        },
      });
    }),
  );

  console.log(`${groups.length} groups seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
