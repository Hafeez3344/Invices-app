import { NextResponse } from "next/server";
import { loginWithCredentials } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || "");
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password required" },
        { status: 400 }
      );
    }

    const result = await loginWithCredentials(username, password);
    if (!result.success) {
      return NextResponse.json(result, { status: 401 });
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
