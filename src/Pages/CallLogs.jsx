import React, { useState, useEffect } from "react";
import { databases } from "../appwrite";
import { Query } from "appwrite";
import toast from "react-hot-toast";

const CallLogs = () => {
    const dbId = import.meta.env.VITE_DB_ID;
    const usersCollId = import.meta.env.VITE_USERS_COLL_ID;
    const companyCollId = import.meta.env.VITE_COMPANY_COLL_ID;

    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("not_picked"); // "all", "picked", "not_picked"
    const [searchQuery, setSearchQuery] = useState("");
    const [searchType, setSearchType] = useState("phone"); // "phone" or "name"

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            fetchUsers();
        } else {
            setUsers([]);
        }
    }, [selectedCompany]);

    const fetchCompanies = async () => {
        try {
            const res = await databases.listDocuments(dbId, companyCollId);
            setCompanies(res.documents);
        } catch (e) {
            toast.error("Failed to load companies");
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const company = companies.find((c) => c.$id === selectedCompany);
            if (!company) return;

            const res = await databases.listDocuments(dbId, usersCollId, [
                Query.equal("userCompany", company.companyName),
                Query.equal("userStatus", true),
                Query.isNotNull("bikeId"),
                Query.limit(500),
            ]);

            setUsers(res.documents);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const updateCallStatus = async (userId, status) => {
        // Optimistic Update
        setUsers((prev) =>
            prev.map((u) =>
                u.$id === userId ? { ...u, lastCallStatus: status, lastCallDate: new Date().toISOString() } : u
            )
        );

        try {
            await databases.updateDocument(dbId, usersCollId, userId, {
                lastCallStatus: status,
                lastCallDate: new Date().toISOString(),
            });
            toast.success(status === "picked" ? "Marked as Picked" : "Marked as Not Picked");
        } catch (error) {
            console.error("Failed to update call status:", error);
            toast.error("Failed to update status");
            fetchUsers(); // Revert
        }
    };

    const getDayName = (dayNum) => {
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return days[dayNum] || "N/A";
    };

    const getFilteredAndSortedUsers = () => {
        let filtered = [...users];

        // Filter by call status
        if (filter === "picked") {
            filtered = filtered.filter((u) => u.lastCallStatus === "picked");
        } else if (filter === "not_picked") {
            filtered = filtered.filter((u) => u.lastCallStatus === "not_picked");
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter((u) => {
                if (searchType === "phone") {
                    return u.userPhone?.toLowerCase().includes(query);
                } else if (searchType === "name") {
                    return u.userName?.toLowerCase().includes(query);
                }
                return true;
            });
        }

        // Sort by recent actions (recently called first)
        // If no date, put at bottom
        return filtered.sort((a, b) => {
            const dateA = a.lastCallDate ? new Date(a.lastCallDate).getTime() : 0;
            const dateB = b.lastCallDate ? new Date(b.lastCallDate).getTime() : 0;
            return dateB - dateA;
        });
    };

    const filteredUsers = getFilteredAndSortedUsers();

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 bg-white min-h-screen pb-24">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Call Logs</h1>
                    <p className="text-gray-600">Manage user calls and statuses</p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 w-full sm:w-auto"
                >
                    Refresh
                </button>
            </div>

            <div className="mb-6">
                <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full max-w-md px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select Company</option>
                    {companies.map((c) => (
                        <option key={c.$id} value={c.$id}>
                            {c.companyName}{" "}
                            {c.salaryDay !== undefined &&
                                `(Salary: ${getDayName(c.salaryDay)})`}
                        </option>
                    ))}
                </select>
            </div>

            {selectedCompany && (
                <>
                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row gap-2 max-w-2xl">
                            <select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value)}
                                className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white sm:w-32"
                            >
                                <option value="phone">Phone</option>
                                <option value="name">Name</option>
                            </select>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={`Search by ${searchType}...`}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 pr-10"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        title="Clear search"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        {searchQuery && (
                            <p className="text-sm text-gray-600 mt-2">
                                Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchQuery}"
                            </p>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                        <button
                            onClick={() => setFilter("not_picked")}
                            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${filter === "not_picked"
                                ? "border-red-600 text-red-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Not Picked (Rejected)
                        </button>
                        <button
                            onClick={() => setFilter("picked")}
                            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${filter === "picked"
                                ? "border-green-600 text-green-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            Picked
                        </button>
                        <button
                            onClick={() => setFilter("all")}
                            className={`px-6 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${filter === "all"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                        >
                            All Users
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-500">No users found for this filter.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.$id}
                                    className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-900">
                                                {user.userName}
                                            </h3>
                                            <p className="text-sm text-gray-600">{user.userPhone}</p>
                                        </div>
                                        {user.lastCallDate && (
                                            <div className="text-xs text-right text-gray-400">
                                                {new Date(user.lastCallDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}<br />
                                                {new Date(user.lastCallDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-2 text-sm text-gray-600 mb-4">
                                        <p>Pending: <span className={user.pendingAmount > 0 ? "text-red-600 font-medium" : "text-gray-600"}>
                                            ₹{(user.pendingAmount || 0).toLocaleString("en-IN")}
                                        </span></p>
                                    </div>

                                    <div className="mt-auto flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                        <a
                                            href={`tel:${user.userPhone}`}
                                            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                            title="Call"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                            </svg>
                                        </a>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateCallStatus(user.$id, "picked")}
                                                className={`flex-1 px-1 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-wide transition-all ${user.lastCallStatus === "picked"
                                                    ? "bg-green-600 text-white shadow-md ring-1 ring-green-200"
                                                    : "bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                                    }`}
                                            >
                                                Picked
                                            </button>
                                            <button
                                                onClick={() => updateCallStatus(user.$id, "not_picked")}
                                                className={`flex-1 px-1 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-wide transition-all ${user.lastCallStatus === "not_picked"
                                                    ? "bg-red-600 text-white shadow-md ring-1 ring-red-200"
                                                    : "bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                                    }`}
                                            >
                                                Rejected
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CallLogs;
