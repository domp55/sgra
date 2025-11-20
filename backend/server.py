from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from starlette.middleware.cors import CORSMiddleware
from typing import Optional, List
import os
import logging
from datetime import timedelta

from database import (
    users_collection, 
    projects_collection, 
    requirements_collection,
    close_db_connection
)
from models import (
    UserRegister, UserLogin, User, UserApprove, UserResponse,
    ProjectCreate, Project, ProjectResponse, ProjectMemberAdd,
    RequirementCreate, RequirementUpdate, Requirement, RequirementResponse
)
from auth import hash_password, verify_password, create_access_token, decode_token

# Create the main app
app = FastAPI(title="SGRA API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ===== AUTHENTICATION MIDDLEWARE =====
async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """Get current user from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado: Token no proporcionado")
    
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        if not payload:
            raise HTTPException(status_code=401, detail="Token inválido o expirado")
        
        # Get user from database
        user = await users_collection.find_one({"id": payload.get("user_id")}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
        if user["status"] != "active":
            raise HTTPException(status_code=403, detail="Usuario inactivo")
        
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Error de autenticación: {str(e)}")

async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    """Require admin role"""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de administrador")
    return current_user

async def require_product_owner(current_user: dict = Depends(get_current_user)) -> dict:
    """Require product owner role"""
    if current_user["role"] not in ["admin", "product_owner"]:
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de Product Owner")
    return current_user

# ===== AUTHENTICATION ENDPOINTS =====
@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    """Register a new user (creates a pending request)"""
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name,
        role="pending",
        status="pending"
    )
    
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await users_collection.insert_one(user_dict)
    
    return {
        "message": "Solicitud de registro enviada. Espera la aprobación del administrador.",
        "user_id": user.id
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login and get JWT token"""
    # Find user
    user = await users_collection.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    # Check if user is active
    if user["status"] != "active":
        if user["status"] == "pending":
            raise HTTPException(status_code=403, detail="Tu cuenta está pendiente de aprobación")
        raise HTTPException(status_code=403, detail="Tu cuenta está inactiva")
    
    # Create token
    token = create_access_token(
        data={"user_id": user["id"], "email": user["email"], "role": user["role"]}
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"],
        "status": current_user["status"]
    }

# ===== USER MANAGEMENT ENDPOINTS =====
@api_router.get("/users/pending")
async def get_pending_users(current_user: dict = Depends(require_admin)):
    """Get all pending user requests (Admin only)"""
    users = await users_collection.find(
        {"status": "pending"},
        {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    return users

@api_router.get("/users")
async def get_users(current_user: dict = Depends(require_admin)):
    """Get all users (Admin only)"""
    users = await users_collection.find(
        {},
        {"_id": 0, "password_hash": 0}
    ).to_list(1000)
    return users

@api_router.put("/users/{user_id}/approve")
async def approve_user(user_id: str, approval: UserApprove, current_user: dict = Depends(require_admin)):
    """Approve a user and assign role (Admin only)"""
    # Validate role
    valid_roles = ["admin", "product_owner", "developer"]
    if approval.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Debe ser uno de: {', '.join(valid_roles)}")
    
    # Update user
    result = await users_collection.update_one(
        {"id": user_id},
        {
            "$set": {
                "role": approval.role,
                "status": "active"
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {"message": "Usuario aprobado y rol asignado exitosamente"}

@api_router.put("/users/{user_id}/deactivate")
async def deactivate_user(user_id: str, current_user: dict = Depends(require_admin)):
    """Deactivate a user (Admin only)"""
    result = await users_collection.update_one(
        {"id": user_id},
        {"$set": {"status": "inactive"}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {"message": "Usuario desactivado exitosamente"}

# ===== PROJECT ENDPOINTS =====
@api_router.get("/projects")
async def get_projects(current_user: dict = Depends(get_current_user)):
    """Get projects based on user role"""
    if current_user["role"] == "admin":
        # Admin sees all projects
        projects = await projects_collection.find({}, {"_id": 0}).to_list(1000)
    elif current_user["role"] == "product_owner":
        # Product Owner sees their own projects
        projects = await projects_collection.find(
            {"owner_id": current_user["id"]},
            {"_id": 0}
        ).to_list(1000)
    else:
        # Developers see projects they're members of
        projects = await projects_collection.find(
            {"members": current_user["id"]},
            {"_id": 0}
        ).to_list(1000)
    
    # Enrich with member details
    for project in projects:
        if "members" in project and project["members"]:
            member_ids = project["members"]
            members = await users_collection.find(
                {"id": {"$in": member_ids}},
                {"_id": 0, "id": 1, "name": 1, "email": 1}
            ).to_list(1000)
            project["members"] = members
        else:
            project["members"] = []
    
    return projects

@api_router.post("/projects")
async def create_project(project_data: ProjectCreate, current_user: dict = Depends(require_product_owner)):
    """Create a new project (Product Owner only)"""
    project = Project(
        name=project_data.name,
        description=project_data.description,
        owner_id=current_user["id"],
        owner_name=current_user["name"],
        members=[]
    )
    
    project_dict = project.model_dump()
    project_dict["created_at"] = project_dict["created_at"].isoformat()
    
    await projects_collection.insert_one(project_dict)
    
    return {
        "message": "Proyecto creado exitosamente",
        "project": project_dict
    }

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(require_product_owner)):
    """Delete a project (Product Owner only - own projects)"""
    # Check if project exists and user is owner
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if project["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este proyecto")
    
    # Delete project
    await projects_collection.delete_one({"id": project_id})
    
    # Also delete all requirements associated with this project
    await requirements_collection.delete_many({"project_id": project_id})
    
    return {"message": "Proyecto eliminado exitosamente"}

@api_router.post("/projects/{project_id}/members")
async def add_project_member(project_id: str, member_data: ProjectMemberAdd, current_user: dict = Depends(require_product_owner)):
    """Add a member to a project (Product Owner only)"""
    # Check if project exists and user is owner
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if project["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este proyecto")
    
    # Check if user to add exists
    user_to_add = await users_collection.find_one({"id": member_data.user_id}, {"_id": 0})
    if not user_to_add:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if user_to_add["status"] != "active":
        raise HTTPException(status_code=400, detail="El usuario no está activo")
    
    # Check if already a member
    if member_data.user_id in project.get("members", []):
        raise HTTPException(status_code=400, detail="El usuario ya es miembro del proyecto")
    
    # Add member
    await projects_collection.update_one(
        {"id": project_id},
        {"$push": {"members": member_data.user_id}}
    )
    
    return {"message": f"Usuario {user_to_add['name']} agregado al proyecto exitosamente"}

@api_router.delete("/projects/{project_id}/members/{user_id}")
async def remove_project_member(project_id: str, user_id: str, current_user: dict = Depends(require_product_owner)):
    """Remove a member from a project (Product Owner only)"""
    # Check if project exists and user is owner
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    if project["owner_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar este proyecto")
    
    # Remove member
    result = await projects_collection.update_one(
        {"id": project_id},
        {"$pull": {"members": user_id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Miembro no encontrado en el proyecto")
    
    return {"message": "Miembro removido del proyecto exitosamente"}

# ===== REQUIREMENTS ENDPOINTS =====
@api_router.get("/requirements")
async def get_requirements(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get all requirements for a project"""
    # Check if user has access to the project
    project = await projects_collection.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Check access
    if current_user["role"] not in ["admin", "product_owner"]:
        if current_user["id"] not in project.get("members", []):
            raise HTTPException(status_code=403, detail="No tienes acceso a este proyecto")
    elif current_user["role"] == "product_owner":
        if project["owner_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="No tienes acceso a este proyecto")
    
    # Get requirements
    requirements = await requirements_collection.find(
        {"project_id": project_id},
        {"_id": 0}
    ).to_list(1000)
    
    return requirements

@api_router.post("/requirements")
async def create_requirement(req_data: RequirementCreate, current_user: dict = Depends(get_current_user)):
    """Create a new requirement"""
    # Check if project exists and user has access
    project = await projects_collection.find_one({"id": req_data.project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Check permissions
    if current_user["role"] == "product_owner":
        if project["owner_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para crear requisitos en este proyecto")
    elif current_user["role"] == "developer":
        if current_user["id"] not in project.get("members", []):
            raise HTTPException(status_code=403, detail="No tienes permiso para crear requisitos en este proyecto")
    
    # Validate priority
    if req_data.priority not in ["low", "medium", "high"]:
        raise HTTPException(status_code=400, detail="Prioridad inválida. Debe ser: low, medium, o high")
    
    # Create requirement
    requirement = Requirement(
        project_id=req_data.project_id,
        title=req_data.title,
        description=req_data.description,
        priority=req_data.priority,
        created_by=current_user["id"],
        created_by_name=current_user["name"]
    )
    
    req_dict = requirement.model_dump()
    req_dict["created_at"] = req_dict["created_at"].isoformat()
    req_dict["updated_at"] = req_dict["updated_at"].isoformat()
    
    await requirements_collection.insert_one(req_dict)
    
    return {
        "message": "Requisito creado exitosamente",
        "requirement": req_dict
    }

@api_router.put("/requirements/{requirement_id}")
async def update_requirement(requirement_id: str, req_update: RequirementUpdate, current_user: dict = Depends(get_current_user)):
    """Update a requirement"""
    # Get requirement
    requirement = await requirements_collection.find_one({"id": requirement_id}, {"_id": 0})
    if not requirement:
        raise HTTPException(status_code=404, detail="Requisito no encontrado")
    
    # Check if user has access to the project
    project = await projects_collection.find_one({"id": requirement["project_id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Check permissions
    if current_user["role"] == "product_owner":
        if project["owner_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para editar este requisito")
    elif current_user["role"] == "developer":
        if current_user["id"] not in project.get("members", []):
            raise HTTPException(status_code=403, detail="No tienes permiso para editar este requisito")
    
    # Validate priority if provided
    if req_update.priority and req_update.priority not in ["low", "medium", "high"]:
        raise HTTPException(status_code=400, detail="Prioridad inválida. Debe ser: low, medium, o high")
    
    # Validate status if provided
    if req_update.status and req_update.status not in ["draft", "approved", "in_progress", "completed"]:
        raise HTTPException(status_code=400, detail="Estado inválido")
    
    # Build update dict
    update_dict = {k: v for k, v in req_update.model_dump().items() if v is not None}
    if update_dict:
        from datetime import datetime
        update_dict["updated_at"] = datetime.utcnow().isoformat()
        
        await requirements_collection.update_one(
            {"id": requirement_id},
            {"$set": update_dict}
        )
    
    return {"message": "Requisito actualizado exitosamente"}

@api_router.delete("/requirements/{requirement_id}")
async def delete_requirement(requirement_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a requirement"""
    # Get requirement
    requirement = await requirements_collection.find_one({"id": requirement_id}, {"_id": 0})
    if not requirement:
        raise HTTPException(status_code=404, detail="Requisito no encontrado")
    
    # Check if user has access to the project
    project = await projects_collection.find_one({"id": requirement["project_id"]}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Check permissions
    if current_user["role"] == "product_owner":
        if project["owner_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este requisito")
    elif current_user["role"] == "developer":
        raise HTTPException(status_code=403, detail="Solo el Product Owner puede eliminar requisitos")
    
    # Delete requirement
    await requirements_collection.delete_one({"id": requirement_id})
    
    return {"message": "Requisito eliminado exitosamente"}

# ===== HEALTH CHECK =====
@api_router.get("/")
async def root():
    return {"message": "SGRA API v1.0 - Sistema de Gestión de Requisitos Ágiles"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db_connection()

# Seed admin user on startup
@app.on_event("startup")
async def create_admin_user():
    """Create default admin user if not exists"""
    admin_email = "admin@sgra.com"
    existing_admin = await users_collection.find_one({"email": admin_email})
    
    if not existing_admin:
        admin_user = User(
            email=admin_email,
            name="Admin",
            role="admin",
            status="active"
        )
        
        admin_dict = admin_user.model_dump()
        admin_dict["password_hash"] = hash_password("admin123")
        admin_dict["created_at"] = admin_dict["created_at"].isoformat()
        
        await users_collection.insert_one(admin_dict)
        logger.info("✅ Admin user created: admin@sgra.com / admin123")
    else:
        logger.info("ℹ️ Admin user already exists")
