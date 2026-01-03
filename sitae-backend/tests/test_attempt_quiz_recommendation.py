# app/tests/test_attempt_quiz_recommendation.py
import types
import uuid
import pytest

from app.schemas.attempt_quiz import FinishAnswerIn  # <-- usar modelo real

# ==== Fakes & helpers ====


def uid(s: str) -> str:
    """Genera UUID determinístico de 32 chars (solo para pruebas)."""
    return uuid.UUID((s * 32)[:32]).hex


class Row(types.SimpleNamespace):
    """Permite r.campo dot-access como en SQLAlchemy Row."""
    pass


class FakeAttemptRepo:
    def __init__(self, attempts):
        # attempts: dict attempt_id -> dict(user_id, quiz_id, state, percent, score_total)
        self.attempts = attempts
        self.updated_payloads = {}  # attempt_id -> dict

    def get_by_id(self, attempt_id):
        a = self.attempts.get(attempt_id)
        if not a:
            return None
        # Simulamos objeto con attrs (como ORM)
        return types.SimpleNamespace(
            id=attempt_id, user_id=a["user_id"], quiz_id=a["quiz_id"], state=a["state"]
        )

    def update(self, attempt_id, payload):
        assert attempt_id in self.attempts
        self.attempts[attempt_id].update(payload)
        self.updated_payloads[attempt_id] = payload
        # Devuelve objeto con modelo mínimo usado por finish_attempt (no requerido aquí)
        return types.SimpleNamespace(**self.attempts[attempt_id])


class FakeDB:
    """
    Emula self.db.execute(text_sql, params) que usa tu servicio.
    Guarda 'tablas' en dicts y responde a SELECT/INSERT/DELETE básicos.
    """

    def __init__(self):
        self.questions = {}  # qid -> Row(id, text, score, topic_objective_id, quiz_id)
        self.options_ok = {}  # qid -> Row(id, text, is_correct=True)
        self.topic_objectives = {}  # otid -> Row(id, code, description)
        self.resources = {}  # rid -> Row(id, title, type, url, duration_minutes, is_mandatory, topic_objective_id, order)
        self.qresponses = []  # list of dict rows inserted
        self.qrecs = []  # list of dict rows inserted
        self.executed = []  # trace of SQL "kinds" for asserts

    def commit(self):
        pass

    def _select_questions_join_ok(self, qid_quiz):
        # Devuelve rows con alias usados en tu SQL (question_id, q_text, q_score, ot_id, ot_code, ot_desc, ok_opt_id, ok_opt_text)
        out = []
        for q in self.questions.values():
            if q.quiz_id != qid_quiz:
                continue
            ot = self.topic_objectives[q.topic_objective_id]
            ok = self.options_ok[q.id]
            out.append(
                Row(
                    question_id=q.id,
                    q_text=q.text,
                    q_score=q.score,
                    ot_id=ot.id,
                    ot_code=ot.code,
                    ot_desc=ot.description,
                    ok_opt_id=ok.id,
                    ok_opt_text=ok.text,
                )
            )
        # Ordena por q.text (como tu ORDER BY q.text)
        out.sort(key=lambda r: r.q_text)
        return out

    def _select_option_text(self, oid):
        # Devuelve Row(text=...)
        for ok in self.options_ok.values():
            if ok.id == oid:
                return Row(text=ok.text)
        return None

    def _select_resources_by_ot(self, ot_id):
        # ORDER BY is_mandatory DESC, order ASC, duration_minutes NULLS LAST
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
        sql = str(sql_text_obj)
        params = params or {}
        st = sql.strip().lower()
        self.executed.append(st[:40])

        # --- SELECT questions + ok option + topic objective
        if (
            "from public.question q" in st
            and "join public.topic_objective ot" in st
            and "join lateral" in st
        ):
            qid_quiz = params.get("qid")
            return self._Result(self._select_questions_join_ok(qid_quiz))

        # --- DELETE question_response
        if st.startswith("delete from public.question_response"):
            aid = params["aid"]
            qid = params["qid"]
            self.qresponses = [
                r
                for r in self.qresponses
                if not (r["attempt_quiz_id"] == aid and r["question_id"] == qid)
            ]
            return self._Result([])

        # --- INSERT question_response
        if st.startswith("insert into public.question_response"):
            self.qresponses.append(
                {
                    "attempt_quiz_id": params["aid"],
                    "question_id": params["qid"],
                    "is_correct": params["ok"],
                    "score": params["score"],
                    "option_id": params["oid"],
                    "time_seconds": params["tsec"],
                }
            )
            return self._Result([])

        # --- SELECT option text
        if "from public.option where id = :oid" in st:
            row = self._select_option_text(params["oid"])
            return self._Result([row] if row else [])

        # --- SELECT resources by topic objective
        if "from public.resource r" in st and "where r.topic_objective_id = :ot" in st:
            rows = self._select_resources_by_ot(params["ot"])
            return self._Result(rows)

        # --- INSERT question_recommendation (ON CONFLICT DO NOTHING)
        if st.startswith("insert into public.question_recommendation"):
            row = {
                "attempt_quiz_id": params["aid"],
                "question_id": params["qid"],
                "resource_id": params["rid"],
                "rank_position": params["rank"],
                "why_text": params["why"],
                "source": params["src"],
            }
            # Simular UNIQUE (question_id, attempt_quiz_id, resource_id)
            if not any(
                (
                    r["question_id"] == row["question_id"]
                    and r["attempt_quiz_id"] == row["attempt_quiz_id"]
                    and r["resource_id"] == row["resource_id"]
                )
                for r in self.qrecs
            ):
                self.qrecs.append(row)
            return self._Result([])

        # No-op default
        return self._Result([])

    class _Result:
        def __init__(self, rows):
            self._rows = rows

        def fetchall(self):
            return self._rows

        def fetchone(self):
            return self._rows[0] if self._rows else None


