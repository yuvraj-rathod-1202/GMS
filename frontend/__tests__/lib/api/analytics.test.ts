import { AnalyticsApi } from '../../../lib/api/analytics';
import { apiClient } from '../../../lib/api/client';

jest.mock('../../../lib/api/client', () => ({
    apiClient: {
        get: jest.fn(),
    },
}));

describe('AnalyticsApi', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('GetCourseAnalytics calls GET /courses/:id/analytics/overview', async () => {
        (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });
        await AnalyticsApi.GetCourseAnalytics(101);
        expect(apiClient.get).toHaveBeenCalledWith('/courses/101/analytics/overview');
    });

    it('GetAssessmentAnalytics calls GET /courses/:cid/assessments/:aid/analytics', async () => {
        (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });
        await AnalyticsApi.GetAssessmentAnalytics(101, 1);
        expect(apiClient.get).toHaveBeenCalledWith('/courses/101/assessments/1/analytics');
    });

    it('GetSystemOverview calls GET /analytics/system/overview', async () => {
        (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });
        await AnalyticsApi.GetSystemOverview();
        expect(apiClient.get).toHaveBeenCalledWith('/analytics/system/overview');
    });
});
