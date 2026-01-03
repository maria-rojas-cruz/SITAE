from pydantic import BaseModel

class RoleOut(BaseModel):
    id: int
    name: str