# Firebase Setup Guide for CRM App

This guide will walk you through the process of setting up Firebase for your CRM application.

## Prerequisites

- A Google account
- Node.js and npm installed on your machine
- Your CRM application codebase

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project"
3. Enter a project name (e.g., "my-crm-app")
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create project"
6. Wait for the project to be created, then click "Continue"

## Step 2: Register Your Web App with Firebase

1. On the Firebase project dashboard, click on the web icon (</>) to add a web app
2. Enter a nickname for your app (e.g., "my-crm-web")
3. Check the box for "Also set up Firebase Hosting" if you plan to deploy your app with Firebase
4. Click "Register app"
5. You'll see a configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

6. Copy these values to your `.env` file in the frontend directory:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

7. Click "Continue to console"

## Step 3: Set Up Firebase Authentication

1. In the Firebase console, go to "Authentication" from the left sidebar
2. Click on "Get started"
3. Enable the "Email/Password" sign-in method by clicking on it and toggling the "Enable" switch
4. Click "Save"

### Create Admin User

1. Go to the "Users" tab in Authentication
2. Click "Add user"
3. Enter an email and password for your admin user
4. Click "Add user"

## Step 4: Set Up Firestore Database

1. In the Firebase console, go to "Firestore Database" from the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" (recommended for real applications)
4. Select a location for your database (choose the region closest to your users)
5. Click "Enable"

### Set Up Firestore Security Rules

1. Go to the "Rules" tab in Firestore Database
2. Replace the default rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read and write their own lead data
    match /leadData/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read and write their own leads
    match /leads/{leadId} {
      allow read, write: if request.auth != null && 
                          (resource == null || 
                           resource.data.builderId == request.auth.uid || 
                           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin");
    }
    
    // Admin users can read and write all data
    match /{document=**} {
      allow read, write: if request.auth != null && 
                          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
  }
}
```

3. Click "Publish"

## Step 5: Set Up User Roles in Firestore

1. Go to the "Data" tab in Firestore Database
2. Click "Start collection"
3. Enter "users" as the Collection ID
4. Click "Next"
5. For the Document ID, enter the UID of the admin user you created earlier (you can find this in the Authentication > Users section)
6. Add the following fields:
   - Field: "email", Type: string, Value: [admin's email]
   - Field: "displayName", Type: string, Value: "Admin"
   - Field: "role", Type: string, Value: "admin"
   - Field: "createdAt", Type: timestamp, Value: [current date/time]
7. Click "Save"

## Step 6: Install Firebase in Your Project

1. Navigate to your project directory in the terminal
2. Run the following command to install Firebase:

```bash
cd frontend
npm install firebase
```

## Step 7: Migrate Existing Data to Firebase (Optional)

If you have existing data in localStorage that you want to migrate to Firebase, you can create a migration script or use the Firebase console to import data.

### Option 1: Manual Migration via Console

1. Export your localStorage data to a JSON file
2. Format the JSON according to Firestore's structure
3. Import the JSON file into Firestore using the Firebase console

### Option 2: Migration Script

Create a migration script in your app that reads from localStorage and writes to Firebase. You can run this script once when users first upgrade to the Firebase version.

```javascript
// Example migration script
import { db, auth } from './firebase/config';
import { doc, setDoc } from 'firebase/firestore';

export const migrateLocalStorageToFirebase = async () => {
  if (!auth.currentUser) {
    console.error('User must be logged in to migrate data');
    return;
  }
  
  // Get data from localStorage
  const myLeadData = JSON.parse(localStorage.getItem('myLeadData') || '{}');
  
  // Write to Firebase
  try {
    await setDoc(doc(db, 'leadData', auth.currentUser.uid), {
      myLeadData
    });
    console.log('Data migration successful');
  } catch (error) {
    console.error('Error migrating data:', error);
  }
};
```

## Step 8: Test Your Firebase Integration

1. Start your application:

```bash
cd frontend
npm start
```

2. Test the authentication flow by logging in
3. Test creating, reading, updating, and deleting leads
4. Verify that data is being stored in Firestore by checking the Firebase console

## Troubleshooting

### Authentication Issues

- Check that you've enabled the Email/Password sign-in method
- Verify that your Firebase configuration in `.env` is correct
- Check the browser console for any Firebase-related errors

### Firestore Issues

- Verify that your security rules are correctly set up
- Check that you're using the correct collection and document IDs
- Ensure that the user is authenticated before trying to access Firestore

### General Issues

- Clear your browser's localStorage and cache
- Restart your development server
- Check the Firebase console for any error logs

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

## Next Steps

- Set up Firebase Storage for file uploads
- Implement Firebase Cloud Functions for server-side logic
- Configure Firebase Hosting for deployment
- Set up Firebase Analytics to track user behavior 