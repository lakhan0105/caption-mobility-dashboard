import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCompanyNames } from "../features/company/companySlice";
import { getUserByFilter, getUsersList } from "../features/user/UserSlice";

function Filters() {
  const dispatch = useDispatch();

  const [activeBtn, setActiveBtn] = useState("all");

  // get all the Company names -> in array format
  useEffect(() => {
    dispatch(getCompanyNames());
  }, []);

  // grab the companyNames state from the companyReducer
  const { companyNames, isLoading } = useSelector(
    (state) => state.companyReducer
  );

  // state to store and set the filter button names
  const [btnNames, setBtnNames] = useState("");
  useEffect(() => {
    if (companyNames) {
      setBtnNames(["all", "active", "pending", ...companyNames]);
    }
  }, [companyNames]);

  // handleFilterBtn
  function handleFilterbtn(e) {
    const name = e.target.name;

    setActiveBtn(name);

    if (name === "all") {
      dispatch(getUsersList());
      return;
    }

    if (name === "active") {
      dispatch(
        getUserByFilter({ attributeName: "userStatus", attributeValue: true })
      );
    } else if (name === "pending") {
      dispatch(
        getUserByFilter({ attributeName: "pendingAmount", attributeValue: "" })
      );
    } else {
      dispatch(
        getUserByFilter({ attributeName: "userCompany", attributeValue: name })
      );
    }
  }

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="max-w-[475px] mt-7 overflow-x-scroll no-scrollbar">
      <div className="text-xs flex gap-4 w-full">
        {btnNames &&
          btnNames?.map((btnName, index) => {
            return (
              <button
                className={`border border-white/50 rounded-xl px-3 py-1 capitalize  ${
                  activeBtn === btnName
                    ? "bg-white/90 text-black"
                    : "text-white/95"
                }`}
                key={index}
                onClick={handleFilterbtn}
                name={btnName}
              >
                {btnName}
              </button>
            );
          })}
      </div>
    </div>
  );
}

export default Filters;
