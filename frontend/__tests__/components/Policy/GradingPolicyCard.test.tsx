import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GradingPolicyCard from '../../../components/Policy/GradingPolicyCard';
import '@testing-library/jest-dom';

describe('GradingPolicyCard component', () => {
    const mockPolicy = {
        id: 1,
        policy_name: 'Test Policy',
        total_weightage: 100,
        is_default: false,
        updated_at: '2026-01-01T00:00:00Z',
        components: [
            {
                id: 1,
                assessment_category_id: 1, // Quiz
                weightage: 20,
                rules: {
                    rule_type: 'BEST_N',
                    rule_params: { n: 2 }
                }
            }
        ]
    } as any;

    const mockEdit = jest.fn();
    const mockDelete = jest.fn();
    const mockSetDefault = jest.fn();

    it('renders policy details correctly', () => {
        render(<GradingPolicyCard 
            policy={mockPolicy} 
            onEdit={mockEdit} 
            onDelete={mockDelete} 
            SetDefault={mockSetDefault} 
        />);
        
        expect(screen.getByText('Test Policy')).toBeInTheDocument();
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('Quiz')).toBeInTheDocument();
        expect(screen.getByText('20%')).toBeInTheDocument();
        expect(screen.getByText('BEST_N')).toBeInTheDocument();
        expect(screen.getByText('n:')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows "Default" badge if is_default is true', () => {
        const defaultPolicy = { ...mockPolicy, is_default: true };
        render(<GradingPolicyCard 
            policy={defaultPolicy} 
            onEdit={mockEdit} 
            onDelete={mockDelete} 
            SetDefault={mockSetDefault} 
        />);
        
        expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('calls callbacks when buttons are clicked', () => {
        render(<GradingPolicyCard 
            policy={mockPolicy} 
            onEdit={mockEdit} 
            onDelete={mockDelete} 
            SetDefault={mockSetDefault} 
        />);
        
        fireEvent.click(screen.getByTitle('Edit Policy'));
        expect(mockEdit).toHaveBeenCalled();
        
        fireEvent.click(screen.getByTitle('Delete Policy'));
        expect(mockDelete).toHaveBeenCalled();
        
        fireEvent.click(screen.getByText(/set as default/i));
        expect(mockSetDefault).toHaveBeenCalled();
    });
});
