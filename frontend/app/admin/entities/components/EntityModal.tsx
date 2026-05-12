'use client';

import React, { useState, useEffect } from 'react';
import { BiX } from 'react-icons/bi';
import Button from '@/components/ui/Button';
import { PolicyApi } from '@/lib/api/policy';
import { AdminApi } from '@/lib/api/admin';
import { BiSearch, BiChevronRight, BiLoaderAlt, BiUserCheck, BiBookOpen } from 'react-icons/bi';

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
  
  // User selection states for Admins
  const [users, setUsers] = useState<any[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userOffset, setUserOffset] = useState(0);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  // Course selection states
  const [courses, setCourses] = useState<any[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseOffset, setCourseOffset] = useState(0);
  const [hasMoreCourses, setHasMoreCourses] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const COURSE_LIMIT = 10;

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
        .catch(err => {
          if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
            console.error('Failed to fetch categories:', err);
          }
        });
    }

    if ((entityType === 'admins' || entityType === 'enrollments') && isOpen) {
      // We don't call fetchUsers(0, true) here anymore because the debounced search effect will handle the initial fetch
      // But we need to clear the search when the modal opens or entity type changes
      setUserSearch('');
    }
  }, [entityType, isOpen]);

  const fetchUsers = async (offset: number, isInitial = false, search = '') => {
    setUserLoading(true);
    try {
      const res: any = await AdminApi.FetchAllUsers(COURSE_LIMIT, offset, search);
      const newUsers = res.users || [];
      
      if (isInitial) {
        setUsers(newUsers);
        setUserOffset(0);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
        setUserOffset(offset);
      }
      
      setHasMoreUsers(newUsers.length === COURSE_LIMIT);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUserLoading(false);
    }
  };

  // Debounced search effect for user selection
  useEffect(() => {
    if ((entityType === 'admins' || entityType === 'enrollments') && isOpen) {
      const timer = setTimeout(() => {
        fetchUsers(0, true, userSearch);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userSearch, entityType, isOpen]);

  const handleLoadMoreUsers = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fetchUsers(userOffset + COURSE_LIMIT, false, userSearch);
  };

  const fetchCourses = async (offset: number, isInitial = false, search = '') => {
    setCourseLoading(true);
    try {
      const res: any = await AdminApi.FetchAllCourses(COURSE_LIMIT, offset, search);
      const newCourses = res.courses || [];
      
      if (isInitial) {
        setCourses(newCourses);
        setCourseOffset(0);
      } else {
        setCourses(prev => [...prev, ...newCourses]);
        setCourseOffset(offset);
      }
      
      setHasMoreCourses(newCourses.length === COURSE_LIMIT);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setCourseLoading(false);
    }
  };

  // Debounced search effect for course selection
  useEffect(() => {
    if ((entityType === 'assessments' || entityType === 'enrollments') && isOpen) {
      const timer = setTimeout(() => {
        fetchCourses(0, true, courseSearch);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [courseSearch, entityType, isOpen]);

  const handleLoadMoreCourses = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fetchCourses(courseOffset + COURSE_LIMIT, false, courseSearch);
  };

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
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error(`Failed to ${isEdit ? 'update' : 'add'} entity:`, error);
      }
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
              <label htmlFor="user-id" className="text-xs font-bold text-gray-400 uppercase">User ID (Roll No/Staff ID)</label>
              <input 
                id="user-id"
                type="number" 
                required
                disabled={isEdit}
                value={formData.id || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
                onChange={e => setFormData({...formData, id: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold text-gray-400 uppercase">Email</label>
              <input 
                id="email"
                type="email" 
                required
                value={formData.email || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            {!isEdit && (
              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-bold text-gray-400 uppercase">Password</label>
                <input 
                  id="password"
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
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Select Course</label>
                <div className="relative">
                  <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search by Code or Name..."
                    value={courseSearch}
                    onChange={e => setCourseSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gms-blue/20 outline-none"
                  />
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 scrollbar-hide">
                {courses.length === 0 && !courseLoading && (
                  <div className="p-8 text-center text-gray-400 text-sm">No courses found</div>
                )}
                
                {courses.map(course => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, course_id: course.id, course_name: course.name })}
                    className={`w-full flex items-center justify-between p-2 text-left transition-colors hover:bg-gray-50 ${
                      formData.course_id === course.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${formData.course_id === course.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        <BiBookOpen className="text-sm" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{course.name}</div>
                        <div className="text-[10px] text-gray-500">{course.course_code} | ID: {course.id}</div>
                      </div>
                    </div>
                    {formData.course_id === course.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </button>
                ))}

                {hasMoreCourses && (
                  <button
                    type="button"
                    onClick={handleLoadMoreCourses}
                    disabled={courseLoading}
                    className="w-full p-2 text-xs font-bold text-gms-blue hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {courseLoading ? <BiLoaderAlt className="animate-spin" /> : 'Load More'}
                  </button>
                )}
              </div>
            </div>

            { formData.course_id && (
              <div className="text-[11px] text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                Selected Course: <span className="font-bold">{formData.course_name || `ID: ${formData.course_id}`}</span>
              </div>
            )}
            <div className="space-y-1">
              <label htmlFor="assessment-name" className="text-xs font-bold text-gray-400 uppercase">Assessment Name</label>
              <input 
                id="assessment-name"
                type="text" 
                required
                value={formData.name || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="max-marks" className="text-xs font-bold text-gray-400 uppercase">Max Marks</label>
                <input 
                  id="max-marks"
                  type="number" 
                  required
                  value={formData.max_marks || ''}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  onChange={e => setFormData({...formData, max_marks: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="category" className="text-xs font-bold text-gray-400 uppercase">Assessment Category</label>
                <select 
                  id="category"
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
              <label htmlFor="date" className="text-xs font-bold text-gray-400 uppercase">Date</label>
              <input 
                id="date"
                type="date" 
                required
                value={formData.assessment_date || ''}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                onChange={e => setFormData({...formData, assessment_date: e.target.value})}
              />
            </div>
            <div className="flex items-center gap-2">
              <input 
                id="published"
                type="checkbox"
                checked={formData.is_marks_published || false}
                onChange={e => setFormData({...formData, is_marks_published: e.target.checked})}
              />
              <label htmlFor="published" className="text-xs font-bold text-gray-400 uppercase">Published</label>
            </div>
          </>
        );
      case 'enrollments':
        return (
          <>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Select Course for Enrollment</label>
                <div className="relative">
                  <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search by Code or Name..."
                    value={courseSearch}
                    onChange={e => setCourseSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gms-blue/20 outline-none"
                  />
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 scrollbar-hide">
                {courses.length === 0 && !courseLoading && (
                  <div className="p-8 text-center text-gray-400 text-sm">No courses found</div>
                )}
                
                {courses.map(course => (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, course_id: course.id, course_name: course.name })}
                    className={`w-full flex items-center justify-between p-2 text-left transition-colors hover:bg-gray-50 ${
                      formData.course_id === course.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${formData.course_id === course.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        <BiBookOpen className="text-sm" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">{course.name}</div>
                        <div className="text-[10px] text-gray-500">{course.course_code} | ID: {course.id}</div>
                      </div>
                    </div>
                    {formData.course_id === course.id && (
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </button>
                ))}

                {hasMoreCourses && (
                  <button
                    type="button"
                    onClick={handleLoadMoreCourses}
                    disabled={courseLoading}
                    className="w-full p-2 text-xs font-bold text-gms-blue hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {courseLoading ? <BiLoaderAlt className="animate-spin" /> : 'Load More'}
                  </button>
                )}
              </div>
            </div>

            { formData.course_id && (
              <div className="text-[11px] text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                Selected Course: <span className="font-bold">{formData.course_name || `ID: ${formData.course_id}`}</span>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Select User for Enrollment</label>
                <div className="relative">
                  <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search by ID or Email..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gms-blue/20 outline-none"
                  />
                </div>
              </div>

            <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 scrollbar-hide">
              {users.length === 0 && !userLoading && (
                <div className="p-8 text-center text-gray-400 text-sm">No users found</div>
              )}
              
              {users.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, student_id: user.id, email: user.email })}
                      className={`w-full flex items-center justify-between p-2 text-left transition-colors hover:bg-gray-50 ${
                        (formData.user_id || formData.student_id) === user.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-gray-900">{user.email}</div>
                        <div className="text-[10px] text-gray-500">ID: {user.id}</div>
                      </div>
                      {(formData.user_id || formData.student_id) === user.id && (
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ))}

                {hasMoreUsers && (
                  <button
                    type="button"
                    onClick={handleLoadMoreUsers}
                    disabled={userLoading}
                    className="w-full p-2 text-xs font-bold text-gms-blue hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {userLoading ? <BiLoaderAlt className="animate-spin" /> : 'Load More'}
                  </button>
                )}
              </div>
            </div>

            { (formData.user_id || formData.student_id) && (
              <div className="text-[11px] text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                Selected: <span className="font-bold">{formData.email || (formData.user_id || formData.student_id)}</span>
              </div>
            )}
            <div className="space-y-1">
              <label htmlFor="enroll-role" className="text-xs font-bold text-gray-400 uppercase">Role</label>
              <select 
                id="enroll-role"
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
      case 'admins':
        return (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Select User to Promote</label>
              <div className="relative">
                <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search by ID or Email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gms-blue/20 outline-none"
                />
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 scrollbar-hide">
              {users.length === 0 && !userLoading && (
                <div className="p-8 text-center text-gray-400 text-sm">No users found</div>
              )}
              
              {users.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, id: user.id })}
                  className={`w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-gray-50 ${
                    formData.id === user.id ? 'bg-blue-50/50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div>
                    <div className="text-sm font-bold text-gray-900">{user.email}</div>
                    <div className="text-[10px] text-gray-500">ID: {user.id}</div>
                  </div>
                  {formData.id === user.id && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}

              {hasMoreUsers && (
                <button
                  type="button"
                  onClick={handleLoadMoreUsers}
                  disabled={userLoading}
                  className="w-full p-3 text-xs font-bold text-gms-blue hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {userLoading ? (
                    <>
                      <BiLoaderAlt className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More Users'
                  )}
                </button>
              )}
            </div>

            {!isEdit && (
              <p className="text-[10px] text-gray-500 italic">Promoting a user to Admin grants them full system access. Please verify the user carefully.</p>
            )}
            
            {formData.id && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                <div className="text-xs text-blue-700">
                  Selected: <span className="font-bold">{users.find(u => u.id === formData.id)?.email || formData.id}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, id: null })}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
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