# ==== Fixtures ====


@pytest.fixture
def fake_env():
    """
    Prepara AttemptQuizService con repos falsos y DB falsa.
    Solo probamos finish_attempt_with_answers.
    """
    # Importa la clase real del servicio
    from app.services.attempt_quiz_service import AttemptQuizService, AttemptState

    # Fake DB con datos base del quiz
    db = FakeDB()

    # IDs
    quiz_id = "quiz-1"
    ot1 = "ot-1"
    ot2 = "ot-2"
    q1 = "q-1"
    q2 = "q-2"
    q3 = "q-3"
    ok1 = "ok-1"
    ok2 = "ok-2"
    ok3 = "ok-3"

    # Topic objectives
    db.topic_objectives[ot1] = Row(id=ot1, code="OT1", description="Intro")
    db.topic_objectives[ot2] = Row(id=ot2, code="OT2", description="Tipos")

    # Questions (q1, q2 en ot1; q3 en ot2)
    db.questions[q1] = Row(
        id=q1, text="Pregunta A", score=1.0, topic_objective_id=ot1, quiz_id=quiz_id
    )
    db.questions[q2] = Row(
        id=q2, text="Pregunta B", score=1.0, topic_objective_id=ot1, quiz_id=quiz_id
    )
    db.questions[q3] = Row(
        id=q3, text="Pregunta C", score=1.0, topic_objective_id=ot2, quiz_id=quiz_id
    )

    # Correct options
    db.options_ok[q1] = Row(id=ok1, text="OK A")
    db.options_ok[q2] = Row(id=ok2, text="OK B")
    db.options_ok[q3] = Row(id=ok3, text="OK C")

    # Resources por objetivo
    # ot1: R1 (mandatory), R2; ot2: R3
    db.resources["r1"] = Row(
        id="r1",
        title="Video OT1",
        type="Video",
        url="u1",
        duration_minutes=7,
        is_mandatory=True,
        topic_objective_id=ot1,
        order=1,
    )
    db.resources["r2"] = Row(
        id="r2",
        title="Lectura OT1",
        type="Lectura",
        url="u2",
        duration_minutes=12,
        is_mandatory=False,
        topic_objective_id=ot1,
        order=2,
    )
    db.resources["r3"] = Row(
        id="r3",
        title="Ejercicio OT2",
        type="Ejercicio",
        url="u3",
        duration_minutes=10,
        is_mandatory=True,
        topic_objective_id=ot2,
        order=1,
    )

    # Attempt
    attempt_id = "att-1"
    user_owner = "u-1"
    attempts = {
        attempt_id: {
            "user_id": user_owner,
            "quiz_id": quiz_id,
            "state": AttemptState.EN_PROGRESO,
        }
    }
    fake_attempt_repo = FakeAttemptRepo(attempts)

    # Instancia servicio y parchea repos + db
    svc = AttemptQuizService(db)
    svc.attempt_repo = fake_attempt_repo  # override
    # No usamos otros repos en finish_attempt_with_answers
    return types.SimpleNamespace(
        svc=svc,
        db=db,
        AttemptState=AttemptState,
        ids=types.SimpleNamespace(
            attempt_id=attempt_id,
            user_owner=user_owner,
            quiz_id=quiz_id,
            q1=q1,
            q2=q2,
            q3=q3,
            ok1=ok1,
            ok2=ok2,
            ok3=ok3,
            ot1=ot1,
            ot2=ot2,
        ),
        attempts=attempts,
    )


