import { NotificationReferenceType, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database...');
  await prisma.token.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.group.deleteMany();
  await prisma.stage.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  console.log('Database cleaned.');
  console.log('Seeding database...');

  // Seed Users
  const users = await Promise.all(
    Array.from({ length: 1000 }).map(async (_, i) => {
      return await prisma.user.create({
        data: {
          email: `user${i}_${faker.internet.email()}`,
          password: await bcrypt.hash('azerty', 10),
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
          location: faker.location.streetAddress(),
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
                length: faker.number.int({ min: 3, max: 10 }),
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

  // Seed Stages (2-5 stages per group)
  const stages = await Promise.all(
    groups.map(async (group) => {
      const stageCount = faker.number.int({ min: 2, max: 5 }); // Between 2 and 5 stages per group
      return Promise.all(
        Array.from({ length: stageCount }).map(async () => {
          return await prisma.stage.create({
            data: {
              title: faker.lorem.words(3),
              description: faker.lorem.paragraph(),
              dateFrom: faker.date.soon(),
              dateTo: faker.date.future(),
              address: faker.location.streetAddress(),
              longitude: faker.location.longitude(),
              latitude: faker.location.latitude(),
              groupId: group.id,
              pathPicture: faker.image.url(),
            },
          });
        }),
      );
    }),
  );

  console.log(`Stages seeded for each group.`);

  const groupsWithMembers = await prisma.group.findMany({
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  // Création des notifications pour chaque groupe
  for (const group of groupsWithMembers) {
    const groupMembers = group.members.map((member) => member.user);

    // Notifications pour chaque membre du groupe
    for (const user of groupMembers) {
      // On crée des notifications pour des événements fictifs
      const notificationsData = [
        {
          referenceId: group.id,
          referenceType: NotificationReferenceType.GROUP_MODIFICATION,
          details: `Votre groupe ${group.title} a été modifié.`,
        },
        {
          referenceId: group.id,
          referenceType: NotificationReferenceType.GROUP_INVITATION,
          details: `Vous avez été invité à rejoindre le groupe ${group.title}.`,
        },
        {
          referenceId: group.id,
          referenceType: NotificationReferenceType.GROUP_STATUS_UPDATE,
          details: `Le statut de votre groupe ${group.title} a changé.`,
        },
        {
          referenceId: group.id,
          referenceType: NotificationReferenceType.GROUP_ROLE_UPDATE,
          details: `Votre rôle dans le groupe ${group.title} a été mis à jour.`,
        },
        {
          referenceId: group.id,
          referenceType: NotificationReferenceType.GROUP_MESSAGE,
          details: `Un nouveau message a été posté dans le groupe ${group.title}.`,
        },
      ];

      // Enregistrement des notifications dans la base de données
      for (const notification of notificationsData) {
        await prisma.notification.create({
          data: {
            userId: user.userId,
            referenceId: notification.referenceId,
            referenceType: notification.referenceType,
            details: notification.details,
            isRead: faker.datatype.boolean(), // Peut être true ou false aléatoirement
          },
        });
      }
    }
  }

  console.log('Notifications seeded.');

  // Génération des messages privés (entre utilisateurs)
  const privateMessages = Array.from({ length: 500 }).map(() => {
    const sender = faker.helpers.arrayElement(users);
    let receiver;

    // Assure que le récepteur est différent de l'émetteur
    do {
      receiver = faker.helpers.arrayElement(users);
    } while (receiver.id === sender.id);

    return {
      content: faker.lorem.sentence({ min: 5, max: 20 }),
      senderId: sender.id,
      userReceiverId: receiver.id,
    };
  });

  // Génération des messages de groupe
  const groupMessages = groupsWithMembers.flatMap((group) => {
    const groupMembers = group.members;

    // Assure que le groupe a des membres pour poster des messages
    if (groupMembers.length === 0) return [];

    return Array.from({ length: faker.number.int({ min: 10, max: 30 }) }).map(
      () => {
        const sender = faker.helpers.arrayElement(groupMembers);

        return {
          content: faker.lorem.sentence({ min: 5, max: 20 }),
          senderId: sender.userId,
          groupReceiverId: group.id,
        };
      },
    );
  });

  // Insertion des messages dans la base de données
  await prisma.message.createMany({
    data: [...privateMessages, ...groupMessages],
  });

  console.log(
    `${privateMessages.length} private messages and ${groupMessages.length} group messages seeded.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
