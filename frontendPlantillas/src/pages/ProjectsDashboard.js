import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectAPI, userAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Plus, Trash2, UserPlus, X, FileText } from 'lucide-react';

const ProjectsDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openMembersDialog, setOpenMembersDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedUserId, setSelectedUserId] = useState('');

  const loadData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        projectAPI.getProjects(),
        userAPI.getUsers()
      ]);
      setProjects(projectsRes.data);
      setAllUsers(usersRes.data.filter(u => u.status === 'active'));
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al cargar proyectos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectAPI.createProject(formData);
      setMessage({ type: 'success', text: 'Proyecto creado exitosamente' });
      setOpenDialog(false);
      setFormData({ name: '', description: '' });
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error al crear proyecto' });
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('¿Estás seguro de eliminar este proyecto? Se eliminarán también todos sus requisitos.')) return;
    
    try {
      await projectAPI.deleteProject(projectId);
      setMessage({ type: 'success', text: 'Proyecto eliminado exitosamente' });
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al eliminar proyecto' });
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      setMessage({ type: 'error', text: 'Por favor selecciona un usuario' });
      return;
    }

    try {
      await projectAPI.addMember(selectedProject.id, selectedUserId);
      setMessage({ type: 'success', text: 'Colaborador agregado exitosamente' });
      setSelectedUserId('');
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error al agregar colaborador' });
    }
  };

  const handleRemoveMember = async (projectId, userId) => {
    if (!window.confirm('¿Estás seguro de remover este colaborador?')) return;

    try {
      await projectAPI.removeMember(projectId, userId);
      setMessage({ type: 'success', text: 'Colaborador removido exitosamente' });
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al remover colaborador' });
    }
  };

  const getAvailableUsers = () => {
    if (!selectedProject) return [];
    const memberIds = selectedProject.members.map(m => m.id);
    return allUsers.filter(u => !memberIds.includes(u.id) && u.id !== selectedProject.owner_id);
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
    <div className="min-h-screen bg-gray-50" data-testid="projects-dashboard">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proyectos</h1>
            <p className="text-gray-600 mt-2">
              {user?.role === 'product_owner' ? 'Gestiona tus proyectos y colaboradores' : 'Proyectos en los que colaboras'}
            </p>
          </div>
          {user?.role === 'product_owner' && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="create-project-button">
                  <Plus className="w-4 h-4" />
                  Nuevo Proyecto
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="create-project-dialog">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                  <DialogDescription>Completa la información del proyecto</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateProject}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nombre del Proyecto</Label>
                      <Input
                        id="name"
                        data-testid="project-name-input"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        data-testid="project-description-input"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" data-testid="submit-project-button">Crear Proyecto</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {message && (
          <Alert
            variant={message.type === 'error' ? 'destructive' : 'default'}
            className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200' : ''}`}
            data-testid="projects-message"
          >
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : ''}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No hay proyectos disponibles</p>
              {user?.role === 'product_owner' && (
                <p className="text-sm text-gray-400 mt-2">Crea tu primer proyecto para comenzar</p>
              )}
            </div>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow" data-testid={`project-card-${project.id}`}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span className="text-lg">{project.name}</span>
                    {user?.role === 'product_owner' && project.owner_id === user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-700 -mt-2"
                        data-testid={`delete-project-${project.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Product Owner:</p>
                    <Badge variant="outline" className="bg-blue-50">{project.owner_name}</Badge>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-medium text-gray-500">Colaboradores: {project.members?.length || 0}</p>
                      {user?.role === 'product_owner' && project.owner_id === user.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProject(project);
                            setOpenMembersDialog(true);
                          }}
                          className="text-blue-600 h-6 px-2"
                          data-testid={`manage-members-${project.id}`}
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          Gestionar
                        </Button>
                      )}
                    </div>
                    {project.members && project.members.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.members.slice(0, 3).map((member) => (
                          <Badge key={member.id} variant="outline" className="text-xs">
                            {member.name}
                          </Badge>
                        ))}
                        {project.members.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{project.members.length - 3}</Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => navigate(`/requirements/${project.id}`)}
                    data-testid={`view-requirements-${project.id}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Requisitos
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Members Management Dialog */}
        <Dialog open={openMembersDialog} onOpenChange={setOpenMembersDialog}>
          <DialogContent className="max-w-2xl" data-testid="manage-members-dialog">
            <DialogHeader>
              <DialogTitle>Gestionar Colaboradores</DialogTitle>
              <DialogDescription>Proyecto: {selectedProject?.name}</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Add Member */}
              <div>
                <Label>Agregar Colaborador</Label>
                <div className="flex gap-2 mt-2">
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="flex-1" data-testid="select-user-to-add">
                      <SelectValue placeholder="Seleccionar usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableUsers().map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.email}) - {u.role === 'product_owner' ? 'Product Owner' : 'Developer'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddMember} data-testid="add-member-button">
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>

              {/* Current Members */}
              <div>
                <Label>Colaboradores Actuales ({selectedProject?.members?.length || 0})</Label>
                <div className="mt-2 space-y-2">
                  {selectedProject?.members && selectedProject.members.length > 0 ? (
                    selectedProject.members.map((member) => (
                      <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 rounded" data-testid={`member-${member.id}`}>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(selectedProject.id, member.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`remove-member-${member.id}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">No hay colaboradores aún</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setOpenMembersDialog(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProjectsDashboard;
