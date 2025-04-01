import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  CssBaseline, 
  ThemeProvider, 
  createTheme, 
  Box, 
  Container, 
  Snackbar,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import { green } from '@mui/material/colors';

// Import components
import Dashboard from './components/dashboard/Dashboard';
import PropertySearch from './components/property/PropertySearch';
import PropertyDetail from './components/property/PropertyDetail';
import FileUpload from './components/upload/FileUpload';
import Navigation from './components/layout/Navigation';
import PropertyTableList from './components/property/PropertyTableList';

// Import API services
import { propertyAPI, uploadAPI, statsAPI, handleApiError } from './services/api';

// Create theme with brand color
const theme = createTheme({
  palette: {
    primary: {
      main: '#233752', // Brand blue
    },
    secondary: {
      main: green[600],
    },
  },
});

function App() {
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search properties
  const searchProperties = async (query: string) => {
    try {
      const results = await propertyAPI.searchProperties(query);
      return results;
    } catch (error) {
      console.error('Property search failed:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
      return [];
    }
  };

  // Handle property selection
  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property);
  };

  // Get property details
  const getPropertyDetails = async (id: number) => {
    try {
      const response = await propertyAPI.getPropertyById(id);
      if (response.success && response.property) {
        setSelectedProperty(response.property);
        return response.property;
      }
    } catch (error) {
      console.error('Failed to get property details:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
    }
    return null;
  };

  // Update property
  const updateProperty = async (id: number, data: any) => {
    try {
      setIsLoading(true);
      const response = await propertyAPI.updateProperty(id, data);
      if (response && response.id) {
        setSelectedProperty(response);
        setNotification({
          message: 'Property updated successfully',
          type: 'success'
        });
        return response;
      }
    } catch (error) {
      console.error('Failed to update property:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      const response = await uploadAPI.uploadFile(file);
      if (response.success) {
        setNotification({
          message: 'File upload started. You can check the status using the job ID.',
          type: 'success'
        });
        return response;
      }
    } catch (error) {
      console.error('File upload failed:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
      throw error;
    }
    return null;
  };

  // Fetch system stats
  const fetchSystemStats = async () => {
    try {
      return await statsAPI.getSystemStats();
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
      throw error;
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navigation />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <Routes>
              <Route 
                path="/" 
                element={<Navigate to="/search" />} 
              />
              <Route 
                path="/dashboard" 
                element={<Dashboard fetchStats={fetchSystemStats} />} 
              />
              <Route 
                path="/search" 
                element={
                  <Box>
                    <PropertySearch 
                      onSearch={searchProperties} 
                      onSelectProperty={handlePropertySelect} 
                    />
                    
                    {selectedProperty ? (
                      <Box mt={4}>
                        <PropertyDetail 
                          property={selectedProperty} 
                          onUpdate={updateProperty}
                          onBack={() => setSelectedProperty(null)}
                          editable={true}
                          isLoading={isLoading}
                        />
                      </Box>
                    ) : (
                      <Box mt={4}>
                        <PropertyTableList 
                          getAllProperties={propertyAPI.getAllProperties}
                          onSelectProperty={handlePropertySelect}
                          limit={20}
                        />
                      </Box>
                    )}
                  </Box>
                } 
              />
              <Route 
                path="/upload" 
                element={<FileUpload onUpload={handleFileUpload} />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Container>
        </Box>
      </Router>
      
      {/* Notification */}
      <Snackbar 
        open={notification !== null} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification ? (
          <Alert
            onClose={handleCloseNotification}
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;