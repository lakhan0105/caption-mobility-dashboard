import React, { useEffect, useState } from "react";
import { SmallTableRow, TableHeader, TableRow } from "../Components";
import { FaUserCircle } from "react-icons/fa";

function UsersTable({ data }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // check the innerWidth of the screen to change the ui of the table
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userTableHeadings = isMobile
    ? ["#", "user", "status", "company"]
    : ["#", "user", "status", "phone", "company"];

  const userCols = isMobile
    ? "0.1fr 0.6fr 0.5fr 0.4fr"
    : "0.1fr 1fr 0.5fr 1fr 0.5fr";

  return (
    <div className="rounded-lg shadow shadow-gray-200/10 w-full borde">
      {/* TABLE HEADER */}
      <TableHeader data={userTableHeadings} cols={userCols} />

      {/* TABLE DATA */}
      <div>
        {data.map((item, index) => {
          const { $id, userName, userCompany, userPhone, userStatus } = item;

          return (
            <TableRow key={$id} cols={userCols}>
              {/* SL NUMBER */}
              <p className="text-[0.7rem] w-[20px] h-[20px] font-medium border bg-indigo-950 text-white flex items-center justify-center rounded-2xl mt-0.5">
                {index + 1}
              </p>

              {/* USER NAME/BASIC DETAILS */}
              {isMobile ? (
                <div className="md:hidden flex items-cente gap-2">
                  <div>
                    <h2 className="font-medium text-md capitalize">
                      {userName}
                    </h2>
                    <p className="text-xs font-light">{userPhone}</p>
                  </div>
                </div>
              ) : (
                <div className="flex font-semibold items-center gap-4">
                  {userName}
                </div>
              )}

              <div className="flex gap-4 justify-center text-xs">
                {userStatus ? (
                  <p className="bg-blue-200 px-4 py-1.5 rounded-2xl">Active</p>
                ) : (
                  <p className="bg-red-400/80 px-3 py-1.5 rounded-2xl">
                    Inactive
                  </p>
                )}
              </div>

              <p>{userCompany}</p>
              {!isMobile && <p>{userPhone}</p>}
            </TableRow>
          );
        })}
      </div>
    </div>
  );
}

export default UsersTable;
