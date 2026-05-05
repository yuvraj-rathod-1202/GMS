import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../../components/LoginForm';
import '@testing-library/jest-dom';

describe('LoginForm component', () => {
  it('renders the form correctly', () => {
    render(<LoginForm onSubmit={jest.fn()} />);
    expect(screen.getByText(/User ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  });

  it('shows error if ID is not numeric', async () => {
    render(<LoginForm onSubmit={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter user id/i), { target: { value: 'abc' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button'));

    expect(await screen.findByText(/Please enter a valid numeric ID/i)).toBeInTheDocument();
  });

  it('calls onSubmit with correct values', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue({});
    render(<LoginForm onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByPlaceholderText(/Enter user id/i), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter password/i), {
      target: { value: 'securepass' },
    });
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(123, 'securepass');
    });
  });

  it('shows loading state', () => {
    render(<LoginForm onSubmit={jest.fn()} loading={true} />);
    expect(screen.getByText(/Logging in.../i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows parent error', () => {
    render(<LoginForm onSubmit={jest.fn()} error="Invalid Credentials" />);
    expect(screen.getByText(/Invalid Credentials/i)).toBeInTheDocument();
  });
});