# Helper para crear respuestas válidas
def A(qid, opt, tsec):
    return FinishAnswerIn(question_id=qid, option_id=opt, time_seconds=tsec)


# ==== TESTS ====


def test_1_recomienda_por_objetivo_fallado_basico(fake_env):
    e = fake_env
    answers = [
        A(e.ids.q1, "wrong", 5),  # incorrecta
        A(e.ids.q2, e.ids.ok2, 6),  # correcta
        A(e.ids.q3, e.ids.ok3, 7),  # correcta
    ]
    out = e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, answers)
    # Solo q1 debe tener recomendaciones (ot1)
    q1_out = next(q for q in out.questions if q.question_id == e.ids.q1)
    q2_out = next(q for q in out.questions if q.question_id == e.ids.q2)
    assert not q2_out.recommendations  # correcta => sin recs
    assert len(q1_out.recommendations) == 2
    # Orden: mandatory primero
    assert q1_out.recommendations[0].mandatory is True
    # Se registró en question_recommendation
    assert len(e.db.qrecs) == 2
    # Attempt cerrado
    assert e.attempts[e.ids.attempt_id]["state"] == e.AttemptState.CALIFICADO


def test_2_no_recomienda_si_todas_correctas(fake_env):
    e = fake_env
    answers = [
        A(e.ids.q1, e.ids.ok1, 5),
        A(e.ids.q2, e.ids.ok2, 6),
        A(e.ids.q3, e.ids.ok3, 7),
    ]
    out = e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, answers)
    assert all(len(q.recommendations) == 0 for q in out.questions)
    assert len(e.db.qrecs) == 0


def test_3_varios_objetivos_fallados_merge(fake_env):
    e = fake_env
    answers = [
        A(e.ids.q1, "bad", 2),  # falla ot1
        A(e.ids.q2, e.ids.ok2, 2),  # correcta
        A(e.ids.q3, "bad", 2),  # falla ot2
    ]
    out = e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, answers)
    q1_out = next(q for q in out.questions if q.question_id == e.ids.q1)
    q3_out = next(q for q in out.questions if q.question_id == e.ids.q3)
    assert {r.id for r in q1_out.recommendations} == {"r1", "r2"}
    assert {r.id for r in q3_out.recommendations} == {"r3"}
    # Total recomendaciones registradas: 3
    assert len(e.db.qrecs) == 3


def test_4_sin_recursos_para_un_objetivo(fake_env):
    e = fake_env
    # Vaciar recursos de ot1
    e.db.resources = {
        k: v for k, v in e.db.resources.items() if v.topic_objective_id != e.ids.ot1
    }
    answers = [
        A(e.ids.q1, "bad", 2),  # falla en ot1 (sin recursos)
        A(e.ids.q2, e.ids.ok2, 2),
        A(e.ids.q3, e.ids.ok3, 2),
    ]
    out = e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, answers)
    q1_out = next(q for q in out.questions if q.question_id == e.ids.q1)
    assert len(q1_out.recommendations) == 0
    assert len(e.db.qrecs) == 0  # no registros porque no hubo recursos


def test_5_respuesta_duplicada_ultima_gana(fake_env):
    # Mismo question_id dos veces: primero mala, luego correcta => debe contar la última
    e = fake_env
    answers = [
        A(e.ids.q1, "bad", 2),              # primera (mala)
        A(e.ids.q1, e.ids.ok1, 3),          # segunda (correcta) -> última gana
        A(e.ids.q2, e.ids.ok2, 2),
        A(e.ids.q3, e.ids.ok3, 2),
    ]
    out = e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, answers)
    q1_out = next(q for q in out.questions if q.question_id == e.ids.q1)
    assert q1_out.correct is True
    assert len(q1_out.recommendations) == 0
    assert len(e.db.qrecs) == 0  # no hubo recs


