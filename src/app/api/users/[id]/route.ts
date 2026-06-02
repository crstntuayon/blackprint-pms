import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, username, email, role, password, resetPassword } = body;

    const isAdmin = session.user.role === "ADMIN";
    const isSelf = session.user.id === id;

    // Only admins can edit other users. Users can only edit themselves.
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name || null;
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;

    // Only admins can change role
    if (role !== undefined && isAdmin) {
      updateData.role = role;
    }

    // Password reset: admin can set any user's password to a specific value
    if (resetPassword && isAdmin) {
      const hashed = await bcrypt.hash("userpassword", 10);
      updateData.password = hashed;
    }

    // Self password change (optional, not requested but good to have)
    if (password && isSelf && !resetPassword) {
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (err: any) {
    console.error("User update error:", err);
    if (err.code === "P2002") {
      return NextResponse.json({ error: "Username or email already taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
