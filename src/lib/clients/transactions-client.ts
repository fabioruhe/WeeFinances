import { apiRequest } from "@/lib/api-client";

export type TransactionItem = {
  id: string;
  amount: string;
  category: string;
  note?: string | null;
  scope: "MINE" | "PARTNER" | "SHARED";
  occurredAt: string;
};

export type CreateTransactionInput = {
  amount: number;
  category: string;
  note?: string;
  scope?: "MINE" | "SHARED";
  occurredAt: string;
};

export async function listTransactions() {
  return apiRequest<{ items: TransactionItem[] }>(
    "/api/transactions",
    undefined,
    "Nao foi possivel carregar as transacoes.",
  );
}

export async function createTransaction(input: CreateTransactionInput) {
  return apiRequest<{ item: TransactionItem }>(
    "/api/transactions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Nao foi possivel criar a transacao.",
  );
}
