'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnalyticsApi } from '@/lib/api/analytics';
import { MarksApi } from '@/lib/api/marks';
import {
  CourseOverviewDBObject,
  AssessmentAnalyticsDBObject,
  AssessmentMarkFrequencyDBObject,
} from '@/lib/types/analytics';
import { AssessmentDBObject } from '@/lib/types/assessments';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import InstructorNavbar from '@/components/Course/InstructorNavbar';
import { BiArrowBack, BiBarChartAlt2, BiHash, BiStats, BiTrendingUp, BiUser } from 'react-icons/bi';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id ? Number(params.id) : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [courseOverview, setCourseOverview] = useState<CourseOverviewDBObject | null>(null);
  const [assessments, setAssessments] = useState<AssessmentDBObject[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [assessmentAnalytics, setAssessmentAnalytics] =
    useState<AssessmentAnalyticsDBObject | null>(null);
  const [assessmentFrequencies, setAssessmentFrequencies] = useState<
    AssessmentMarkFrequencyDBObject[]
  >([]);

  // Fetch course overview and assessments
  useEffect(() => {
    if (!courseId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewData, assessmentsData] = await Promise.all([
          AnalyticsApi.GetCourseAnalytics(courseId),
          MarksApi.GetAllAssessments(courseId),
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
        setError(err?.message || 'Failed to fetch analytics data');
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
          AnalyticsApi.GetAssessmentFrequencies(courseId, selectedAssessmentId),
        ]);

        // Handle analytics response - extract from assessment_analytics key
        const analyticsData = (analytics as any)?.assessment_analytics || analytics;
        setAssessmentAnalytics(analyticsData as AssessmentAnalyticsDBObject);

        // Handle frequencies response
        const frequenciesData = Array.isArray(frequencies)
          ? frequencies
          : (frequencies as any)?.frequencies || (frequencies as any)?.data || [];
        setAssessmentFrequencies(frequenciesData);
      } catch (err: any) {
        console.error('Failed to fetch assessment analytics:', err);
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

  const selectedAssessment = assessments.find(
    (assessment) => assessment.id === selectedAssessmentId
  );
  const maxPossibleMarks = selectedAssessment?.max_marks ?? assessmentAnalytics?.max ?? 100;
  const observedMaxMark = assessmentFrequencies.reduce(
    (highest, entry) => Math.max(highest, entry.mark),
    0
  );
  const histogramUpperBound = Math.max(maxPossibleMarks, observedMaxMark, 1);
  const binCount = Math.min(
    10,
    Math.max(5, Math.ceil(Math.sqrt(Math.max(assessmentFrequencies.length, 1))))
  );
  const binSize = Math.max(1, Math.ceil(histogramUpperBound / binCount));
  const bins = Array.from({ length: Math.ceil(histogramUpperBound / binSize) }, (_, index) => {
    const start = index * binSize;
    const end = Math.min(start + binSize, histogramUpperBound);
    const isLastBin = index === Math.ceil(histogramUpperBound / binSize) - 1;
    const frequency = assessmentFrequencies.reduce((count, entry) => {
      const inRange = isLastBin
        ? entry.mark >= start && entry.mark <= end
        : entry.mark >= start && entry.mark < end;
      return inRange ? count + entry.frequency : count;
    }, 0);

    return {
      label: start === end ? `${start}` : `${start}-${end}`,
      frequency,
    };
  });

  const frequencyChartData = {
    labels: bins.map((bin) => bin.label),
    datasets: [
      {
        label: 'Student Count',
        data: bins.map((bin) => bin.frequency),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 10,
        maxBarThickness: 48,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f2937',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items: any) => `Mark range: ${items[0].label}`,
          label: (item: any) => `${item.raw} Students`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { display: true, borderDash: [2, 4], color: '#f3f4f6' },
        title: { display: true, text: 'Number of Students' },
      },
      x: {
        grid: { display: true, borderDash: [2, 4], color: '#f3f4f6' },
        title: { display: true, text: 'Marks Range' },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
        },
      },
    },
  };

  return (
    <>
      <InstructorNavbar />
      <div className="flex flex-col overflow-y-auto h-[calc(100vh-96px)] bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
              >
                <BiArrowBack className="text-xl" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Course Analytics
                </h1>
                <p className="text-xs text-gray-500">Performance insights and grade distribution</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {courseOverview && (
              <section>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Course Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <OverviewCard
                    label="Total Students"
                    value={courseOverview.total_students}
                    trend="Enrolled"
                  />
                  <OverviewCard
                    label="Class Average"
                    value={courseOverview.mean?.toFixed(1)}
                    trend="Mean Score"
                    accentColor="text-green-600"
                  />
                  <OverviewCard
                    label="Median Score"
                    value={courseOverview.median?.toFixed(1)}
                    trend="Middle Point"
                    accentColor="text-purple-600"
                  />
                  <OverviewCard
                    label="Standard Dev"
                    value={courseOverview.std?.toFixed(2)}
                    trend="Variability"
                    accentColor="text-orange-600"
                  />
                </div>
              </section>
            )}

            <hr className="border-gray-200" />

            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">Assessment Analysis</h2>

                {assessments.length > 0 && (
                  <div className="relative">
                    <select
                      value={selectedAssessmentId || ''}
                      onChange={(e) => setSelectedAssessmentId(Number(e.target.value))}
                      className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium min-w-60"
                    >
                      {assessments.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {assessmentAnalytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-6">
                      Performance Metrics
                    </h3>

                    <div className="space-y-6">
                      <MetricRow
                        label="Average Score"
                        value={assessmentAnalytics.mean}
                        max={
                          selectedAssessmentId
                            ? assessments.filter((a) => a.id === selectedAssessmentId)[0]?.max_marks
                            : 100
                        }
                        color="bg-blue-500"
                      />
                      <MetricRow
                        label="Median Score"
                        value={assessmentAnalytics.median}
                        max={
                          selectedAssessmentId
                            ? assessments.filter((a) => a.id === selectedAssessmentId)[0]?.max_marks
                            : 100
                        }
                        color="bg-purple-500"
                      />
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Highest</div>
                          <div className="text-xl font-bold text-green-600">
                            {assessmentAnalytics.max}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Lowest</div>
                          <div className="text-xl font-bold text-red-600">
                            {assessmentAnalytics.min}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-semibold text-gray-900">Grade Distribution</h3>
                      <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded text-gray-600">
                        Frequency Histogram
                      </span>
                    </div>
                    <div className="h-64 md:h-80">
                      <Bar data={frequencyChartData} options={chartOptions} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500">Select an assessment to view detailed analytics.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

function OverviewCard({
  label,
  value,
  trend,
  accentColor = 'text-gray-900',
}: {
  label: string;
  value: string | number | null;
  trend: string;
  accentColor?: string;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <h3 className={`text-2xl font-bold mt-1 ${accentColor}`}>{value || '-'}</h3>
        <p className="text-xs text-gray-400 mt-1">{trend}</p>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-lg flex flex-row gap-1 font-bold items-center text-gray-900">
          {typeof value === 'number' ? value.toFixed(2) : 'N/A'}
          <p className="text-xs opacity-50">/{max}</p>
        </span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
