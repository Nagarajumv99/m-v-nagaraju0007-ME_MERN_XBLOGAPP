require('dotenv').config();

const app = require('./src/app');
const connectDatabase = require('./src/config/database');

const port = Number(process.env.PORT) || 5000;

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in the environment.');
  }

  await connectDatabase();

  app.listen(port, () => {
    console.log(`XBlogApp API listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start XBlogApp API:', error.message);
  process.exitCode = 1;
});
