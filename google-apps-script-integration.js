/**
 * Google Apps Script for syncing Google Form submissions to Firebase
 * 
 * To use this script:
 * 1. Open your Google Sheet
 * 2. Click on Extensions > Apps Script
 * 3. Paste this code
 * 4. Replace the API_URL with your actual API endpoint
 * 5. Set up a trigger to run onFormSubmit when a form is submitted
 */

// Your API endpoint for syncing form submissions
const API_URL = 'https://slow-vbulletin-holly-ranks.trycloudflare.com/api/form-submissions';

/**
 * Triggered when a form is submitted
 * @param {Object} e - The form submission event
 */
function onFormSubmit(e) {
  try {
    // Get the form response
    const formResponse = e.namedValues;
    
    // Get the row number of the submission
    const row = e.range.getRow();
    
    // Log the form response for debugging
    Logger.log('Form response: ' + JSON.stringify(formResponse));
    
    // Create a payload with the form data
    const payload = {
      rowId: row,
      timestamp: new Date().toISOString(),
      fullName: formResponse['Full Name'] ? formResponse['Full Name'][0] : '',
      phoneNumber: formResponse['Phone Number'] ? formResponse['Phone Number'][0] : '',
      email: formResponse['Email'] ? formResponse['Email'][0] : '',
      address: formResponse['Address'] ? formResponse['Address'][0] : '',
      city: formResponse['City'] ? formResponse['City'][0] : '',
      workRequired: formResponse['Work Required'] ? formResponse['Work Required'][0] : '',
      details: formResponse['Details'] ? formResponse['Details'][0] : '',
      budget: formResponse['Budget'] ? formResponse['Budget'][0] : '',
      startDate: formResponse['Start Date'] ? formResponse['Start Date'][0] : '',
      contactPreference: formResponse['Contact Preference'] ? formResponse['Contact Preference'][0] : '',
      builder: formResponse['Builder'] ? formResponse['Builder'][0] : 'N/A'
    };
    
    // Log the payload for debugging
    Logger.log('Syncing form submission to Firebase: ' + JSON.stringify(payload));
    
    // Check if API key is set
    const apiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (!apiKey) {
      throw new Error('API key not set. Please set the API key using the Firebase Sync menu.');
    }
    
    // Send the data to your API
    const response = syncToFirebase(payload);
    
    // Log the response
    Logger.log('Firebase sync response: ' + JSON.stringify(response));
    
    // Update the sheet with the sync status
    const sheet = SpreadsheetApp.getActiveSheet();
    sheet.getRange(row, getColumnIndexByName(sheet, 'Firebase Sync Status')).setValue('Synced');
    sheet.getRange(row, getColumnIndexByName(sheet, 'Firebase ID')).setValue(response.leadId);
    
  } catch (error) {
    Logger.log('Error syncing form submission: ' + error.message);
    
    // Update the sheet with the error
    const sheet = SpreadsheetApp.getActiveSheet();
    sheet.getRange(e.range.getRow(), getColumnIndexByName(sheet, 'Firebase Sync Status')).setValue('Error: ' + error.message);
    
    // Add more detailed error information in another column
    const errorDetailsColumn = getColumnIndexByName(sheet, 'Sync Error Details');
    sheet.getRange(e.range.getRow(), errorDetailsColumn).setValue(error.stack || 'No stack trace available');
  }
}

/**
 * Sends the form data to your API for syncing to Firebase
 * @param {Object} payload - The form data
 * @returns {Object} - The API response
 */
function syncToFirebase(payload) {
  // Get the API key from script properties
  const apiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
  
  // Set up the request options
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'headers': {
      'Authorization': 'Bearer ' + apiKey
    },
    'muteHttpExceptions': true
  };
  
  // Send the request
  const response = UrlFetchApp.fetch(API_URL, options);
  
  // Log the response code and content
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();
  Logger.log('Response Code: ' + responseCode);
  Logger.log('Response Text: ' + responseText);
  
  // Check if the response is valid JSON
  try {
    return JSON.parse(responseText);
  } catch (e) {
    Logger.log('Error parsing JSON: ' + e.message);
    Logger.log('First 500 characters of response: ' + responseText.substring(0, 500));
    throw new Error('Invalid JSON response from server: ' + e.message);
  }
}

