import { Client, Account, Databases } from "appwrite";

// import
const appwriteEndpoint = import.meta.env.VITE_API_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECTID;

const client = new Client()
  .setEndpoint(appwriteEndpoint) // Your API Endpoint
  .setProject(projectId); // Your project ID

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases };
