import { AdminApi } from '../../../lib/api/admin';
import { apiClient } from '../../../lib/api/client';

jest.mock('../../../lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('AdminApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('FetchSystemAnalytics returns overview field', async () => {
    const mockOverview = { total_courses: 5 };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { overview: mockOverview } });

    const result = await AdminApi.FetchSystemAnalytics();

    expect(apiClient.get).toHaveBeenCalledWith('/courses/system/overview');
    expect(result).toEqual(mockOverview);
  });

  it('AssignInstructor calls POST /courses/:id/instructors', async () => {
    const data = { user_id: 1, instructor_id: 2 } as any;
    (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });
    await AdminApi.AssignInstructor(101, data);
    expect(apiClient.post).toHaveBeenCalledWith('/courses/101/instructors', data);
  });

  it('RemoveInstructor calls DELETE with query params', async () => {
    (apiClient.delete as jest.Mock).mockResolvedValue({ data: {} });
    await AdminApi.RemoveInstructor(101, 2, 1);
    expect(apiClient.delete).toHaveBeenCalledWith(
      '/courses/101/instructors?user_id=1&instructor_id=2'
    );
  });
});
