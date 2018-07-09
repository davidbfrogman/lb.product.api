module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [

    // Spawn 2 instances of the Leblum rest api
    {
      name: 'prdct.api',
      script: './dist/server.js',
      instances: 1,
      max_memory_restart: '500M',
      max_restarts: 3,
      restart_delay: 3000,
      exec_mode : "cluster",
      log_type: "raw",
      merge_logs: true,
      log_date_format : "YYYY-MM-DD HH:mm Z"
    }
  ],
};
