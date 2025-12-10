// google-drive-service.js - Google Drive Upload Service (OAuth2 Version)
const { google } = require("googleapis");
const fs = require("fs");

/**
 * Creates an authenticated Google Drive client using OAuth2 + Refresh Token
 * Works with PERSONAL Gmail accounts (My Drive)
 */
function createDriveClient() {
  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        "Missing OAuth credentials. Set GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN"
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "http://localhost" // required but unused in server mode
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    return google.drive({ version: "v3", auth: oauth2Client });
  } catch (error) {
    console.error("❌ Error creating OAuth Drive client:", error);
    throw error;
  }
}

/**
 * Uploads a file to Google Drive
 */
async function uploadToGoogleDrive(filePath, fileName, folderId = null) {
  try {
    console.log("📤 Uploading file to Google Drive...");
    console.log("   File:", fileName);
    console.log("   Path:", filePath);

    const drive = createDriveClient();

    const metadata = { name: fileName };
    if (folderId) {
      metadata.parents = [folderId];
      console.log("   Upload Folder ID:", folderId);
    }

    const media = {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: metadata,
      media,
      fields: "id, name, webViewLink, webContentLink",
    });

    console.log("✅ File uploaded successfully!");
    console.log("   File ID:", response.data.id);

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
      webContentLink: response.data.webContentLink,
    };
  } catch (error) {
    console.error("❌ Error uploading to Google Drive:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Updates an existing file in Google Drive
 */
async function updateFileInGoogleDrive(fileId, filePath) {
  try {
    console.log("🔄 Updating file in Google Drive...");
    console.log("   File ID:", fileId);

    const drive = createDriveClient();

    const media = {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.update({
      fileId,
      media,
      fields: "id, name, modifiedTime, webViewLink",
    });

    console.log("✅ File updated successfully!");
    console.log("   Modified:", response.data.modifiedTime);

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
      modifiedTime: response.data.modifiedTime,
    };
  } catch (error) {
    console.error("❌ Error updating Google Drive file:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Makes a file publicly accessible
 */
async function makeFilePublic(fileId) {
  try {
    console.log("🌐 Making file publicly accessible...");

    const drive = createDriveClient();

    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    console.log("✅ File is now public!");

    return { success: true };
  } catch (error) {
    console.error("❌ Error making file public:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Search a file by name
 */
async function findFileByName(fileName, folderId = null) {
  try {
    const drive = createDriveClient();

    let query = `name='${fileName}' and trashed=false`;
    if (folderId) query += ` and '${folderId}' in parents`;

    const response = await drive.files.list({
      q: query,
      fields: "files(id, name, webViewLink)",
      pageSize: 1,
    });

    if (response.data.files.length > 0) {
      return { success: true, file: response.data.files[0] };
    }

    return { success: false, message: "File not found" };
  } catch (error) {
    console.error("❌ Error searching file:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  uploadToGoogleDrive,
  updateFileInGoogleDrive,
  makeFilePublic,
  findFileByName,
};
