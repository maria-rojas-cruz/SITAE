import types
import uuid
import pytest
from app.schemas.attempt_quiz import FinishAnswerIn  # modelo real

# ====================== Helpers y Fakes comunes ======================

def uid(s: str) -> str:
    return uuid.UUID((s * 32)[:32]).hex

class Row(types.SimpleNamespace):
    pass

class FakeAttemptRepo:
    def __init__(self, attempts):
        self.attempts = attempts
        self.updated_payloads = {}

    def get_by_id(self, attempt_id):
        a = self.attempts.get(attempt_id)
        if not a:
            return None
        return types.SimpleNamespace(
            id=attempt_id, user_id=a["user_id"], quiz_id=a["quiz_id"], state=a["state"]
        )

    def update(self, attempt_id, payload):
        assert attempt_id in self.attempts
        self.attempts[attempt_id].update(payload)
        self.updated_payloads[attempt_id] = payload
        return types.SimpleNamespace(**self.attempts[attempt_id])

class FakeDB:
    """
    DB fake compatible con finish_attempt_with_personalization:
    - SELECT preguntas + opción correcta + OT
    - DELETE/INSERT question_response
    - UPDATE/SELECT comment en question_response
    - SELECT option text
    - SELECT recursos por OT
    - INSERT question_recommendation (upsert simplificado)
    """
    def __init__(self):
        self.questions = {}       # qid -> Row(id, text, score, topic_objective_id, quiz_id, correct_explanation?)
        self.options_ok = {}      # qid -> Row(id, text, is_correct=True)
        self.topic_objectives = {}# otid -> Row(id, code, description)
        self.resources = {}       # rid -> Row(id, title, type, url, duration_minutes, is_mandatory, topic_objective_id, order)
        self.qresponses = []      # dicts con comment opcional
        self.qrecs = []           # dicts
        self.executed = []

    def commit(self): pass

    # -- utilidades internas --
    def _select_questions_join_ok(self, quiz_id):
        out = []
        for q in self.questions.values():
            if q.quiz_id != quiz_id:
                continue
            ot = self.topic_objectives[q.topic_objective_id]
            ok = self.options_ok[q.id]
            out.append(
                Row(
                    id=q.id, text=q.text, score=q.score, topic_objective_id=ot.id,
                    correct_explanation=getattr(q, "correct_explanation", None),
                    ot_code=ot.code, ot_desc=ot.description,
                    ok_opt_id=ok.id, ok_opt_text=ok.text
                )
            )
        out.sort(key=lambda r: r.text)
        return out

    def _select_option_text(self, oid):
        for ok in self.options_ok.values():
            if ok.id == oid:
                return Row(text=ok.text)
        return None

    def _select_resources_by_ot(self, ot_id):
        rows = [r for r in self.resources.values() if r.topic_objective_id == ot_id]
        rows.sort(
            key=lambda r: (
                0 if r.is_mandatory else 1,
                (r.order if r.order is not None else 10**9),
                (10**9 if r.duration_minutes is None else r.duration_minutes),
            )
        )
        return rows

    def execute(self, sql_text_obj, params=None):
        sql = str(sql_text_obj).strip().lower()
        params = params or {}
        self.executed.append(sql[:60])

        # SELECT preguntas + ok + OT
        if "from public.question q" in sql and "join public.topic_objective ot" in sql and "join lateral" in sql:
            return self._Result(self._select_questions_join_ok(params["qid"]))

        # DELETE question_response
        if sql.startswith("delete from public.question_response"):
            aid = params["aid"]; qid = params["qid"]
            self.qresponses = [r for r in self.qresponses if not (r["attempt_quiz_id"] == aid and r["question_id"] == qid)]
            return self._Result([])

        # INSERT question_response
        if sql.startswith("insert into public.question_response"):
            self.qresponses.append({
                "attempt_quiz_id": params["aid"],
                "question_id": params["qid"],
                "is_correct": params["ok"],
                "score": params["score"],
                "option_id": params["oid"],
                "time_seconds": params["tsec"],
                "comment": None,  # podrá actualizarse
            })
            return self._Result([])

        # UPDATE comment en question_response
        if sql.startswith("update public.question_response") and "set comment = :exp" in sql:
            for r in self.qresponses:
                if r["attempt_quiz_id"] == params["aid"] and r["question_id"] == params["qid"]:
                    r["comment"] = params["exp"]
            return self._Result([])

        # SELECT comment en question_response
        if "select comment from public.question_response" in sql:
            for r in self.qresponses:
                if r["attempt_quiz_id"] == params["aid"] and r["question_id"] == params["qid"]:
                    return self._Result([Row(comment=r["comment"])])
            return self._Result([])

        # SELECT option text
        if "from public.option where id = :oid" in sql:
            return self._Result([self._select_option_text(params["oid"])])

        # SELECT recursos por OT
        if "from public.resource r" in sql and "where r.topic_objective_id = :ot" in sql:
            return self._Result(self._select_resources_by_ot(params["ot"]))

        # INSERT/UPSERT question_recommendation
        if sql.startswith("insert into public.question_recommendation"):
            row = {
                "attempt_quiz_id": params["aid"],
                "question_id": params["qid"],
                "resource_id": params["rid"],     # puede ser None si is_external=True
                "rank_position": params["rank"],
                "why_text": params["why"],
                "source": params["src"],
            }
            # upsert simplificado por clave (aid, qid, rid)
            found = next((i for i, r in enumerate(self.qrecs)
                          if r["attempt_quiz_id"] == row["attempt_quiz_id"]
                          and r["question_id"] == row["question_id"]
                          and r["resource_id"] == row["resource_id"]), None)
            if found is None:
                self.qrecs.append(row)
            else:
                self.qrecs[found].update({
                    "rank_position": row["rank_position"],
                    "why_text": row["why_text"],
                    "source": row["source"]
                })
            return self._Result([])

        return self._Result([])

    class _Result:
        def __init__(self, rows):
            self._rows = rows

        def fetchall(self):
            return self._rows

        def fetchone(self):
            return self._rows[0] if self._rows else None

