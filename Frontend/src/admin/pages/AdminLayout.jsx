import React, { useState } from "react";
import { NavLink, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import AdminOverviewPage from "./AdminOverviewPage";
import AdminUsersPage from "./AdminUsersPage";
import AdminProductsPage from "./AdminProductsPage";
import AdminOrdersPage from "./AdminOrdersPage";
import AdminEnvironmentPage from "./AdminEnvironmentPage";
import {
    FiGrid, FiUsers, FiPackage, FiShoppingCart,
    FiLogOut, FiChevronLeft, FiChevronRight, FiMenu,
    FiShield
} from "react-icons/fi";
import { FaLeaf } from "react-icons/fa";

const NAV = [
    { to: "overview", icon: <FiGrid />, label: "Dashboard", badge: null },
    { to: "users", icon: <FiUsers />, label: "Users", badge: null },
    { to: "products", icon: <FiPackage />, label: "Products", badge: null },
    { to: "orders", icon: <FiShoppingCart />, label: "Orders", badge: null },
    { to: "environment", icon: <FaLeaf />, label: "Eco Impact", badge: null },
];

export default function AdminLayout() {
    const { admin, adminLogout } = useAdminAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await adminLogout();
        navigate("/admin/login");
    };

    const pageLabel = NAV.find(n => window.location.pathname.includes(n.to))?.label || "Admin Console";

    return (
        <div className="min-h-screen flex bg-[#f1f5f9] font-sans antialiased overflow-hidden">
            {/* ── Desktop Sidebar ── */}
            <aside
                className={`hidden md:flex flex-col z-30 transition-all duration-300 ease-in-out flex-shrink-0`}
                style={{ width: sidebarOpen ? 252 : 72, minHeight: "100vh" }}
            // Deep navy sidebar — industrial look
            >
                {/* Sidebar inner with gradient */}
                <div className="flex flex-col h-full"
                    style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)" }}>

                    {/* Logo */}
                    <div className="h-16 flex items-center px-5 border-b border-white/5">
                        <div className="flex items-center gap-3 w-full overflow-hidden">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow"
                                style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                                <FiShield className="text-white" size={16} />
                            </div>
                            {sidebarOpen && (
                                <div className="overflow-hidden whitespace-nowrap">
                                    <p className="text-white font-black text-sm tracking-tight leading-none">EcoFinds</p>
                                    <p className="text-indigo-400 text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5">Admin Console</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Toggle button */}
                    <div className="absolute top-16 -right-3.5 z-40">
                        <button
                            onClick={() => setSidebarOpen(o => !o)}
                            className="w-7 h-7 bg-[#1e293b] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white shadow-lg transition-all"
                        >
                            {sidebarOpen ? <FiChevronLeft size={14} /> : <FiChevronRight size={14} />}
                        </button>
                    </div>

                    {/* Section label */}
                    {sidebarOpen && (
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-5 mt-6 mb-2">Navigation</p>
                    )}

                    {/* Nav */}
                    <nav className="flex-1 py-2 space-y-0.5 px-2.5">
                        {NAV.map((item) => (
                            <NavLink
                                key={item.to}
                                to={`/admin/${item.to}`}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative ${isActive
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                                    }`
                                }
                            >
                                <span className="text-[18px] flex-shrink-0">{item.icon}</span>
                                {sidebarOpen && (
                                    <span className="whitespace-nowrap tracking-tight">{item.label}</span>
                                )}
                                {!sidebarOpen && (
                                    <div className="absolute left-14 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
                                        {item.label}
                                    </div>
                                )}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Admin footer */}
                    <div className="p-3 border-t border-white/5">
                        {sidebarOpen && (
                            <div className="mb-2 px-3 py-3 rounded-xl bg-white/5 border border-white/5">
                                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-1">Signed in as</p>
                                <p className="text-sm text-white font-bold truncate leading-tight">{admin?.name || "Administrator"}</p>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">{admin?.email}</p>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-slate-500 hover:bg-red-500/10 hover:text-red-400 ${!sidebarOpen ? "justify-center" : ""}`}
                        >
                            <FiLogOut size={16} className="flex-shrink-0" />
                            {sidebarOpen && <span>Sign Out</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Topbar */}
                <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-300 hidden md:inline">/</span>
                            <h2 className="text-sm font-bold text-slate-700 tracking-tight">{pageLabel}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Live</span>
                        </div>
                        {/* Mobile Logout */}
                        <button
                            onClick={handleLogout}
                            title="Sign Out"
                            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                            <FiLogOut size={14} />
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
                    <div className="max-w-7xl mx-auto w-full">
                        <Routes>
                            <Route index element={<Navigate to="overview" replace />} />
                            <Route path="overview" element={<AdminOverviewPage />} />
                            <Route path="users" element={<AdminUsersPage />} />
                            <Route path="products" element={<AdminProductsPage />} />
                            <Route path="orders" element={<AdminOrdersPage />} />
                            <Route path="environment" element={<AdminEnvironmentPage />} />
                        </Routes>
                    </div>
                </main>
            </div>

            {/* ── Mobile Sticky Bottom Nav (below md) ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <ul className="flex items-stretch justify-around">
                    {NAV.map((item) => (
                        <li key={item.to} className="flex-1">
                            <NavLink
                                to={`/admin/${item.to}`}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center w-full py-2.5 gap-1 transition-colors relative ${
                                        isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <span className="text-xl flex-shrink-0">{item.icon}</span>
                                        <span className={`text-[10px] font-bold leading-none ${isActive ? "text-indigo-600" : "text-slate-500"}`}>
                                            {item.label}
                                        </span>
                                        {isActive && (
                                            <span className="absolute top-0 w-full h-0.5 bg-indigo-600" />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}
