# Fabrication Quote Web Application

This project is a web application for generating fabrication quotes, including features for material and service pricing, user authentication, and an admin dashboard for managing pricing.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm (usually comes with Node.js)
*   MongoDB Atlas account (or a local MongoDB instance)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd "DXF website"
    ```
    (Replace `<repository_url>` with the actual URL of your repository)

2.  **Install Frontend Dependencies:**
    Navigate to the project root directory (`DXF website`) and install the frontend dependencies:
    ```bash
    npm install
    ```

3.  **Install Backend Dependencies:**
    Navigate into the `backend` directory and install the backend dependencies:
    ```bash
    cd backend
    npm install
    cd .. # Go back to the project root
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the `backend` directory. This file will store your MongoDB connection string and JWT secret.
    ```
    # backend/.env

    # MongoDB Connection String
    # Replace with your actual MongoDB connection URI from MongoDB Atlas
    MONGODB_URI="your_mongodb_atlas_connection_string"

    # Server Port (Optional - defaults to 5001 if not set)
    # PORT=5001

    # JWT Secret Key - Replace with a strong, random string!
    # You can generate one using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    JWT_SECRET="your_jwt_secret_key"
    ```
    *   Replace `"your_mongodb_atlas_connection_string"` with your actual connection string from your MongoDB Atlas cluster. Make sure to whitelist your IP address in MongoDB Atlas Network Access settings.
    *   Replace `"your_jwt_secret_key"` with a strong, random string.

### Running the Application

To run the application, you need to start both the backend and the frontend servers.

1.  **Start the Backend Server:**
    Open a terminal and navigate to the `backend` directory:
    ```bash
    cd backend
    node server.js
    ```
    You should see messages indicating the server is starting and attempting to connect to MongoDB. Look for "MongoDB connected successfully."

2.  **Start the Frontend Development Server:**
    Open a *new* terminal in the project root directory (`DXF website`) and run:
    ```bash
    npm run dev
    ```
    This will start the Vite development server. You should see output indicating the server is ready and the local URL (usually `http://localhost:5173/`).

3.  **Access the Application:**
    Open your web browser and go to the local address provided by the frontend server (e.g., `http://localhost:5173/`).

### Admin Account

An admin account is automatically created if you sign up with the email `apexengraving@gmail.com`. You can use any password you choose during signup. This account will have access to the admin dashboard for managing pricing.

### Project Structure

*   `backend/`: Contains the Node.js/Express backend code, including server logic, models, and API routes.
*   `src/`: Contains the React frontend code, including components, contexts, and utility functions.
*   `public/`: Static assets.
*   `index.html`: The main HTML file for the frontend.
*   `package.json`: Frontend dependencies and scripts.
*   `backend/package.json`: Backend dependencies and scripts.

---