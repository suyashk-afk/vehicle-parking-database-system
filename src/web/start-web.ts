/**
 * Web server startup script
 */

import { WebServer } from './server';

async function startWebServer() {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001; // Changed to 3001
  const server = new WebServer(port);

  try {
    await server.initialize();
    server.start();
    
    console.log('\n🌐 Parking Management System Started');
    console.log('=====================================');
    console.log(`🌐 Open your browser to: http://localhost:${port}`);
    console.log('📊 Features live dashboard and real-time updates');
    
  } catch (error) {
    console.error('❌ Failed to start web server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down web server...');
  process.exit(0);
});

startWebServer();