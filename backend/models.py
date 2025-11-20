from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
import uuid

# ===== USER MODELS =====
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str = "pending"  # pending, admin, product_owner, developer
    status: str = "pending"  # pending, active, inactive
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserApprove(BaseModel):
    role: str  # admin, product_owner, developer

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    status: str
    created_at: datetime

# ===== PROJECT MODELS =====
class ProjectBase(BaseModel):
    name: str
    description: str

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    owner_name: str = ""
    members: List[str] = []  # List of user IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    owner_id: str
    owner_name: str
    members: List[dict] = []  # List of {id, name, email}
    created_at: datetime

class ProjectMemberAdd(BaseModel):
    user_id: str

# ===== REQUIREMENT MODELS =====
class RequirementBase(BaseModel):
    title: str
    description: str
    priority: str = "medium"  # low, medium, high

class RequirementCreate(RequirementBase):
    project_id: str

class RequirementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class Requirement(RequirementBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    status: str = "draft"  # draft, approved, in_progress, completed
    created_by: str
    created_by_name: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RequirementResponse(BaseModel):
    id: str
    project_id: str
    title: str
    description: str
    priority: str
    status: str
    created_by: str
    created_by_name: str
    created_at: datetime
    updated_at: datetime
