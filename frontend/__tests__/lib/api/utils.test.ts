import { handleRequest } from '../../../lib/api/utils';
import axios from 'axios';

describe('handleRequest utility', () => {
    beforeAll(() => {
        window.alert = jest.fn();
    });

    it('returns data on success', async () => {
        const mockResponse = { data: 'success' };
        const result = await handleRequest(Promise.resolve(mockResponse as any));
        expect(result).toBe('success');
    });

    it('throws custom error on axios failure', async () => {
        const error = {
            isAxiosError: true,
            response: { data: { message: 'Custom Error' } },
        };
        await expect(handleRequest(Promise.reject(error))).rejects.toThrow('Custom Error');
    });

    it('throws default error if no message in axios error', async () => {
        const error = {
            isAxiosError: true,
            response: { data: {} },
        };
        await expect(handleRequest(Promise.reject(error))).rejects.toThrow('Network error. Please try again.');
    });

    it('alerts on generic network error', async () => {
        const error = new Error('Some error');        
        
        await expect(handleRequest(Promise.reject(error))).rejects.toThrow('Network error. Please try again.');
        expect(window.alert).toHaveBeenCalledWith('Network error. Please try again.');
    });
});
