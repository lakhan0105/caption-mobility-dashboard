import React, { useState } from "react";
import { AuthBtn, InputRow } from "../Components";
import { useDispatch, useSelector } from "react-redux";
import {
  createAccount,
  loginUser,
  toggleIsSignup,
} from "../features/auth/AuthSlice";
import { ID } from "appwrite";

function AuthPage() {
  const { isSignup, isLoading, errorMsg } = useSelector(
    (state) => state.authReducer
  );
  const dispatch = useDispatch();

  // text based on the state of isSignup
  const btnName = isSignup ? "signup" : "login";
  const text = isSignup
    ? "Already have an account?"
    : "Do not have an account?";

  // formState
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // function to handle the changes in the form
  function handleInputChange(e) {
    const key = e.target.name;
    const value = e.target.value;

    setFormData((prev) => {
      return { ...prev, [key]: value };
    });
  }

  // function to signup the user
  function handleSignup() {
    const data = {
      userId: ID.unique(),
      email: formData.email,
      password: formData.password,
      name: formData?.username,
    };
    console.log(data);
    dispatch(createAccount(data));
  }

  // function to login the user
  function handleLogin(e) {
    console.log("login function test");
    const data = {
      email: formData.email,
      password: formData.password,
    };
    dispatch(loginUser(data));
  }

  // function to login/signup based on the isSignup state value
  function handleAuth() {
    if (isSignup) {
      handleSignup();
    } else if (isSignup === false) {
      handleLogin();
    }
  }

  return (
    <section>
      <div className="m-[10rem] text-cente max-w-[400px] mx-auto py-10 px-8 bg-white rounded-md shadow-lg">
        <h2 className="text-2xl font-semibold">
          {isSignup ? "Create an Account" : "Welcome, Please Login"}
        </h2>

        <form className="w-full mt-6">
          {/* USERNAME */}
          {isSignup && (
            <InputRow
              name={"username"}
              label={"username"}
              type={"text"}
              value={formData.userName}
              handleChange={handleInputChange}
              required={true}
            />
          )}

          {/* EMAIL */}
          <InputRow
            name={"email"}
            label={"email"}
            type={"email"}
            value={formData.email}
            handleChange={handleInputChange}
            required={true}
          />

          {/* PASSWORD */}
          <InputRow
            name={"password"}
            label={"password"}
            type={"password"}
            value={formData.password}
            handleChange={handleInputChange}
            required={true}
          />

          {/* TEXT */}
          <p className="text-sm">
            <span className="mr-1.5">{text}</span>
            <button
              name={btnName}
              className="capitalize underline"
              onClick={() => {
                dispatch(toggleIsSignup());
              }}
            >
              {isSignup ? "login" : "signup"}
            </button>
          </p>

          {/* ERROR MSG */}
          <p className="mt-1 mb-1 font-semibold text-sm text-red-600">
            {errorMsg}
          </p>

          {/* SUBMIT BUTTON */}
          <AuthBtn
            text={btnName}
            type="submit"
            extraStyles={
              "w-full text-black rounded border border-green-700/50 bg-green-600 hover:bg-green-700 text-white mt-4"
            }
            authBtnHandler={handleAuth}
            disabled={isLoading}
          />
        </form>
      </div>
    </section>
  );
}

export default AuthPage;
