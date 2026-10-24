import { NextResponse } from "next/server";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { dbGetUsers, dbCreateUser } from "@/lib/serverDb";

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const users = await dbGetUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const username = String(body.username || "").trim();
  const full_name = String(body.full_name || "").trim();
  const password = String(body.password || "");
  const role = body.role === "admin" ? "admin" : "user";
  const is_active = body.is_active !== false;

  if (!username || !password || !full_name) {
    return NextResponse.json(
      { error: "الاسم الكامل، اسم المستخدم وكلمة المرور مطلوبة / full_name, username and password are required" },
      { status: 400 }
    );
  }

  try {
    const password_hash = await hashPassword(password);
    const result = await dbCreateUser({
      username,
      full_name,
      role,
      is_active,
      password_hash,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