# ---------- Fakes de servicios de perfil/personalización (async) ----------

class FakeProfileService:
    def __init__(self, db): pass
    def get_complete_profile_for_agent(self, user_id, course_id):
        return {
            "learning_profile": {
                "time_per_week": 4,
                "prefers": ["videos", "ejercicios"],
                "level": "intermedio",
            },
            "course_profile": {
                "current_week": 5,
                "weak_topics": ["Intro"],
            },
        }

class FakePersonalizedRecommendationService:
    def __init__(self, db, raise_on_analysis=False, mixed_external=False):
        self.raise_on_analysis = raise_on_analysis
        self.mixed_external = mixed_external

    async def generate_error_analysis(self, **kwargs):
        if self.raise_on_analysis:
            raise RuntimeError("LLM down")
        # devuelve texto corto
        qt = kwargs.get("question_text", "")
        co = kwargs.get("correct_option", "")
        return f"Tu error fue confundir el concepto. Clave: {co}. (Q: {qt[:20]}...)"

    async def get_personalized_recommendations(self, **kwargs):
        ot_desc = kwargs.get("topic_objective_description", "OT")
        if self.mixed_external:
            return [
                {  # interno
                    "resource_id": "r-int-1",
                    "title": f"Video guiado sobre {ot_desc}",
                    "type": "Video",
                    "url": "https://curso/vid",
                    "duration_min": 8,
                    "is_external": False,
                    "rank": 1,
                    "why_text": "Se ajusta a tus preferencias de video.",
                },
                {  # externo (sin resource_id)
                    "resource_id": None,
                    "title": f"Artículo recomendado {ot_desc}",
                    "type": "Lectura",
                    "url": "https://externo/art",
                    "duration_min": 12,
                    "is_external": True,
                    "rank": 2,
                    "why_text": "Refuerzo adicional externo.",
                },
            ]
        # sólo internos
        return [
            {
                "resource_id": "r-int-1",
                "title": f"Resumen {ot_desc}",
                "type": "Lectura",
                "url": "https://curso/lec",
                "duration_min": 6,
                "is_external": False,
                "rank": 1,
                "why_text": "A tu nivel actual.",
            }
        ]

# ====================== Fixture de entorno ======================

