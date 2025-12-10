// google-drive-service.js - Google Drive Upload Service
const { google } = require("googleapis");
const fs = require("fs");

/**
 * Create Google Drive client using Service Account credentials from env variable.
 */
function createDriveClient() {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      throw new Error(
        "❌ Missing GOOGLE_SERVICE_ACCOUNT_JSON env variable. Add it in Railway."
      );
    }

    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    return google.drive({ version: "v3", auth });

  } catch (error) {
    console.error("❌ Failed to create Google Drive client:", error);
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

    const fileMetadata = { name: fileName };
    if (folderId) fileMetadata.parents = [folderId];

    const media = {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, webViewLink, webContentLink",
    });

    console.log("✅ File uploaded:", response.data.name);
    console.log("   File ID:", response.data.id);
    console.log("   View:", response.data.webViewLink);

    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error("❌ Error uploading to Google Drive:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates an existing file
 */
async function updateFileInGoogleDrive(fileId, filePath) {
  try {
    console.log("🔄 Updating Google Drive file:", fileId);

    const drive = createDriveClient();
    const media = {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.update({
      fileId,
      media,
      fields: "id, name, modifiedTime, webViewLink",
    });

    console.log("✅ Updated:", response.data.modifiedTime);

    return {
      success: true,
      ...response.data,
    };
  } catch (error) {
    console.error("❌ Error updating file:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Make a file publicly viewable
 */
async function makeFilePublic(fileId) {
  try {
    console.log("🌐 Making file public:", fileId);

    const drive = createDriveClient();

    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    console.log("✅ File is now public");

    return { success: true, message: "File is now publicly accessible" };
  } catch (error) {
    console.error("❌ Error making public:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Find a file by name
 */
async function findFileByName(fileName, folderId = null) {
  try {
    const drive = createDriveClient();

    let query = `name='${fileName}' and trashed=false`;
    if (folderId) query += ` and '${folderId}' in parents`;

    const res = await drive.files.list({
      q: query,
      fields: "files(id, name, webViewLink)",
      pageSize: 1,
    });

    if (res.data.files?.length) {
      return { success: true, file: res.data.files[0] };
    }

    return { success: false, message: "File not found" };
  } catch (error) {
    console.error("❌ Error finding file:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  uploadToGoogleDrive,
  updateFileInGoogleDrive,
  makeFilePublic,
  findFileByName,
};
