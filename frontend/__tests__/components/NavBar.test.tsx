import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NavBar from '../../components/NavBar';
import { useCoursesStore } from '@/lib/store/courses';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { CoursesApi } from '@/lib/api/courses';
import '@testing-library/jest-dom';

// Mocks
jest.mock('@/lib/store/courses');
jest.mock('next/navigation');
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/api/courses');

describe('NavBar component', () => {
  const mockRouter = { push: jest.fn() };
  const mockLogout = jest.fn();

  beforeEach(() => {
    (usePathname as jest.Mock).mockReturnValue('/');
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ logout: mockLogout });
    (useCoursesStore as unknown as jest.Mock).mockReturnValue([]);
    (CoursesApi.VerifyAdmin as jest.Mock).mockResolvedValue({ isAdmin: false });
  });

  it('renders basic navigation links', async () => {
    render(<NavBar />);
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });

  it('renders Admin button if user is admin', async () => {
    (CoursesApi.VerifyAdmin as jest.Mock).mockResolvedValue({ isAdmin: true });
    render(<NavBar />);

    await waitFor(() => {
      const adminButtons = screen.getAllByText(/Admin/i);
      expect(adminButtons.length).toBeGreaterThan(0);
    });
  });

  it('shows course code when on a course page', async () => {
    (usePathname as jest.Mock).mockReturnValue('/c/101');
    (useCoursesStore as unknown as jest.Mock).mockReturnValue([{ id: 101, course_code: 'CS101' }]);

    render(<NavBar />);
    expect(screen.getByText('CS101')).toBeInTheDocument();
  });

  it('handles logout', async () => {
    render(<NavBar />);

    // Open menu (mobile version button is always there in render, hidden by css in browser)
    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);

    const logoutButton = screen.getByText(/Logout/i);
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });
});
