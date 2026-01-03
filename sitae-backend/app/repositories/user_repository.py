#repositories/user_repository.property
 
from sqlalchemy.orm import Session
from app.models.user import User
from typing import Optional

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_google_id(self, google_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.google_id == google_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user_data: dict) -> User:
        db_user = User(**user_data)
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update_user(self, user: User, update_data: dict) -> User:
        for field, value in update_data.items():
            setattr(user, field, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def link_google_account(self, user: User, google_data: dict) -> User:
        user.google_id = google_data["google_id"]
        user.name = google_data.get("name")
        user.picture = google_data.get("picture")
        user.auth_provider = "google"
        self.db.commit()
        self.db.refresh(user)
        return user