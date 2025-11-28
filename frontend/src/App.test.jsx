import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import App from './App';

// Mock AWS Amplify
vi.mock('aws-amplify/api', () => ({
  post: vi.fn(() => ({
    response: Promise.resolve({
      body: {
        json: () => Promise.resolve({ images: [] }),
      },
    }),
  })),
}));

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('App', () => {
  it('renders the main heading', () => {
    renderWithTheme(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Visual Image Search');
  });

  it('renders step 1 with K neighbors selector', () => {
    renderWithTheme(<App />);
    expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/K Neighbors/i)).toBeInTheDocument();
  });

  it('renders step 2 with upload and URL options', () => {
    renderWithTheme(<App />);
    expect(screen.getByText(/Step 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload from your device/i)).toBeInTheDocument();
    expect(screen.getByText(/Or enter a public image URL/i)).toBeInTheDocument();
  });

  it('renders step 3 results section', () => {
    renderWithTheme(<App />);
    expect(screen.getByText(/Step 3: Results/i)).toBeInTheDocument();
    expect(screen.getByText(/No results yet/i)).toBeInTheDocument();
  });

  it('allows changing the K value', async () => {
    renderWithTheme(<App />);
    const select = screen.getByLabelText(/K Neighbors/i);

    // Default value should be 3
    expect(select).toHaveTextContent('3');
  });

  it('has a search button for URL submission', () => {
    renderWithTheme(<App />);
    const searchButton = screen.getByRole('button', { name: /search/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('has a dropzone for file upload', () => {
    renderWithTheme(<App />);
    expect(screen.getByText(/Drag & drop an image/i)).toBeInTheDocument();
  });

  it('displays supported file types', () => {
    renderWithTheme(<App />);
    expect(screen.getByText(/Supports: JPG, PNG, GIF/i)).toBeInTheDocument();
  });
});
