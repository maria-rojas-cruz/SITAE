# app/tests/test_chat_service.py
import uuid
import types
import datetime as dt
import pytest

# --- Importa el módulo para poder "monkeypatchearlo" (tiktoken, models, settings, etc.)
import app.services.chat_service as chat_module
from types import SimpleNamespace

# =========================
#  Dummies / Fakes comunes
# =========================

class DummyEncoding:
    def encode(self, s: str):
        return list(s.encode("utf-8"))

class FakeTiktoken:
    def encoding_for_model(self, _):
        return DummyEncoding()

class FakeOpenAIChatCreateResult:
    class _Msg:
        def __init__(self, content):
            self.content = content

    class _Choice:
        def __init__(self, content):
            self.message = FakeOpenAIChatCreateResult._Msg(content)

    def __init__(self, content="respuesta LLM", total_tokens=321):
        self.choices = [FakeOpenAIChatCreateResult._Choice(content)]
        self.usage = SimpleNamespace(total_tokens=total_tokens)

class FakeOpenAIClient:
    class _Completions:
        def __init__(self, parent):
            self._parent = parent

        def create(self, **kwargs):
            # Retorna una respuesta controlada
            return FakeOpenAIChatCreateResult(
                content=self._parent._content,
                total_tokens=self._parent._tokens,
            )

    class _Chat:
        def __init__(self, parent):
            self.completions = FakeOpenAIClient._Completions(parent)

    def __init__(self, content="respuesta LLM", tokens=321):
        self._content = content
        self._tokens = tokens
        self.chat = FakeOpenAIClient._Chat(self)

# Fake modelos ORM
class _Col:
    """Simula una columna SQLAlchemy que soporta .desc()."""
    def desc(self):
        return self

class FakeConversation:
    # Atributos de CLASE para que el código pueda hacer Conversation.user_id == ...
    user_id = _Col()
    course_id = _Col()
    created_at = _Col()

    def __init__(self, user_id, course_id, message, response, sources):
        import uuid, datetime as dt
        self.id = str(uuid.uuid4())
        self.user_id = user_id
        self.course_id = course_id
        self.message = message
        self.response = response
        self.sources = sources
        self.created_at = dt.datetime.utcnow()


class FakeCourse:
    id = None
    def __init__(self, id_, name):
        self.id = id_
        self.name = name

# Fake DB/Query para .query(...).filter(...).order_by(...).limit(...).all()/first()
class QueryStub:
    def __init__(self, db, model):
        self.db = db
        self.model = model
        self._limit = None

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def limit(self, n):
        self._limit = n
        return self

    def all(self):
        if self.model is chat_module.Conversation:
            items = list(self.db._conversations)
            # Simula created_at DESC en DB; luego ChatService los invierte
            items.sort(key=lambda c: c.created_at, reverse=True)
            if self._limit is not None:
                items = items[: self._limit]
            return items
        return []

    def first(self):
        if self.model is chat_module.Course:
            # Devuelve el curso requerido si existe
            return self.db._course
        return None

class FakeDBSession:
    def __init__(self):
        self._course = None
        self._conversations = []
        self._execute_rows = []   # para _get_weak_areas (fetchall)
        self._execute_should_raise = False
        self._added = []
        self.did_commit = False
        self.did_refresh = False
        self.did_rollback = False
        self.last_execute_params = None

    def query(self, model):
        return QueryStub(self, model)

    def execute(self, sql_text_obj, params=None):
        # Guarda params para aserciones
        self.last_execute_params = params or {}
        if self._execute_should_raise:
            raise RuntimeError("SQL error simulated")
        return SimpleNamespace(
            fetchall=lambda: list(self._execute_rows),
            fetchone=lambda: (self._execute_rows[0] if self._execute_rows else None),
        )

    def add(self, obj):
        self._added.append(obj)

    def commit(self):
        if getattr(self, "_commit_should_raise", False):
            raise RuntimeError("Commit failed")
        self.did_commit = True

    def refresh(self, obj):
        self.did_refresh = True

    def rollback(self):
        self.did_rollback = True

# =========================
#  Fixtures de entorno
# =========================

@pytest.fixture(autouse=True)
def patch_module(monkeypatch):
    """
    Parcha dependencias del módulo:
    - tiktoken
    - modelos (Conversation, Course)
    - settings
    """
    # tiktoken dummy
    monkeypatch.setattr(chat_module, "tiktoken", FakeTiktoken(), raising=True)
    # Modelos
    monkeypatch.setattr(chat_module, "Conversation", FakeConversation, raising=True)
    monkeypatch.setattr(chat_module, "Course", FakeCourse, raising=True)
    # settings
    fake_settings = SimpleNamespace(OPENAI_API_KEY="test", CHAT_MODEL="gpt-x")
    monkeypatch.setattr(chat_module, "settings", fake_settings, raising=True)

