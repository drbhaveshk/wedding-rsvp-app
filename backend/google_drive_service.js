// google-drive-service.js - Google Drive Upload Service
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Creates an authenticated Google Drive client using Service Account
 */
function createDriveClient() {
  try {
    let credentials;
    
    // Option 1: Load from file path (RECOMMENDED)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH) {
      const keyPath = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH);
      credentials = require(keyPath);
      console.log('✅ Loaded credentials from file:', keyPath);
    } 
    // Option 2: Load from environment variable (NOT RECOMMENDED - security risk)
    else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.warn('⚠️  WARNING: Loading credentials from environment variable. Use GOOGLE_SERVICE_ACCOUNT_KEY_PATH instead for better security!');
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } 
    else {
      throw new Error('Missing Google credentials. Set either GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_SERVICE_ACCOUNT_KEY');
    }
    
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    return google.drive({ version: 'v3', auth });
  } catch (error) {
    console.error('❌ Error creating Drive client:', error);
    throw error;
  }
}

/**
 * Uploads a file to Google Drive
 * @param {string} filePath - Path to the file to upload
 * @param {string} fileName - Name to give the file in Drive
 * @param {string} folderId - Optional folder ID where to upload the file
 * @returns {Promise<Object>} - File metadata including file ID and webViewLink
 */
async function uploadToGoogleDrive(filePath, fileName, folderId = null) {
  try {
    console.log('📤 Uploading file to Google Drive...');
    console.log('   File:', fileName);
    console.log('   Path:', filePath);
    
    const drive = createDriveClient();

    // File metadata
    const fileMetadata = {
      name: fileName,
    };

    // Add parent folder if specified
    if (folderId) {
      fileMetadata.parents = [folderId];
      console.log('   Folder ID:', folderId);
    }

    // File content
    const media = {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: fs.createReadStream(filePath),
    };

    // Upload file
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, webContentLink',
    });

    console.log('✅ File uploaded successfully!');
    console.log('   File ID:', response.data.id);
    console.log('   View Link:', response.data.webViewLink);

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
    };

  } catch (error) {
    console.error('❌ Error uploading to Google Drive:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Updates an existing file in Google Drive
 * @param {string} fileId - ID of the file to update
 * @param {string} filePath - Path to the new file content
 * @returns {Promise<Object>} - Updated file metadata
 */
async function updateFileInGoogleDrive(fileId, filePath) {
  try {
    console.log('🔄 Updating file in Google Drive...');
    console.log('   File ID:', fileId);
    
    const drive = createDriveClient();

    const media = {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.update({
      fileId: fileId,
      media: media,
      fields: 'id, name, webViewLink, modifiedTime',
    });

    console.log('✅ File updated successfully!');
    console.log('   Modified:', response.data.modifiedTime);

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
      modifiedTime: response.data.modifiedTime,
    };

  } catch (error) {
    console.error('❌ Error updating file in Google Drive:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Makes a file publicly accessible (anyone with link can view)
 * @param {string} fileId - ID of the file to make public
 * @returns {Promise<Object>} - Result of the operation
 */
async function makeFilePublic(fileId) {
  try {
    console.log('🌐 Making file publicly accessible...');
    
    const drive = createDriveClient();

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log('✅ File is now publicly accessible');

    return {
      success: true,
      message: 'File is now publicly accessible',
    };

  } catch (error) {
    console.error('❌ Error making file public:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Searches for a file by name in a specific folder
 * @param {string} fileName - Name of the file to search for
 * @param {string} folderId - Optional folder ID to search in
 * @returns {Promise<Object>} - File metadata if found
 */
async function findFileByName(fileName, folderId = null) {
  try {
    const drive = createDriveClient();

    let query = `name='${fileName}' and trashed=false`;
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, webViewLink)',
      pageSize: 1,
    });

    if (response.data.files && response.data.files.length > 0) {
      return {
        success: true,
        file: response.data.files[0],
      };
    }

    return {
      success: false,
      message: 'File not found',
    };

  } catch (error) {
    console.error('❌ Error searching for file:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  uploadToGoogleDrive,
  updateFileInGoogleDrive,
  makeFilePublic,
  findFileByName,
};
