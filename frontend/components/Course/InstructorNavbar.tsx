'use client';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export default function InstructorNavbar() {
  const params = useParams();
  const pathname = usePathname();
  const courseId = params.id;

  const navItems = [
    { label: 'Overview', href: `/c/${courseId}` },
    { label: 'People', href: `/c/${courseId}/p` },
    { label: 'Assessments', href: `/c/${courseId}/g` },
    { label: 'Policies', href: `/c/${courseId}/gp` },
    { label: 'Analytics', href: `/c/${courseId}/a` },
  ];

  const isActive = (href: string) => {
    if (href === `/c/${courseId}`) {
      return pathname === href;
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <div className="bg-white h-12 border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex flex-row items-center sm:items-end py-2 gap-3">
          <nav className="flex gap-1 sm:gap-2 overflow-x-auto m-auto sm:ml-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 sm:px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive(item.href)
                    ? 'border-b-4 border-b-mms-blue'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
