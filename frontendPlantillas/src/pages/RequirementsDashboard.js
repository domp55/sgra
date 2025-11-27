import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requirementAPI, projectAPI } from '../utils/api';
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
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';

const RequirementsDashboard = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });

  const loadData = async () => {
    try {
      const [projectsRes, reqRes] = await Promise.all([
        projectAPI.getProjects(),
        requirementAPI.getRequirements(projectId)
      ]);
      
      const currentProject = projectsRes.data.find(p => p.id === projectId);
      if (!currentProject) {
        setMessage({ type: 'error', text: 'Proyecto no encontrado' });
        return;
      }
      
      setProject(currentProject);
      setRequirements(reqRes.data);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error al cargar requisitos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReq) {
        await requirementAPI.updateRequirement(editingReq.id, formData);
        setMessage({ type: 'success', text: 'Requisito actualizado exitosamente' });
      } else {
        await requirementAPI.createRequirement({ ...formData, project_id: projectId });
        setMessage({ type: 'success', text: 'Requisito creado exitosamente' });
      }
      setOpenDialog(false);
      setEditingReq(null);
      setFormData({ title: '', description: '', priority: 'medium' });
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error al guardar requisito' });
    }
  };

  const handleDelete = async (reqId) => {
    if (!window.confirm('¿Estás seguro de eliminar este requisito?')) return;
    
    try {
      await requirementAPI.deleteRequirement(reqId);
      setMessage({ type: 'success', text: 'Requisito eliminado exitosamente' });
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Error al eliminar requisito' });
    }
  };

  const handleEdit = (req) => {
    setEditingReq(req);
    setFormData({
      title: req.title,
      description: req.description,
      priority: req.priority
    });
    setOpenDialog(true);
  };

  const handleStatusChange = async (reqId, newStatus) => {
    try {
      await requirementAPI.updateRequirement(reqId, { status: newStatus });
      setMessage({ type: 'success', text: 'Estado actualizado exitosamente' });
      loadData();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al actualizar estado' });
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: <Badge variant="outline" className="bg-green-50 text-green-700">Baja</Badge>,
      medium: <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Media</Badge>,
      high: <Badge variant="outline" className="bg-red-50 text-red-700">Alta</Badge>
    };
    return badges[priority] || priority;
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: <Badge variant="outline">Borrador</Badge>,
      approved: <Badge className="bg-blue-500">Aprobado</Badge>,
      in_progress: <Badge className="bg-purple-500">En Progreso</Badge>,
      completed: <Badge className="bg-green-500">Completado</Badge>
    };
    return badges[status] || status;
  };

  const canManageRequirements = () => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'product_owner' && project?.owner_id === user.id) return true;
    if (user?.role === 'developer' && project?.members?.some(m => m.id === user.id)) return true;
    return false;
  };

  const canDelete = () => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'product_owner' && project?.owner_id === user.id) return true;
    return false;
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
    <div className="min-h-screen bg-gray-50" data-testid="requirements-dashboard">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/projects')}
            className="mb-4"
            data-testid="back-to-projects-button"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Proyectos
          </Button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project?.name}</h1>
            <p className="text-gray-600 mt-2">{project?.description}</p>
          </div>
          {canManageRequirements() && (
            <Dialog open={openDialog} onOpenChange={(open) => {
              setOpenDialog(open);
              if (!open) {
                setEditingReq(null);
                setFormData({ title: '', description: '', priority: 'medium' });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2" data-testid="create-requirement-button">
                  <Plus className="w-4 h-4" />
                  Nuevo Requisito
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="requirement-dialog">
                <DialogHeader>
                  <DialogTitle>{editingReq ? 'Editar Requisito' : 'Crear Nuevo Requisito'}</DialogTitle>
                  <DialogDescription>
                    {editingReq ? 'Modifica los datos del requisito' : 'Completa la información del requisito'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        data-testid="requirement-title-input"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        data-testid="requirement-description-input"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Prioridad</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger className="mt-1" data-testid="requirement-priority-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baja</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setOpenDialog(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" data-testid="submit-requirement-button">
                      {editingReq ? 'Actualizar' : 'Crear'} Requisito
                    </Button>
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
            data-testid="requirements-message"
          >
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : ''}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4">
          {requirements.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No hay requisitos en este proyecto</p>
                {canManageRequirements() && (
                  <p className="text-sm text-gray-400 mt-2">Crea el primer requisito para comenzar</p>
                )}
              </CardContent>
            </Card>
          ) : (
            requirements.map((req) => (
              <Card key={req.id} className="hover:shadow-md transition-shadow" data-testid={`requirement-card-${req.id}`}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{req.title}</h3>
                        {getPriorityBadge(req.priority)}
                        {getStatusBadge(req.status)}
                      </div>
                      <p className="text-gray-600 mb-4">{req.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Creado por: <strong>{req.created_by_name}</strong></span>
                        <span>•</span>
                        <span>{new Date(req.created_at).toLocaleDateString('es-ES')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {canManageRequirements() && (
                        <>
                          <Select 
                            value={req.status} 
                            onValueChange={(value) => handleStatusChange(req.id, value)}
                          >
                            <SelectTrigger className="w-[140px]" data-testid={`status-select-${req.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Borrador</SelectItem>
                              <SelectItem value="approved">Aprobado</SelectItem>
                              <SelectItem value="in_progress">En Progreso</SelectItem>
                              <SelectItem value="completed">Completado</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(req)}
                            data-testid={`edit-requirement-${req.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      {canDelete() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(req.id)}
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-requirement-${req.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RequirementsDashboard;
