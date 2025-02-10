const { default: axios } = require("axios");

export const BASE_URL = "https://proconnectlinkedinclone-1.onrender.com";

export const clientServer = axios.create({
  baseURL: BASE_URL,
});
