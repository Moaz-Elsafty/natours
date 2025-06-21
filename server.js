const dotenv = require('dotenv');

// Handling Synchronous Errors
process.on('uncaughtException', (err) => {
  console.error(`UncaughtException Errors: ${err.name} | ${err.message}`);
  console.error('Shutting down....');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const dbConnection = require('./config/database');

// Connect with DB
dbConnection();

// Starting the server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}`);
});

// Handling Erros outside of the app
process.on('unhandledRejection', (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`Shutting down....`);
    process.exit(1);
  });
});

// Handling SiGTERM signal (for Heroku)
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED! Shutting down');
  server.close(() => {
    console.log('Process terminated!');
  });
});
