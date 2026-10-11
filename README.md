# TripTribe

### Find a stay. Share the journey.

An Airbnb-style accommodation discovery platform built with Node.js, Express, MongoDB, and Mapbox.

[![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)](https://getbootstrap.com/)
[![Render](https://img.shields.io/badge/Deployed%20on-Render-46E3B7?logo=render&logoColor=111111)](https://render.com/)
[![Deployment status](https://img.shields.io/website?url=https%3A%2F%2Ftriptribe-eh1g.onrender.com&label=live%20deployment)](https://triptribe-eh1g.onrender.com)

## Introduction

TripTribe is a full-stack travel and accommodation listing application. Visitors can explore stays and their locations; registered users can publish and manage listings, and leave or remove reviews. Listings are geocoded and displayed on an interactive Mapbox map.

**Live application:** [triptribe-eh1g.onrender.com](https://triptribe-eh1g.onrender.com)

## Core Features

- **Listing management:** Create, read, update, and delete accommodation listings, with ownership checks on edits and deletion.
- **Authentication:** Sign up, log in, and log out with Passport.js Local Strategy and `passport-local-mongoose`.
- **Reviews and ratings:** Add 1–5 star reviews to listings; review authors can remove their own reviews.
- **Interactive maps:** Mapbox geocoding resolves listing locations to GeoJSON points, which are shown on Mapbox GL JS maps.
- **Image uploads:** Listing images are uploaded to Cloudinary via Multer storage.
- **Session-backed feedback:** MongoDB-backed sessions preserve authentication state; flash messages report action results.
- **Input validation and authorization:** Joi validation and route middleware protect listing and review operations.

## Architecture and Request Lifecycle

```text
 Browser (EJS pages, Bootstrap, client-side Mapbox GL JS)
           |
           | HTTP request / form submission
           v
 Express application (app.js)
   |-- URL-encoded body parsing, method override, static assets
   |-- express-session <----> connect-mongo <----> MongoDB
   |-- Passport initialize / session (deserialize authenticated user)
   |-- flash messages and template locals
   |-- resource routers (/listings, /listings/:id/reviews, /)
           |
           v
 Route middleware (authentication, authorization, Joi validation, uploads)
           |
           v
 Controllers (business logic) ---> Mapbox Geocoding / Cloudinary uploads
           |
           v
 Mongoose models (User, Listing, Review)
           |
           v
 MongoDB Atlas (application documents and persisted sessions)
           |
           v
 EJS response rendered and returned to the browser
```

## Database Schema

| Model       | Main fields                                                                       | Relationships and behavior                                                                                                                                |
| ----------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**    | `email`; username and authentication fields provided by `passport-local-mongoose` | Listing owners and review authors reference a user by ObjectId.                                                                                           |
| **Listing** | `title`, `description`, `image`, `price`, `location`, `country`, `geometry`       | `owner` references a `User`; `reviews` stores references to `Review` documents. `geometry` is a GeoJSON `Point` with `[longitude, latitude]` coordinates. |
| **Review**  | `name`, `comment`, `rating` (1–5), `createdAt`                                    | `author` references a `User`; each listing stores references to its reviews.                                                                              |

Deleting a listing removes its associated review documents through a Mongoose `findOneAndDelete` post middleware hook. Deleting an individual review removes its reference from the listing and then deletes the review document. User documents are not configured for cascade deletion.

## Technology Stack

| Layer                       | Technologies                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Frontend                    | EJS, EJS-Mate, Bootstrap 5.3, HTML, CSS, JavaScript                                                                                 |
| Backend                     | Node.js, Express 4, REST-style resource routes                                                                                      |
| Authentication and security | Passport.js Local Strategy, `passport-local-mongoose`, `express-session`, `connect-mongo`, Joi validation, authorization middleware |
| Database                    | MongoDB / MongoDB Atlas, Mongoose                                                                                                   |
| Maps and media              | Mapbox Geocoding API, Mapbox GL JS, Cloudinary, Multer                                                                              |
| Deployment                  | Render                                                                                                                              |

## Getting Started

### Prerequisites

- Node.js `24.21.0` (the version declared by this project) and npm
- A MongoDB Atlas database and connection string
- A Mapbox access token
- A Cloudinary account for listing image uploads
- Git

### Install and configure

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/Rupayan24/TripTribe.git
   cd TripTribe
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```dotenv
   ATLASDB_URL=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
   SECRET=replace-with-a-long-random-session-secret
   MAPBOX_TOKEN=your-mapbox-access-token
   MAP_TOKEN=your-mapbox-access-token
   CLOUD_NAME=your-cloudinary-cloud-name
   CLOUD_API_KEY=your-cloudinary-api-key
   CLOUD_API_SECRET=your-cloudinary-api-secret
   ```

   **Map token variable:** Both names are shown to make the current code requirement clear. The application reads `MAP_TOKEN` (in `controllers/listings.js` and the listing view); `MAPBOX_TOKEN` is not currently read. Set both to the same value, or update the app to use `MAPBOX_TOKEN`. Keep `.env` private and do not commit secrets.

4. Ensure the Atlas database user and network access rules allow the application to connect. Start the application:

   ```bash
   node app.js
   ```

   Open [http://localhost:8080](http://localhost:8080). The server listens on port `8080`.

### Seed data (optional)

Sample listing data is available in `init/data.js`. The existing seed script can be run with:

```bash
node init/index.js
```

This script is currently hard-coded to connect to a local MongoDB database at `mongodb://127.0.0.1:27017/wanderlust`; it does **not** use `ATLASDB_URL`. It also assigns seeded listings to a fixed owner ObjectId. To seed Atlas or associate listings with a real user, update the script's connection URL and owner ID before running it. The script deletes existing listings in its target database before inserting the sample data.

## Project Structure

```text
TripTribe/
├── app.js                   # Express app, database connection, sessions, and routes
├── cloudConfig.js           # Cloudinary configuration and upload storage
├── middleware.js            # Authentication, authorization, and validation middleware
├── schema.js                # Joi validation schemas
├── controllers/             # Listing, review, and user request handlers
├── models/                  # Mongoose User, Listing, and Review models
├── routes/                  # Listing, review, and user route definitions
├── views/                   # EJS pages, layouts, and shared includes
├── public/                  # Stylesheets and browser-side JavaScript
├── init/                    # Sample data and database seed script
├── utils/                   # Express errors and async route wrapper
├── uploads/                 # Local upload artifacts
├── .env                     # Local secrets (not committed)
└── package.json             # Dependencies and project metadata
```

## Author

Built by [Rupayan Ghosh](https://github.com/Rupayan24).

- **GitHub:** [github.com/Rupayan24](https://github.com/Rupayan24)
- **Live project:** [TripTribe on Render](https://triptribe-eh1g.onrender.com)
