import React from 'react';
import { render, screen } from '@testing-library/react';
import { CourseItem } from '../../../components/ui/CourseItem';
import '@testing-library/jest-dom';

describe('CourseItem component', () => {
    it('renders course name and link', () => {
        render(<CourseItem name="Computer Science" id={101} Highlight={false} />);
        
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/c/101');
        expect(screen.getByText('Computer Science')).toBeInTheDocument();
        expect(screen.getByText('C')).toBeInTheDocument(); // Initial
    });

    it('applies highlight class when Highlight is true', () => {
        const { container } = render(<CourseItem name="Computer Science" id={101} Highlight={true} />);
        const div = container.querySelector('div');
        expect(div).toHaveClass('bg-mms-grayLight');
    });
});
