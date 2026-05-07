'use client';

import React, { useState, useEffect } from 'react';
import { FlagsApi } from '@/lib/api/flags';

interface CourseFlag {
  id: number;
  name: string;
  description: string;
  default_enabled: boolean;
  override_enabled: boolean | null;
}

export const CourseFeatureFlags = ({ courseId }: { courseId: string }) => {
  const [flags, setFlags] = useState<CourseFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchCourseFlags = async () => {
    setIsLoading(true);
    try {
      const data = await FlagsApi.GetCourseFlags(courseId);
      setFlags(data as CourseFlag[]);
    } catch (err) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Failed to fetch course flags', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseFlags();
  }, [courseId]);

  const handleToggle = async (flag: CourseFlag) => {
    const currentEnabled = flag.override_enabled !== null ? flag.override_enabled : flag.default_enabled;
    const nextEnabled = !currentEnabled;
    
    setSaving(flag.name);
    try {
      await FlagsApi.SetCourseOverride(courseId, flag.name, { enabled: nextEnabled });
      setFlags(flags.map(f => f.name === flag.name ? { ...f, override_enabled: nextEnabled } : f));
    } catch (err) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Failed to save override', err);
      }
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) return <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Feature Controls</h3>
          <p className="text-sm text-gray-500">Enable or disable specific functionalities for this course.</p>
        </div>
      </div>
      
      <div className="grid gap-4">
        {flags.map((flag) => {
          const isEnabled = flag.override_enabled !== null ? flag.override_enabled : flag.default_enabled;

          return (
            <div 
              key={flag.id} 
              className="p-5 bg-white border border-gray-100 rounded-2xl flex items-center justify-between hover:border-indigo-100 hover:shadow-sm transition-all group"
            >
              <div className="flex-1 pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-800 tracking-tight">
                    {flag.name.includes('.') ? flag.name.split('.').pop()?.replace(/_/g, ' ') : flag.name.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md">{flag.description}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={() => handleToggle(flag)}
                  disabled={saving === flag.name}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${isEnabled ? 'bg-mms-blue' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all ${isEnabled ? 'translate-x-6' : 'translate-x-1'} ${saving === flag.name ? 'scale-75 animate-pulse' : ''}`} />
                </button>
                <span className={`text-[10px] font-black uppercase tracking-tighter ${isEnabled ? 'text-mms-blue' : 'text-gray-400'}`}>
                  {isEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
