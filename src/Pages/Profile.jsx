import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router";
import { getUserProfile } from "../features/user/UserSlice";
import { ProfileRow } from "../Components";

function Profile() {
  const params = useParams();
  const { currUser, isLoading } = useSelector((state) => state.authReducer);
  const { userProfile, isUserLoading } = useSelector((state) => {
    return state.userReducer;
  });
  const dispatch = useDispatch();

  const [checkAuth, setCheckAuth] = useState(false);
  const [profile, setProfile] = useState();

  useEffect(() => {
    if (currUser.id !== params.id && currUser.isAdmin === false) {
      setCheckAuth(false);
    } else {
      setCheckAuth(true);
      dispatch(getUserProfile(params.id));
    }
  }, []);

  // if checkAuth is false show the unauth message on screen
  if (checkAuth === false) {
    return (
      <h2 className="ml-[300px] w-[calc(100%-300px)] rounded-l h-[80v]">
        You are Unauthorized, to see the data
      </h2>
    );
  }

  return (
    <section className="ml-[300px] w-[calc(100%-300px)] rounded-l h-[80v]  overflow-hidden">
      {/* profile header */}
      <div>
        <div
          style={{
            background:
              "url('https://images.unsplash.com/photo-1490604001847-b712b0c2f967?q=80&w=2153&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
          className="bg-green-700 h-[250px]"
        ></div>

        {/* basic-info */}
        <div className="flex items-end px-10 relative max-w-[1000px] mx-auto">
          <h2 className="text-3xl font-bold mt-10 mb-10">
            {userProfile?.userName}
          </h2>
        </div>
      </div>

      {/* profile info */}
      <div className="px-10 max-w-[1000px] mx-auto">
        <h2 className="text-md ">Account Information</h2>

        <ProfileRow heading={"User Id"} value={userProfile?.$id} />
        <ProfileRow heading={"Email"} value={userProfile?.userEmail} />
        <ProfileRow heading={"Phone"} value={userProfile?.userPhone} />
      </div>
    </section>
  );
}

export default Profile;
