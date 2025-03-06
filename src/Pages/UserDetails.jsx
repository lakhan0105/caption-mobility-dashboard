import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { FaUserCircle } from "react-icons/fa";
import { FaPhoneAlt } from "react-icons/fa";
import { FaRegMessage } from "react-icons/fa6";
import { FaPlus } from "react-icons/fa6";
import { databases } from "../appwrite";
import SimpleBtn from "../Components/Buttons/SimpleBtn";
import { AssignForm, Modal } from "../Components";
import { useDispatch, useSelector } from "react-redux";
import { showModal } from "../features/modal/modalSlice";
import { IoIosReturnLeft } from "react-icons/io";
import moment from "moment";
import { updateBike } from "../features/bike/bikeSlice";
import { returnBikeFrmUser } from "../features/user/UserSlice";

const dbId = import.meta.env.VITE_DB_ID;
const usersCollId = import.meta.env.VITE_USERS_COLL_ID;

function UserDetails() {
  const param = useParams();
  const paramId = param.id;
  const [userDetails, setUserDetails] = useState();

  const dispatch = useDispatch();

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
  }, []);

  // function to return the bike
  // - removes the bikeId, userSatatus from the userData in appwrite
  // - changes bikeStatus to null from bikeData in appwrite
  function handleReturnBike(data) {
    console.log(data);

    // run the returnBikeFrmUser
    // - if successfull run the getUser() to refresh the data again
    dispatch(returnBikeFrmUser(data))
      .unwrap()
      .then(() => {
        getUser();
      })
      .catch((error) => {
        console.log("error while returning bike", error);
      });
    getUser();
  }

  if (userDetails) {
    const {
      $id,
      userName,
      $createdAt,
      $updatedAt,
      bikeId,
      batteryId,
      userCompany,
      userPhone,
      userStatus,
      userNotes,
    } = userDetails;

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

          {/* HORIZONTAL LINE */}
          <hr className="mt-5" />

          {/* RENTAL DETAILS */}
          <div className="mt-5">
            <h3 className="text-sm mb-2">Rental details</h3>

            <p className="text-xs">
              status - {userStatus ? "active" : "inactive"}
            </p>

            {bikeId && (
              <div className="mb-2 text-xs leading-relaxed">
                <p>bike - {bikeId}</p>
                <p>updated at - {moment({ $updatedAt }).format("lll")}</p>
              </div>
            )}

            {/* if no bike is assigned, show the assign bike button */}
            {bikeId ? (
              <SimpleBtn
                name={"return bike"}
                icon={<IoIosReturnLeft />}
                extraStyles={"py-1.5 text-xs bg-red-600 text-white border-none"}
                handleBtn={() => {
                  handleReturnBike({
                    userId: $id,
                    bikeId,
                  });
                }}
              />
            ) : (
              <SimpleBtn
                name={"Assign bike"}
                icon={<FaPlus />}
                extraStyles={"py-1.5 text-xs"}
                handleBtn={() => {
                  dispatch(showModal());
                }}
              />
            )}
          </div>

          <Modal>
            <AssignForm getUser={getUser} />
          </Modal>
        </div>
      </section>
    );
  }
}

export default UserDetails;
