"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnalyticsApi } from "@/lib/api/analytics";
import { MarksApi } from "@/lib/api/marks";
import { CourseOverviewDBObject, AssessmentAnalyticsDBObject, AssessmentMarkFrequencyDBObject } from "@/lib/types/analytics";
import { AssessmentDBObject } from "@/lib/types/assessments";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import InstructorNavbar from "@/components/Course/InstructorNavbar";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsPage() {
  const router = useRouter();
  const courseId = useParams()?.id ? Number(useParams().id) : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [courseOverview, setCourseOverview] = useState<CourseOverviewDBObject | null>(null);
  const [assessments, setAssessments] = useState<AssessmentDBObject[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [assessmentAnalytics, setAssessmentAnalytics] = useState<AssessmentAnalyticsDBObject | null>(null);
  const [assessmentFrequencies, setAssessmentFrequencies] = useState<AssessmentMarkFrequencyDBObject[]>([]);


  // Fetch course overview and assessments
  useEffect(() => {
    if (!courseId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewData, assessmentsData] = await Promise.all([
          AnalyticsApi.GetCourseAnalytics(courseId),
          MarksApi.GetAllAssessments(courseId)
        ]);

        // Handle overview response - it might be wrapped in an object
        const overview = (overviewData as any)?.overview || overviewData;
        setCourseOverview(overview as CourseOverviewDBObject);
        
        const assessmentList = Array.isArray(assessmentsData) 
          ? assessmentsData 
          : (assessmentsData as any)?.assessments || [];
        setAssessments(assessmentList);
        
        if (assessmentList.length > 0) {
          setSelectedAssessmentId(assessmentList[0].id);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to fetch analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  // Fetch assessment-specific analytics
  useEffect(() => {
    if (!courseId || !selectedAssessmentId) return;

    const fetchAssessmentData = async () => {
      try {
        const [analytics, frequencies] = await Promise.all([
          AnalyticsApi.GetAssessmentAnalytics(courseId, selectedAssessmentId),
          AnalyticsApi.GetAssessmentFrequencies(courseId, selectedAssessmentId)
        ]);

        // Handle analytics response - extract from assessment_analytics key
        const analyticsData = (analytics as any)?.assessment_analytics || analytics;
        setAssessmentAnalytics(analyticsData as AssessmentAnalyticsDBObject);
        
        // Handle frequencies response
        const frequenciesData = Array.isArray(frequencies) 
          ? frequencies 
          : (frequencies as any)?.frequencies || 
            (frequencies as any)?.data || [];
        setAssessmentFrequencies(frequenciesData);
      } catch (err: any) {
        console.error("Failed to fetch assessment analytics:", err);
      }
    };

    fetchAssessmentData();
  }, [courseId, selectedAssessmentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-600 text-lg">{error}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const frequencyChartData = {
    labels: assessmentFrequencies.map(f => f.mark.toString()),
    datasets: [{
      label: 'Frequency',
      data: assessmentFrequencies.map(f => f.frequency),
      backgroundColor: 'rgba(34, 197, 94, 0.6)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 2,
      tension: 0.4,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <>
        <InstructorNavbar />
        <div className="p-6 overflow-y-auto h-[calc(100vh-96px)] bg-gray-50">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Course Analytics</h1>
            <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
            </button>
        </div>

        {/* Course Overview Stats */}
        {courseOverview && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total Students" value={courseOverview.total_students ?? 0} />
            <StatCard label="Mean" value={courseOverview.mean?.toFixed(2) ?? 'N/A'} />
            <StatCard label="Median" value={courseOverview.median?.toFixed(2) ?? 'N/A'} />
            <StatCard label="Max" value={courseOverview.max?.toFixed(2) ?? 'N/A'} />
            <StatCard label="Min" value={courseOverview.min?.toFixed(2) ?? 'N/A'} />
            <StatCard label="Std Dev" value={courseOverview.std?.toFixed(2) ?? 'N/A'} />
            </div>
        )}

        {/* Assessment Selection */}
        {assessments.length > 0 && (
            <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Assessment
            </label>
            <select
                value={selectedAssessmentId || ''}
                onChange={(e) => setSelectedAssessmentId(Number(e.target.value))}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                    {assessment.name}
                </option>
                ))}
            </select>
            </div>
        )}

        {/* Assessment Analytics */}
        {assessmentAnalytics && (
            <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Assessment Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard label="Mean" value={assessmentAnalytics.mean?.toFixed(2) ?? 'N/A'} color="bg-blue-50" />
                <StatCard label="Median" value={assessmentAnalytics.median?.toFixed(2) ?? 'N/A'} color="bg-blue-50" />
                <StatCard label="Max" value={assessmentAnalytics.max?.toFixed(2) ?? 'N/A'} color="bg-blue-50" />
                <StatCard label="Min" value={assessmentAnalytics.min?.toFixed(2) ?? 'N/A'} color="bg-blue-50" />
                <StatCard label="Std Dev" value={assessmentAnalytics.std?.toFixed(2) ?? 'N/A'} color="bg-blue-50" />
            </div>
            </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Frequency Distribution Chart */}
            {assessmentFrequencies.length > 0 && (
            <ChartCard title="Mark Frequency Distribution">
                <Line data={frequencyChartData} options={chartOptions} />
            </ChartCard>
            )}
        </div>
        </div>
    </>
  );
}

// Reusable Components
function StatCard({ label, value, color = "bg-white" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className={`${color} p-4 rounded-lg shadow-sm border border-gray-200`}>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="h-80">
        {children}
      </div>
    </div>
  );
}
