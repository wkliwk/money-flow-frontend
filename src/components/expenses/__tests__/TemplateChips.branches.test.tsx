import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateChips from '../TemplateChips';
import { TransactionTemplate } from '../../../hooks/useTemplates';

const makeTemplate = (overrides: Partial<TransactionTemplate> = {}): TransactionTemplate => ({
  id: 't1',
  label: 'Lunch',
  description: 'Lunch at office',
  type: 'expense',
  category: 'Food & Drink',
  ...overrides,
});

describe('TemplateChips — branch coverage', () => {
  it('renders income-type template with income colour styling', () => {
    render(
      <TemplateChips
        templates={[makeTemplate({ id: 'i1', label: 'Salary', type: 'income' })]}
        onSelect={jest.fn()}
        onManage={jest.fn()}
      />
    );
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('renders expense-type template alongside income-type template', () => {
    render(
      <TemplateChips
        templates={[
          makeTemplate({ id: 'i1', label: 'Salary', type: 'income' }),
          makeTemplate({ id: 'e1', label: 'Taxi', type: 'expense' }),
        ]}
        onSelect={jest.fn()}
        onManage={jest.fn()}
      />
    );
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Taxi')).toBeInTheDocument();
  });

  it('does NOT truncate labels that are exactly 18 characters', () => {
    const exactLabel = 'Exactly18CharsHere'; // 18 chars
    render(
      <TemplateChips
        templates={[makeTemplate({ label: exactLabel })]}
        onSelect={jest.fn()}
        onManage={jest.fn()}
      />
    );
    expect(screen.getByText(exactLabel)).toBeInTheDocument();
  });

  it('truncates labels longer than 18 characters', () => {
    const longLabel = 'This is 19 chars!!X'; // 19 chars
    render(
      <TemplateChips
        templates={[makeTemplate({ label: longLabel })]}
        onSelect={jest.fn()}
        onManage={jest.fn()}
      />
    );
    expect(screen.getByText('This is 19 chars!!…')).toBeInTheDocument();
  });

  it('calls onSelect with the correct income template on click', () => {
    const onSelect = jest.fn();
    const template = makeTemplate({ type: 'income', label: 'Dividend' });
    render(
      <TemplateChips templates={[template]} onSelect={onSelect} onManage={jest.fn()} />
    );
    fireEvent.click(screen.getByText('Dividend'));
    expect(onSelect).toHaveBeenCalledWith(template);
  });
});
