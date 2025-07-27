# Sahayak: The AI Teaching Companion

Welcome to Sahayak, an AI-powered teaching assistant designed to support educators in multi-grade, low-resource environments. This application leverages generative AI to provide a suite of tools that help teachers create hyper-local content, generate differentiated worksheets, create adaptive assessments, and much more.

## Features

- **Content Generator**: Create culturally relevant stories and teaching aids.
- **Homework Generator**: Generate differentiated worksheets from various sources like topics, uploaded content, or the content library.
- **Assessment Generator**: Design adaptive assessments with various question types.
- **AI Teaching/Studying Assistants**: Interactive chat interfaces for both teachers and students to ask questions and get instant help.
- **Lesson Planner**: Craft weekly lesson plans based on syllabus and grade.
- **Progress Tracker**: Monitor and visualize student performance.
- **Revision Module**: Personalized practice sessions for students based on their past performance.

## Tech Stack

- **Framework**: Next.js (with App Router)
- **Language**: TypeScript
- **AI Toolkit**: Genkit
- **UI**: React, ShadCN UI, Tailwind CSS
- **Backend & Database**: Firebase (Authentication, Firestore)

---

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Clone the Repository

First, clone the project to your local machine:

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

Install the necessary packages using npm:

```bash
npm install
```

### 3. Configure Environment Variables

This project requires a connection to Firebase and a Google AI API key for Genkit.

1.  Create a new file named `.env` in the root of the project.
2.  Copy the contents of `.env.example` (if it exists) or add the following variables to your new `.env` file:

    ```env
    # Firebase Project Configuration (from your Firebase project settings)
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-firebase-storage-bucket.appspot.com"
    NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-web-api-key"
    
    # Firebase Admin SDK Service Account (generate a new private key in Firebase)
    FIREBASE_CLIENT_EMAIL="firebase-adminsdk-...@your-project.iam.gserviceaccount.com"
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

    # Google AI API Key (for Genkit)
    # Get this from Google AI Studio: https://aistudio.google.com/app/apikey
    GEMINI_API_KEY="your-gemini-api-key"
    ```

    **Note:** Ensure your `FIREBASE_PRIVATE_KEY` is wrapped in quotes and includes the `\n` characters for newlines.

### 4. Run the Application

You need to run two separate processes in two different terminal windows for the application to work correctly.

**Terminal 1: Run the Next.js Frontend**

```bash
npm run dev
```

This will start the main application, typically on `http://localhost:9002`.

**Terminal 2: Run the Genkit AI Flows**

```bash
npm run genkit:dev
```

This starts the Genkit development server, which allows your AI flows to be tested and run locally.

### 5. Access the Application

Once both servers are running, you can access the application in your browser at `http://localhost:9002`.

#### Login Credentials

Use the following credentials to log in as an administrator:

-   **Username**: `prajwalk17072001@gmail.com`
-   **Password**: `admin@123`

As an administrator, you can add new teacher and student users from the "Add User" page in the dashboard.
