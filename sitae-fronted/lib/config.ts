// lib/config.ts

const getEnv = (key: string, defaultValue: string = ""): string => {
  return process.env[key] || defaultValue;
};

export const config = {
  backend: {
    url: getEnv("NEXT_PUBLIC_API_BASE_URL", "http://127.0.0.1:8000"),

    //   Documentar endpoints disponibles
    endpoints: {
      // Auth
      auth: {
        google: "/api/auth/google",
      },

      // Courses
      courses: {
        myCourses: "/api/courses/my-courses",
        all: "/api/courses",
        byId: (id: number) => `/api/courses/${id}`,
        create: "/api/courses",
        update: (id: number) => `/api/courses/${id}`,
        delete: (id: number) => `/api/courses/${id}`,
      },

      // Students (ajusta según tu backend)
      students: {
        all: "/api/students",
        byId: (id: number) => `/api/students/${id}`,
      },

      // Agregar más endpoints según tu backend...
    },
  },

  frontend: {
    url: getEnv("NEXTAUTH_URL", "http://localhost:3000"),
  },

  google: {
    clientId: getEnv("GOOGLE_CLIENT_ID"),
    clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
  },

  auth: {
    secret: getEnv("NEXTAUTH_SECRET"),
  },
} as const;

export const buildBackendUrl = (path: string): string => {
  const base = config.backend.url.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