@pytest.fixture
def fake_env_pers(monkeypatch):
    """
    Prepara AttemptQuizService para probar finish_attempt_with_personalization.
    Monkeypatch de _get_course_id_from_quiz para evitar repos reales.
    Inyecta ProfileService y PersonalizedRecommendationService fakes.
    """
    from app.services.attempt_quiz_service import AttemptQuizService, AttemptState

    db = FakeDB()

    # IDs & data
    quiz_id = "quiz-1"
    ot1, ot2 = "ot-1", "ot-2"
    q1, q2, q3 = "q-1", "q-2", "q-3"
    ok1, ok2, ok3 = "ok-1", "ok-2", "ok-3"

    db.topic_objectives[ot1] = Row(id=ot1, code="OT1", description="Intro")
    db.topic_objectives[ot2] = Row(id=ot2, code="OT2", description="Tipos")

    db.questions[q1] = Row(id=q1, text="Pregunta A", score=1.0, topic_objective_id=ot1, quiz_id=quiz_id, correct_explanation="Exp A")
    db.questions[q2] = Row(id=q2, text="Pregunta B", score=1.0, topic_objective_id=ot1, quiz_id=quiz_id, correct_explanation="Exp B")
    db.questions[q3] = Row(id=q3, text="Pregunta C", score=1.0, topic_objective_id=ot2, quiz_id=quiz_id, correct_explanation="Exp C")

    db.options_ok[q1] = Row(id=ok1, text="OK A")
    db.options_ok[q2] = Row(id=ok2, text="OK B")
    db.options_ok[q3] = Row(id=ok3, text="OK C")

    # Recursos de fallback en BD (se usan sólo si falla el LLM)
    db.resources["r1"] = Row(id="r1", title="Video OT1", type="Video", url="u1", duration_minutes=7, is_mandatory=True, topic_objective_id=ot1, order=1)
    db.resources["r2"] = Row(id="r2", title="Lectura OT1", type="Lectura", url="u2", duration_minutes=12, is_mandatory=False, topic_objective_id=ot1, order=2)
    db.resources["r3"] = Row(id="r3", title="Ejercicio OT2", type="Ejercicio", url="u3", duration_minutes=10, is_mandatory=True, topic_objective_id=ot2, order=1)

    attempt_id = "att-1"
    user_owner = "u-1"
    attempts = {attempt_id: {"user_id": user_owner, "quiz_id": quiz_id, "state": AttemptState.EN_PROGRESO}}
    fake_attempt_repo = FakeAttemptRepo(attempts)

    svc = AttemptQuizService(db)
    svc.attempt_repo = fake_attempt_repo

    # Evita navegar repos: fuerza course_id fijo
    monkeypatch.setattr(svc, "_get_course_id_from_quiz", lambda _quiz_id: "course-1")

    # Inyecta fakes de perfil/personalización por defecto (OK)
    monkeypatch.setattr("app.services.attempt_quiz_service.ProfileService", FakeProfileService)
    monkeypatch.setattr("app.services.attempt_quiz_service.PersonalizedRecommendationService",
                        lambda db: FakePersonalizedRecommendationService(db, raise_on_analysis=False, mixed_external=False))

    return types.SimpleNamespace(
        svc=svc,
        db=db,
        AttemptState=AttemptState,
        ids=types.SimpleNamespace(
            attempt_id=attempt_id, user_owner=user_owner, quiz_id=quiz_id,
            q1=q1, q2=q2, q3=q3, ok1=ok1, ok2=ok2, ok3=ok3, ot1=ot1, ot2=ot2
        ),
        attempts=attempts
    )

def A(qid, opt, tsec):
    return FinishAnswerIn(question_id=qid, option_id=opt, time_seconds=tsec)

# ====================== TESTS ======================

