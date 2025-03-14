# Firebase Migration Guide

This document outlines the process of migrating lead data from Google Forms to Firebase Firestore.

## Why Migrate to Firebase?

Firebase Firestore offers several advantages over Google Sheets:

1. **Better Performance**: Faster data retrieval and updates
2. **Real-time Updates**: Changes are immediately reflected across all devices
3. **Advanced Querying**: More powerful filtering and sorting capabilities
4. **Improved Security**: Better access control and data protection
5. **Offline Support**: Users can access data even when offline
6. **Unified Data Source**: All your data in one place, making it easier to manage

## Migration Process

### Step 1: Access the Migration Tool

1. Log in to the application as an admin user
2. Navigate to the "Data Migration" page from the sidebar menu

### Step 2: Check Migration Status

The migration tool will automatically check if migration is needed by comparing the number of leads in Google Forms and Firebase.

### Step 3: Start Migration

1. Click the "Start Migration" button
2. Wait for the migration to complete (this may take a few minutes depending on the amount of data)
3. Once complete, the application will automatically use Firebase for all lead data

### Step 4: Set Up Google Form Sync

After migration, new form submissions will still go to Google Sheets. To keep Firebase in sync:

1. In the "Google Form Sync" section, click "Sync Now" to manually sync new submissions
2. Toggle "Enable automatic sync" to automatically sync new submissions (requires server-side setup)

### Step 5: Verify Migration

After migration, verify that:
- All leads are visible in the application
- Lead details are correct
- Filtering and sorting work as expected

## Google Form Integration

### How It Works

1. **Form Submission**: Users submit data through the Google Form
2. **Google Sheets Storage**: Form responses are stored in Google Sheets
3. **Firebase Sync**: The application syncs new submissions to Firebase

### Sync Options

1. **Manual Sync**: Click "Sync Now" in the Data Migration tool to manually sync new submissions
2. **Automatic Sync**: Enable automatic sync to periodically check for new submissions

### Server-Side Integration (For Developers)

For a more robust solution, consider implementing one of these options:

1. **Google Apps Script**: Create a script in Google Sheets that triggers on form submission and sends data to Firebase
2. **Webhook**: Set up a webhook that triggers when a new form submission is added
3. **Cloud Function**: Create a Firebase Cloud Function that periodically checks for new submissions

## Technical Details

### Data Structure

The migration process maps Google Form fields to the following Firebase Firestore structure:

```javascript
{
  _id: "auto-generated-id",
  fullName: "Customer Name",
  phoneNumber: "Phone Number",
  email: "Email",
  address: "Address",
  city: "City",
  workRequired: "Work Required",
  details: "Details",
  budget: "Budget",
  startDate: "Start Date",
  contactPreference: "Contact Preference",
  builderId: "Firebase UID of the builder",
  builder: "Builder Name",
  stage: "New Lead",
  stageManuallySet: false,
  timestamp: serverTimestamp(),
  activities: [
    {
      type: "stage_change",
      title: "New Lead Created",
      description: "Lead has been submitted for [builder]",
      timestamp: serverTimestamp()
    }
  ],
  googleFormSubmission: true,
  googleSheetId: "ID reference to the Google Sheet row"
}
```

### Fallback Mechanism

The application includes a fallback mechanism to fetch data from Google Sheets if Firebase data is not available. This ensures a smooth transition during the migration process.

## Troubleshooting

### Missing Leads

If leads are missing after migration:
1. Check the migration status in the Data Migration tool
2. Verify that the leads exist in Google Sheets
3. Try refreshing the page or logging out and back in

### Data Discrepancies

If lead data appears incorrect after migration:
1. Compare the data in Google Sheets and Firebase
2. Check for any errors in the migration process logs
3. Contact the system administrator for assistance

### Sync Issues

If new form submissions are not appearing in Firebase:
1. Check if the sync feature is enabled
2. Try manually syncing by clicking "Sync Now"
3. Verify that the Google Form is still submitting to the correct Google Sheet
4. Check for any errors in the sync process logs

## Support

For assistance with the migration process, please contact the system administrator. 