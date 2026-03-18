const fs = require('fs');
const { resolveStoredFilePath } = require('./storedFiles');

const safeRemoveFile = (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    const resolvedPath = resolveStoredFilePath(filePath);
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }
  } catch (error) {
    console.error(`Failed to remove file at ${filePath}:`, error.message);
  }
};

module.exports = {
  safeRemoveFile,
};
