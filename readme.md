# Natours Application

Natours is a full-featured travel booking application that allows users to explore and book tours around the world. It offers a secure and seamless experience with advanced features for both users and admins.

## Features
- **User Authentication & Security**
  - Sign up & login with email/password
  - Two-Factor Authentication (2FA) via Authenticator apps
  - Account activation for new users
  - JWT access tokens with refresh tokens to keep users logged in securely

- **Tour Management**
  - Browse, search, and filter tours
  - Admin dashboard to manage tours, users, and bookings

- **Booking System**
  - Book tours online
  - Restriction: users can only review tours they have booked

- **Reviews & Ratings**
  - Leave reviews only for tours booked
  - Admin moderation of reviews

- **Advanced Validation & Security**
  - Comprehensive payload validation for all endpoints
  - Error handling and proper response structure

- **Frontend**
  - Dynamic views using **Pug**
  - Responsive and interactive UI with **HTML, CSS, and JavaScript**

- **Extras**
  - Image upload & processing for tours
  - RESTful API design

## Tech Stack
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Frontend:** Pug, HTML, CSS, JavaScript
- **Authentication & Security:** JWT, 2FA, refresh tokens, account activation
- **Other:** REST API, validation, error handling, image processing

## Installation
1. Clone the repository:  
   ```bash
   git clone <https://github.com/Moaz-Elsafty/natours.git>

2. Install dependencies:
   ```bash
   npm install

3. Set up environment variables in .env
  Required variables: DB connection, JWT secrets, and email service.

4. Start the server:
   npm run start:dev

## License
This project is licensed under the MIT License.
