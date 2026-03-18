const fs = require('fs');
const path = require('path');

const resolveStoredFilePath = (filePath) => {
  if (!filePath) {
    return '';
  }

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(__dirname, '..', filePath);
};

const storedFileExists = (filePath) => {
  const resolvedPath = resolveStoredFilePath(filePath);
  return Boolean(resolvedPath) && fs.existsSync(resolvedPath);
};

const getStoredFileName = (filePath, fallback = 'document.pdf') => {
  const resolvedPath = resolveStoredFilePath(filePath);
  return resolvedPath ? path.basename(resolvedPath) : fallback;
};

module.exports = {
  resolveStoredFilePath,
  storedFileExists,
  getStoredFileName,
};
