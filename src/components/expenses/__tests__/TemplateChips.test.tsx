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

describe('TemplateChips', () => {
  it('renders nothing when templates is empty', () => {
    const { container } = render(
      <TemplateChips templates={[]} onSelect={jest.fn()} onManage={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders template chips when templates exist', () => {
    render(
      <TemplateChips
        templates={[makeTemplate(), makeTemplate({ id: 't2', label: 'Taxi', type: 'expense' })]}
        onSelect={jest.fn()}
        onManage={jest.fn()}
      />
    );
    expect(screen.getByText('Lunch')).toBeInTheDocument();
    expect(screen.getByText('Taxi')).toBeInTheDocument();
  });

  it('calls onSelect with the template when chip is clicked', () => {
    const onSelect = jest.fn();
    const template = makeTemplate();
    render(
      <TemplateChips templates={[template]} onSelect={onSelect} onManage={jest.fn()} />
    );
    fireEvent.click(screen.getByText('Lunch'));
    expect(onSelect).toHaveBeenCalledWith(template);
  });

  it('renders Edit manage button', () => {
    render(
      <TemplateChips templates={[makeTemplate()]} onSelect={jest.fn()} onManage={jest.fn()} />
    );
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('calls onManage when Edit chip is clicked', () => {
    const onManage = jest.fn();
    render(
      <TemplateChips templates={[makeTemplate()]} onSelect={jest.fn()} onManage={onManage} />
    );
    fireEvent.click(screen.getByText('Edit'));
    expect(onManage).toHaveBeenCalled();
  });

  it('truncates long template labels', () => {
    const longLabel = 'This is a very long template label that should be truncated';
    render(
      <TemplateChips
        templates={[makeTemplate({ label: longLabel })]}
        onSelect={jest.fn()}
        onManage={jest.fn()}
      />
    );
    // Truncated to 18 chars + ellipsis
    expect(screen.getByText('This is a very lon…')).toBeInTheDocument();
  });

  it('shows Templates section label', () => {
    render(
      <TemplateChips templates={[makeTemplate()]} onSelect={jest.fn()} onManage={jest.fn()} />
    );
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });
});
