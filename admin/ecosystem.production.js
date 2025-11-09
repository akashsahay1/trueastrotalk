module.exports = {
  apps: [
    {
      name: 'trueastrotalk-admin',
      script: './server.js',
      cwd: '/var/www/html/trueastrotalk/backend',

      // CLUSTER MODE - Multiple instances for zero-downtime deployments
      instances: 2,  // Run 2 instances (can use 'max' for all CPU cores)
      exec_mode: 'cluster',

      env: {
        NODE_ENV: 'production',
        PORT: 4001
      },

      // Graceful reload settings - CRITICAL for zero downtime
      kill_timeout: 5000,        // Wait 5s for app to gracefully shutdown
      listen_timeout: 10000,     // Wait 10s for app to be ready before routing traffic
      wait_ready: true,          // Wait for process.send('ready') signal

      // Restart policies
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      autorestart: true,          // Auto-restart on crash
      watch: false,               // Don't watch files (use pm2 reload for updates)

      // Logging
      error_file: '/var/log/pm2/trueastrotalk-admin-error.log',
      out_file: '/var/log/pm2/trueastrotalk-admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Instance management
      min_uptime: '10s',         // Consider app crashed if uptime < 10s
      max_restarts: 10,          // Max restarts within restart_delay
      restart_delay: 4000        // Wait 4s between restarts
    },
    {
      name: 'trueastrotalk-socket',
      script: './socket-server.js',
      cwd: '/var/www/html/trueastrotalk/backend',

      // Socket.IO - Keep at 1 instance (or implement Redis adapter for clustering)
      instances: 1,
      exec_mode: 'fork',  // Fork mode for single instance

      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 4002
      },

      // Graceful reload settings
      kill_timeout: 5000,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',

      // Logging
      error_file: '/var/log/pm2/trueastrotalk-socket-error.log',
      out_file: '/var/log/pm2/trueastrotalk-socket-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Instance management
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000
    }
  ],

  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:akashsahay1/trueastrotalk.git',
      path: '/var/www/html/trueastrotalk/backend',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.production.js --env production'
    }
  }
};
