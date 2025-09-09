// @ts-nocheck

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/providers";
import apiService from "@/services/api";

interface TutorLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/tutor/dashboard",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
        />
      </svg>
    ),
  },
  {
    name: "Opportunities",
    href: "/tutor/opportunities",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    name: "Tutorial",
    href: "/tutor/tutorial",
    icon: (
      <svg
        className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 6v6m0 0l-2-2m2 2l2-2m-7 8h10a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
    highlight: true,
  },
];

export function TutorLayout({ children }: TutorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingSchedulingCount, setPendingSchedulingCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  // Fix hydration mismatch by only showing notifications after client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch notification data on component mount and periodically
  useEffect(() => {
    const fetchNotificationData = async () => {
      if (!user) return;
      
      try {
        const response = await apiService.getTutorDashboard();
        if (response?.jobs) {
          const count = response.jobs.filter((j: any) => j.status === 'pending_tutor_scheduling').length;
          setPendingSchedulingCount(count);
        }
      } catch (error) {
        console.error('Failed to fetch tutor notification data:', error);
      }
    };

    fetchNotificationData();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotificationData, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Also refresh when pathname changes (user navigates)
  useEffect(() => {
    if (user) {
      const fetchNotificationData = async () => {
        try {
          const response = await apiService.getTutorDashboard();
          if (response?.jobs) {
            const count = response.jobs.filter((j: any) => j.status === 'pending_tutor_scheduling').length;
            setPendingSchedulingCount(count);
          }
        } catch (error) {
          console.error('Failed to fetch tutor notification data:', error);
        }
      };
      fetchNotificationData();
    }
  }, [pathname, user]);

  const handleSignOut = async () => {
    console.log("Sidebar: Starting sign out...");
    await signOut();
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img
                  src="/sidebar_logo.png"
                  alt="Tutoring Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="ml-3 mt-1 text-lg font-semibold text-gray-900">
                Tutoring
              </span>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center">
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </div>
                  {item.name === "Dashboard" &&
                    isClient &&
                    pendingSchedulingCount > 0 && (
                      <div className="bg-red-600 text-white w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center">
                        {pendingSchedulingCount}
                      </div>
                    )}
                </Link>
              );
            })}
          </nav>

          {/* User info and sign out */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {(user?.email?.replace(/(^[^@\s]+)(\+(?:tutor|tutee))@([Hh][Dd][Ss][Bb]\.ca)$/,'$1@$3') || '').charAt(0).toUpperCase() || "T"}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email?.replace(/(^[^@\s]+)(\+(?:tutor|tutee))@([Hh][Dd][Ss][Bb]\.ca)$/,'$1@$3') || "Tutor"}
                </p>
                <p className="text-xs text-gray-500">Tutor Account</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="ml-3">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign Out
          </button>
        </div>

        {/* Top actions bar (desktop) */}
        <div className="hidden lg:flex items-center justify-end bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={handleSignOut}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign Out
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
