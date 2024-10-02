// logger.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Logs an error to the database.
 * @param {Object} params - Log parameters.
 * @param {string} params.level - Log level (e.g., 'ERROR').
 * @param {string} params.message - Error message.
 * @param {string} [params.stackTrace] - Stack trace.
 * @param {string} [params.endpoint] - API endpoint.
 * @param {string} [params.method] - HTTP method.
 * @param {number} [params.userId] - User ID.
 */
const logError = async ({ level, message, stackTrace, endpoint, method, userId }) => {
  try {
    await prisma.log.create({
      data: {
        level,
        message,
        stackTrace,
        endpoint,
        method,
        userId,
      },
    });
  } catch (error) {
    console.error('Failed to log error:', error);
  }
};

module.exports = {
  logError,
};
