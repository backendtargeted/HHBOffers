import React, { useState, useEffect } from 'react';
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
import { blue, green } from '@mui/material/colors';

// Import components
import Login from './components/auth/Login';
import Registration from './components/auth/Registration';
import Dashboard from './components/dashboard/Dashboard';
import PropertySearch from './components/property/PropertySearch';
import PropertyDetail from './components/property/PropertyDetail';
import FileUpload from './components/upload/FileUpload';
import Navigation from './components/layout/Navigation';
import PropertyTableList from './components/property/PropertyTableList';

// Import API services
import { authAPI, propertyAPI, uploadAPI, statsAPI, handleApiError } from './services/api';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: blue[700],
    },
    secondary: {
      main: green[600],
    },
  },
});

// Define user interface
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

// Auth context interface and implementation
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = React.createContext<AuthContextType | null>(null);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error' | 'info'} | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await authAPI.getProfile();
        if (response.success && response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        localStorage.removeItem('authToken');
        console.error('Authentication check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await authAPI.login(email, password);
      if (response.success && response.token) {
        localStorage.setItem('authToken', response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        setNotification({
          message: 'Login successful',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      setNotification({
        message: handleApiError(error),
        type: 'error'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      
      // Clear local storage and state
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
      setNotification({
        message: 'You have been logged out',
        type: 'info'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Auth context value
  const authContextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated
  };

  // If initial loading
  if (loading && !user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthContext.Provider value={authContextValue}>
        <Router>
          {isAuthenticated && <Navigation />}
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
              <Routes>
                <Route 
                  path="/" 
                  element={isAuthenticated ? <Navigate to="/search" /> : <Login onLogin={login} />} 
                />
                <Route 
                  path="/login" 
                  element={isAuthenticated ? <Navigate to="/search" /> : <Login onLogin={login} />} 
                />
                <Route 
                  path="/register" 
                  element={isAuthenticated ? <Navigate to="/search" /> : <Registration />} 
                />
                <Route 
                  path="/dashboard" 
                  element={isAuthenticated ? <Dashboard fetchStats={fetchSystemStats} /> : <Navigate to="/login" />} 
                />


                <Route 
                  path="/search" 
                  element={
                    isAuthenticated ? 
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
                              onBack={() => setSelectedProperty(null)} // Add back button functionality
                              editable={user?.role === 'admin' || user?.role === 'manager'} 
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
                      </Box> : 
                      <Navigate to="/login" />
                  } 
                />
                <Route 
                  path="/upload" 
                  element={
                    isAuthenticated && (user?.role === 'admin' || user?.role === 'manager') ? 
                      <FileUpload onUpload={handleFileUpload} /> : 
                      <Navigate to="/login" />
                  } 
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Container>
          </Box>
        </Router>
      </AuthContext.Provider>
      
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
