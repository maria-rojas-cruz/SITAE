# Etapa 1: Base con Python
FROM python:3.11-slim as base

# Variables de entorno para Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Etapa 2: Builder - Instalar dependencias
FROM base as builder

# Instalar dependencias del sistema necesarias para compilar paquetes
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar solo requirements para aprovechar cache de Docker
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --user --no-warn-script-location -r requirements.txt

# Etapa 3: Runner - Imagen final
FROM base as runner

# Instalar solo las dependencias de runtime necesarias
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root primero
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Copiar dependencias instaladas desde builder al directorio del usuario
COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local

# Asegurarse de que los scripts en .local están en PATH
ENV PATH=/home/appuser/.local/bin:$PATH

# Copiar el código de la aplicación
COPY --chown=appuser:appuser . .

# Cambiar permisos finales
RUN chown -R appuser:appuser /app /home/appuser/.local

# Cambiar a usuario no-root
USER appuser

# Exponer el puerto de FastAPI
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando para ejecutar la aplicación
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]