@pytest.mark.asyncio
async def test_p1_personaliza_solo_incorrectas_y_persiste_why(fake_env_pers, monkeypatch):
    """
    - q1 incorrecta, q2 y q3 correctas.
    - Debe generar comment via LLM para q1.
    - Debe insertar question_recommendation con why_text y source='llm_personalized'.
    """
    e = fake_env_pers
    answers = [A(e.ids.q1, "wrong", 5), A(e.ids.q2, e.ids.ok2, 6), A(e.ids.q3, e.ids.ok3, 7)]

    out = await e.svc.finish_attempt_with_personalization(e.ids.attempt_id, e.ids.user_owner, answers)

    # q1 personalizada, q2/q3 sin cambios
    q1_out = next(q for q in out.questions if q.question_id == e.ids.q1)
    assert q1_out.correct is False
    assert q1_out.comment and "Tu error fue" in q1_out.comment

    # Se insertó al menos 1 recomendación personalizada con why_text
    assert len(q1_out.recommendations) >= 1
    assert all(r.why_text for r in q1_out.recommendations)

    # Persistencia en question_recommendation
    assert any(r["source"] == "llm_personalized" and r["why_text"] for r in e.db.qrecs)

    # Attempt cerrado
    assert e.attempts[e.ids.attempt_id]["state"] == e.AttemptState.CALIFICADO

@pytest.mark.asyncio
async def test_p2_personalizacion_solo_internos_con_id(fake_env_pers, monkeypatch):
    from tests.test_attempt_quiz_recommendation_personalized import A, FakePersonalizedRecommendationService

    # Fuerza solo internos
    monkeypatch.setattr(
        "app.services.attempt_quiz_service.PersonalizedRecommendationService",
        lambda db: FakePersonalizedRecommendationService(db, raise_on_analysis=False, mixed_external=False)
    )

    e = fake_env_pers
    answers = [A(e.ids.q1, "bad", 3), A(e.ids.q2, e.ids.ok2, 2), A(e.ids.q3, e.ids.ok3, 2)]
    out = await e.svc.finish_attempt_with_personalization(e.ids.attempt_id, e.ids.user_owner, answers)

    q1_out = next(q for q in out.questions if q.question_id == e.ids.q1)
    assert len(q1_out.recommendations) >= 1
    assert all(isinstance(r.id, str) and r.id for r in q1_out.recommendations)
    


@pytest.mark.asyncio
async def test_p3_fallback_cuando_llm_falla(fake_env_pers, monkeypatch):
    """
    - Si generate_error_analysis lanza error, se aplica fallback:
      * comment = texto genérico con el OT
      * recursos desde BD (no personalizados), source='fallback_basic' y why_text=None
    """
    e = fake_env_pers
    monkeypatch.setattr(
        "app.services.attempt_quiz_service.PersonalizedRecommendationService",
        lambda db: FakePersonalizedRecommendationService(db, raise_on_analysis=True, mixed_external=False)
    )

    answers = [A(e.ids.q1, "bad", 2), A(e.ids.q2, e.ids.ok2, 2), A(e.ids.q3, e.ids.ok3, 2)]
    out = await e.svc.finish_attempt_with_personalization(e.ids.attempt_id, e.ids.user_owner, answers)

    q1_out = next(q for q in out.questions if q.question_id == e.ids.q1)
    assert q1_out.comment  # fallback_text
    assert any(r for r in q1_out.recommendations)  # vienen desde BD (r1, r2)
    assert all(r.why_text is None for r in q1_out.recommendations)
    assert any(r["source"] == "fallback_basic" for r in e.db.qrecs)

@pytest.mark.asyncio
async def test_p4_no_personaliza_si_es_correcta(fake_env_pers):
    """
    - Si la respuesta es correcta, NO debe llamar a LLM ni insertar recs.
    """
    e = fake_env_pers
    answers = [A(e.ids.q1, e.ids.ok1, 2), A(e.ids.q2, e.ids.ok2, 2), A(e.ids.q3, e.ids.ok3, 2)]
    out = await e.svc.finish_attempt_with_personalization(e.ids.attempt_id, e.ids.user_owner, answers)

    assert all(q.correct for q in out.questions)
    assert all(len(q.recommendations) == 0 for q in out.questions)
    assert len(e.db.qrecs) == 0

@pytest.mark.asyncio
async def test_p5_seguridad_intento_ajeno(fake_env_pers):
    """
    - Usuario distinto al owner no puede finalizar.
    """
    e = fake_env_pers
    e.attempts[e.ids.attempt_id]["user_id"] = "otro-user"
    with pytest.raises(Exception) as ex:
        await e.svc.finish_attempt_with_personalization(e.ids.attempt_id, e.ids.user_owner, [])
    assert "not your attempt" in str(ex.value).lower() or "403" in str(ex.value)
