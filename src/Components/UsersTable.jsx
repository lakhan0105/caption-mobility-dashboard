import React from "react";
import { GenericTable, TableHeader, TableRow } from "../Components";
import { useSelector } from "react-redux";
import { Link } from "react-router";

// This component will accept the user data, we need pass the headings and cols for mobile and large screens
// we pass everything as a children to the genricTable component

function UsersTable({ data }) {
  const { isMobile } = useSelector((state) => state.deviceReducer);

  const userTableHeadings = isMobile
    ? ["#", "user", "status", "company"]
    : ["#", "user", "status", "phone", "company"];

  const userCols = isMobile
    ? "0.1fr 0.6fr 0.5fr 0.4fr"
    : "0.1fr 1fr 0.5fr 1fr 0.5fr";

  return (
    <GenericTable>
      {/* SEARCH BAR */}

      {/* TABLE HEADER */}
      <TableHeader data={userTableHeadings} cols={userCols} />

      {/* TABLE DATA */}
      <div>
        {data.map((item, index) => {
          const {
            $id,
            userName,
            userCompany,
            userPhone,
            userStatus,
            totalSwapCount,
            pendingAmount,
          } = item;

          return (
            <Link key={$id} to={`/dashboard/users/${$id}`}>
              <TableRow cols={userCols}>
                {/* SL NUMBER */}
                <p className="text-[0.7rem] w-[20px] h-[20px] font-medium border bg-indigo-950 text-white flex items-center justify-center rounded-2xl mt-0.5">
                  {index + 1}
                </p>

                {/* USER NAME/BASIC DETAILS */}
                {isMobile ? (
                  <div className="md:hidden flex  gap-2">
                    <div>
                      <h2 className="font-medium text-md capitalize">
                        {userName}
                      </h2>

                      <div className="leading-4 mt-0.5">
                        {/* total swap count for the current bike */}
                        {totalSwapCount > 0 ? (
                          <p className="text-[10px]">
                            {totalSwapCount} {""}
                            {totalSwapCount <= 1 ? "swap" : "swaps"} with
                            current bike
                          </p>
                        ) : (
                          <p className="text-[10px]"></p>
                        )}

                        {/* pendingAmount if present */}
                        {pendingAmount > 0 && (
                          <p className="text-[10px] font-medium text-red-700">
                            pending: ₹{pendingAmount}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex font-semibold items-center gap-4">
                    {userName}
                  </div>
                )}

                <div className="flex gap-4 justify-center text-xs">
                  {userStatus ? (
                    <p className="bg-blue-200 px-4 py-1.5 rounded-2xl">
                      Active
                    </p>
                  ) : (
                    <p className="bg-red-400/80 px-3 py-1.5 rounded-2xl">
                      Inactive
                    </p>
                  )}
                </div>

                <p>{userCompany}</p>
                {!isMobile && <p>{userPhone}</p>}
              </TableRow>
            </Link>
          );
        })}
      </div>
    </GenericTable>
  );
}

export default UsersTable;
