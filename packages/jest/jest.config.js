module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
};
