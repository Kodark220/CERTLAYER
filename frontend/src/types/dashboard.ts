export type Mode = "wallet" | "email";
export type View = "landing" | "protocol" | "api";

export type AuthSession = {
  token: string;
  wallet: string;
  role: string;
  expiresAt: string;
};

export type RegisterForm = {
  id: string;
  name: string;
  website: string;
  protocolType: string;
  uptimeBps: string;
};

export type LifecycleForm = {
  incidentId: string;
  startTs: string;
  evidenceHash: string;
  walletsCsv: string;
  amountsCsv: string;
  challengeEndsTs: string;
  disputeWallet: string;
  disputeEvidenceHash: string;
  disputeDecision: string;
  payoutStartIndex: string;
  payoutLimit: string;
};

export type CommitmentForm = {
  commitmentId: string;
  commitmentType: string;
  sourceUrl: string;
  commitmentTextHash: string;
  amount: string;
  asset: string;
  deadlineTs: string;
  verificationRule: string;
  result: string;
  evidenceHash: string;
};

export type SecurityForm = {
  incidentId: string;
  startTs: string;
  evidenceHash: string;
  lastCleanBlock: string;
  triggerSourcesCsv: string;
  walletsCsv: string;
  lossesCsv: string;
  recoveryAmount: string;
  recoveryStartIndex: string;
  recoveryLimit: string;
  responseSpeed: string;
  communicationQuality: string;
  poolAdequacy: string;
  postMortemQuality: string;
  recoveryEffort: string;
};
