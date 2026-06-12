export const API_CONFIG = {
  // Google API Key
  API_KEY: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,

  // Google Sheets API
  SHEET: {
    BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
    // Dynamic URL builders
    getValuesUrl: (sheetId, range, key) => 
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${key}`,
    getAppendUrl: (sheetId, tab, key) => 
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS&key=${key}`,
    getClearUrl: (sheetId, tab, key) => 
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab + '!A2:Z99999')}:clear?key=${key}`,
    getMetaUrl: (sheetId, key) => 
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${key}`,
    getBatchUpdateUrl: (sheetId, key) => 
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate?key=${key}`,
  },

  // Google Drive API
  DRIVE: {
    FILES_BASE: 'https://www.googleapis.com/drive/v3/files',
    getFilesUrl: (query, fields = '', pageSize = null) => {
      let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`;
      if (fields) url += `&fields=${fields}`;
      if (pageSize) url += `&pageSize=${pageSize}`;
      return url;
    },
    getDownloadUrl: (fileId) => 
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    getUploadUrl: (fileId = null) => 
      fileId 
        ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`
        : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
  },

  // Google OAuth 2.0
  OAUTH: {
    CLIENT_ID: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
    SCOPES: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile',
    USER_INFO: 'https://www.googleapis.com/oauth2/v3/userinfo',
    GSI_SCRIPT: 'https://accounts.google.com/gsi/client',
  }
}
