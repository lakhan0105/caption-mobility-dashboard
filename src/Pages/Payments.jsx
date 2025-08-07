import React, { useState, useEffect } from "react";
import { databases } from "../appwrite"; // Adjust import path as needed
import { Query } from "appwrite";

const Payments = () => {
  const dbId = import.meta.env.VITE_DB_ID;
  const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
  const paymentRecordsCollId = import.meta.env.VITE_PAYMENT_RECORDS_COLL_ID;
  const companyCollId = import.meta.env.VITE_COMPANY_COLL_ID;

  const [payments, setPayments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [collectingPayment, setCollectingPayment] = useState(null);

  useEffect(() => {
    // Check localStorage for cached companies
    const cachedCompanies = localStorage.getItem("companies_cache");
    const cacheTime = localStorage.getItem("companies_cache_time");

    if (cachedCompanies && cacheTime) {
      const timeDiff = Date.now() - parseInt(cacheTime);
      // Use cache if less than 5 minutes old
      if (timeDiff < 5 * 60 * 1000) {
        setCompanies(JSON.parse(cachedCompanies));
        return;
      }
    }
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      // Check localStorage for cached payments
      const cachedPayments = localStorage.getItem(
        `payments_${selectedCompany}`
      );
      const cacheTime = localStorage.getItem(
        `payments_${selectedCompany}_time`
      );

      if (cachedPayments && cacheTime) {
        const timeDiff = Date.now() - parseInt(cacheTime);
        // Use cache if less than 2 minutes old
        if (timeDiff < 2 * 60 * 1000) {
          const parsedPayments = JSON.parse(cachedPayments);
          setPayments(parsedPayments);
          const total = parsedPayments.reduce(
            (sum, payment) => sum + payment.amount,
            0
          );
          setTotalAmount(total);
          return;
        }
      }
      fetchTodaysPayments();
    }
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      const response = await databases.listDocuments(dbId, companyCollId);
      setCompanies(response.documents);

      // Cache companies data
      localStorage.setItem(
        "companies_cache",
        JSON.stringify(response.documents)
      );
      localStorage.setItem("companies_cache_time", Date.now().toString());
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchTodaysPayments = async () => {
    setLoading(true);
    try {
      // Get selected company details
      const selectedCompanyData = companies.find(
        (c) => c.$id === selectedCompany
      );

      if (!selectedCompanyData) {
        setLoading(false);
        return;
      }

      console.log("Selected company:", selectedCompanyData.companyName);

      // Get all users from the selected company
      const usersResponse = await databases.listDocuments(dbId, usersCollId, [
        Query.equal("userCompany", selectedCompanyData.companyName),
      ]);

      console.log("Users found for company:", usersResponse.documents.length);

      if (usersResponse.documents.length === 0) {
        setPayments([]);
        setTotalAmount(0);
        setLoading(false);
        return;
      }

      // Get user IDs from the company   
      const companyUserIds = usersResponse.documents.map((user) => user.$id);
      console.log("User IDs:", companyUserIds);

      // Get all pending payment records for these users
      const paymentsResponse = await databases.listDocuments(
        dbId,
        paymentRecordsCollId,
        [Query.equal("type", "pending")]
      );

      console.log("All pending payments:", paymentsResponse.documents.length);

      // Filter payments for users of selected company
      const userPayments = [];
      const userMap = {};

      // Create user map for easy lookup
      usersResponse.documents.forEach((user) => {
        userMap[user.$id] = user;
      });

      // Process payments - filter by company users
      paymentsResponse.documents.forEach((payment) => {
        if (companyUserIds.includes(payment.userId)) {
          const user = userMap[payment.userId];
          if (user) {
            userPayments.push({
              ...payment,
              userName: user.userName,
              userPhone: user.userPhone,
            });
          }
        }
      });

      console.log("Filtered payments for company:", userPayments.length);

      setPayments(userPayments);

      const total = userPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );
      setTotalAmount(total);

      // Cache payments data
      localStorage.setItem(
        `payments_${selectedCompany}`,
        JSON.stringify(userPayments)
      );
      localStorage.setItem(
        `payments_${selectedCompany}_time`,
        Date.now().toString()
      );
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const collectPayment = async (payment) => {
    setCollectingPayment(payment.$id);
    try {
      // Update the payment record to mark as collected
      await databases.updateDocument(dbId, paymentRecordsCollId, payment.$id, {
        type: "collected", // Change from 'pending' to 'collected'
      });

      // Update user's pending amount (subtract the collected amount)
      const user = await databases.getDocument(
        dbId,
        usersCollId,
        payment.userId
      );
      const currentPending = parseInt(user.pendingAmount || "0");
      const newPending = Math.max(0, currentPending - payment.amount);

      if (user.pendingAmount) {
        await databases.updateDocument(dbId, usersCollId, payment.userId, {
          pendingAmount: newPending.toString(),
        });
      }

      // Remove the collected payment from the list
      const updatedPayments = payments.filter((p) => p.$id !== payment.$id);
      setPayments(updatedPayments);

      // Update total amount
      const newTotal = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
      setTotalAmount(newTotal);

      // Update cache
      localStorage.setItem(
        `payments_${selectedCompany}`,
        JSON.stringify(updatedPayments)
      );
      localStorage.setItem(
        `payments_${selectedCompany}_time`,
        Date.now().toString()
      );

      alert(
        `₹${payment.amount} collected successfully from ${payment.userName}!`
      );
    } catch (error) {
      console.error("Error collecting payment:", error);
      alert("Failed to collect payment. Please try again.");
    } finally {
      setCollectingPayment(null);
    }
  };

  const refreshData = () => {
    // Clear localStorage cache
    localStorage.removeItem("companies_cache");
    localStorage.removeItem("companies_cache_time");
    // Clear all payment caches
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("payments_")) {
        localStorage.removeItem(key);
      }
    });

    setPayments([]);
    setSelectedCompany("");
    fetchCompanies();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case "rent":
        return "bg-blue-100 text-blue-800";
      case "deposit":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMethodBadge = (method) => {
    return method === "cash"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-purple-100 text-purple-800";
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
              View all pending payments by company
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

      {/* Company Selection */}
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
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Pending Payments Collection
                </h3>
                <p className="text-sm text-gray-600">
                  {payments.length} pending payment(s) found
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl font-bold text-green-600">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-gray-600">Total Amount</p>
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
                No pending payments found for this company
              </p>
            </div>
          ) : (
            /* Responsive Payments Display */
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
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
                            {payment.userPhone || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{payment.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentTypeColor(
                                payment.type
                              )}`}
                            >
                              {payment.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodBadge(
                                payment.method
                              )}`}
                            >
                              {payment.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.date)}
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

              {/* Mobile Card View */}
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
                          {payment.userPhone || "N/A"}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-900">
                          ₹{payment.amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentTypeColor(
                          payment.type
                        )}`}
                      >
                        {payment.type}
                      </span>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodBadge(
                          payment.method
                        )}`}
                      >
                        {payment.method}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        {formatDate(payment.date)}
                      </p>
                      <button
                        onClick={() => collectPayment(payment)}
                        disabled={collectingPayment === payment.$id}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          collectingPayment === payment.$id
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                        }`}
                      >
                        {collectingPayment === payment.$id
                          ? "Collecting..."
                          : "Collect"}
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