import { Html5Qrcode, Html5QrcodeScanner } from "html5-qrcode";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  const [isScanning, setIsScanning] = useState(false);

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
    let html5QrCode = null;
    let isMounted = true;

    // success
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

    // failure
    function onScanFailure(error) {
      // handle scan failure, usually better to ignore and keep scanning.
      // for example:
      console.warn(`Code scan error = ${error}`);
    }

    const startScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return; // exit this block if isMounted is false

        if (devices && devices.length) {
          var cameraId = devices[0].id;
          html5QrCode = new Html5Qrcode("reader");

          // start the camera
          html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (batteryId) => {
              onScanSuccess(batteryId);
            },
            (errorMessage) => {
              onScanFailure(errorMessage);
            }
          );
        }

        // set the isScanning state as true
        if (isMounted) {
          setIsScanning(true);
        }
      } catch (error) {
        console.log("scanner error", error);
      }
    };

    startScanner();

    // cleanup function
    return () => {
      isMounted = false;
      setIsScanning(false);

      if (html5QrCode) {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch((err) => console.log("cleanup error", err));
      }
    };
  }, [scanNewBattery]);

  return <div id="reader"></div>;
}

export default ScannerComp;