@pytest.fixture
def base_env(monkeypatch):
    """
    Construye ChatService con DB falsa + inyecta servicios/mocks de RAG, perfil y OpenAI.
    """
    db = FakeDBSession()

    # Curso base existente
    db._course = FakeCourse("course-1", "Fundamentos de Python")

    # Historial: 3 conversaciones (antigua a reciente)
    def mk_conv(msg, resp, seconds_ago):
        c = FakeConversation("user-1", "course-1", msg, resp, [])
        c.created_at = dt.datetime.utcnow() - dt.timedelta(seconds=seconds_ago)
        return c
    db._conversations = [
        mk_conv("hola", "hola!", 90),
        mk_conv("qué es una lista", "explicación...", 60),
        mk_conv("y una tupla?", "otra explicación...", 30),
    ]

    # Instancia ChatService real (pero lo cableamos con fakes)
    svc = chat_module.ChatService(db)

    # OpenAI fake
    svc.client = FakeOpenAIClient(content="respuesta LLM", tokens=321)

    # Embedding fake
    class FakeEmbedding:
        def __init__(self, docs=None, metas=None, dists=None):
            self._docs = ["Doc A " + ("x" * 210), "Doc B", "Doc C"] if docs is None else docs
            self._metas = [
                {"document_id": "d1", "document_title": "Tema 1", "document_type": "pdf"},
                {"document_id": "d2", "document_title": "Tema 2", "document_type": "web"},
                {"document_id": "d3", "document_title": "Tema 3", "document_type": "note"},
            ] if metas is None else metas
            self._dists = [0.0, 0.8, 2.0] if dists is None else dists



        def search_similar_content(self, course_id, query, n_results):
            return {
                "documents": self._docs[:n_results],
                "metadatas": self._metas[:n_results],
                "distances": self._dists[:n_results],
            }

    svc.embedding_service = FakeEmbedding()

    # Profile fake
    class FakeProfile:
        def __init__(self, payload=None, raise_err=False):
            self._payload = payload
            self._raise = raise_err

        def get_complete_profile_for_agent(self, user_id, course_id):
            if self._raise:
                raise RuntimeError("profile error")
            return self._payload if self._payload is not None else {
                "learning_profile": {
                    "career": "Ingeniería Informática",
                    "job_role": "Becaria de TI",
                    "preferred_modalities": ["video", "ejercicio"],
                    "devices": ["laptop_pc", "movil"],
                },
                "course_profile": {
                    "prereq_level": "medio",
                    "weekly_time": "h3_6",
                    "goals": ["mejorar_nota", "dominar"],
                },
            }

    svc.profile_service = FakeProfile()

    return SimpleNamespace(svc=svc, db=db, FakeEmbedding=FakeEmbedding)

# =========================================
#  10 CASOS PRIORIZADOS (de la lista top)
# =========================================

@pytest.mark.asyncio
async def test_1_flujo_feliz_e2e(base_env):
    e = base_env
    # Configura filas para _get_weak_areas
    e.db._execute_rows = [
        SimpleNamespace(code="OBJ1", description="Listas", fail_count=3),
        SimpleNamespace(code=None, description="Comprensiones", fail_count=2),
    ]
    out = await e.svc.process_message("user-1", "course-1", "¿qué es una lista?")
    assert out.conversation_id
    assert out.response == "respuesta LLM"
    assert out.tokens_used == 321
    assert isinstance(out.sources, list) and len(out.sources) == 3
    # Truncamiento a 200 + "..."
    assert out.sources[0].chunk_text.endswith("...")
    # Se persistió conversación
    assert e.db.did_commit is True
    assert e.db.did_refresh is True
    assert len(e.db._added) == 1

@pytest.mark.asyncio
async def test_2_curso_no_encontrado(base_env):
    e = base_env
    e.db._course = None
    with pytest.raises(ValueError) as ex:
        await e.svc.process_message("user-1", "course-1", "hola?")
    assert "Curso no encontrado" in str(ex.value)
    assert e.db.did_rollback is True
    assert e.db.did_commit is False

