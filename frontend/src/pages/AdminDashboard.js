import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selectedRole, setSelectedRole] = useState({});

  const loadData = async () => {
    try {
      const [pendingRes, allRes] = await Promise.all([
        userAPI.getPendingUsers(),
        userAPI.getUsers()
      ]);
      setPendingUsers(pendingRes.data);
      setAllUsers(allRes.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cargar usuarios' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (userId) => {
    const role = selectedRole[userId];
    if (!role) {
      setMessage({ type: 'error', text: 'Por favor selecciona un rol' });
      return;
    }

    try {
      await userAPI.approveUser(userId, role);
      setMessage({ type: 'success', text: 'Usuario aprobado exitosamente' });
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error al aprobar usuario' });
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('¿Estás seguro de desactivar este usuario?')) return;

    try {
      await userAPI.deactivateUser(userId);
      setMessage({ type: 'success', text: 'Usuario desactivado exitosamente' });
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al desactivar usuario' });
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: <Badge className="bg-purple-500">Administrador</Badge>,
      product_owner: <Badge className="bg-blue-500">Product Owner</Badge>,
      developer: <Badge className="bg-green-500">Developer</Badge>,
      pending: <Badge variant="outline">Pendiente</Badge>
    };
    return badges[role] || role;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: <Badge className="bg-green-500">Activo</Badge>,
      inactive: <Badge variant="destructive">Inactivo</Badge>,
      pending: <Badge variant="outline">Pendiente</Badge>
    };
    return badges[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-2">Gestiona usuarios y permisos del sistema</p>
        </div>

        {message && (
          <Alert
            variant={message.type === 'error' ? 'destructive' : 'default'}
            className={message.type === 'success' ? 'bg-green-50 border-green-200' : ''}
            data-testid="admin-message"
          >
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : ''}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Users Section */}
        <Card className="mb-8" data-testid="pending-users-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              Solicitudes Pendientes ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay solicitudes pendientes</p>
            ) : (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`pending-user-${user.id}`}>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Select
                        value={selectedRole[user.id] || ''}
                        onValueChange={(value) => setSelectedRole({ ...selectedRole, [user.id]: value })}
                      >
                        <SelectTrigger className="w-[180px]" data-testid={`role-select-${user.id}`}>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="product_owner">Product Owner</SelectItem>
                          <SelectItem value="developer">Developer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleApprove(user.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`approve-user-${user.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprobar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Users Section */}
        <Card data-testid="all-users-section">
          <CardHeader>
            <CardTitle>Todos los Usuarios ({allUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-gray-50" data-testid={`user-row-${u.id}`}>
                      <td className="py-3 px-4">{u.name}</td>
                      <td className="py-3 px-4 text-gray-600">{u.email}</td>
                      <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3 px-4">{getStatusBadge(u.status)}</td>
                      <td className="py-3 px-4">
                        {u.status === 'active' && u.id !== user.id && (
                          <Button
                            onClick={() => handleDeactivate(u.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            data-testid={`deactivate-user-${u.id}`}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Desactivar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
