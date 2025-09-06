module.exports = {
  apps: [
    {
      name: 'trueastrotalk-admin',
      script: 'server.js',
      cwd: '/var/www/html/trueastrotalk',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      // Logging
      log_file: '/var/log/pm2/trueastrotalk-admin.log',
      out_file: '/var/log/pm2/trueastrotalk-admin-out.log',
      error_file: '/var/log/pm2/trueastrotalk-admin-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      
      // Restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
      
      // Error handling
      min_uptime: '10s',
      max_restarts: 10,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    },
    {
      name: 'trueastrotalk-socket',
      script: 'socket-server.js',
      cwd: '/var/www/html/trueastrotalk',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 4001
      },
      env_production: {
        NODE_ENV: 'production',
        SOCKET_PORT: 4001
      },
      // Logging
      log_file: '/var/log/pm2/trueastrotalk-socket.log',
      out_file: '/var/log/pm2/trueastrotalk-socket-out.log',
      error_file: '/var/log/pm2/trueastrotalk-socket-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      
      // Restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      restart_delay: 4000,
      
      // Error handling
      min_uptime: '10s',
      max_restarts: 10,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    }
  ]
};