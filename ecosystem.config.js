module.exports = {
  apps: [
    {
      name: "zerogram",
      cwd: "/var/www/zerogram/current",
      script: "dist/server.js",
      instances: "max",
      exec_mode: "cluster",
      // 서버에 있는 .env를 선로딩 (레포에 비밀 넣지 않기)
      node_args: "-r dotenv/config",
      env: {
        NODE_ENV: "prod",
        PORT: "4000",
        DOTENV_CONFIG_PATH: "/var/www/zerogram/shared/.env",
      },
      listen_timeout: 10000,
      kill_timeout: 5000,
    },
  ],
};
