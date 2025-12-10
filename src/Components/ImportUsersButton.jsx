// src/components/ImportUsersButton.jsx
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
// import { databases, Query } from "../appwrite";

import { updateBike } from "../features/bike/bikeSlice";
import { updateBattery } from "../features/battery/batterySlice";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { FaFileExcel } from "react-icons/fa";
import { ID, Query } from "appwrite";
import { databases } from "../appwrite";

const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
const bikesCollId = import.meta.env.VITE_BIKES_COLL_ID;
const batteriesCollId = import.meta.env.VITE_BATTERIES_COLL_ID;

function ImportUsersButton() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const phone = row.phone?.toString().trim();
          const plan = (row.planType || "CS").toString().trim().toUpperCase();

          if (!phone) {
            errorCount++;
            console.error(`Row ${i + 2}: Missing phone number`);
            continue;
          }

          if (!["CS", "BS"].includes(plan)) {
            toast.error(
              `Row ${i + 2}: Invalid planType "${row.planType}". Use CS or BS`
            );
            errorCount++;
            continue;
          }

          try {
            // 1. Find or Create User
            let userDoc;
            const existingUsers = await databases.listDocuments(
              dbId,
              usersCollId,
              [Query.equal("userPhone", phone)]
            );

            if (existingUsers.documents.length > 0) {
              userDoc = existingUsers.documents[0];
            }

            const userData = {
              userName: row.name?.trim().toLowerCase() || `user_${phone}`,
              userPhone: phone,
              userCompany: row.company?.trim().toLowerCase() || "",
              userLocation: row.location?.trim().toLowerCase() || "",
              userRegisterId: row.registerId?.trim() || "",
              userStatus: true,
              depositAmount: Number(row.deposit) || 0,
              paidAmount: Number(row.paid) || 0,
              pendingAmount: Number(row.pending) || 0,
              chargerStatus: row.charger?.toString().toLowerCase() === "yes",
              totalSwapCount: 0,
              planType: plan,
            };

            if (userDoc) {
              await databases.updateDocument(
                dbId,
                usersCollId,
                userDoc.$id,
                userData
              );
              userDoc = { ...userDoc, ...userData, $id: userDoc.$id };
            } else {
              const newUser = await databases.createDocument(
                dbId,
                usersCollId,
                ID.unique(),
                userData
              );
              userDoc = newUser;
            }

            // 2. Assign Bike
            if (row.bikeRegNum) {
              const bikeRes = await databases.listDocuments(dbId, bikesCollId, [
                Query.equal(
                  "bikeRegNum",
                  row.bikeRegNum.toString().trim().toUpperCase()
                ),
              ]);

              if (bikeRes.documents.length > 0) {
                const bike = bikeRes.documents[0];

                await dispatch(
                  updateBike({
                    bikeId: bike.$id,
                    userId: userDoc.$id,
                    bikeStatus: true,
                  })
                ).unwrap();

                await databases.updateDocument(dbId, usersCollId, userDoc.$id, {
                  bikeId: bike.$id,
                });
              } else {
                console.warn(`Bike not found: ${row.bikeRegNum}`);
              }
            }

            // 3. Assign Battery
            if (row.batteryRegNum) {
              const batRes = await databases.listDocuments(
                dbId,
                batteriesCollId,
                [
                  Query.equal(
                    "batRegNum",
                    row.batteryRegNum.toString().trim().toUpperCase()
                  ),
                ]
              );

              if (batRes.documents.length > 0) {
                const battery = batRes.documents[0];

                await dispatch(
                  updateBattery({
                    batteryId: battery.$id,
                    userId: userDoc.$id,
                    batStatus: true,
                    assignedAt: new Date(),
                  })
                ).unwrap();

                await databases.updateDocument(dbId, usersCollId, userDoc.$id, {
                  batteryId: battery.$id,
                });
              } else {
                console.warn(`Battery not found: ${row.batteryRegNum}`);
              }
            }

            successCount++;
          } catch (err) {
            console.error(`Row ${i + 2} failed:`, row, err);
            errorCount++;
          }
        }

        toast.success(
          `Import completed! Success: ${successCount} users ${
            errorCount > 0 ? `| Failed: ${errorCount}` : ""
          }`
        );
      } catch (err) {
        toast.error("Failed to process file. Check format and try again.");
        console.error(err);
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isProcessing}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="fixed bottom-20 right-5 z-40 flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 text-white shadow-2xl hover:bg-green-700 active:scale-95 transition-all md:hidden"
      >
        <FaFileExcel className="text-xl" />
        <span className="text-sm font-medium">
          {isProcessing ? "Importing..." : "Import Excel"}
        </span>
      </button>
    </>
  );
}

export default ImportUsersButton;
