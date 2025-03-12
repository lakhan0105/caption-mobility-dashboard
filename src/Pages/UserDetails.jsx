import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { FaUserCircle } from "react-icons/fa";
import { FaPhoneAlt } from "react-icons/fa";
import { FaRegMessage } from "react-icons/fa6";
import { databases } from "../appwrite";
import SimpleBtn from "../Components/Buttons/SimpleBtn";
import { AssignForm, Modal, SwapForm } from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { returnBikeFrmUser } from "../features/user/UserSlice";
import Tabs from "../Components/Tabs/Tabs";

const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;

function UserDetails() {
  const param = useParams();
  const paramId = param.id;
  const [userDetails, setUserDetails] = useState();

  const dispatch = useDispatch();

  // function to fetch the user (single user)
  async function getUser() {
    try {
      const response = await databases.getDocument(dbId, usersCollId, paramId);
      if (response) {
        setUserDetails(() => response);
      }
      console.log(response);
    } catch (error) {
      alert("error while geting the user details");
      console.log(error);
    }
  }

  useEffect(() => {
    getUser();
  }, [paramId]);

  // function to return the bike
  // - removes the bikeId, userSatatus from the userData in appwrite
  // - changes bikeStatus to null from bikeData in appwrite
  function handleReturnBike() {
    // run the returnBikeFrmUser
    // - if successfull run the getUser() to refresh the data again
    dispatch(
      returnBikeFrmUser({
        userId: userDetails?.$id,
        bikeId: userDetails?.bikeId,
        batteryId: userDetails?.batteryId,
      })
    )
      .unwrap()
      .then(() => {
        getUser();
      })
      .catch((error) => {
        console.log("error while returning bike", error);
      });
    getUser();
  }

  console.log(userDetails);

  if (userDetails) {
    const { $id, userName } = userDetails;

    return (
      <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] px-5 pt-8">
        <div className="">
          {/* TOP CARD */}
          <div className="flex items-center gap-10 py-5 mr-10">
            {/* PROFILE ICON */}
            <div className="text-[85px]">
              <FaUserCircle />
            </div>

            {/* BASIC INFO */}
            <div className="mt-2">
              <h2 className="text-x font-medium">{userName}</h2>
              <p className="text-xs font-medium text-zinc-500 mt-1 mb-2">
                {$id}
              </p>

              {/* BUTTONS TO CALL AND MESSAGE THE USER */}
              <div>
                <div className=" flex items-center gap-2 text-xs">
                  <SimpleBtn name={"call"} icon={<FaPhoneAlt />} />
                  <SimpleBtn name={"messsage"} icon={<FaRegMessage />} />
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <Tabs userDetails={userDetails} handleReturnBike={handleReturnBike} />

          {/* If bike is not assigned then show AssignForm or else show the swap form */}
          <Modal>
            {!userDetails?.bikeId ? (
              <AssignForm getUser={getUser} />
            ) : (
              <SwapForm userDetails={userDetails} getUser={getUser} />
            )}
          </Modal>
        </div>
      </section>
    );
  }
}

export default UserDetails;
