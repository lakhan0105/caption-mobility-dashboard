import React, { useState } from "react";
import AuthBtn from "../Components/AuthBtn";
import { useDispatch } from "react-redux";
import { setIsSignup } from "../features/auth/AuthSlice";
import { useNavigate } from "react-router";

import logo from "../assets/logo.png";

function StartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // this function identifies which auth btn was clicked and helps us know wether to login/signup
  function handleStartBtn(btnName) {
    dispatch(setIsSignup(btnName));
    navigate("/authPage");
  }

  return (
    <section className="w-full h-screen flex flex-col items-center justify-center bg-[#F5F5DC]">
      <img src={logo} className="w-[220px] rounded-[50%] " alt="not found" />

      {/* <h2 className="text-4xl font-bold mt-4 mb-3 text-[#3E2723] text-center">
        Welcome
      </h2> */}

      {/* buttons container */}
      <div className="flex gap-4 mt-6">
        <AuthBtn
          text={"login"}
          name={"login"}
          extraStyles="bg-green-600 hover:bg-green-700 text-white rounded-3xl"
          authBtnHandler={handleStartBtn}
        />

        <AuthBtn
          text={"signup"}
          name={"signup"}
          extraStyles={
            "text-black rounded-3xl border border-green-700/50 hover:bg-green-700 hover:text-white"
          }
          authBtnHandler={handleStartBtn}
        />
      </div>
    </section>
  );
}

export default StartPage;