/**
 * Gets the column index by name
 * @param {Object} sheet - The sheet object
 * @param {string} columnName - The name of the column
 * @returns {number} - The column index
 */
function getColumnIndexByName(sheet, columnName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const columnIndex = headers.indexOf(columnName) + 1;
  
  // If the column doesn't exist, create it
  if (columnIndex === 0) {
    const newColumnIndex = sheet.getLastColumn() + 1;
    sheet.getRange(1, newColumnIndex).setValue(columnName);
    return newColumnIndex;
  }
  
  return columnIndex;
}

/**
 * Sets up the API key for authentication
 * @param {string} apiKey - The API key
 */
function setApiKey(apiKey) {
  PropertiesService.getScriptProperties().setProperty('API_KEY', apiKey);
  Logger.log('API key set successfully');
}

/**
 * Creates a menu in the Google Sheet for easy access to functions
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Firebase Sync')
    .addItem('Set API Key', 'showApiKeyDialog')
    .addItem('Sync All Rows', 'syncAllRows')
    .addItem('Test API Connection', 'testApiConnection')
    .addToUi();
}

/**
 * Shows a dialog for setting the API key
 */
function showApiKeyDialog() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    'Set API Key',
    'Enter your API key for Firebase sync:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (result.getSelectedButton() === ui.Button.OK) {
    setApiKey(result.getResponseText());
    ui.alert('API key set successfully');
  }
}

/**
 * Syncs all rows in the sheet to Firebase
 */
function syncAllRows() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  // Skip the header row
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowNumber = i + 1;
    
    // Check if the row has already been synced
    const syncStatusColumn = getColumnIndexByName(sheet, 'Firebase Sync Status');
    const syncStatus = sheet.getRange(rowNumber, syncStatusColumn).getValue();
    
    if (syncStatus === 'Synced') {
      Logger.log('Row ' + rowNumber + ' already synced, skipping');
      continue;
    }
    
    // Create a payload with the row data
    const headers = values[0];
    const payload = {
      rowId: rowNumber,
      timestamp: new Date().toISOString()
    };
    
    // Map the headers to the payload
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (header) {
        payload[header] = row[j] || '';
      }
    }
    
    try {
      // Sync the row to Firebase
      const response = syncToFirebase(payload);
      
      // Update the sync status
      sheet.getRange(rowNumber, syncStatusColumn).setValue('Synced');
      sheet.getRange(rowNumber, getColumnIndexByName(sheet, 'Firebase ID')).setValue(response.leadId);
      
      Logger.log('Row ' + rowNumber + ' synced successfully');
    } catch (error) {
      Logger.log('Error syncing row ' + rowNumber + ': ' + error.message);
      sheet.getRange(rowNumber, syncStatusColumn).setValue('Error: ' + error.message);
    }
    
    // Add a small delay to avoid rate limiting
    Utilities.sleep(1000);
  }
  
  SpreadsheetApp.getUi().alert('Sync completed');
}

/**
 * Test function to manually test the API connection
 * Run this function from the Apps Script editor to test the connection
 */
function testApiConnection() {
  try {
    // Create a test payload
    const testPayload = {
      rowId: 999,
      timestamp: new Date().toISOString(),
      fullName: "Test User",
      phoneNumber: "1234567890",
      email: "test@example.com",
      builder: "Test Builder"
    };
    
    // Log the test payload
    Logger.log('Testing API connection with payload: ' + JSON.stringify(testPayload));
    
    // Check if API key is set
    const apiKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (!apiKey) {
      throw new Error('API key not set. Please set the API key using the Firebase Sync menu.');
    }
    
    Logger.log('Using API key: ' + apiKey);
    
    // Test the connection
    const response = syncToFirebase(testPayload);
    
    // Log the response
    Logger.log('API test successful! Response: ' + JSON.stringify(response));
    
    // Show a success message
    SpreadsheetApp.getUi().alert('API connection test successful! Check the logs for details.');
    
    return response;
  } catch (error) {
    Logger.log('API test failed: ' + error.message);
    
    // Show an error message
    SpreadsheetApp.getUi().alert('API connection test failed: ' + error.message + '\n\nCheck the logs for details.');
    
    throw error;
  }
}