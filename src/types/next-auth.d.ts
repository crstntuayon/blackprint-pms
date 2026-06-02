import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }

  interface User {
    username: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    id: string;
    username: string;
  }
}
