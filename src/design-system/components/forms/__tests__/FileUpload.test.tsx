import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { FileUpload } from '../FileUpload';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

const TestWrapper = ({ children, defaultValues = {} }: any) => {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
};

// Helper to create mock files
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileUpload', () => {
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    mockOnUpload.mockClear();
  });

  it('renders upload area with label', () => {
    render(
      <TestWrapper>
        <FileUpload
          name="files"
          label="Upload Files"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
  });

  it('shows drag and drop text when enabled', () => {
    render(
      <TestWrapper>
        <FileUpload
          name="files"
          dragAndDrop={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('hides drag and drop text when disabled', () => {
    render(
      <TestWrapper>
        <FileUpload
          name="files"
          dragAndDrop={false}
        />
      </TestWrapper>
    );

    expect(screen.queryByText(/drag and drop/i)).not.toBeInTheDocument();
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
  });

  it('accepts file selection through input', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');
    
    render(
      <TestWrapper>
        <FileUpload name="files" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, mockFile);

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(screen.getByText('1 KB')).toBeInTheDocument();
    });
  });

  it('handles multiple file selection when enabled', async () => {
    const user = userEvent.setup();
    const mockFiles = [
      createMockFile('test1.txt', 1024, 'text/plain'),
      createMockFile('test2.txt', 2048, 'text/plain'),
    ];
    
    render(
      <TestWrapper>
        <FileUpload name="files" multiple={true} />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, mockFiles);

    await waitFor(() => {
      expect(screen.getByText('test1.txt')).toBeInTheDocument();
      expect(screen.getByText('test2.txt')).toBeInTheDocument();
      expect(screen.getByText('Selected Files (2)')).toBeInTheDocument();
    });
  });

  it('validates file size', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const largeMockFile = createMockFile('large.txt', 20 * 1024 * 1024, 'text/plain'); // 20MB
    
    render(
      <TestWrapper>
        <FileUpload 
          name="files" 
          maxSize={10 * 1024 * 1024} // 10MB limit
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, largeMockFile);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Invalid files:', expect.arrayContaining([
        expect.objectContaining({
          file: largeMockFile,
          error: 'File size exceeds 10 MB'
        })
      ]));
    });

    // File should not be added to the list
    expect(screen.queryByText('large.txt')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('validates file type', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const invalidFile = createMockFile('test.exe', 1024, 'application/x-executable');
    
    render(
      <TestWrapper>
        <FileUpload 
          name="files" 
          accept="image/*,.pdf"
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, invalidFile);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Invalid files:', expect.arrayContaining([
        expect.objectContaining({
          file: invalidFile,
          error: 'File type not accepted. Accepted types: image/*,.pdf'
        })
      ]));
    });

    consoleSpy.mockRestore();
  });

  it('enforces maximum file count', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockFiles = [
      createMockFile('test1.txt', 1024, 'text/plain'),
      createMockFile('test2.txt', 1024, 'text/plain'),
      createMockFile('test3.txt', 1024, 'text/plain'),
    ];
    
    render(
      <TestWrapper>
        <FileUpload 
          name="files" 
          multiple={true}
          maxFiles={2}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, mockFiles);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Maximum 2 files allowed');
    });

    consoleSpy.mockRestore();
  });

  it('removes files when remove button is clicked', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');
    
    render(
      <TestWrapper>
        <FileUpload name="files" />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, mockFile);

    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: '' }); // SVG button
    await user.click(removeButton);

    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
    expect(screen.queryByText('Selected Files')).not.toBeInTheDocument();
  });

  it('handles drag and drop', async () => {
    const mockFile = createMockFile('dropped.txt', 1024, 'text/plain');
    
    render(
      <TestWrapper>
        <FileUpload name="files" dragAndDrop={true} />
      </TestWrapper>
    );

    const dropZone = screen.getByText('Click to upload').closest('div');
    
    // Simulate drag over
    fireEvent.dragOver(dropZone!, {
      dataTransfer: {
        files: [mockFile],
      },
    });

    // Simulate drop
    fireEvent.drop(dropZone!, {
      dataTransfer: {
        files: [mockFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('dropped.txt')).toBeInTheDocument();
    });
  });

  it('calls custom upload handler when provided', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');
    mockOnUpload.mockResolvedValue(['uploaded-url']);
    
    render(
      <TestWrapper>
        <FileUpload 
          name="files" 
          onUpload={mockOnUpload}
          showProgress={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, mockFile);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith([mockFile]);
    });

    // Should show upload progress
    expect(screen.getByText('Upload Progress')).toBeInTheDocument();
  });

  it('shows upload progress when enabled', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');
    mockOnUpload.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(['uploaded-url']), 100))
    );
    
    render(
      <TestWrapper>
        <FileUpload 
          name="files" 
          onUpload={mockOnUpload}
          showProgress={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, mockFile);

    // Should show progress section
    await waitFor(() => {
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
      expect(screen.getByText('uploading')).toBeInTheDocument();
    });

    // Should complete
    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
  });

  it('handles upload errors', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');
    mockOnUpload.mockRejectedValue(new Error('Upload failed'));
    
    render(
      <TestWrapper>
        <FileUpload 
          name="files" 
          onUpload={mockOnUpload}
          showProgress={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, mockFile);

    await waitFor(() => {
      expect(screen.getByText('error')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Upload failed:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('clears upload progress when clear button is clicked', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');
    mockOnUpload.mockResolvedValue(['uploaded-url']);
    
    render(
      <TestWrapper>
        <FileUpload 
          name="files" 
          onUpload={mockOnUpload}
          showProgress={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, mockFile);

    await waitFor(() => {
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);

    expect(screen.queryByText('Upload Progress')).not.toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(
      <TestWrapper>
        <FileUpload
          name="files"
          label="Upload Files"
          required={true}
        />
      </TestWrapper>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <TestWrapper>
        <FileUpload
          name="files"
          disabled={true}
        />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    expect(input).toBeDisabled();
  });

  it('displays file size information', () => {
    render(
      <TestWrapper>
        <FileUpload
          name="files"
          maxSize={5 * 1024 * 1024} // 5MB
          maxFiles={3}
          accept="image/*"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Accepted: image/*')).toBeInTheDocument();
    expect(screen.getByText('Max size: 5 MB')).toBeInTheDocument();
    expect(screen.getByText('Max files: 3')).toBeInTheDocument();
  });

  it('formats file sizes correctly', async () => {
    const user = userEvent.setup();
    const mockFiles = [
      createMockFile('small.txt', 512, 'text/plain'), // 512 Bytes
      createMockFile('medium.txt', 1536, 'text/plain'), // 1.5 KB
      createMockFile('large.txt', 2 * 1024 * 1024, 'text/plain'), // 2 MB
    ];
    
    render(
      <TestWrapper>
        <FileUpload name="files" multiple={true} />
      </TestWrapper>
    );

    const input = screen.getByRole('textbox', { hidden: true }) as HTMLInputElement;
    await user.upload(input, mockFiles);

    await waitFor(() => {
      expect(screen.getByText('512 Bytes')).toBeInTheDocument();
      expect(screen.getByText('1.5 KB')).toBeInTheDocument();
      expect(screen.getByText('2 MB')).toBeInTheDocument();
    });
  });
});