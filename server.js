import dns from 'node:dns/promises';
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import app from './src/app.js';
import connectDB from './src/config/database.js';

connectDB();
    
        app.listen(3000, () => {
            console.log('Server running on port 3000');
        });
   


