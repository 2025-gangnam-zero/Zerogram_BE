module.exports = {
  apps: [
    {
      name: "zerogram",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "prod",
        PORT: "4000",
      },
    },
  ],
};
