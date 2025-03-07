import React, { useState } from "react";
import { databases } from "../../appwrite";

const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
const bikesCollId = import.meta.env.VITE_BIKES_COLL_ID;

function UserBatteryDetails({ userBatteryId }) {
  // state to save the user battery details
  const [userBatteryState, setUserBatteryState] = useState();

  // function to fetch the user battery state
  //   async function getBatteryById() {
  //     try {
  //         const response = await databases.getDocument(dbId, )
  //     } catch (error) {

  //     }
  //   }

  return <div>UserBatteryDetails</div>;
}

export default UserBatteryDetails;
