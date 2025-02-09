import React, { useState } from "react";
import AuthBtn from "../Components/AuthBtn";
import { useDispatch } from "react-redux";
import { setIsSignup } from "../features/auth/AuthSlice";
import { useNavigate } from "react-router";

function StartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // this function identifies which auth btn was clicked and helps us know wether to login/signup
  function handleStartBtn(btnName) {
    if (btnName === "signup") {
      dispatch(setIsSignup(true));
    } else {
      dispatch(setIsSignup(false));
    }

    navigate("/signup");
  }

  return (
    <section className="w-full h-screen flex flex-col items-center justify-center bg-[#F5F5DC]">
      <h2 className="text-4xl font-bold mb-8 text-[#3E2723]">
        Welcome to Caption Mobility
      </h2>

      {/* buttons container */}
      <div className="flex gap-4">
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
