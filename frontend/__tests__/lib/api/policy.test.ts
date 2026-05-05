import { PolicyApi } from '../../../lib/api/policy';
import { apiClient } from '../../../lib/api/client';

jest.mock('../../../lib/api/client', () => ({
    apiClient: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    },
}));

describe('PolicyApi', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('CreatePolicy calls POST /courses/:id/policy', async () => {
        const data = { name: 'P1' } as any;
        (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });
        await PolicyApi.CreatePolicy(101, data);
        expect(apiClient.post).toHaveBeenCalledWith('/courses/101/policy', data);
    });

    it('UpdatePolicy calls PUT /courses/:id/policy', async () => {
        const data = { policy_id: 1, name: 'Updated' } as any;
        (apiClient.put as jest.Mock).mockResolvedValue({ data: {} });
        await PolicyApi.UpdatePolicy(101, data);
        expect(apiClient.put).toHaveBeenCalledWith('/courses/101/policy', data);
    });

    it('RecalculateTotal calls POST /courses/:id/policy/recalculate', async () => {
        (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });
        await PolicyApi.RecalculateTotal(101);
        expect(apiClient.post).toHaveBeenCalledWith('/courses/101/policy/recalculate');
    });

    it('GetTotalOfAllStudents calls GET /courses/:id/total', async () => {
        (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
        await PolicyApi.GetTotalOfAllStudents(101);
        expect(apiClient.get).toHaveBeenCalledWith('/courses/101/total');
    });
});
