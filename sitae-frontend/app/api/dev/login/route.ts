import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { type } = await req.json(); // "teacher" | "student"
  const map: Record<string, string | undefined> = {
    teacher: process.env.NEXT_PUBLIC_DEV_TEACHER_ID,
    student: process.env.NEXT_PUBLIC_DEV_STUDENT_ID,
  };
  const id = map[type];
  if (!id)
    return NextResponse.json(
      { ok: false, error: "invalid type" },
      { status: 400 }
    );

  const res = NextResponse.json({ ok: true, userId: id, role: type });
  res.cookies.set("x-user-id", id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
