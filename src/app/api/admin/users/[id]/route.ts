import { NextResponse } from "next/server";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { dbUpdateUser, dbDeleteUser } from "@/lib/serverDb";
import type { UserRole } from "@/lib/types";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updates: {
      full_name?: string;
      role?: UserRole;
      is_active?: boolean;
      password_hash?: string;
    } = {};

    if (body.full_name !== undefined) updates.full_name = String(body.full_name);
    if (body.role !== undefined)
      updates.role = body.role === "admin" ? "admin" : "user";
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);
    if (body.password) {
      updates.password_hash = await hashPassword(String(body.password));
    }

    const result = await dbUpdateUser(params.id, updates);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error) {
    console.error("PUT /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await dbDeleteUser(params.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/users/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
