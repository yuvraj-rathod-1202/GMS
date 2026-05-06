'use client';
import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiUsers, FiBookOpen, FiBarChart2, FiRefreshCw } from 'react-icons/fi';
import { AdminApi } from '@/lib/api/admin';
import { SystemOverviewDBObject } from '@/lib/types/analytics';

export default function AnalyticsPanel() {
  const [analytics, setAnalytics] = useState<SystemOverviewDBObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminApi.FetchSystemAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const StatCard = ({
    title,
    value,
    subtext,
    color,
  }: {
    title: string;
    value: string | number;
    subtext?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
        <p className="font-medium mb-2">Failed to load analytics</p>
        <p>{error}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-3 px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-12 text-gray-500">No analytics data available</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
        <button
          onClick={fetchAnalytics}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-gray-900"
          title="Refresh analytics"
        >
          <FiRefreshCw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <StatCard
          title="Total Courses"
          value={analytics.total_courses}
          subtext={`${analytics.active_courses} active, ${analytics.inactive_courses} inactive`}
          color="bg-blue-500"
        />

        <StatCard
          title="Enrolled Students"
          value={analytics.total_students}
          subtext="Across all courses"
          color="bg-green-500"
        />

        <StatCard
          title="Instructors"
          value={analytics.total_instructors}
          subtext="Teaching courses"
          color="bg-purple-500"
        />
      </div>
    </div>
  );
}
