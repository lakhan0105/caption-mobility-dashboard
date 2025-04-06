import { Html5QrcodeScanner } from "html5-qrcode";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
// import { getUserByBattery } from "../features/user/UserSlice";

import { databases } from "../appwrite";
const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
import { Query } from "appwrite";

function ScannerComp({
  scanNewBattery,
  handleScanNewBattery,
  handleOldBatteryDetails,
}) {
  const dispatch = useDispatch();

  // getUserByBatteryId
  const getUserByBatteryId = async (batteryId) => {
    try {
      const resp = await databases.listDocuments(dbId, usersCollId, [
        Query.equal("batteryId", batteryId),
      ]);
      return resp.documents[0];
    } catch (error) {
      console.log("error in getUserByBatteryId", error);
      return error;
    }
  };

  useEffect(() => {
    function onScanSuccess(batteryId) {
      // if scanNewBattery === true, then run different code
      if (scanNewBattery) {
        handleScanNewBattery(batteryId);
        console.log("new", batteryId);
        return;
      }

      // IIF - run hanldeOldBatteryDetails only after the selectedUser is set
      (async () => {
        const user = await getUserByBatteryId(batteryId);
        if (user) {
          handleOldBatteryDetails(batteryId, user);
        }
      })();
    }

    function onScanFailure(error) {
      // handle scan failure, usually better to ignore and keep scanning.
      // for example:
      console.warn(`Code scan error = ${error}`);
    }

    let scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, onScanFailure);

    // Cleanup
    return () => {
      scanner.clear().catch((error) => console.error("Clear error", error));
    };
  }, []);

  return <div id="reader"></div>;
}

export default ScannerComp;