@pytest.mark.asyncio
async def test_3_openai_falla_rolls_back(base_env, monkeypatch):
    e = base_env

    def boom(**kwargs):
        raise RuntimeError("OpenAI down")

    # Forzamos que la llamada al LLM falle
    monkeypatch.setattr(e.svc.client.chat.completions, "create", boom)

    with pytest.raises(RuntimeError):
        await e.svc.process_message("user-1", "course-1", "hola?")

    assert e.db.did_rollback is True
    assert e.db.did_commit is False


@pytest.mark.asyncio
async def test_4_fallo_commit_rolls_back(base_env):
    e = base_env
    e.db._execute_rows = []
    e.db._commit_should_raise = True
    with pytest.raises(RuntimeError):
        await e.svc.process_message("user-1", "course-1", "hola?")
    assert e.db.did_rollback is True

@pytest.mark.asyncio
async def test_5_rag_vacio(base_env):
    e = base_env
    # Reinyecta embedding que retorna vacío
    e.svc.embedding_service = e.FakeEmbedding(docs=[], metas=[], dists=[])
    e.db._execute_rows = []
    out = await e.svc.process_message("user-1", "course-1", "tema sin fuentes")
    assert out.sources == []  # sin fuentes
    # Prompt no debe incluir "Material de referencia del curso"
    # (no accedemos al prompt interno; validamos que no explota y guarda)
    assert e.db.did_commit is True

@pytest.mark.asyncio
async def test_6_historial_incluido_en_orden(monkeypatch, base_env):
    e = base_env
    captured = {}

    # Envuelve la llamada a OpenAI para inspeccionar los mensajes enviados
    real = e.svc.client.chat.completions.create
    def spy(**kwargs):
        captured['messages'] = kwargs.get("messages", [])
        return real(**kwargs)

    monkeypatch.setattr(e.svc.client.chat.completions, "create", spy)
    e.db._execute_rows = []
    await e.svc.process_message("user-1", "course-1", "mensaje actual")
    msgs = captured['messages']
    # Esperamos: 1 system + (historial user, assistant)*3 + user actual
    assert msgs[0]["role"] == "system"
    # Los 2 primeros del historial deben ser de la conversación más antigua
    assert msgs[1]["role"] == "user"
    assert msgs[2]["role"] == "assistant"
    assert msgs[-1]["role"] == "user"
    assert "mensaje actual" in msgs[-1]["content"]

def test_7_get_weak_areas_con_resultados(base_env):
    e = base_env
    e.db._execute_rows = [
        SimpleNamespace(code="OBJ1", description="Listas", fail_count=3),
        SimpleNamespace(code=None, description="Comprensiones", fail_count=2),
    ]
    txt = e.svc._get_weak_areas("user-1", "course-1")
    assert "Objetivos de aprendizaje" in txt
    assert "- [OBJ1] Listas (3 fallos)" in txt
    assert "- Comprensiones (2 fallos)" in txt
    # Parámetros pasados correctamente
    assert e.db.last_execute_params == {"user_id": "user-1", "course_id": "course-1"}

def test_8_get_weak_areas_error_sql_hace_rollback(base_env):
    e = base_env
    e.db._execute_should_raise = True
    txt = e.svc._get_weak_areas("user-1", "course-1")
    assert "No disponible" in txt
    assert e.db.did_rollback is True

def test_9_get_student_context_sin_perfil(base_env):
    e = base_env

    class EmptyProfile:
        def get_complete_profile_for_agent(self, *_):
            return {"learning_profile": {}, "course_profile": {}}

    e.svc.profile_service = EmptyProfile()
    txt = e.svc._get_student_context("user-1", "course-1")
    assert "No disponible (aún no ha completado su perfil)" in txt

def test_10_build_system_prompt_con_fuentes(base_env):
    e = base_env
    prompt = e.svc._build_system_prompt(
        course_name="Fundamentos de Python",
        student_context="Perfil del estudiante: X",
        weak_areas="Áreas: Y",
        relevant_content=["AAA", "BBB", "CCC"],
    )
    assert 'curso "Fundamentos de Python"' in prompt
    assert "Perfil del estudiante: X" in prompt
    assert "Áreas: Y" in prompt
    assert "Material de referencia del curso" in prompt
    assert "[Fuente 1]" in prompt and "[Fuente 2]" in prompt and "[Fuente 3]" in prompt
    # Reglas clave presentes
    for s in [
        "Adapta tus explicaciones", "tiempo limitado", "ejemplos de código",
        "dificultades", "indica la fuente", "no tienes información suficiente",
        "pensamiento crítico", "tono amigable", "conceptos erróneos",
    ]:
        assert s in prompt
