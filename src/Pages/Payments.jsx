import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { databases } from "../appwrite";
import { Query } from "appwrite";
import { updatePayment } from "../features/user/UserSlice";
import toast from "react-hot-toast";

const Payments = () => {
  const dbId = import.meta.env.VITE_DB_ID;
  const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
  const companyCollId = import.meta.env.VITE_COMPANY_COLL_ID;
  const bikesCollId = import.meta.env.VITE_BIKES_COLL_ID;
  const paymentRecordsCollId = import.meta.env.VITE_PAYMENT_RECORDS_COLL_ID;

  const dispatch = useDispatch();

  const [payments, setPayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [collecting, setCollecting] = useState({});

  const DAILY_RATE = 1700 / 7;

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

      // Fetch bike details for users with bikes and calculate pro-rated rent
      const userPayments = await Promise.all(
        allUsers.map(async (user) => {
          const pendingAmount = parseInt(user.pendingAmount || 0);
          const hasBike = user.bikeId && user.bikeId.trim() !== "";

          let daysSinceLast = 0;
          let rentDue = 0;
          let assignedAt = null;
          let lastPaymentDate = null;

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
                lastPaymentDate = user.lastRentCollectionDate
                  ? new Date(user.lastRentCollectionDate)
                  : assignedDate;
                const currentDate = new Date();
                const timeDiff = currentDate - lastPaymentDate;
                daysSinceLast = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                rentDue = Math.round(DAILY_RATE * daysSinceLast);
              }
            } catch (error) {
              console.error(`Error fetching bike ${user.bikeId}:`, error);
            }
          }

          const totalToCollect = pendingAmount + rentDue;

          return {
            $id: user.$id,
            userId: user.$id,
            userName: user.userName,
            userPhone: user.userPhone,
            userCompany: user.userCompany,
            bikeId: user.bikeId || null,
            batteryId: user.batteryId || null,
            hasBike,
            depositAmount: parseInt(user.depositAmount || 0),
            paidAmount: parseInt(user.paidAmount || 0),
            pendingAmount,
            rentDue,
            totalToCollect,
            daysSinceLast,
            lastRentDate: user.lastRentCollectionDate || null,
            lastCycleStart: lastPaymentDate
              ? lastPaymentDate.toISOString()
              : null,
            type: "pending",
            method: "cash",
            date: new Date().toISOString(),
          };
        })
      );

      // Filter users with pending > 0 or hasBike (to include even if rentDue = 0)
      const filteredPayments = userPayments.filter(
        (payment) => payment.pendingAmount > 0 || payment.hasBike
      );

      console.log("Users with payments due:", filteredPayments.length);

      const total = filteredPayments.reduce(
        (sum, payment) => sum + payment.totalToCollect,
        0
      );

      setPayments(filteredPayments);
      setTotalAmount(total);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const collectPending = async (payment) => {
    if (payment.pendingAmount <= 0) {
      toast.error("No pending amount.");
      return;
    }

    const confirmMsg = `Collect pending ₹${payment.pendingAmount} from ${payment.userName}?`;

    if (!confirm(confirmMsg)) return;

    setCollecting((prev) => ({ ...prev, [`${payment.$id}-pending`]: true }));
    try {
      const newPaidAmount =
        Number(payment.paidAmount) + Number(payment.pendingAmount);

      // Update pending to 0
      await dispatch(
        updatePayment({
          userId: payment.userId,
          pendingAmount: 0,
        })
      ).unwrap();

      // Update user document with new paid amount
      await databases.updateDocument(dbId, usersCollId, payment.userId, {
        paidAmount: newPaidAmount,
      });

      // Create payment record
      await databases.createDocument(dbId, paymentRecordsCollId, "unique()", {
        userId: payment.userId,
        amount: payment.pendingAmount,
        type: "pending_clearance",
        method: "cash",
        date: new Date().toISOString(),
      });

      // Update local state
      const updatedPayments = payments
        .map((p) =>
          p.$id === payment.$id
            ? {
                ...p,
                pendingAmount: 0,
                paidAmount: newPaidAmount,
                totalToCollect: p.totalToCollect - p.pendingAmount,
              }
            : p
        )
        .filter((p) => p.pendingAmount > 0 || p.hasBike);

      setPayments(updatedPayments);
      setTotalAmount(
        updatedPayments.reduce((sum, p) => sum + p.totalToCollect, 0)
      );

      toast.success(`✅ Pending ₹${payment.pendingAmount} collected!`);
    } catch (error) {
      console.error("Error collecting pending:", error);
      toast.error(`❌ Failed to collect pending: ${error.message}`);
    } finally {
      setCollecting((prev) => ({ ...prev, [`${payment.$id}-pending`]: false }));
    }
  };

  const collectRent = async (payment) => {
    if (payment.rentDue <= 0) {
      toast.error("No rent due at this time.");
      return;
    }

    const confirmMsg = `Collect rent due ₹${payment.rentDue} from ${payment.userName}?`;

    if (!confirm(confirmMsg)) return;

    setCollecting((prev) => ({ ...prev, [`${payment.$id}-rent`]: true }));
    try {
      const newPaidAmount =
        Number(payment.paidAmount) + Number(payment.rentDue);

      // Update user document with new paid amount and last rent date
      await databases.updateDocument(dbId, usersCollId, payment.userId, {
        paidAmount: newPaidAmount,
        lastRentCollectionDate: new Date().toISOString(),
      });

      // Create payment record
      await databases.createDocument(dbId, paymentRecordsCollId, "unique()", {
        userId: payment.userId,
        amount: payment.rentDue,
        type: "rent_collection",
        method: "cash",
        date: new Date().toISOString(),
      });

      // Update local state
      const updatedPayments = payments
        .map((p) =>
          p.$id === payment.$id
            ? {
                ...p,
                rentDue: 0,
                paidAmount: newPaidAmount,
                totalToCollect: p.totalToCollect - p.rentDue,
                daysSinceLast: 0,
                lastRentDate: new Date().toISOString(),
                lastCycleStart: new Date().toISOString(),
              }
            : p
        )
        .filter((p) => p.pendingAmount > 0 || p.hasBike);

      setPayments(updatedPayments);
      setTotalAmount(
        updatedPayments.reduce((sum, p) => sum + p.totalToCollect, 0)
      );

      toast.success(`✅ Rent ₹${payment.rentDue} collected!`);
    } catch (error) {
      console.error("Error collecting rent:", error);
      toast.error(`❌ Failed to collect rent: ${error.message}`);
    } finally {
      setCollecting((prev) => ({ ...prev, [`${payment.$id}-rent`]: false }));
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
              Collect pending amounts and pro-rated rent (₹1,700/week,
              calculated per day)
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
                  Users in Company
                </h3>
                <p className="text-sm text-gray-600">
                  {payments.length} user(s)
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
              <p className="text-gray-600">No users for this company</p>
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
                          Cycle Start
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days Since Last Rent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pending
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rent Due
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total to Collect
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
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
                            {formatDate(payment.lastCycleStart) || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.daysSinceLast >= 7
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {payment.daysSinceLast} days
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{payment.pendingAmount.toLocaleString("en-IN")}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            title={`Based on ${
                              payment.daysSinceLast
                            } days at ₹${DAILY_RATE.toFixed(2)}/day`}
                          >
                            {payment.rentDue > 0 ? (
                              <span className="text-red-600 font-medium">
                                ₹{payment.rentDue.toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not due</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            ₹{payment.totalToCollect.toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                            <button
                              onClick={() => collectPending(payment)}
                              disabled={collecting[`${payment.$id}-pending`]}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                collecting[`${payment.$id}-pending`]
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                            >
                              {collecting[`${payment.$id}-pending`]
                                ? "Collecting..."
                                : "Collect Pending"}
                            </button>
                            <button
                              onClick={() => collectRent(payment)}
                              disabled={collecting[`${payment.$id}-rent`]}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                collecting[`${payment.$id}-rent`]
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                  : "bg-green-600 text-white hover:bg-green-700"
                              }`}
                            >
                              {collecting[`${payment.$id}-rent`]
                                ? "Collecting..."
                                : "Collect Rent"}
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
                              payment.daysSinceLast >= 7
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {payment.daysSinceLast} days since last rent
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
                        Rent Due:{" "}
                        {payment.rentDue > 0
                          ? `₹${payment.rentDue.toLocaleString("en-IN")}`
                          : "Not due"}
                      </div>
                      {payment.hasBike && (
                        <div className="text-xs text-gray-500">
                          Calculation: {payment.daysSinceLast} days × ₹
                          {DAILY_RATE.toFixed(2)}/day ≈ ₹{payment.rentDue}
                        </div>
                      )}
                      <div>
                        Cycle started:{" "}
                        {formatDate(payment.lastCycleStart) || "N/A"}
                      </div>
                      <div>Last Rent: {formatDate(payment.lastRentDate)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => collectPending(payment)}
                        disabled={collecting[`${payment.$id}-pending`]}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                          collecting[`${payment.$id}-pending`]
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {collecting[`${payment.$id}-pending`]
                          ? "Collecting..."
                          : `Collect Pending ₹${payment.pendingAmount.toLocaleString(
                              "en-IN"
                            )}`}
                      </button>
                      <button
                        onClick={() => collectRent(payment)}
                        disabled={collecting[`${payment.$id}-rent`]}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                          collecting[`${payment.$id}-rent`]
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {collecting[`${payment.$id}-rent`]
                          ? "Collecting..."
                          : `Collect Rent ₹${payment.rentDue.toLocaleString(
                              "en-IN"
                            )}`}
                      </button>
                    </div>
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
