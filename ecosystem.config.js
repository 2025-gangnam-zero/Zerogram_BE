module.exports = {
  apps: [
    {
      name: "zerogram",
      cwd: "/var/www/zerogram/current",
      script: "dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "prod",
        PORT: "4000",
        DOTENV_CONFIG_PATH: "/var/www/zerogram/shared/.env",
        AWS_REGION: "ap-northeast-2",
      },
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
