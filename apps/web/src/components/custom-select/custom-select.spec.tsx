import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomSelect } from './index';

describe('CustomSelect Component', () => {
  const options = [
    { value: 'all', label: 'Всі типи' },
    { value: 'laptops', label: 'Ноутбуки' },
    { value: 'monitors', label: 'Монітори' },
  ];

  it('renders with initial selected label', () => {
    const handleChange = jest.fn();
    render(<CustomSelect options={options} value="monitors" onChange={handleChange} />);

    expect(screen.getByText('Монітори')).toBeTruthy();
  });

  it('opens dropdown on click and triggers onChange when option selected', () => {
    const handleChange = jest.fn();
    render(<CustomSelect options={options} value="all" onChange={handleChange} />);

    // Click trigger to open
    fireEvent.click(screen.getByText('Всі типи'));

    // Option exists in dropdown
    expect(screen.getByText('Ноутбуки')).toBeTruthy();

    // Select option
    fireEvent.click(screen.getByText('Ноутбуки'));

    expect(handleChange).toHaveBeenCalledWith('laptops');
  });

  it('renders action item and triggers onActionClick', () => {
    const handleChange = jest.fn();
    const handleAction = jest.fn();

    render(
      <CustomSelect
        options={options}
        value="all"
        onChange={handleChange}
        actionLabel="+ Додати новий тип"
        onActionClick={handleAction}
      />,
    );

    fireEvent.click(screen.getByText('Всі типи'));

    const actionBtn = screen.getByText('+ Додати новий тип');
    fireEvent.click(actionBtn);

    expect(handleAction).toHaveBeenCalled();
  });
});
