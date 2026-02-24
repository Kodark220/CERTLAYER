# { "Depends": "py-genlayer:test" }

from genlayer import *


class CertLayerContract(gl.Contract):
    # Registry
    protocol_metadata: TreeMap[str, str]
    protocol_owner_wallet: TreeMap[str, str]
    protocol_status: TreeMap[str, str]
    protocol_count: bigint

    # Monitoring / Decision
    incident_payload: TreeMap[str, str]
    incident_status: TreeMap[str, str]
    incident_decision: TreeMap[str, str]
    incident_signal_verified: TreeMap[str, bool]
    incident_signal_note: TreeMap[str, str]
    incident_protocol_id: TreeMap[str, str]
    incident_start_ts: TreeMap[str, bigint]
    incident_evidence_hash: TreeMap[str, str]
    incident_challenge_ends_ts: TreeMap[str, bigint]
    incident_queue_wallets_csv: TreeMap[str, str]
    incident_queue_amounts_csv: TreeMap[str, str]
    incident_total_amount: TreeMap[str, bigint]
    incident_paid_count: TreeMap[str, bigint]
    incident_dispute_decision: TreeMap[str, str]
    incident_dispute_evidence: TreeMap[str, str]

    # Coverage / Enforcement
    pool_balance: TreeMap[str, bigint]
    incident_enforced: TreeMap[str, bool]
    wallet_compensation_balance: TreeMap[str, bigint]

    # Reputation
    protocol_score: TreeMap[str, bigint]
    protocol_grade: TreeMap[str, str]

    def __init__(self):
        self.protocol_count = bigint(0)

    def _dispute_key(self, incident_id: str, wallet: str) -> str:
        return incident_id + "|" + wallet.lower()

    # ----------------------------
    # Registry
    # ----------------------------
    @gl.public.write
    def register_protocol(self, protocol_id: str, metadata_json: str, owner_wallet: str):
        if protocol_id in self.protocol_metadata:
            raise Exception("protocol already registered")

        self.protocol_metadata[protocol_id] = metadata_json
        self.protocol_owner_wallet[protocol_id] = owner_wallet.lower()
        self.protocol_status[protocol_id] = "active"
        self.protocol_count = self.protocol_count + bigint(1)

    @gl.public.write
    def set_protocol_status(self, protocol_id: str, new_status: str):
        if protocol_id not in self.protocol_metadata:
            raise Exception("protocol not found")
        self.protocol_status[protocol_id] = new_status

    @gl.public.view
    def get_protocol_metadata(self, protocol_id: str) -> str:
        if protocol_id not in self.protocol_metadata:
            return ""
        return self.protocol_metadata[protocol_id]

    @gl.public.view
    def get_protocol_owner_wallet(self, protocol_id: str) -> str:
        if protocol_id not in self.protocol_owner_wallet:
            return ""
        return self.protocol_owner_wallet[protocol_id]

    @gl.public.view
    def get_protocol_status(self, protocol_id: str) -> str:
        if protocol_id not in self.protocol_status:
            return "unknown"
        return self.protocol_status[protocol_id]

    @gl.public.view
    def get_protocol_count(self) -> int:
        return int(self.protocol_count)

    # ----------------------------
    # Monitoring / Verification
    # ----------------------------
    @gl.public.write
    def submit_incident_candidate(self, incident_id: str, payload_json: str):
        if incident_id in self.incident_payload:
            raise Exception("incident already exists")
        self.incident_payload[incident_id] = payload_json
        self.incident_status[incident_id] = "candidate"
        self.incident_decision[incident_id] = "pending"

    @gl.public.write
    def submit_verification_decision(self, incident_id: str, decision: str, reason: str):
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")
        if decision != "breach_confirmed" and decision != "breach_rejected":
            raise Exception("invalid decision")

        self.incident_decision[incident_id] = decision
        self.incident_status[incident_id] = "decided"
        self.incident_payload[incident_id] = self.incident_payload[incident_id] + " | reason=" + reason

    @gl.public.write
    def verify_external_signal(self, incident_id: str, source_url: str, must_contain: str):
        """
        Non-deterministic web verification aligned with GenLayer Intelligent Contracts.
        """
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")

        def non_deterministic_block():
            web_data = gl.get_webpage(source_url, mode="text")
            return must_contain.lower() in web_data.lower()

        matched = gl.eq_principle_strict_eq(non_deterministic_block)
        self.incident_signal_verified[incident_id] = bool(matched)
        self.incident_signal_note[incident_id] = source_url
        if matched:
            self.incident_status[incident_id] = "signal_verified"

    @gl.public.write
    def create_incident(self, incident_id: str, protocol_id: str, start_ts: int, evidence_hash: str):
        if incident_id in self.incident_payload:
            raise Exception("incident already exists")
        if protocol_id not in self.protocol_metadata:
            raise Exception("protocol not found")
        if start_ts <= 0:
            raise Exception("invalid start_ts")

        self.incident_payload[incident_id] = "{}"
        self.incident_status[incident_id] = "candidate"
        self.incident_decision[incident_id] = "pending"
        self.incident_protocol_id[incident_id] = protocol_id
        self.incident_start_ts[incident_id] = bigint(start_ts)
        self.incident_evidence_hash[incident_id] = evidence_hash
        self.incident_queue_wallets_csv[incident_id] = ""
        self.incident_queue_amounts_csv[incident_id] = ""
        self.incident_total_amount[incident_id] = bigint(0)
        self.incident_paid_count[incident_id] = bigint(0)

    @gl.public.write
    def attach_affected_users(self, incident_id: str, wallets_csv: str, amounts_csv: str):
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")

        wallets = wallets_csv.split(",")
        amounts = amounts_csv.split(",")
        if len(wallets) != len(amounts):
            raise Exception("wallets and amounts length mismatch")
        if len(wallets) == 0:
            raise Exception("empty queue")

        total = bigint(0)
        for i in range(len(wallets)):
            wallet = wallets[i].strip().lower()
            if wallet == "":
                raise Exception("invalid wallet")
            amount = int(amounts[i].strip())
            if amount <= 0:
                raise Exception("invalid amount")
            total = total + bigint(amount)

        self.incident_queue_wallets_csv[incident_id] = wallets_csv
        self.incident_queue_amounts_csv[incident_id] = amounts_csv
        self.incident_total_amount[incident_id] = total

    @gl.public.write
    def open_challenge_window(self, incident_id: str, challenge_ends_ts: int):
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")
        if challenge_ends_ts <= 0:
            raise Exception("invalid challenge end")
        self.incident_challenge_ends_ts[incident_id] = bigint(challenge_ends_ts)
        self.incident_status[incident_id] = "challenge_open"

    @gl.public.write
    def raise_dispute(self, incident_id: str, wallet: str, evidence_hash: str):
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")
        key = self._dispute_key(incident_id, wallet)
        self.incident_dispute_decision[key] = "pending"
        self.incident_dispute_evidence[key] = evidence_hash

    @gl.public.write
    def resolve_dispute(self, incident_id: str, wallet: str, decision: str):
        if decision != "approved" and decision != "rejected":
            raise Exception("invalid dispute decision")
        key = self._dispute_key(incident_id, wallet)
        if key not in self.incident_dispute_decision:
            raise Exception("dispute not found")
        self.incident_dispute_decision[key] = decision

    @gl.public.write
    def finalize_incident(self, incident_id: str, current_ts: int):
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")
        if incident_id not in self.incident_challenge_ends_ts:
            raise Exception("challenge window not set")
        if bigint(current_ts) < self.incident_challenge_ends_ts[incident_id]:
            raise Exception("challenge window still open")
        self.incident_status[incident_id] = "finalized"

    @gl.public.write
    def execute_payout_batch(self, incident_id: str, protocol_id: str, start_index: int, limit: int, current_ts: int):
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")
        if incident_id in self.incident_enforced and self.incident_enforced[incident_id]:
            raise Exception("incident already fully enforced")
        if self.incident_status[incident_id] != "finalized":
            raise Exception("incident not finalized")
        if incident_id not in self.incident_protocol_id or self.incident_protocol_id[incident_id] != protocol_id:
            raise Exception("protocol mismatch")
        if bigint(current_ts) < self.incident_challenge_ends_ts[incident_id]:
            raise Exception("challenge window still open")
        if start_index < 0 or limit <= 0:
            raise Exception("invalid batch range")

        wallets_raw = self.incident_queue_wallets_csv[incident_id]
        amounts_raw = self.incident_queue_amounts_csv[incident_id]
        wallets = wallets_raw.split(",") if wallets_raw != "" else []
        amounts = amounts_raw.split(",") if amounts_raw != "" else []
        if len(wallets) != len(amounts):
            raise Exception("corrupt payout queue")

        end_index = start_index + limit
        if end_index > len(wallets):
            end_index = len(wallets)

        batch_total = bigint(0)
        for i in range(start_index, end_index):
            wallet = wallets[i].strip().lower()
            amount = int(amounts[i].strip())
            dkey = self._dispute_key(incident_id, wallet)
            if dkey in self.incident_dispute_decision and self.incident_dispute_decision[dkey] == "rejected":
                continue
            batch_total = batch_total + bigint(amount)

        current_pool = bigint(0)
        if protocol_id in self.pool_balance:
            current_pool = self.pool_balance[protocol_id]
        if current_pool < batch_total:
            raise Exception("insufficient pool balance")

        self.pool_balance[protocol_id] = current_pool - batch_total

        for i in range(start_index, end_index):
            wallet = wallets[i].strip().lower()
            amount = int(amounts[i].strip())
            dkey = self._dispute_key(incident_id, wallet)
            if dkey in self.incident_dispute_decision and self.incident_dispute_decision[dkey] == "rejected":
                continue

            previous = bigint(0)
            if wallet in self.wallet_compensation_balance:
                previous = self.wallet_compensation_balance[wallet]
            self.wallet_compensation_balance[wallet] = previous + bigint(amount)

        self.incident_paid_count[incident_id] = bigint(end_index)
        if end_index >= len(wallets):
            self.incident_enforced[incident_id] = True
            self.incident_status[incident_id] = "paid"

    @gl.public.view
    def get_incident_payload(self, incident_id: str) -> str:
        if incident_id not in self.incident_payload:
            return ""
        return self.incident_payload[incident_id]

    @gl.public.view
    def get_incident_status(self, incident_id: str) -> str:
        if incident_id not in self.incident_status:
            return "unknown"
        return self.incident_status[incident_id]

    @gl.public.view
    def get_incident_decision(self, incident_id: str) -> str:
        if incident_id not in self.incident_decision:
            return "pending"
        return self.incident_decision[incident_id]

    @gl.public.view
    def get_incident_signal_verified(self, incident_id: str) -> bool:
        if incident_id not in self.incident_signal_verified:
            return False
        return self.incident_signal_verified[incident_id]

    @gl.public.view
    def get_incident_signal_note(self, incident_id: str) -> str:
        if incident_id not in self.incident_signal_note:
            return ""
        return self.incident_signal_note[incident_id]

    @gl.public.view
    def get_incident_protocol_id(self, incident_id: str) -> str:
        if incident_id not in self.incident_protocol_id:
            return ""
        return self.incident_protocol_id[incident_id]

    @gl.public.view
    def get_incident_challenge_ends_ts(self, incident_id: str) -> int:
        if incident_id not in self.incident_challenge_ends_ts:
            return 0
        return int(self.incident_challenge_ends_ts[incident_id])

    @gl.public.view
    def get_incident_total_amount(self, incident_id: str) -> int:
        if incident_id not in self.incident_total_amount:
            return 0
        return int(self.incident_total_amount[incident_id])

    @gl.public.view
    def get_incident_paid_count(self, incident_id: str) -> int:
        if incident_id not in self.incident_paid_count:
            return 0
        return int(self.incident_paid_count[incident_id])

    @gl.public.view
    def get_dispute_decision(self, incident_id: str, wallet: str) -> str:
        key = self._dispute_key(incident_id, wallet)
        if key not in self.incident_dispute_decision:
            return ""
        return self.incident_dispute_decision[key]

    @gl.public.view
    def get_wallet_compensation_balance(self, wallet: str) -> int:
        key = wallet.lower()
        if key not in self.wallet_compensation_balance:
            return 0
        return int(self.wallet_compensation_balance[key])

    # ----------------------------
    # Coverage / Enforcement
    # ----------------------------
    @gl.public.write
    def deposit(self, protocol_id: str, amount: int):
        if amount <= 0:
            raise Exception("amount must be positive")

        current = bigint(0)
        if protocol_id in self.pool_balance:
            current = self.pool_balance[protocol_id]

        updated = current + bigint(amount)
        self.pool_balance[protocol_id] = updated

    @gl.public.write
    def execute_compensation(self, incident_id: str, protocol_id: str, total_amount: int):
        if total_amount <= 0:
            raise Exception("invalid amount")
        if incident_id in self.incident_enforced and self.incident_enforced[incident_id]:
            raise Exception("incident already enforced")

        current = bigint(0)
        if protocol_id in self.pool_balance:
            current = self.pool_balance[protocol_id]

        if current < bigint(total_amount):
            raise Exception("insufficient pool balance")

        self.pool_balance[protocol_id] = current - bigint(total_amount)
        self.incident_enforced[incident_id] = True

    @gl.public.view
    def get_pool_balance(self, protocol_id: str) -> int:
        if protocol_id not in self.pool_balance:
            return 0
        return int(self.pool_balance[protocol_id])

    @gl.public.view
    def is_incident_enforced(self, incident_id: str) -> bool:
        if incident_id not in self.incident_enforced:
            return False
        return self.incident_enforced[incident_id]

    # ----------------------------
    # Reputation
    # ----------------------------
    @gl.public.write
    def recompute_score(
        self,
        protocol_id: str,
        uptime_component: int,
        incident_component: int,
        response_component: int,
        pool_health_component: int,
    ):
        total = uptime_component + incident_component + response_component + pool_health_component
        score = total // 4

        grade = "C"
        if score >= 9000:
            grade = "AAA"
        elif score >= 8000:
            grade = "AA"
        elif score >= 7000:
            grade = "A"
        elif score >= 6000:
            grade = "B"

        self.protocol_score[protocol_id] = bigint(score)
        self.protocol_grade[protocol_id] = grade

    @gl.public.view
    def get_score(self, protocol_id: str) -> int:
        if protocol_id not in self.protocol_score:
            return 0
        return int(self.protocol_score[protocol_id])

    @gl.public.view
    def get_grade(self, protocol_id: str) -> str:
        if protocol_id not in self.protocol_grade:
            return "N/A"
        return self.protocol_grade[protocol_id]
