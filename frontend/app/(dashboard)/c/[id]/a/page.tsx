'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnalyticsApi } from '@/lib/api/analytics';
import { MarksApi } from '@/lib/api/marks';
import {
  CourseOverviewDBObject,
  AssessmentAnalyticsDBObject,
  AssessmentMarkFrequencyDBObject,
  CourseMarkFrequencyDBObject,
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
import TANavbar from '@/components/Course/TANavbar';
import { useRoleAccess } from '@/hooks/useRoleAccess';
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

  const { role } = useRoleAccess({
    allowedRoles: ['instructor', 'ta'],
    courseId: courseId || 0,
  });

  // Data states
  const [courseOverview, setCourseOverview] = useState<CourseOverviewDBObject | null>(null);
  const [assessments, setAssessments] = useState<AssessmentDBObject[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [assessmentAnalytics, setAssessmentAnalytics] =
    useState<AssessmentAnalyticsDBObject | CourseOverviewDBObject | null>(null);
  const [assessmentFrequencies, setAssessmentFrequencies] = useState<
    AssessmentMarkFrequencyDBObject[] | CourseMarkFrequencyDBObject[]
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

  // Fetch assessment-specific analytics OR course-wide analytics
  useEffect(() => {
    if (!courseId) return;

    if (selectedAssessmentId === undefined) return;

    const fetchAnalyticsData = async () => {
      try {
        if (selectedAssessmentId === null) {
          // Fetch Course Analytics and Frequencies
          const [analytics, frequencies] = await Promise.all([
            AnalyticsApi.GetCourseAnalytics(courseId),
            AnalyticsApi.GetCourseFrequencies(courseId),
          ]);
          
          const analyticsData = (analytics as any)?.overview || analytics;
          setAssessmentAnalytics(analyticsData);

          const frequenciesData = Array.isArray(frequencies)
            ? frequencies
            : (frequencies as any)?.frequencies || (frequencies as any)?.data || [];
          setAssessmentFrequencies(frequenciesData);
        } else {
          // Fetch Assessment Analytics
          const [analytics, frequencies] = await Promise.all([
            AnalyticsApi.GetAssessmentAnalytics(courseId, selectedAssessmentId),
            AnalyticsApi.GetAssessmentFrequencies(courseId, selectedAssessmentId),
          ]);

          const analyticsData = (analytics as any)?.assessment_analytics || analytics;
          setAssessmentAnalytics(analyticsData);

          const frequenciesData = Array.isArray(frequencies)
            ? frequencies
            : (frequencies as any)?.frequencies || (frequencies as any)?.data || [];
          setAssessmentFrequencies(frequenciesData);
        }
      } catch (err: any) {
        if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
          console.error('Failed to fetch analytics:', err);  
        }
      }
    };

    fetchAnalyticsData();
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

  const selectedAssessment = selectedAssessmentId === null 
    ? null 
    : assessments.find((assessment) => assessment.id === selectedAssessmentId);
  const maxPossibleMarks = selectedAssessmentId === null 
    ? 100
    : (selectedAssessment?.max_marks ?? (assessmentAnalytics as any)?.max ?? 100);

  const observedMaxMark = assessmentFrequencies.reduce(
    (highest, entry) => Math.max(highest, entry.mark),
    0
  );
  const observedMinMark = assessmentFrequencies.reduce(
    (lowest, entry) => Math.min(lowest, entry.mark),
    0
  );

  const histogramUpperBound = Math.max(maxPossibleMarks, observedMaxMark, 1);
  const histogramLowerBound = Math.min(0, observedMinMark);
  const range = Math.max(histogramUpperBound - histogramLowerBound, 1);

  const binCount = Math.min(
    10,
    Math.max(5, Math.ceil(Math.sqrt(Math.max(assessmentFrequencies.length, 1))))
  );
  
  const binSize = Math.max(1, Math.ceil(range / binCount));
  
  const totalBins = Math.ceil(range / binSize);
  const bins = Array.from({ length: totalBins }, (_, index) => {
    const start = histogramLowerBound + index * binSize;
    const end = Math.min(start + binSize, histogramUpperBound);
    const isLastBin = index === totalBins - 1;
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

  const meanLinePlugin = {
    id: 'meanMedianLines',
    afterDraw: (chart: any) => {
      const pluginOptions = chart.options.plugins?.meanMedianLines;
      if (!pluginOptions) return;
      
      const { mean, median, exactMin, exactRange } = pluginOptions;
      if (exactRange === undefined || exactRange === 0) return;

      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      
      const { left, right, top, bottom } = chartArea;

      const drawLine = (value: number, color: string, label: string) => {
        const fraction = Math.max(0, Math.min((value - exactMin) / exactRange, 1));
        const xPos = left + (right - left) * fraction;

        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(xPos, top);
        ctx.lineTo(xPos, bottom);
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, xPos, top - 6);
        ctx.restore();
      };

      if (mean !== null && mean !== undefined) {
        drawLine(mean, '#22c55e', 'Mean');
      }
      if (median !== null && median !== undefined) {
        drawLine(median, '#a855f7', 'Median');
      }
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 20 } },
    plugins: {
      meanMedianLines: {
        mean: assessmentAnalytics?.mean,
        median: assessmentAnalytics?.median,
        exactMin: histogramLowerBound,
        exactRange: totalBins * binSize,
      },
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
      {role === 'instructor' ? <InstructorNavbar /> : <TANavbar />}
      <div className="flex flex-col overflow-y-auto h-[calc(100vh-96px)] bg-gray-50">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {courseOverview && (
              <section>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <OverviewCard
                    label="Total Students"
                    value={courseOverview.total_students}
                  />
                  <OverviewCard
                    label="Average"
                    value={courseOverview.mean?.toFixed(1)}
                  />
                  <OverviewCard
                    label="Median"
                    value={courseOverview.median?.toFixed(1)}
                  />
                  <OverviewCard
                    label="STD"
                    value={courseOverview.std?.toFixed(2)}
                  />
                </div>
              </section>
            )}

            <hr className="border-gray-200" />

            <section className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                {assessments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedAssessmentId(null)}
                      className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                        selectedAssessmentId === null
                          ? 'bg-teal-50 text-gms-blue ring-1 ring-inset ring-gms-blue/20'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Total Mark
                    </button>
                    {assessments.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAssessmentId(a.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                          selectedAssessmentId === a.id
                            ? 'bg-teal-50 text-gms-blue ring-1 ring-inset ring-gms-blue/20'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {assessmentAnalytics ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

                    <div className="space-y-6">
                      <MetricRow
                        label="Mean"
                        value={assessmentAnalytics.mean}
                        max={
                          selectedAssessmentId
                            ? assessments.filter((a) => a.id === selectedAssessmentId)[0]?.max_marks
                            : 100
                        }
                        color="bg-green-500"
                      />
                      <MetricRow
                        label="Median"
                        value={assessmentAnalytics.median}
                        max={
                          selectedAssessmentId
                            ? assessments.filter((a) => a.id === selectedAssessmentId)[0]?.max_marks
                            : 100
                        }
                        color="bg-purple-500"
                      />
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Highest</div>
                          <div className="text-xl font-bold text-black">
                            {assessmentAnalytics.max}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Lowest</div>
                          <div className="text-xl font-bold text-black">
                            {assessmentAnalytics.min}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Std Dev</div>
                          <div className="text-xl font-bold text-black">
                            {assessmentAnalytics.std?.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="h-64 md:h-80">
                      <Bar data={frequencyChartData} options={chartOptions} plugins={[meanLinePlugin]} />
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
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900">{value || '-'}</h3>
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
