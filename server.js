console.log('🔍 Environment Debug:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   PORT: ${process.env.PORT}`);
console.log(`   MONGODB_URI exists: ${!!process.env.MONGODB_URI}`);
console.log(`   MONGODB_URI starts with mongodb+srv: ${process.env.MONGODB_URI?.startsWith('mongodb+srv://') || false}`);
console.log(`   JWT_SECRET exists: ${!!process.env.JWT_SECRET}`);

const app = require('./src/app');
const config = require('./src/config/config');
const database = require('./src/utils/database');

const PORT = process.env.PORT || config.port || 3000;

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Connect to database and start server
async function startServer() {
  try {
    console.log('🚀 Starting Chapter Performance Dashboard API...');
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🔌 Attempting database connection...`);
    
    // Connect to MongoDB
    await database.connect();
    console.log('✅ Database connected successfully');
    
    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API docs: http://localhost:${PORT}/api/v1`);
    });

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log('✅ HTTP server closed');
        await database.disconnect();
        console.log('✅ Database disconnected');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      reason: error.reason
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start the server
startServer();