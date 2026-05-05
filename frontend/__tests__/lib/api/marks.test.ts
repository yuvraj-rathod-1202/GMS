import { MarksApi } from '../../../lib/api/marks';
import { apiClient } from '../../../lib/api/client';

jest.mock('../../../lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('MarksApi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('CreateAssessment calls POST /courses/:id/assessments', async () => {
    const data = { name: 'A1' } as any;
    (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });
    await MarksApi.CreateAssessment(101, data);
    expect(apiClient.post).toHaveBeenCalledWith('/courses/101/assessments', data);
  });

  it('AddMarks calls POST /assessments/:cid/:aid/marks', async () => {
    const data = { marks: 80 } as any;
    (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });
    await MarksApi.AddMarks(101, 1, data);
    expect(apiClient.post).toHaveBeenCalledWith('/assessments/101/1/marks', data);
  });

  it('PublishMarks calls PUT /assessments/:cid/:aid/publish', async () => {
    (apiClient.put as jest.Mock).mockResolvedValue({ data: {} });
    await MarksApi.PublishMarks(101, 1);
    expect(apiClient.put).toHaveBeenCalledWith('/assessments/101/1/publish');
  });

  it('GetStudentMarks calls GET /courses/:cid/marks/:sid', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
    await MarksApi.GetStudentMarks(101, 123);
    expect(apiClient.get).toHaveBeenCalledWith('/courses/101/marks/123');
  });
});
