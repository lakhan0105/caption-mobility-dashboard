import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { databases } from "../appwrite";
import { Query } from "appwrite";
import { updatePayment, returnBikeFromUser } from "../features/user/UserSlice"; // Import thunks
import toast from "react-hot-toast";

const Payments = () => {
  const dbId = import.meta.env.VITE_DB_ID;
  const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
  const companyCollId = import.meta.env.VITE_COMPANY_COLL_ID;
  const bikesCollId = import.meta.env.VITE_BIKES_COLL_ID;

  const dispatch = useDispatch(); // Initialize Redux dispatch

  const [payments, setPayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [collectingPayment, setCollectingPayment] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchTodaysPayments();
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const response = await databases.listDocuments(dbId, companyCollId);
      setCompanies(response.documents);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchTodaysPayments = async () => {
    setLoading(true);
    try {
      const selectedCompanyData = companies.find(
        (c) => c.$id === selectedCompany
      );
      if (!selectedCompanyData) {
        setPayments([]);
        setTotalAmount(0);
        setLoading(false);
        return;
      }

      console.log("Selected company:", selectedCompanyData.companyName);

      // Fetch users with pagination
      const limit = 100;
      let offset = 0;
      let allUsers = [];
      let hasMore = true;

      while (hasMore) {
        const response = await databases.listDocuments(dbId, usersCollId, [
          Query.contains("userCompany", selectedCompanyData.companyName),
          Query.limit(limit),
          Query.offset(offset),
        ]);
        allUsers = allUsers.concat(response.documents);
        offset += limit;
        hasMore = response.documents.length === limit;
      }

      console.log("Matched users:", allUsers.length);

      if (allUsers.length === 0) {
        setPayments([]);
        setTotalAmount(0);
        setLoading(false);
        return;
      }

      // Fetch bike details for users with bikes
      const userPayments = await Promise.all(
        allUsers
          .filter((user) => {
            const hasPending = parseInt(user.pendingAmount || 0) > 0;
            const hasBike = user.bikeId && user.bikeId.trim() !== "";
            return hasPending || hasBike;
          })
          .map(async (user) => {
            const pendingAmount = parseInt(user.pendingAmount || 0);
            const hasBike = user.bikeId && user.bikeId.trim() !== "";
            const weeklyRent = hasBike ? 1700 : 0;
            const totalToCollect = pendingAmount + weeklyRent;

            // Fetch bike details if user has a bike
            let daysSinceRent = 0;
            let assignedAt = null;
            if (hasBike) {
              try {
                const bike = await databases.getDocument(
                  dbId,
                  bikesCollId,
                  user.bikeId
                );
                assignedAt = bike.assignedAt;
                if (assignedAt) {
                  const assignedDate = new Date(assignedAt);
                  const currentDate = new Date();
                  const timeDiff = currentDate - assignedDate;
                  daysSinceRent = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                }
              } catch (error) {
                console.error(`Error fetching bike ${user.bikeId}:`, error);
              }
            }

            return {
              $id: user.$id,
              userId: user.$id,
              userName: user.userName,
              userPhone: user.userPhone,
              userCompany: user.userCompany,
              bikeId: user.bikeId || null,
              batteryId: user.batteryId || null, // Include batteryId for returnBikeFromUser
              hasBike,
              depositAmount: parseInt(user.depositAmount || 0),
              paidAmount: parseInt(user.paidAmount || 0),
              pendingAmount,
              weeklyRent,
              totalToCollect,
              daysSinceRent,
              lastRentDate: user.lastRentCollectionDate || null,
              type: "pending",
              method: "cash",
              date: new Date().toISOString(),
            };
          })
      );

      console.log("Users with payments due:", userPayments.length);

      const total = userPayments.reduce(
        (sum, payment) => sum + payment.totalToCollect,
        0
      );

      setPayments(userPayments);
      setTotalAmount(total);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const collectPayment = async (payment) => {
    const confirmMsg = payment.hasBike
      ? `Collect ₹${payment.totalToCollect} from ${payment.userName} and RETURN bike?\n\nBreakdown:\n- Pending: ₹${payment.pendingAmount}\n- Weekly Rent: ₹${payment.weeklyRent}\n- Total: ₹${payment.totalToCollect}\n\n⚠️ Bike will be returned!`
      : `Collect ₹${payment.totalToCollect} from ${payment.userName}?\n\nBreakdown:\n- Pending: ₹${payment.pendingAmount}\n- Weekly Rent: ₹${payment.weeklyRent}\n- Total: ₹${payment.totalToCollect}`;

    if (!confirm(confirmMsg)) return;

    setCollectingPayment(payment.$id);
    try {
      // Calculate new values
      const newPaidAmount =
        Number(payment.paidAmount) + Number(payment.totalToCollect);

      // Update payment details using updatePayment thunk
      await dispatch(
        updatePayment({
          userId: payment.userId,
          pendingAmount: 0,
        })
      ).unwrap();

      // Update user document with paid amount and last rent collection date
      const updateData = {
        paidAmount: newPaidAmount,
      };
      if (payment.weeklyRent > 0) {
        updateData.lastRentCollectionDate = new Date().toISOString();
      }

      // If user has a bike, return it using returnBikeFromUser thunk
      if (payment.hasBike && payment.bikeId) {
        await dispatch(
          returnBikeFromUser({
            userId: payment.userId,
            bikeId: payment.bikeId,
            batteryId: payment.batteryId || null,
            totalSwapCount: 0, // Adjust if you track swap count
          })
        ).unwrap();
      } else {
        // Update user document if no bike is returned
        await databases.updateDocument(
          dbId,
          usersCollId,
          payment.userId,
          updateData
        );
      }

      // Update UI
      const updatedPayments = payments.filter((p) => p.$id !== payment.$id);
      setPayments(updatedPayments);
      const newTotal = updatedPayments.reduce(
        (sum, p) => sum + p.totalToCollect,
        0
      );
      setTotalAmount(newTotal);

      const successMsg = payment.hasBike
        ? `✅ ₹${payment.totalToCollect} collected and bike returned!\n\nNew paid amount: ₹${newPaidAmount}`
        : `✅ ₹${payment.totalToCollect} collected!\n\nNew paid amount: ₹${newPaidAmount}`;
      toast.success(successMsg);
    } catch (error) {
      console.error("Error collecting payment:", {
        code: error.code,
        message: error.message,
        type: error.type,
      });
      toast.error(
        `❌ Failed to collect payment: ${error.message} (Code: ${
          error.code || "N/A"
        })`
      );
    } finally {
      setCollectingPayment(null);
    }
  };

  const refreshData = () => {
    if (selectedCompany) {
      fetchTodaysPayments();
    }
  };

  const formatDate = (dateString) => {
    return dateString
      ? new Date(dateString).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Pending Payments Collection
            </h1>
            <p className="text-gray-600">
              Collect pending amounts and weekly rent (₹1,700) due every 7 days
            </p>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 w-full sm:w-auto"
          >
            Refresh Data
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Company
        </label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a company...</option>
          {companies.map((company) => (
            <option key={company.$id} value={company.$id}>
              {company.companyName}
            </option>
          ))}
        </select>
      </div>

      {selectedCompany && (
        <>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Payments Due Today
                </h3>
                <p className="text-sm text-gray-600">
                  {payments.length} user(s) with payments due
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold text-green-600">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-gray-600">Total to Collect</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                No payments due for this company today
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days Since Rent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pending
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Weekly Rent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total to Collect
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.$id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.userName || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.userCompany || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.userPhone || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.daysSinceRent >= 7
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {payment.daysSinceRent} days
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{payment.pendingAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.weeklyRent > 0 ? (
                              <span className="text-red-600 font-medium">
                                ₹{payment.weeklyRent.toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not due</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            ₹{payment.totalToCollect.toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => collectPayment(payment)}
                              disabled={collectingPayment === payment.$id}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                collectingPayment === payment.$id
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                              }`}
                            >
                              {collectingPayment === payment.$id
                                ? "Collecting..."
                                : "Collect"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:hidden space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment.$id}
                    className="bg-white shadow rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {payment.userName || "N/A"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {payment.userCompany || "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {payment.userPhone || "N/A"}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.daysSinceRent >= 7
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {payment.daysSinceRent} days since rent
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{payment.totalToCollect.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 mb-3 space-y-1">
                      <div>
                        Pending: ₹
                        {payment.pendingAmount.toLocaleString("en-IN")}
                      </div>
                      <div>
                        Weekly Rent:{" "}
                        {payment.weeklyRent > 0
                          ? `₹${payment.weeklyRent.toLocaleString("en-IN")}`
                          : "Not due"}
                      </div>
                      <div>Last Rent: {formatDate(payment.lastRentDate)}</div>
                    </div>
                    <button
                      onClick={() => collectPayment(payment)}
                      disabled={collectingPayment === payment.$id}
                      className={`w-full px-4 py-2 rounded-md text-sm font-medium ${
                        collectingPayment === payment.$id
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                      }`}
                    >
                      {collectingPayment === payment.$id
                        ? "Collecting..."
                        : `Collect ₹${payment.totalToCollect.toLocaleString(
                            "en-IN"
                          )}`}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Payments;
