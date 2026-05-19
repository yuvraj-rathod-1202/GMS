'use client';

import React, { useState, useEffect } from 'react';
import {
  BiUser,
  BiBookBookmark,
  BiShieldQuarter,
  BiSpreadsheet,
  BiGroup,
  BiSearch,
  BiPlus,
  BiDotsHorizontalRounded,
  BiTrash,
  BiEditAlt,
} from 'react-icons/bi';
import { AdminApi } from '@/lib/api/admin';
import Button from '@/components/ui/Button';
import EntityModal from './components/EntityModal';
import { Authapi } from '@/lib/api/auth';

type EntityType = 'users' | 'admins' | 'assessments' | 'enrollments';

interface EntityConfig {
  id: EntityType;
  label: string;
}

const ENTITIES: EntityConfig[] = [
  { id: 'users', label: 'Users' },
  { id: 'admins', label: 'Admins' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'enrollments', label: 'Enrollments' },
];

export default function EntityManagementPage() {
  const [activeEntity, setActiveEntity] = useState<EntityType>('users');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const LIMIT = 50;

  useEffect(() => {
    setOffset(0);
    setData([]);
    setHasMore(true);
    fetchData(0, true);
  }, [activeEntity]);

  const handleSave = async (formData: any) => {
    try {
      const isEdit = !!selectedItem;

      switch (activeEntity) {
        case 'users':
          if (isEdit) {
            alert(
              'Full user profile editing is coming soon. For now, users can change their own passwords in settings.'
            );
          } else {
            await Authapi.signup({ ...formData, password: formData.password });
          }
          break;
        case 'assessments':
          if (isEdit) {
            await AdminApi.UpdateAssessment(selectedItem.course_id, selectedItem.id, {
              ...formData,
              user_id: 0,
            });
          } else {
            const { course_id: assessmentCourseId, ...assessmentData } = formData;
            await AdminApi.CreateAssessment(assessmentCourseId, { ...assessmentData, user_id: 0 });
          }
          break;
        case 'enrollments':
          if (isEdit) {
            alert('Enrollments cannot be edited. Please delete and recreate if needed.');
          } else {
            await AdminApi.CreateEnrollment(
              formData.course_id,
              formData.student_id,
              formData.role,
              formData.email
            );
          }
          break;
        case 'admins':
          if (isEdit) {
            alert('Admin details cannot be edited. Please delete and recreate if needed.');
          } else {
            await AdminApi.MakeAdmin(formData.id);
          }
          break;
        default:
      }
      fetchData(0, true);
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to save entity:', error);
      throw error;
    }
  };

  const fetchData = async (currentOffset: number, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      let result: any = [];
      switch (activeEntity) {
        case 'users':
          result = await AdminApi.FetchAllUsers(LIMIT, currentOffset);
          break;
        case 'admins':
          result = await AdminApi.FetchAllAdmins();
          break;
        case 'enrollments':
          result = await AdminApi.FetchAllEnrollments(LIMIT, currentOffset);
          break;
        case 'assessments':
          result = await AdminApi.FetchAllAssessments(LIMIT, currentOffset);
          break;
        default:
          result = [];
      }

      const newItems = Array.isArray(result)
        ? result
        : (result as any).data ||
          (result as any).users ||
          (result as any).admins ||
          (result as any).enrollments ||
          (result as any).assessments ||
          [];

      if (isInitial) {
        setData(newItems);
      } else {
        setData((prev) => [...prev, ...newItems]);
      }

      if (newItems.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error(`Failed to fetch ${activeEntity}:`, error);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchData(nextOffset);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeEntity.slice(0, -1)}?`))
      return;

    try {
      switch (activeEntity) {
        case 'assessments':
          await AdminApi.DeleteAssessment(item.course_id, item.id);
          break;
        case 'enrollments':
          if (item.role === 'ta') {
            await AdminApi.RemoveTA(item.course_id, item.user_id || item.student_id || item.ta_id);
          } else if (item.role === 'instructor') {
            await AdminApi.RemoveInstructor(
              item.course_id,
              item.user_id || item.student_id || item.instructor_id,
              0
            );
          } else {
            await AdminApi.UnenrollStudent(item.course_id, item.user_id || item.student_id);
          }
          break;
        case 'admins':
          await AdminApi.RemoveAdmin(item.id);
          break;
        case 'users':
          await AdminApi.DeleteUser(item.id);
          break;
        default:
          alert(`Delete feature for ${activeEntity} is not fully integrated yet.`);
          return;
      }
      fetchData(0, true);
    } catch (error) {
      if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'development') {
        console.error('Delete failed:', error);
      }
      alert('Failed to delete record. It might have dependent data.');
    }
  };

  const filteredData = data.filter((item) =>
    JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns =
    data.length > 0
      ? Object.keys(data[0]).filter((col) => activeEntity !== 'users' || col !== 'is_admin')
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Entity Manager</h1>
          <p className="text-sm text-gray-500">Full admin control over all system data.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            className="flex items-center gap-2"
            onClick={() => {
              setSelectedItem(null);
              setIsModalOpen(true);
            }}
          >
            <BiPlus className="text-lg" />
            Add {activeEntity.slice(0, -1)}
          </Button>
        </div>
      </div>

      <EntityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        entityType={activeEntity}
        onSave={handleSave}
        initialData={selectedItem}
      />

      {/* Entity Selector Tabs */}
      <div className="flex items-center overflow-x-auto gap-2 p-1 bg-gray-100 rounded-xl max-w-full scrollbar-hide whitespace-nowrap">
        {ENTITIES.map((entity) => (
          <button
            key={entity.id}
            onClick={() => setActiveEntity(entity.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeEntity === entity.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            {entity.label}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <BiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder={`Search ${activeEntity}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gms-blue/20 focus:border-gms-blue"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 text-center text-gray-500 animate-pulse">
              Loading {activeEntity}...
            </div>
          ) : data.length === 0 ? (
            <div className="p-20 text-center text-gray-500">
              No records found in {activeEntity}.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400"
                    >
                      {col.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-6 py-4 text-sm text-gray-600 truncate max-w-[200px]"
                      >
                        {typeof item[col] === 'boolean' ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item[col] ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                          >
                            {item[col] ? 'True' : 'False'}
                          </span>
                        ) : typeof item[col] === 'object' ? (
                          <span className="text-gray-400 italic text-[10px]">JSON Object</span>
                        ) : (
                          String(item[col] || '-')
                        )}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <BiEditAlt className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <BiTrash className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-4 border-t border-gray-100 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2 text-sm font-bold text-gms-blue hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : `Load More ${activeEntity.slice(0, -1)}s`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
