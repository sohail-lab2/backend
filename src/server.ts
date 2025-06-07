import app from './app';
import { config } from './config/variables.config';
import { connectDB } from './config/database.config';
import { NetworkInterfaceInfo, networkInterfaces } from 'os';

async function startServer() {
  try {
    await connectDB();

    const host = config.nodeEnv === 'development' ? '0.0.0.0' : 'localhost';
    app.listen(config.port, host, () => {
      console.log(`Server running on http://localhost:${config.port}`);
      if (host === '0.0.0.0') {
        const ifaces = networkInterfaces();
        Object.keys(ifaces).forEach((ifname) => {
          ifaces[ifname]?.forEach((iface: NetworkInterfaceInfo) => {
            if (iface.family === 'IPv4' && !iface.internal) {
              console.log(`Also accessible on the network: ${iface.address}`);
            }
          });
        });
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();