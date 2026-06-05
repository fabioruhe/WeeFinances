import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JoinClient } from "./join-client";

type Props = {
  params: Promise<{ code: string }>;
};

export default async function JoinPage({ params }: Props) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const invite = await prisma.couple.findUnique({
    where: { inviteCode: upperCode },
    include: {
      userA: { select: { id: true, nome: true, email: true } },
    },
  });

  if (!invite) notFound();

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? null;
  const onboardingCompleto = session?.user?.onboardingCompleto ?? false;

  const isExpired = invite.status !== "PENDENTE";
  const isOwnInvite = currentUserId === invite.userAId;

  return (
    <JoinClient
      code={upperCode}
      inviterName={invite.userA.nome ?? invite.userA.email ?? "seu parceiro(a)"}
      isLoggedIn={!!currentUserId}
      isExpired={isExpired}
      isOwnInvite={isOwnInvite}
      onboardingCompleto={onboardingCompleto}
    />
  );
}
