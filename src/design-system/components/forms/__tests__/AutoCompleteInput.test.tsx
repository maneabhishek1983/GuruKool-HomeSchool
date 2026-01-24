import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { AutoCompleteInput } from '../AutoCompleteInput';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const TestWrapper = ({ children, defaultValues = {} }: any) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

describe('AutoCompleteInput', () => {
  const mockSuggestions = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];
  const mockOnSuggestionsFetch = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    mockOnSuggestionsFetch.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders input with label', () => {
    render(
      <TestWrapper>
        <AutoCompleteInput
          name="fruit"
          label="Select Fruit"
          placeholder="Type to search..."
          suggestions={mockSuggestions}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Select Fruit')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Type to search...')
    ).toBeInTheDocument();
  });

  it('shows suggestions when typing', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AutoCompleteInput name="fruit" suggestions={mockSuggestions} />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'a');

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('Banana')).toBeInTheDocument();
    });

    expect(screen.queryByText('Cherry')).not.toBeInTheDocument();
  });

  it('filters suggestions based on input', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AutoCompleteInput name="fruit" suggestions={mockSuggestions} />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'ch');

    await waitFor(() => {
      expect(screen.getByText('Cherry')).toBeInTheDocument();
    });

    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('selects suggestion on click', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AutoCompleteInput name="fruit" suggestions={mockSuggestions} />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'a');

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Apple'));

    expect(input).toHaveValue('Apple');
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AutoCompleteInput name="fruit" suggestions={mockSuggestions} />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'a');

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    // Navigate down
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('Apple')).toHaveClass('bg-blue-50');

    // Navigate down again
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('Banana')).toHaveClass('bg-blue-50');

    // Select with Enter
    await user.keyboard('{Enter}');
    expect(input).toHaveValue('Banana');
  });

  it('closes suggestions on Escape', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <AutoCompleteInput name="fruit" suggestions={mockSuggestions} />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'a');

    await waitFor(
      () => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  }, 10000);

  it('fetches AI suggestions when enabled', async () => {
    const user = userEvent.setup();
    mockOnSuggestionsFetch.mockResolvedValue([
      'AI Suggestion 1',
      'AI Suggestion 2',
    ]);

    render(
      <TestWrapper>
        <AutoCompleteInput
          name="fruit"
          aiPowered={true}
          onSuggestionsFetch={mockOnSuggestionsFetch}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    await waitFor(
      () => {
        expect(mockOnSuggestionsFetch).toHaveBeenCalledWith('test');
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText('AI Suggestion 1')).toBeInTheDocument();
        expect(screen.getByText('AI Suggestion 2')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  }, 10000);

  it('shows loading indicator during AI fetch', async () => {
    const user = userEvent.setup();
    mockOnSuggestionsFetch.mockImplementation(
      () =>
        new Promise(resolve => setTimeout(() => resolve(['AI Result']), 100))
    );

    render(
      <TestWrapper>
        <AutoCompleteInput
          name="fruit"
          aiPowered={true}
          onSuggestionsFetch={mockOnSuggestionsFetch}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    // Should show loading spinner
    expect(
      screen.getByRole('textbox').parentElement?.querySelector('.animate-spin')
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('AI Result')).toBeInTheDocument();
    });

    // Loading spinner should be gone
    expect(
      screen.getByRole('textbox').parentElement?.querySelector('.animate-spin')
    ).not.toBeInTheDocument();
  }, 10000);

  it('falls back to local suggestions when AI fetch fails', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockOnSuggestionsFetch.mockRejectedValue(new Error('AI fetch failed'));

    render(
      <TestWrapper>
        <AutoCompleteInput
          name="fruit"
          suggestions={mockSuggestions}
          aiPowered={true}
          onSuggestionsFetch={mockOnSuggestionsFetch}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'a');

    await waitFor(
      () => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch AI suggestions:',
          expect.any(Error)
        );
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.getByText('Banana')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    consoleSpy.mockRestore();
  }, 10000);

  it('shows required indicator when required', () => {
    render(
      <TestWrapper>
        <AutoCompleteInput name="fruit" label="Select Fruit" required={true} />
      </TestWrapper>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows AI badge when AI powered', () => {
    render(
      <TestWrapper>
        <AutoCompleteInput name="fruit" label="Select Fruit" aiPowered={true} />
      </TestWrapper>
    );

    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <TestWrapper>
        <AutoCompleteInput name="fruit" disabled={true} />
      </TestWrapper>
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('debounces AI suggestions fetch', async () => {
    const user = userEvent.setup();
    mockOnSuggestionsFetch.mockResolvedValue(['Result']);

    render(
      <TestWrapper>
        <AutoCompleteInput
          name="fruit"
          aiPowered={true}
          onSuggestionsFetch={mockOnSuggestionsFetch}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox');

    // Type multiple characters quickly
    await user.type(input, 'test');

    // Should only call once after debounce
    await waitFor(
      () => {
        expect(mockOnSuggestionsFetch).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 }
    );
  }, 10000);
});
