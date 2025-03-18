import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Alert,
  CircularProgress,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Check, Error } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authAPI } from '../../services/api';

// Define validation schema with password requirements
const registerSchema = yup.object({
  name: yup
    .string()
    .required('Name is required'),
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password should be of minimum 8 characters length')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Password confirmation is required'),
}).required();

// TypeScript interface for form data
interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  const { control, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });
  
  // Get current password value for validation display
  const password = watch('password', '');
  
  // Password requirement checks
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  // Submit handler
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { confirmPassword, ...userData } = data;
      await authAPI.register(userData);
      
      setSuccess(true);
      // Redirect to login after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        marginTop: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        <Paper 
          elevation={3} 
          sx={{ 
            padding: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h5" gutterBottom>
            Create Account
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Registration successful! Redirecting to login...
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%', mt: 1 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  autoComplete="name"
                  autoFocus
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
            
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  autoComplete="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
            
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="password"
                  label="Password"
                  type="password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                />
              )}
            />
            
            {/* Password requirements checklist */}
            <Box sx={{ mt: 1, mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Password must have:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {hasMinLength ? <Check color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary="At least 8 characters" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {hasUppercase ? <Check color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary="At least one uppercase letter" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {hasLowercase ? <Check color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary="At least one lowercase letter" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {hasNumber ? <Check color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary="At least one number" />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {hasSpecial ? <Check color="success" fontSize="small" /> : <Error color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText primary="At least one special character" />
                </ListItem>
              </List>
            </Box>
            
            <Controller
              name="confirmPassword"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                />
              )}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading || success}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Link href="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Registration;
