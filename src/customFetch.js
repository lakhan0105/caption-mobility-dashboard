import axios from "axios";

const projectId = import.meta.env.VITE_APPWRITE_PROJECTID;
const endPoint = import.meta.env.VITE_API_ENDPOINT;

const customFetch = axios.create({
  baseURL: endPoint,
  withCredentials: true,
  headers: {
    "X-Appwrite-Project": projectId,
    "Content-Type": "application/json",
  },
});

export default customFetch;
