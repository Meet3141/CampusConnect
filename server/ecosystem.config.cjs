// ecosystem.config.cjs — PM2 configuration
// Usage:
//   pm2 start ecosystem.config.cjs           (production)
//   pm2 start ecosystem.config.cjs --env dev (development)

module.exports = {
  apps: [
    {
      name: "campusconnect-server",
      script: "index.js",

      // Cluster mode: one worker per CPU core for max throughput
      instances: "max",
      exec_mode: "cluster",

      // Auto-restart on crash, memory leak protection
      autorestart: true,
      max_memory_restart: "512M",

      // Graceful shutdown timeout (ms) — let in-flight requests finish
      kill_timeout: 5000,

      // Environment variables per deploy target
      env: {
        NODE_ENV: "development",
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // Log configuration
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",

      // Watch (disabled in prod — use CI/CD to redeploy)
      watch: false,
    },
  ],
};
