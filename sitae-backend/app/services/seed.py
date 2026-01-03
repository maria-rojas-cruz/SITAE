from sqlalchemy import text
from app.db.session import SessionLocal

def seed_python_course():
    """
    Siembra PROGRAMACION EN PYTHON con:
      - Quiz (5 preguntas, opción única) en T1.1
      - Alumno demo matriculado
    Idempotente: si ya existe el curso por código, no duplica.
    """
    db = SessionLocal()
    try:
        db.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))

        # ===== QUIZ (Tema 1.1) ===============================================
        quiz = db.execute(text("""
            SELECT id FROM public.quiz WHERE tema_id = :tid AND titulo = 'Quiz: Introducción y entorno'
        """), {"tid": "2c1041b3-6220-4bf2-9f45-f9b32560de3b"}).fetchone()
        if quiz:
            quiz_id = quiz[0]
        else:
            quiz_id = db.execute(text("""
                INSERT INTO public.quiz (tema_id, titulo, descripcion, tiempo_min, intentos_max, peso, activo)
                VALUES (:tid, 'Quiz: Introducción y entorno',
                        'REPL, instalación, ejecución de scripts', 12, 3, 0.1, TRUE)
                RETURNING id
            """), {"tid": "2c1041b3-6220-4bf2-9f45-f9b32560de3b"}).fetchone()[0]

        def add_pregunta(enunciado, puntaje, ot_id, opciones):
            """
            opciones: list[ (texto, es_correcta_bool) ], EXACTAMENTE 1 correcta
            """
            pr = db.execute(text("""
                SELECT id FROM public.pregunta
                WHERE quiz_id = :qid AND enunciado = :enun
            """), {"qid": quiz_id, "enun": enunciado}).fetchone()
            if pr:
                return pr[0]
            pid = db.execute(text("""
                INSERT INTO public.pregunta (quiz_id, enunciado, puntaje, objetivo_tema_id)
                VALUES (:qid, :enun, :pts, :ot) RETURNING id
            """), {"qid": quiz_id, "enun": enunciado, "pts": puntaje, "ot": ot_id}).fetchone()[0]
            for txt, ok in opciones:
                db.execute(text("""
                    INSERT INTO public.opcion (pregunta_id, texto, es_correcta)
                    VALUES (:pid, :txt, :ok)
                """), {"pid": pid, "txt": txt, "ok": ok})
            return pid

        # 5 preguntas (map a OT: 2 a OT1.1.1, 2 a OT1.1.2, 1 a OT1.1.3)
        add_pregunta(
            "¿Cómo abres el intérprete interactivo (REPL) desde terminal?",
            1.0, "46a74263-2bf4-43d9-8253-f4d489423d66",
            [("python", True), ("node", False), ("pip", False), ("bash", False)]
        )
        add_pregunta(
            "¿Qué extensión de archivo corresponde a un script de Python?",
            1.0, "ef98ca45-0fe0-4dc6-982c-c34684b676f8",
            [(".py", True), (".pyc", False), (".ipynb", False), (".pyt", False)]
        )
        add_pregunta(
            "¿Qué extensión oficial de VS Code facilita trabajar con Python?",
            1.0, "ef98ca45-0fe0-4dc6-982c-c34684b676f8",
            [("Python (Microsoft)", True), ("C/C++", False), ("Live Server", False), ("Docker", False)]
        )
        add_pregunta(
            "¿Qué instrucción imprime texto en pantalla en Python?",
            1.0, "46a74263-2bf4-43d9-8253-f4d489423d66",
            [("print('Hola')", True), ("echo Hola", False), ("console.log('Hola')", False), ("printf('Hola')", False)]
        )
        add_pregunta(
            "Para ejecutar el script hola.py desde terminal, ¿qué comando usas?",
            1.0, "6b7da9d8-1a26-4f32-a536-6c8f4d4012e4",
            [("python hola.py", True), ("run hola.py", False), ("pycompile hola.py", False), ("execute hola.py", False)]
        )

        # ===== Alumno demo (para probar intentos) =============================
        user = db.execute(text("""
            SELECT u.id
            FROM public.usuario u
            JOIN public.persona p ON p.id = u.persona_id
            WHERE p.email = 'alumno.python@example.com'
        """)).fetchone()
        if user:
            usuario_id = user[0]
        else:
            persona_id = db.execute(text("""
                INSERT INTO public.persona (nombre, primer_apellido, segundo_apellido, email)
                VALUES ('Lucía', 'Gómez', 'Ruiz', 'alumno.python@example.com')
                RETURNING id
            """)).fetchone()[0]
            usuario_id = db.execute(text("""
                INSERT INTO public.usuario (persona_id, username, password_hash)
                VALUES (:pid, 'alumna_python', 'demo') RETURNING id
            """), {"pid": persona_id}).fetchone()[0]

        # Matricular al curso si no está
        exists = db.execute(text("""
            SELECT 1 FROM public.curso_estudiante
            WHERE curso_id = :cid AND usuario_id = :uid
        """), {"cid": "66db8a5e-c89e-4da0-99df-0a604f389a0d", "uid": usuario_id}).fetchone()
        if not exists:
            db.execute(text("""
                INSERT INTO public.curso_estudiante (curso_id, usuario_id)
                VALUES (:cid, :uid)
            """), {"cid": "66db8a5e-c89e-4da0-99df-0a604f389a0d", "uid": usuario_id})

        db.commit()
        return {
            "ok": True,
            "quiz_tema1_id": str(quiz_id),
            "usuario_demo_id": str(usuario_id)
        }
    except Exception as e:
        db.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        db.close()
