# Travel2Gether backend

## Technologies Used

This project uses the following technologies:

- NestJS
- TypeScript
- Prisma
- MySQL
- Multer
- Jest
- ESLint

## Getting Started

To get started with this project, follow these steps:

1. Clone the repository:

```bash
$ git clone https://git.alt-tools.tech/gp_groovy_git/travel2gather/back.git
$ cd back
```

2. Install the dependencies:

```bash
$ npm install
```

3. Set up the environment variables. Create a `.env` file in the root directory and add the following variables:

```env
DATABASE_URL="mysql://username:password@ip:port/db_name"
SECRET_KEY="secret_key_for_access_token"
SECRET_REFRESH_KEY="secret_key_for_refresh_token"
IS_PUBLIC_KEY="public_key"
BREVO_API_KEY="your_brevo_api_key"
FRONT_URL="https://example.com"
NATS_DNS=XXX.XXX.X.XX
NATS_PORT=XXXX
```

4. Run the database migrations:

```bash
$ npx prisma migrate deploy
```

## Available scripts

In the project directory, you can run the following scripts:

- Start the development server:

  ```bash
  $ npm run start
  ```

- Start the development server in watch mode:

  ```bash
  $ npm run start:dev
  ```

- Start the production server:

  ```bash
  $ npm run start:prod
  ```

- Run unit tests:

  ```bash
  $ npm run test
  ```

- Run end-to-end tests:

  ```bash
  $ npm run test:e2e
  ```

- Run test coverage:

  ```bash
  $ npm run test:cov
  ```

- Run database migrations:

  ```bash
  $ npx prisma migrate deploy
  ```

- Revert database migrations:

  ```bash
  $ npx prisma migrate reset
  ```

- Generate a new migration:
  ```bash
  $ npx prisma migrate dev --name MigrationName
  ```

## Environment Variables

The following environment variables are used in this project:

- `DATABASE_URL`: The URL of your MySQL database.
- `SECRET_KEY`: The secret key for signing JWT tokens.
- `SECRET_REFRESH_KEY`: The secret key for signing refresh tokens.
- `IS_PUBLIC_KEY`: The key to identify public endpoints.
- `BREVO_API_KEY`: The API key for Brevo.
- `FRONT_URL`: The URL of the front-end application.
- `NATS_DNS`: The DNS of the NATS server.
- `NATS_PORT`: The port of the NATS server.

## ESLint Configuration

The project uses ESLint for linting. The configuration can be found in the `eslintrc.js` file. To expand the ESLint configuration, follow the steps provided in the "Expanding the ESLint configuration" section above.

## Additional Resources

For more information on the technologies used in this project, check out the following resources:

- [Node.js](https://nodejs.org/)
- [NestJS](https://nestjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [MySQL](https://www.mysql.com/)
- [Prisma](https://www.prisma.io/)
- [Jest](https://jestjs.io/)