def test_6_opcion_no_marcada_se_cuenta_incorrecta(fake_env):
    # option_id=None => no responde => incorrecta => recomienda
    e = fake_env
    answers = [
        A(e.ids.q1, None, 2),               # sin opción => incorrecta
        A(e.ids.q2, e.ids.ok2, 2),
        A(e.ids.q3, e.ids.ok3, 2),
    ]
    out = e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, answers)
    q1_out = next(q for q in out.questions if q.question_id == e.ids.q1)
    assert q1_out.correct is False
    assert {r.id for r in q1_out.recommendations} == {"r1", "r2"}
    assert len(e.db.qrecs) == 2  # se loguearon 2 recs para q1


def test_7_pregunta_fuera_del_quiz_422(fake_env):
    # question_id que no pertenece al quiz debe disparar 422
    e = fake_env
    with pytest.raises(Exception) as ex:
        e.svc.finish_attempt_with_answers(
            e.ids.attempt_id, e.ids.user_owner,
            [A("q-999", "whatever", 1)]
        )
    assert "does not belong to this quiz" in str(ex.value).lower() or "422" in str(ex.value)


def test_8_registro_de_log_de_recomendacion(fake_env):
    e = fake_env
    answers = [
        A(e.ids.q1, "bad", 2),  # genera 2 recs
        A(e.ids.q2, e.ids.ok2, 2),
        A(e.ids.q3, e.ids.ok3, 2),
    ]
    e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, answers)
    # Verifica que se insertaron filas con rank_position 1..n
    ranks = [r["rank_position"] for r in e.db.qrecs]
    assert ranks == [1, 2]
    # Verifica source
    assert all(r["source"] == "filtered" for r in e.db.qrecs)


def test_9_seguridad_intento_ajeno(fake_env):
    e = fake_env
    # Cambiamos dueño
    e.attempts[e.ids.attempt_id]["user_id"] = "otro-user"
    with pytest.raises(Exception) as ex:
        e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, [])
    msg = str(ex.value).lower()
    assert "not your attempt" in msg or "403" in msg


def test_10_integridad_de_salida_esquema(fake_env):
    e = fake_env
    answers = [
        A(e.ids.q1, "bad", 2),
        A(e.ids.q2, e.ids.ok2, 2),
        A(e.ids.q3, e.ids.ok3, 2),
    ]
    out = e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, answers)
    # Estructura del resumen
    assert hasattr(out, "attempt")
    assert out.attempt.attempt_id == e.ids.attempt_id
    assert isinstance(out.attempt.percent, float)
    # Estructura de preguntas y recomendaciones
    for q in out.questions:
        assert hasattr(q, "question_id")
        assert hasattr(q, "text")
        assert hasattr(q, "correct")
        assert hasattr(q, "correct_option")
        assert hasattr(q, "topic_objective")
        assert hasattr(q, "recommendations")
        for r in q.recommendations:
            assert all(hasattr(r, k) for k in ("id", "title", "type", "url"))
            # Campos opcionales pueden ser None, pero deben existir en el schema pydantic
            assert hasattr(r, "duration_min")
            assert hasattr(r, "mandatory")


def test_11_sin_responder_ninguna_genera_recomendaciones_para_todas(fake_env):
    # answers vacío => todas incorrectas => recomienda para c/u según su OT
    e = fake_env
    out = e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, [])
    # q1 y q2 (OT1) => 2 recs cada uno; q3 (OT2) => 1 rec => total 5 logs
    assert len(e.db.qrecs) == 5
    q1_out = next(q for q in out.questions if q.question_id == e.ids.q1)
    q2_out = next(q for q in out.questions if q.question_id == e.ids.q2)
    q3_out = next(q for q in out.questions if q.question_id == e.ids.q3)
    assert len(q1_out.recommendations) == 2
    assert len(q2_out.recommendations) == 2
    assert len(q3_out.recommendations) == 1


def test_12_recomendacion_al_finalizar_RF9(fake_env):
    e = fake_env
    # Verifica transición de estado y que solo se recomiende al finalizar
    answers = [
        A(e.ids.q1, "bad", 2),
        A(e.ids.q2, e.ids.ok2, 2),
        A(e.ids.q3, e.ids.ok3, 2),
    ]
    e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, answers)
    assert e.attempts[e.ids.attempt_id]["state"] == e.AttemptState.CALIFICADO
    # Si intentamos volver a finalizar, debe fallar con "Attempt already finished"
    with pytest.raises(Exception) as ex:
        e.svc.finish_attempt_with_answers(e.ids.attempt_id, e.ids.user_owner, answers)
    assert "already finished" in str(ex.value).lower()



