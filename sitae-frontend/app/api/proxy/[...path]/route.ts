// app/api/proxy/[...path]/route.ts
import { getServerSession } from "next-auth/next";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/lib/auth-config';
import { config } from '@/lib/config';

const BACKEND_URL = config.backend.url.replace(/\/$/, '');

async function handleRequest(
  req: NextRequest,
  params: { path: string[] },
  method: string
): Promise<NextResponse> {
  
  const session = await getServerSession(authOptions);
  
  if (!session?.token) {
    return NextResponse.json(
      { error: "No autorizado" }, 
      { status: 401 }
    );
  }

  const path = params.path.join("/");
  const url = `${BACKEND_URL}/${path}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  });
  
  headers.set("Authorization", `Bearer ${session.token}`);

  const body = !['GET', 'HEAD'].includes(method) 
    ? await req.arrayBuffer() 
    : undefined;

  try {
    const response = await fetch(url, { 
      method, 
      headers, 
      body,
      cache: "no-store" 
    });

    // if backend returns 401/403, pass it through
    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { error: "Token expirado" }, 
        { status: 401 }
      );
    }

    const responseBody = await response.arrayBuffer();
    const output = new NextResponse(responseBody, { 
      status: response.status 
    });
    
    response.headers.forEach((value, key) => {
      output.headers.set(key, value);
    });
    
    return output;

  } catch (error) {
    //console.error('Proxy error:', error);
    return NextResponse.json(
      { error: "Error del servidor" }, 
      { status: 500 }
    );
  }
}

export const GET = (req: NextRequest, context: { params: { path: string[] } }) =>
  handleRequest(req, context.params, "GET");

export const POST = (req: NextRequest, context: { params: { path: string[] } }) =>
  handleRequest(req, context.params, "POST");

export const PUT = (req: NextRequest, context: { params: { path: string[] } }) =>
  handleRequest(req, context.params, "PUT");

export const PATCH = (req: NextRequest, context: { params: { path: string[] } }) =>
  handleRequest(req, context.params, "PATCH");

export const DELETE = (req: NextRequest, context: { params: { path: string[] } }) =>
  handleRequest(req, context.params, "DELETE");