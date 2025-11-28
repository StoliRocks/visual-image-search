import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  ImageList,
  ImageListItem,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  styled,
  linearProgressClasses,
} from '@mui/material';
import { CloudUpload, Search } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { post } from 'aws-amplify/api';

import './App.css';

// Styled progress bar with custom colors
const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[200],
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  },
}));

// Styled paper component
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  height: '100%',
  color: theme.palette.text.secondary,
}));

// Styled dropzone component
const DropzoneArea = styled(Box)(({ theme, isDragActive }) => ({
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isDragActive ? theme.palette.action.hover : 'transparent',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main,
  },
}));

// Styled submit button
const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  color: 'white',
  fontWeight: 'bold',
  '&:hover': {
    background: 'linear-gradient(45deg, #FE6B8B 50%, #FF8E53 100%)',
  },
});

function App() {
  const [pictures, setPictures] = useState([]);
  const [progress, setProgress] = useState(0);
  const [kValue, setKValue] = useState(3);
  const [url, setUrl] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.replace(/^data:image\/[a-z]+;base64,/, '');
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Process API response
  const processResponse = (images) => {
    setPictures(images.map((img) => ({ img, cols: 1 })));
    setProgress(100);
    setIsLoading(false);
  };

  // Handle errors
  const handleError = (err) => {
    console.error('API Error:', err);
    setError('Failed to search for similar images. Please try again.');
    setProgress(0);
    setIsLoading(false);
  };

  // Search by uploaded image
  const searchByImage = async (base64Image) => {
    setIsLoading(true);
    setError(null);
    setProgress(66);

    try {
      const response = await post({
        apiName: 'ImageSearch',
        path: '/postImage',
        options: {
          body: { base64img: base64Image, k: kValue },
        },
      }).response;

      const data = await response.body.json();
      processResponse(data.images);
    } catch (err) {
      handleError(err);
    }
  };

  // Search by URL
  const searchByUrl = async (imageUrl) => {
    if (!imageUrl) {
      setPictures([]);
      setProgress(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(66);

    try {
      const response = await post({
        apiName: 'ImageSearch',
        path: '/postURL',
        options: {
          body: { url: imageUrl, k: kValue },
        },
      }).response;

      const data = await response.body.json();
      processResponse(data.images);
    } catch (err) {
      handleError(err);
    }
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setProgress(33);
    setError(null);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);

    try {
      const base64 = await fileToBase64(file);
      await searchByImage(base64);
    } catch (err) {
      handleError(err);
    }
  }, [kValue]);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
    },
    maxSize: 5242880, // 5MB
    multiple: false,
  });

  // Handle URL form submission
  const handleUrlSubmit = (event) => {
    event.preventDefault();
    setPreviewImage(null);
    searchByUrl(url);
  };

  // Handle K value change
  const handleKChange = (event) => {
    setKValue(event.target.value);
  };

  // Clear results
  const clearResults = () => {
    setPictures([]);
    setProgress(0);
    setPreviewImage(null);
    setUrl('');
    setError(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Visual Image Search
      </Typography>

      <Grid container spacing={3}>
        {/* Step 1: Select K neighbors */}
        <Grid item xs={12}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Step 1: Select the number of similar images
            </Typography>
            <FormControl sx={{ minWidth: 200, mt: 2 }}>
              <InputLabel id="k-select-label">K Neighbors</InputLabel>
              <Select
                labelId="k-select-label"
                id="k-select"
                value={kValue}
                label="K Neighbors"
                onChange={handleKChange}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </StyledPaper>
        </Grid>

        {/* Step 2: Provide image */}
        <Grid item xs={12}>
          <StyledPaper elevation={2}>
            <Typography variant="h6" gutterBottom>
              Step 2: Provide an image to search
            </Typography>
          </StyledPaper>
        </Grid>

        {/* Upload option */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="subtitle1" gutterBottom>
              Upload from your device
            </Typography>
            <DropzoneArea {...getRootProps()} isDragActive={isDragActive}>
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
              <Typography>
                {isDragActive
                  ? 'Drop the image here...'
                  : 'Drag & drop an image, or click to select'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports: JPG, PNG, GIF (max 5MB)
              </Typography>
            </DropzoneArea>
            {previewImage && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
                />
              </Box>
            )}
          </StyledPaper>
        </Grid>

        {/* URL option */}
        <Grid item xs={12} md={6}>
          <StyledPaper elevation={2}>
            <Typography variant="subtitle1" gutterBottom>
              Or enter a public image URL
            </Typography>
            <Box component="form" onSubmit={handleUrlSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Image URL"
                variant="outlined"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                sx={{ mb: 2 }}
              />
              <GradientButton
                type="submit"
                variant="contained"
                startIcon={<Search />}
                disabled={isLoading}
              >
                Search
              </GradientButton>
            </Box>
          </StyledPaper>
        </Grid>

        {/* Step 3: Results */}
        <Grid item xs={12}>
          <StyledPaper elevation={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Step 3: Results</Typography>
              {pictures.length > 0 && (
                <Button variant="outlined" onClick={clearResults} size="small">
                  Clear
                </Button>
              )}
            </Box>

            <StyledLinearProgress
              variant="determinate"
              value={progress}
              sx={{ mb: 3 }}
            />

            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            {pictures.length > 0 ? (
              <ImageList cols={3} gap={16}>
                {pictures.map((item, index) => (
                  <ImageListItem key={item.img || index}>
                    <img
                      src={item.img}
                      alt={`Similar image ${index + 1}`}
                      loading="lazy"
                      style={{
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                      }}
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <Typography color="text.secondary">
                {isLoading ? 'Searching for similar images...' : 'No results yet. Upload an image or enter a URL to search.'}
              </Typography>
            )}
          </StyledPaper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;
