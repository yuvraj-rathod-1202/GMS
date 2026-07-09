import { Authapi } from '../../../lib/api/auth';
import { apiClient } from '../../../lib/api/client';

jest.mock('../../../lib/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('Authapi', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('login calls /auth/login with correct credentials', async () => {
    const mockData = { user: { id: 123 } };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: mockData });

    const result = await Authapi.login(123, 'password');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', null, {
      auth: { username: '123', password: 'password' },
    });
    expect(result).toEqual(mockData);
  });

  it('signup calls /auth/signup', async () => {
    const userData = { email: 'test@test.com', password: 'password' } as any;
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    await Authapi.signup(userData);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/signup', userData);
  });

  it('logout calls /auth/logout', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });
    await Authapi.logout();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('handles errors via handleRequest', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: 'Invalid credentials' } },
    });

    await expect(Authapi.login(123, 'wrong')).rejects.toThrow('Invalid credentials');
  });
});
