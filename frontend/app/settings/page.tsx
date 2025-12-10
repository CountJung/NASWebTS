'use client';

import { useEffect, useState } from 'react';
import { 
  Box, Typography, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Select, MenuItem, IconButton,
  useTheme, useMediaQuery, Card, CardContent, Stack, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../lib/api';
import { UserRole } from '../../types/user';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  lastLoginAt: string;
}

export default function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users. You might not be an admin.');
    } finally {
      setLoading(false);
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

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Box p={isMobile ? 1 : 3}>
      <Typography variant="h4" gutterBottom>User Management</Typography>
      
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
  );
}
