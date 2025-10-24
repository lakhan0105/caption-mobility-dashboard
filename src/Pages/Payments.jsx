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

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPayment, setCurrentPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [utrInput, setUtrInput] = useState("");

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
      toast.error("Failed to load companies");
    }
  };

  const calculateDaysInclusive = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return daysDiff + 1; // Inclusive counting
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

      // Fetch bike details and calculate rent
      const userPayments = await Promise.all(
        allUsers.map(async (user) => {
          const pendingAmount = parseInt(user.pendingAmount || 0);
          const hasBike = user.bikeId && user.bikeId.trim() !== "";

          let daysSinceLast = 0;
          let rentDue = 0;
          let lastPaymentDate = null;
          let cycleStartDate = null;
          let bikeAssignedDate = null;

          if (hasBike) {
            try {
              const bike = await databases.getDocument(
                dbId,
                bikesCollId,
                user.bikeId
              );
              bikeAssignedDate = bike.assignedAt;
              const assignedDate = new Date(bike.assignedAt);

              // Determine cycle start: either last rent collection or bike assignment
              cycleStartDate = user.lastRentCollectionDate
                ? new Date(user.lastRentCollectionDate)
                : assignedDate;

              lastPaymentDate = user.lastRentCollectionDate;

              const currentDate = new Date();

              // Calculate days inclusively
              daysSinceLast = calculateDaysInclusive(
                cycleStartDate,
                currentDate
              );

              // Calculate rent based on daily rate
              rentDue = Math.round(DAILY_RATE * daysSinceLast);
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
            bikeAssignedDate,
            pendingAmount,
            rentDue,
            totalToCollect,
            daysSinceLast,
            lastRentDate: lastPaymentDate,
            cycleStartDate: cycleStartDate
              ? cycleStartDate.toISOString()
              : null,
          };
        })
      );

      const filteredPayments = userPayments.filter(
        (payment) => payment.pendingAmount > 0 || payment.hasBike
      );

      const total = filteredPayments.reduce(
        (sum, payment) => sum + payment.totalToCollect,
        0
      );

      setPayments(filteredPayments);
      setTotalAmount(total);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const collectPending = (payment) => {
    if (payment.pendingAmount <= 0) {
      toast.error("No pending amount.");
      return;
    }
    setCurrentPayment({
      ...payment,
      type: "pending",
      amount: payment.pendingAmount,
    });
    setShowPaymentModal(true);
  };

  const collectRent = (payment) => {
    if (payment.rentDue <= 0) {
      toast.error("No rent due at this time.");
      return;
    }
    setCurrentPayment({
      ...payment,
      type: "rent",
      amount: payment.rentDue,
    });
    setShowPaymentModal(true);
  };

  const refreshData = () => {
    if (selectedCompany) {
      fetchTodaysPayments();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              Collect pending amounts and pro-rated rent (₹1,700/week = ₹
              {DAILY_RATE.toFixed(2)}/day)
            </p>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 w-full sm:w-auto"
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
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                          Bike Assigned
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Cycle Start
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Days in Cycle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pending
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rent Due
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
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
                            {payment.bikeAssignedDate ? (
                              <span
                                className="text-xs"
                                title={formatDateTime(payment.bikeAssignedDate)}
                              >
                                {formatDate(payment.bikeAssignedDate)}
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.cycleStartDate ? (
                              <div>
                                <div
                                  className="text-xs"
                                  title={formatDateTime(payment.cycleStartDate)}
                                >
                                  {formatDate(payment.cycleStartDate)}
                                </div>
                                {payment.lastRentDate && (
                                  <div className="text-xs text-green-600">
                                    (Last paid:{" "}
                                    {formatDate(payment.lastRentDate)})
                                  </div>
                                )}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.daysSinceLast >= 7
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {payment.daysSinceLast}{" "}
                              {payment.daysSinceLast === 1 ? "day" : "days"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{payment.pendingAmount.toLocaleString("en-IN")}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                            title={`${
                              payment.daysSinceLast
                            } days × ₹${DAILY_RATE.toFixed(2)}/day`}
                          >
                            {payment.rentDue > 0 ? (
                              <span className="text-red-600 font-medium">
                                ₹{payment.rentDue.toLocaleString("en-IN")}
                              </span>
                            ) : (
                              <span className="text-gray-400">₹0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            ₹{payment.totalToCollect.toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                            <button
                              onClick={() => collectPending(payment)}
                              disabled={
                                collecting[`${payment.$id}-pending`] ||
                                payment.pendingAmount <= 0
                              }
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                collecting[`${payment.$id}-pending`] ||
                                payment.pendingAmount <= 0
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
                              disabled={
                                collecting[`${payment.$id}-rent`] ||
                                payment.rentDue <= 0
                              }
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                collecting[`${payment.$id}-rent`] ||
                                payment.rentDue <= 0
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
                            Day {payment.daysSinceLast} of cycle
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
                        <strong>Bike Assigned:</strong>{" "}
                        {formatDate(payment.bikeAssignedDate)}
                      </div>
                      <div>
                        <strong>Current Cycle Started:</strong>{" "}
                        {formatDate(payment.cycleStartDate)}
                      </div>
                      {payment.lastRentDate && (
                        <div className="text-green-600">
                          <strong>Last Rent Collected:</strong>{" "}
                          {formatDate(payment.lastRentDate)}
                        </div>
                      )}
                      <div className="pt-2 border-t mt-2">
                        <div>
                          Pending: ₹
                          {payment.pendingAmount.toLocaleString("en-IN")}
                        </div>
                        <div>
                          Rent Due: ₹{payment.rentDue.toLocaleString("en-IN")}
                        </div>
                        {payment.hasBike && (
                          <div className="text-xs text-gray-500 mt-1">
                            ({payment.daysSinceLast} days × ₹
                            {DAILY_RATE.toFixed(2)}/day)
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => collectPending(payment)}
                        disabled={
                          collecting[`${payment.$id}-pending`] ||
                          payment.pendingAmount <= 0
                        }
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                          collecting[`${payment.$id}-pending`] ||
                          payment.pendingAmount <= 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {collecting[`${payment.$id}-pending`]
                          ? "Collecting..."
                          : `Pending ₹${payment.pendingAmount.toLocaleString(
                              "en-IN"
                            )}`}
                      </button>
                      <button
                        onClick={() => collectRent(payment)}
                        disabled={
                          collecting[`${payment.$id}-rent`] ||
                          payment.rentDue <= 0
                        }
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium ${
                          collecting[`${payment.$id}-rent`] ||
                          payment.rentDue <= 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {collecting[`${payment.$id}-rent`]
                          ? "Collecting..."
                          : `Rent ₹${payment.rentDue.toLocaleString("en-IN")}`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Payment Modal */}
          {showPaymentModal && currentPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                <h3 className="text-lg font-semibold mb-4">
                  Collect {currentPayment.type === "rent" ? "Rent" : "Pending"}{" "}
                  from {currentPayment.userName}
                </h3>
                <p className="text-2xl font-bold text-green-600 mb-4">
                  ₹{currentPayment.amount.toLocaleString("en-IN")}
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online (UPI/Bank)</option>
                  </select>
                </div>

                {paymentMethod === "online" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UTR / Reference Number{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={utrInput}
                      onChange={(e) => setUtrInput(e.target.value)}
                      placeholder="e.g. 123456789012"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (paymentMethod === "online" && !utrInput.trim()) {
                        toast.error("UTR is required for online payment");
                        return;
                      }

                      setCollecting((prev) => ({
                        ...prev,
                        [`${currentPayment.$id}-${currentPayment.type}`]: true,
                      }));

                      try {
                        const TODAY = new Date();
                        // Set to tomorrow for rent collection
                        const TOMORROW = new Date(TODAY);
                        TOMORROW.setDate(TODAY.getDate() + 1);
                        TOMORROW.setHours(0, 0, 0, 0);

                        // Update user in usersCollId
                        await databases.updateDocument(
                          dbId,
                          usersCollId,
                          currentPayment.userId,
                          {
                            pendingAmount:
                              currentPayment.type === "pending"
                                ? 0
                                : currentPayment.pendingAmount,
                            ...(currentPayment.type === "rent" && {
                              lastRentCollectionDate: TOMORROW.toISOString(),
                            }),
                          }
                        );

                        // Create payment record in paymentRecordsCollId
                        await databases.createDocument(
                          dbId,
                          paymentRecordsCollId,
                          "unique()",
                          {
                            userId: currentPayment.userId,
                            amount: currentPayment.amount,
                            type:
                              currentPayment.type === "rent"
                                ? "rent_collection"
                                : "pending_clearance",
                            method: paymentMethod,
                            utrNumber:
                              paymentMethod === "online"
                                ? utrInput.trim()
                                : null,
                            date: TODAY.toISOString(),
                          }
                        );

                        // Update UI
                        const fieldToReset =
                          currentPayment.type === "rent"
                            ? "rentDue"
                            : "pendingAmount";
                        const updatedPayments = payments
                          .map((p) =>
                            p.$id === currentPayment.$id
                              ? {
                                  ...p,
                                  [fieldToReset]: 0,
                                  totalToCollect:
                                    p.totalToCollect - currentPayment.amount,
                                  ...(currentPayment.type === "rent" && {
                                    daysSinceLast: 0,
                                    lastRentDate: TOMORROW.toISOString(),
                                    cycleStartDate: TOMORROW.toISOString(),
                                  }),
                                }
                              : p
                          )
                          .filter((p) => p.pendingAmount > 0 || p.hasBike);

                        setPayments(updatedPayments);
                        setTotalAmount(
                          updatedPayments.reduce(
                            (sum, p) => sum + p.totalToCollect,
                            0
                          )
                        );

                        toast.success(
                          `Collected ₹${
                            currentPayment.amount
                          } via ${paymentMethod.toUpperCase()}!`
                        );
                      } catch (error) {
                        toast.error(`Failed: ${error.message}`);
                      } finally {
                        setCollecting((prev) => ({
                          ...prev,
                          [`${currentPayment.$id}-${currentPayment.type}`]: false,
                        }));
                        setShowPaymentModal(false);
                        setUtrInput("");
                        setPaymentMethod("cash");
                      }
                    }}
                    disabled={
                      collecting[`${currentPayment.$id}-${currentPayment.type}`]
                    }
                    className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {collecting[`${currentPayment.$id}-${currentPayment.type}`]
                      ? "Processing..."
                      : "Confirm & Collect"}
                  </button>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setUtrInput("");
                      setPaymentMethod("cash");
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Payments;
