import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCompanyNames } from "../features/company/companySlice";
import {
  getUserByFilter,
  getUsersList,
  setActiveFilter,
} from "../features/user/UserSlice";
import { CiCirclePlus } from "react-icons/ci";
import toast from "react-hot-toast";

function Filters() {
  const dispatch = useDispatch();
  const [activeBtn, setActiveBtn] = useState("all");
  const [btnNames, setBtnNames] = useState(["all", "active", "pending"]);
  const { companyNames, isLoading } = useSelector(
    (state) => state.companyReducer
  );

  // Fetch company names on mount
  useEffect(() => {
    dispatch(getCompanyNames())
      .unwrap()
      .catch((error) => {
        toast.error("Failed to load company names");
        console.error("Failed to fetch company names:", error);
      });
  }, [dispatch]);

  // Update btnNames when companyNames changes
  useEffect(() => {
    if (companyNames) {
      setBtnNames((prev) => {
        const updatedBtnNames = [...new Set([...prev, ...companyNames])];
        console.log("Updated btnNames:", updatedBtnNames);

        return updatedBtnNames;
      });
    }
  }, [companyNames]);

  // Handle filter button click
  function handleFilterBtn(e) {
    const name = e.target.name;
    console.log(name);
    setActiveBtn(name);

    if (name === "all") {
      dispatch(getUsersList(0));
      dispatch(setActiveFilter(null));
      return;
    }

    let filter = {};
    if (name === "active") {
      filter = { attributeName: "userStatus", attributeValue: true };
    } else if (name === "pending") {
      filter = { attributeName: "pendingAmount", attributeValue: "" };
    } else {
      filter = { attributeName: "userCompany", attributeValue: name };
    }

    dispatch(setActiveFilter(filter));
    dispatch(getUserByFilter({ ...filter, offset: 0 }));
  }

  // Handle plus button click to reload company names
  function handleReloadCompanies() {
    dispatch(getCompanyNames())
      .unwrap()
      .then(() => {
        toast.success("Refreshed company names");
      })
      .catch((error) => {
        toast.error("Failed to refresh company names");
        console.error("Failed to reload company names:", error);
      });
  }

  if (isLoading) {
    return <h2>Loading filters...</h2>;
  }

  if (!companyNames) {
    return <h2>No companies available</h2>;
  }

  return (
    <div className="max-w-[475px] mt-7 overflow-x-scroll no-scrollbar">
      <div className="text-xs w-max flex gap-4 whitespace-nowrap pr-24">
        {btnNames?.map((btnName, index) => (
          <button
            className={`border border-white/50 rounded-xl px-3 py-1 capitalize ${
              activeBtn === btnName ? "bg-white/90 text-black" : "text-white/95"
            }`}
            key={index}
            onClick={handleFilterBtn}
            name={btnName}
          >
            {btnName}
          </button>
        ))}
        <button
          className="plus-btn text-2xl text-white/85"
          onClick={handleReloadCompanies}
          title="Refresh company names"
        >
          <CiCirclePlus />
        </button>
      </div>
    </div>
  );
}

export default Filters;
