# YouTube Backend

[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/ronak009code/Youtube-Backned)

This repository contains the backend service for a YouTube-like application. It's built with Node.js, Express, and MongoDB, providing a robust set of APIs for user management, video handling, social interactions, and more.

## Features

-   **User Authentication:** Secure user registration and login using JWT (Access & Refresh Tokens) and bcrypt for password hashing.
-   **Profile Management:** Users can update their profile details, avatar, and cover image.
-   **Video Operations:** Full CRUD (Create, Read, Update, Delete) operations for videos, including uploading to Cloudinary, updating details, and deleting.
-   **Social Interactions:**
    -   **Likes:** Toggle likes on videos, comments, and tweets.
    -   **Comments:** Add, update, and delete comments on videos.
    -   **Subscriptions:** Subscribe and unsubscribe to channels.
    -   **Tweets:** Create, update, and delete short text posts (tweets).
-   **Playlist Management:** Create, update, and delete playlists. Add or remove videos from playlists.
-   **Dashboard:** View channel statistics, including total video views, likes, subscribers, and a list of all uploaded videos.
-   **Advanced Features:**
    -   Watch history tracking for users.
    -   Complex data retrieval using MongoDB aggregation pipelines (e.g., channel stats, user profiles).
    -   Pagination for lists of comments and videos.
-   **Health Check:** A simple endpoint to monitor the application's health status.

## Tech Stack

-   **Backend:** Node.js, Express.js
-   **Database:** MongoDB with Mongoose ODM
-   **File Storage:** Cloudinary for video, thumbnail, and image uploads
-   **Authentication:** JSON Web Tokens (jsonwebtoken), Bcrypt
-   **File Handling:** Multer
-   **Environment Variables:** Dotenv
-   **Utilities:** CORS, Cookie-Parser, mongoose-aggregate-paginate-v2

## Project Structure

The codebase is organized into a modular structure for better maintainability and scalability.

```
/src
├── DB/           # Database connection logic
├── Models/       # Mongoose data models/schemas
├── controllers/  # Business logic for handling API requests
├── middlewares/  # Express middlewares (authentication, file uploads)
├── Routes/       # API route definitions
├── utills/       # Utility classes and functions (error handling, API responses)
├── app.js        # Express app configuration and middleware setup
├── constants.js  # Project-wide constants
└── index.js      # Main entry point of the application
```

## Environment Variables

Create a `.env` file in the root directory and add the following variables.

```env
# MongoDB Connection URL
MONGODB_URI=your_mongodb_connection_string

# Server Port
PORT=5000

# CORS Origin
CORS_ORIGIN=*

# JWT Secrets and Expiration
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Getting Started

### Prerequisites

-   Node.js (v18.x or higher)
-   npm
-   MongoDB Instance
-   Cloudinary Account

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/ronak009code/youtube-backned.git
    cd youtube-backned
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the project's root directory and populate it with your configuration (see the Environment Variables section above).

4.  **Run the application:**
    ```bash
    npm run dev
    ```
    The server will start on the port specified in your `.env` file (e.g., `http://localhost:5000`).

## API Endpoints

All routes are prefixed with `/api/v1`. Most protected routes require a valid JWT `accessToken` sent in a cookie or as a `Bearer` token in the `Authorization` header.

### Users (`/users`)

-   `POST /register`: Register a new user.
-   `POST /login`: Log in a user and receive access/refresh tokens.
-   `POST /logout`: Log out the current user (requires auth).
-   `POST /refresh-token`: Get a new access token using a refresh token.
-   `POST /change-password`: Change the current user's password (requires auth).
-   `GET /current-user`: Get details of the currently logged-in user (requires auth).
-   `PATCH /update-account-details`: Update user's full name and email (requires auth).
-   `PATCH /update-avatar`: Update user's avatar (requires auth).
-   `PATCH /update-coverimage`: Update user's cover image (requires auth).
-   `GET /c/:username`: Get a user's channel profile.
-   `GET /watch-history`: Get the watch history of the logged-in user (requires auth).

### Videos (`/video`)

-   `POST /`: Publish a new video (requires auth).
-   `GET /`: Get all videos with pagination, sorting, and search.
-   `GET /v/:videoId`: Get details of a specific video.
-   `PATCH /v/:videoId`: Update video details (title, description, thumbnail) (requires auth).
-   `DELETE /v/:videoId`: Delete a video (requires auth).
-   `PATCH /toggle/publish/:videoId`: Toggle the publish status of a video (requires auth).

### Comments (`/comment`)

-   `POST /:videoId`: Add a comment to a video (requires auth).
-   `GET /:videoId`: Get all comments for a video.
-   `PATCH /c/:commentId`: Update a comment (requires auth).
-   `DELETE /c/:commentId`: Delete a comment (requires auth).

### Likes (`/likes`)

-   `POST /toggle/v/:videoId`: Toggle like on a video (requires auth).
-   `POST /toggle/c/:commentId`: Toggle like on a comment (requires auth).
-   `POST /toggle/t/:tweetId`: Toggle like on a tweet (requires auth).
-   `GET /videos`: Get all videos liked by the current user (requires auth).

### Subscriptions (`/subscriptions`)

-   `POST /c/:channelId`: Toggle subscription to a channel (requires auth).
-   `GET /c/:channelId`: Get all subscribers of a channel.
-   `GET /u/:subscriberId`: Get all channels a user is subscribed to.

### Tweets (`/tweet`)

-   `POST /`: Create a new tweet (requires auth).
-   `GET /user/:userId`: Get all tweets from a specific user.
-   `PATCH /:tweetId`: Update a tweet (requires auth).
-   `DELETE /:tweetId`: Delete a tweet (requires auth).

### Playlists (`/playlist`)

-   `POST /`: Create a new playlist (requires auth).
-   `GET /user/:userId`: Get all playlists of a specific user.
-   `GET /:playlistId`: Get a specific playlist by ID.
-   `PATCH /:playlistId`: Update a playlist's details (requires auth).
-   `DELETE /:playlistId`: Delete a playlist (requires auth).
-   `PATCH /add/:videoId/:playlistId`: Add a video to a playlist (requires auth).
-   `PATCH /remove/:videoId/:playlistId`: Remove a video from a playlist (requires auth).

### Dashboard (`/dashboard`)

-   `GET /stats`: Get channel statistics (requires auth).
-   `GET /videos`: Get all videos uploaded by the channel (requires auth).

### Health Check (`/healthcheck`)

-   `GET /`: Check the health of the API.