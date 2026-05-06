'use client';

import React, { useState, useEffect } from 'react';
import { BiX } from 'react-icons/bi';
import Button from '@/components/ui/Button';
import { PolicyApi } from '@/lib/api/policy';

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
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (entityType === 'assessments' && isOpen) {
      PolicyApi.FetchAssessmentCategories()
        .then((res: any) => {
          const cats = res.categories || [];
          setCategories(cats);
          if (entityType === 'assessments' && !initialData && cats.length > 0 && !formData.assessment_type_id) {
            setFormData((prev: any) => ({ ...prev, assessment_type_id: cats[0].id }));
          }
        })
        .catch(err => console.error('Failed to fetch categories:', err));
    }
  }, [entityType, isOpen]);

  useEffect(() => {
    if (initialData) {
      // For assessments, we need to convert the date string to YYYY-MM-DD for the input[type=date]
      const preparedData = { ...initialData };
      if (preparedData.assessment_date) {
        preparedData.assessment_date = new Date(preparedData.assessment_date).toISOString().split('T')[0];
      }
      setFormData(preparedData);
    } else {
      // Set defaults for new entities
      const defaults: any = {};
      if (entityType === 'assessments') {
        defaults.is_marks_published = false;
        defaults.assessment_date = new Date().toISOString().split('T')[0];
      }
      setFormData(defaults);
    }
  }, [initialData, isOpen, entityType]);

  if (!isOpen) return null;

  const isEdit = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
      setFormData({});
    } catch (error: any) {
      console.error(`Failed to ${isEdit ? 'update' : 'add'} entity:`, error);
      const errorMsg = error.response?.data?.detail;
      const displayMsg = typeof errorMsg === 'string' 
        ? errorMsg 
        : (Array.isArray(errorMsg) 
            ? errorMsg.map((e: any) => `${e.loc.join('.')}: ${e.msg}`).join('\n')
            : 'Please check your input.');
      alert(`Failed to ${isEdit ? 'update' : 'add'} entity:\n${displayMsg}`);
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
                <label className="text-xs font-bold text-gray-400 uppercase">Assessment Category</label>
                <select 
                  required
                  value={formData.assessment_type_id || ''}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  onChange={e => setFormData({...formData, assessment_type_id: parseInt(e.target.value)})}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.type}</option>
                  ))}
                </select>
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
