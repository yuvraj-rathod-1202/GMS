import { CoursesApi } from '../../../lib/api/courses';
import { apiClient } from '../../../lib/api/client';

jest.mock('../../../lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('CoursesApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('CreateCourse calls POST /courses/', async () => {
    const data = { course_code: 'CS101' } as any;
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: 1 } });
    await CoursesApi.CreateCourse(data);
    expect(apiClient.post).toHaveBeenCalledWith('/courses/', data);
  });

  it('GetAllCourse calls GET /courses', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
    await CoursesApi.GetAllCourse();
    expect(apiClient.get).toHaveBeenCalledWith('/courses');
  });

  it('GetCourseById calls GET /courses/:id', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });
    await CoursesApi.GetCourseById(101);
    expect(apiClient.get).toHaveBeenCalledWith('/courses/101');
  });

  it('EnrollStudent calls POST /courses/:id/enroll', async () => {
    const data = { student_id: 1 } as any;
    (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });
    await CoursesApi.EnrollStudent(101, data);
    expect(apiClient.post).toHaveBeenCalledWith('/courses/101/enroll', data);
  });

  it('VerifyAdmin calls GET /verify/verifyadmin', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { isAdmin: true } });
    await CoursesApi.VerifyAdmin();
    expect(apiClient.get).toHaveBeenCalledWith('/verify/verifyadmin');
  });
});
