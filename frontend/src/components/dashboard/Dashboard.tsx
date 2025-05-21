import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Divider,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  UploadFile as UploadIcon,
  Home as HomeIcon,
  Update as UpdateIcon,
  Add as AddIcon
} from '@mui/icons-material';
import type { GridProps } from '@mui/material/Grid';

// Define TypeScript interfaces for the data
interface ActivityItem {
  id: number;
  action: string;
  entityType: string;
  entityId?: string;
  timestamp: string;
  details?: any;
}

interface UploadStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  cancelled: number;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsErrored: number;
  averageProcessingTime: number;
}

interface SystemStats {
  properties: {
    total: number;
    addedToday: number;
    updatedToday: number;
  };
  uploads: UploadStats;
  recentActivities: ActivityItem[];
}

interface DashboardProps {
  fetchStats: () => Promise<SystemStats>;
}

const Dashboard: React.FC<DashboardProps> = ({ fetchStats }) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    
    // Refresh stats every minute
    const interval = setInterval(loadStats, 60000);
    
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Get color for activity type
  const getActivityColor = (action: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    switch (action) {
      case 'create':
      case 'upload':
        return 'success';
      case 'delete':
      case 'upload_failed':
      case 'processing_failed':
        return 'error';
      case 'update':
      case 'batch_update':
        return 'warning';
      case 'view':
        return 'info';
      default:
        return 'default';
    }
  };

  // Get icon for activity type
  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.action) {
      case 'create':
      case 'add':
        return <AddIcon color="success" />;
      case 'update':
      case 'batch_update':
        return <UpdateIcon color="warning" />;
      case 'upload':
      case 'upload_failed':
      case 'processing_failed':
        return <UploadIcon color={activity.action.includes('failed') ? 'error' : 'success'} />;
      default:
        return <HomeIcon />;
    }
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" gutterBottom>
          Error loading dashboard data: {error}
        </Typography>
        <Typography>
          Please try refreshing the page or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {/* Stats Summary */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
        {/* Property Stats */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Properties
            </Typography>
            <Typography variant="h3" color="primary">
              {stats?.properties.total.toLocaleString() || 0}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Added Today</Typography>
                <Typography variant="h6" color="success.main">
                  {stats?.properties.addedToday.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Updated Today</Typography>
                <Typography variant="h6" color="warning.main">
                  {stats?.properties.updatedToday.toLocaleString() || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
        
        {/* Upload Stats */}
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              File Uploads (Last 30 Days)
            </Typography>
            <Typography variant="h3" color="primary">
              {stats?.uploads.total.toLocaleString() || 0}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Completed</Typography>
                <Typography variant="h6" color="success.main">
                  {stats?.uploads.completed.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Records Processed</Typography>
                <Typography variant="h6">
                  {stats?.uploads.recordsProcessed.toLocaleString() || 0}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      {/* Recent Activity */}
      <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <List>
          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity) => (
              <ListItem key={activity.id} divider>
                <ListItemIcon>
                  {getActivityIcon(activity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography variant="body1">
                        {`${activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} ${activity.entityType}`}
                      </Typography>
                      <Chip
                        size="small"
                        label={activity.action}
                        color={getActivityColor(activity.action)}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={`${formatDate(activity.timestamp)} ${activity.entityId ? `• ID: ${activity.entityId}` : ''}`}
                />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemText primary="No recent activity" />
            </ListItem>
          )}
        </List>
      </Paper>
      
      {/* Upload Statistics */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Upload Statistics
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="textSecondary">Processing Status</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Completed</Typography>
                <Typography variant="h6" color="success.main">
                  {stats?.uploads.completed || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Failed</Typography>
                <Typography variant="h6" color="error.main">
                  {stats?.uploads.failed || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Processing</Typography>
                <Typography variant="h6" color="warning.main">
                  {stats?.uploads.processing || 0}
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="textSecondary">Record Processing</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mt: 1 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Created</Typography>
                <Typography variant="h6" color="success.main">
                  {stats?.uploads.recordsCreated.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Updated</Typography>
                <Typography variant="h6" color="warning.main">
                  {stats?.uploads.recordsUpdated.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Errors</Typography>
                <Typography variant="h6" color="error.main">
                  {stats?.uploads.recordsErrored.toLocaleString() || 0}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard;
