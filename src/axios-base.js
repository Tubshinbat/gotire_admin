import axios from "axios";

const instance = axios.create({
  // baseURL: "http://localhost:2001/api/v1/",
  baseURL: "https://admin.gotire.mn/api/",
});

instance.defaults.withCredentials = true;

export default instance;
