// @ts-check
const nextPWA = require("next-pwa");

module.exports = nextPWA({
  dest: "public",
  disable: process.env.NODE_ENV !== "production",
  runtimeCaching: [
    {
      urlPattern: "/api/users/me",
      method: "GET",
      handler: "NetworkOnly",
    },
  ],
})({
  reactStrictMode: true,
});
