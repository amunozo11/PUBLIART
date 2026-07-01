module.exports = {
  apps: [
    {
      name: "publiart-backend",
      cwd: "./backend",
      script: "npm.cmd",
      args: "run dev",
      watch: false,
    },
    {
      name: "publiart-frontend",
      cwd: "./frontend",
      script: "npm.cmd",
      args: "run dev",
      watch: false,
    }
  ]
};
