import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { LogOut, Users, FolderKanban, FileText } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center" data-testid="navbar-logo">
              <h1 className="text-2xl font-bold text-blue-600">SGRA</h1>
            </Link>
            
            <div className="ml-10 flex items-center space-x-4">
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  data-testid="navbar-admin-link"
                >
                  <Users className="w-4 h-4" />
                  Usuarios
                </Link>
              )}
              
              {(user?.role === 'product_owner' || user?.role === 'developer') && (
                <Link
                  to="/projects"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  data-testid="navbar-projects-link"
                >
                  <FolderKanban className="w-4 h-4" />
                  Proyectos
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm" data-testid="navbar-user-info">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrador' : user?.role === 'product_owner' ? 'Product Owner' : 'Developer'}</p>
            </div>
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              data-testid="navbar-logout-button"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
