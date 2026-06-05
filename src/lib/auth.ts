import { compare } from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import { type DefaultSession, type NextAuthOptions } from "next-auth";
import { type JWT } from "next-auth/jwt";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email e senha",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            nome: true,
            image: true,
            senhaHash: true,
            plano: true,
            coupleId: true,
            onboardingCompleto: true,
          },
        });

        if (!user?.senhaHash) return null;

        const isValidPassword = await compare(parsed.data.password, user.senhaHash);
        if (!isValidPassword) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.nome,
          image: user.image,
          plan: user.plano,
          coupleId: user.coupleId,
          onboardingCompleto: user.onboardingCompleto,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Preenchimento inicial no login
      if (user) {
        token.id = user.id;
        if ("plan" in user) token.plan = user.plan as JWT["plan"];
        if ("coupleId" in user) token.coupleId = (user.coupleId as string) ?? null;
        if ("onboardingCompleto" in user) token.onboardingCompleto = user.onboardingCompleto as boolean;
      }

      // Refresh dos dados do DB se algum campo ainda não estiver no token OU onboardingCompleto for false
      // (continua checando até que onboarding seja concluído, depois para de checar)
      if (token.id && (token.plan === undefined || token.coupleId === undefined || !token.onboardingCompleto)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { plano: true, coupleId: true, nome: true, onboardingCompleto: true },
        });
        if (dbUser) {
          token.plan = dbUser.plano ?? "FREE";
          token.coupleId = dbUser.coupleId ?? null;
          token.onboardingCompleto = dbUser.onboardingCompleto;
          if (!token.name && dbUser.nome) token.name = dbUser.nome;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.plan = token.plan ?? "FREE";
        session.user.coupleId = token.coupleId ?? null;
        session.user.onboardingCompleto = token.onboardingCompleto ?? false;
        if (token.name) session.user.name = token.name;
      }
      return session;
    },
  },
};

// ─── Type augmentation ───────────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      plan: "FREE" | "PREMIUM";
      coupleId: string | null;
      onboardingCompleto: boolean;
    };
  }
  interface User {
    plan?: "FREE" | "PREMIUM";
    coupleId?: string | null;
    onboardingCompleto?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    plan?: "FREE" | "PREMIUM";
    coupleId?: string | null;
    onboardingCompleto?: boolean;
  }
}
