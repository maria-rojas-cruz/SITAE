# services/agent_service.py

from app.services import ProfileService

class exProfileService:
    def __init__(self, db: Session):
        self.db = db
        self.profile_service = ProfileService(db)
    
    async def process_with_agent(self, user_id: str, course_id: str):
        """Procesar con agente usando el perfil completo"""
        
        # Obtener perfil para el agente
        profile_data = self.profile_service.get_complete_profile_for_agent(
            user_id=user_id,
            course_id=course_id
        )
        
        # Preparar JSON para el agente
        agent_payload = {
            "user_context": profile_data,
            "task": "generate_recommendations",
            # ... otros datos
        }
        
        # Enviar al agente
        # response = await agent_client.process(agent_payload)
        
        return agent_payload