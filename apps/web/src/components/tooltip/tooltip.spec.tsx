import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Tooltip } from './index';

describe('Tooltip Component', () => {
  it('renders children correctly', () => {
    render(
      <Tooltip content="Tooltip message">
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    expect(screen.getByText('Hover me')).toBeTruthy();
  });

  it('shows tooltip content on mouse enter and hides on mouse leave', async () => {
    render(
      <Tooltip content="Full detailed product name" delayMs={10}>
        <span data-testid="target">Giga...</span>
      </Tooltip>,
    );

    const target = screen.getByTestId('target');
    fireEvent.mouseEnter(target);

    await waitFor(() => {
      expect(screen.getByText('Full detailed product name')).toBeTruthy();
    });

    fireEvent.mouseLeave(target);
    await waitFor(() => {
      expect(screen.queryByText('Full detailed product name')).toBeNull();
    });
  });
});
