'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Select, MenuItem, IconButton,
  useTheme, useMediaQuery, Card, CardContent, Stack, Chip,
  Tabs, Tab, TextField, Button, Alert, CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../lib/api';
import { UserRole } from '../../types/user';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  lastLoginAt: string;
}

interface SystemConfig {
  backendPort: string;
  frontendPort: string;
  logCleanupIntervalHours?: string;
  logRetentionDays?: string;
}

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [tabValue, setTabValue] = useState(0);
  
  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');

  // System Config State
  const [config, setConfig] = useState<SystemConfig>({
    backendPort: '',
    frontendPort: '',
    logCleanupIntervalHours: '1',
    logRetentionDays: '10',
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchUsers();
    fetchConfig();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setUsersError('Failed to fetch users. You might not be an admin.');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await api.get('/system/config');
      setConfig(response.data);
    } catch (err) {
      console.error('Failed to fetch system config', err);
    }
  };

  const handleRoleChange = async (id: string, newRole: UserRole) => {
    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Failed to update role');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleConfigSave = async () => {
    setConfigLoading(true);
    setConfigMessage(null);
    try {
      await api.post('/system/config', config);
      setConfigMessage({ type: 'success', text: 'Configuration saved. Please restart the servers to apply changes.' });
    } catch (err) {
      setConfigMessage({ type: 'error', text: 'Failed to save configuration.' });
    } finally {
      setConfigLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (usersLoading) return <Typography>Loading...</Typography>;
  if (usersError) return <Typography color="error">{usersError}</Typography>;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab label="User Management" />
          <Tab label="System Settings" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Box p={isMobile ? 0 : 0}>
          <Typography variant="h5" gutterBottom>Users</Typography>
          
          {isMobile ? (
            <Stack spacing={2}>
              {users.map((user) => (
                <Card key={user.id}>
                  <CardContent>
                    <Typography variant="h6">{user.name}</Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>{user.email}</Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        size="small"
                        sx={{ minWidth: 100 }}
                      >
                        <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                        <MenuItem value={UserRole.USER}>User</MenuItem>
                        <MenuItem value={UserRole.GUEST}>Guest</MenuItem>
                        <MenuItem value={UserRole.BANNED}>Banned</MenuItem>
                      </Select>
                      <IconButton onClick={() => handleDelete(user.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="caption" display="block" mt={1}>
                      Last Login: {new Date(user.lastLoginAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          size="small"
                        >
                          <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
                          <MenuItem value={UserRole.USER}>User</MenuItem>
                          <MenuItem value={UserRole.GUEST}>Guest</MenuItem>
                          <MenuItem value={UserRole.BANNED}>Banned</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>{new Date(user.lastLoginAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleDelete(user.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box maxWidth={600}>
          <Typography variant="h5" gutterBottom>Port Configuration</Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Changing these values will update the .env files. You must restart the servers manually for changes to take effect.
          </Typography>
          
          {configMessage && (
            <Alert severity={configMessage.type} sx={{ mb: 2 }}>
              {configMessage.text}
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField
              label="Frontend Port"
              value={config.frontendPort}
              onChange={(e) => setConfig({ ...config, frontendPort: e.target.value })}
              helperText="Default: 3000"
            />
            <TextField
              label="Backend Port"
              value={config.backendPort}
              onChange={(e) => setConfig({ ...config, backendPort: e.target.value })}
              helperText="Default: 4000"
            />

            <Typography variant="h6">Log Cleanup</Typography>
            <TextField
              label="Cleanup Interval (hours)"
              type="number"
              value={config.logCleanupIntervalHours || '1'}
              onChange={(e) => setConfig({ ...config, logCleanupIntervalHours: e.target.value })}
              helperText="Default: 1 (runs hourly, can skip based on interval)"
              inputProps={{ min: 1, max: 168 }}
            />
            <TextField
              label="Retention Days"
              type="number"
              value={config.logRetentionDays || '10'}
              onChange={(e) => setConfig({ ...config, logRetentionDays: e.target.value })}
              helperText="Default: 10"
              inputProps={{ min: 1, max: 365 }}
            />
            <Button 
              variant="contained" 
              startIcon={configLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleConfigSave}
              disabled={configLoading}
            >
              Save Configuration
            </Button>
          </Stack>
        </Box>
      </TabPanel>
    </Box>
  );
}
