'use client';

import React, { useState, useEffect } from 'react';
import { BiX } from 'react-icons/bi';
import Button from '@/components/ui/Button';

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}

export default function EntityModal({ isOpen, onClose, entityType, onSave, initialData }: EntityModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      // For assessments, we need to convert the date string to YYYY-MM-DD for the input[type=date]
      const preparedData = { ...initialData };
      if (preparedData.assessment_date) {
        preparedData.assessment_date = new Date(preparedData.assessment_date).toISOString().split('T')[0];
      }
      setFormData(preparedData);
    } else {
      setFormData({});
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEdit = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
      setFormData({});
    } catch (error) {
      console.error(`Failed to ${isEdit ? 'update' : 'add'} entity:`, error);
      alert(`Failed to ${isEdit ? 'update' : 'add'} entity. Please check your input.`);
    } finally {
      setLoading(false);
    }
  };

  const renderFields = () => {
    switch (entityType) {
      case 'users':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">User ID (Roll No/Staff ID)</label>
              <input 
                type="number" 
                required
                disabled={isEdit}
                value={formData.id || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
                onChange={e => setFormData({...formData, id: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
              <input 
                type="email" 
                required
                value={formData.email || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            {!isEdit && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            )}
            {isEdit && (
              <p className="text-[10px] text-gray-400 italic">Password cannot be changed here for security reasons.</p>
            )}
          </>
        );
      case 'courses':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Course Code (e.g. CS101)</label>
              <input 
                type="text" 
                required
                value={formData.course_code || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, course_code: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Course Name</label>
              <input 
                type="text" 
                required
                value={formData.name || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Semester</label>
                <input 
                  type="text" 
                  required
                  placeholder="Spring 2026"
                  value={formData.semester || ''}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  onChange={e => setFormData({...formData, semester: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Credits</label>
                <input 
                  type="number" 
                  required
                  value={formData.credits || ''}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  onChange={e => setFormData({...formData, credits: parseInt(e.target.value)})}
                />
              </div>
            </div>
            {isEdit && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Status</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  value={formData.status || 'ongoing'}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}
          </>
        );
      case 'assessments':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Course ID (Database ID)</label>
              <input 
                type="number" 
                required
                value={formData.course_id || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, course_id: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Assessment Name</label>
              <input 
                type="text" 
                required
                value={formData.name || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Max Marks</label>
                <input 
                  type="number" 
                  required
                  value={formData.max_marks || ''}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  onChange={e => setFormData({...formData, max_marks: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Type ID</label>
                <input 
                  type="number" 
                  required
                  placeholder="1=Exam, 2=Quiz..."
                  value={formData.assessment_type_id || ''}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  onChange={e => setFormData({...formData, assessment_type_id: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Date</label>
              <input 
                type="date" 
                required
                value={formData.assessment_date || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, assessment_date: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={formData.is_marks_published || false}
                onChange={e => setFormData({...formData, is_marks_published: e.target.checked})}
              />
              <label className="text-xs font-bold text-gray-400 uppercase">Published</label>
            </div>
          </>
        );
      case 'enrollments':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Course ID (Database ID)</label>
              <input 
                type="number" 
                required
                value={formData.course_id || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, course_id: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">User ID</label>
              <input 
                type="number" 
                required
                value={formData.user_id || formData.student_id || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, student_id: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Email (Optional)</label>
              <input 
                type="email" 
                value={formData.email || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Role</label>
              <select 
                required
                value={formData.role || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="">Select Role</option>
                <option value="student">Student</option>
                <option value="ta">TA</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            {/* No restriction message */}
          </>
        );
      case 'flags':
        return (
          <>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Flag Name (snake_case)</label>
              <input 
                type="text" 
                required
                value={formData.name || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
              <textarea 
                value={formData.description || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Type</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  value={formData.type || 'boolean'}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="boolean">Boolean</option>
                  <option value="string">String</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Scope Level</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  value={formData.scope_level || 'global'}
                  onChange={e => setFormData({...formData, scope_level: e.target.value})}
                >
                  <option value="global">Global</option>
                  <option value="course">Course</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                checked={formData.default_enabled || false}
                onChange={e => setFormData({...formData, default_enabled: e.target.checked})}
              />
              <label className="text-xs font-bold text-gray-400 uppercase">Default Enabled</label>
            </div>
          </>
        );
      default:
        return <p className="text-sm text-gray-500 italic">Adding for this entity type is coming soon.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit' : 'Add New'} {entityType.slice(0, -1)}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <BiX className="text-2xl text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {renderFields()}
          
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" loading={loading}>
              {isEdit ? 'Update' : 'Create'} {entityType.slice(0, -1)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
