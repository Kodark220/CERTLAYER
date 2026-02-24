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
    incident_type: TreeMap[str, str]
    incident_start_ts: TreeMap[str, bigint]
    incident_evidence_hash: TreeMap[str, str]
    incident_challenge_ends_ts: TreeMap[str, bigint]
    incident_queue_wallets_csv: TreeMap[str, str]
    incident_queue_amounts_csv: TreeMap[str, str]
    incident_total_amount: TreeMap[str, bigint]
    incident_paid_count: TreeMap[str, bigint]
    incident_dispute_decision: TreeMap[str, str]
    incident_dispute_evidence: TreeMap[str, str]
    incident_recovery_pool: TreeMap[str, bigint]
    incident_recovery_distributed: TreeMap[str, bigint]
    incident_last_clean_block: TreeMap[str, bigint]
    incident_trigger_sources: TreeMap[str, str]
    incident_response_speed_score: TreeMap[str, bigint]
    incident_communication_quality_score: TreeMap[str, bigint]
    incident_pool_adequacy_score: TreeMap[str, bigint]
    incident_post_mortem_score: TreeMap[str, bigint]
    incident_recovery_effort_score: TreeMap[str, bigint]

    # Community commitments
    commitment_protocol_id: TreeMap[str, str]
    commitment_type: TreeMap[str, str]
    commitment_source_url: TreeMap[str, str]
    commitment_text_hash: TreeMap[str, str]
    commitment_deadline_ts: TreeMap[str, bigint]
    commitment_verification_rule: TreeMap[str, str]
    commitment_status: TreeMap[str, str]
    commitment_evidence_hash: TreeMap[str, str]
    commitment_grace_ends_ts: TreeMap[str, bigint]
    protocol_missed_commitments_count: TreeMap[str, bigint]

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
        self.incident_type[incident_id] = "availability"
        self.incident_start_ts[incident_id] = bigint(start_ts)
        self.incident_evidence_hash[incident_id] = evidence_hash
        self.incident_queue_wallets_csv[incident_id] = ""
        self.incident_queue_amounts_csv[incident_id] = ""
        self.incident_total_amount[incident_id] = bigint(0)
        self.incident_paid_count[incident_id] = bigint(0)
        self.incident_recovery_pool[incident_id] = bigint(0)
        self.incident_recovery_distributed[incident_id] = bigint(0)
        self.incident_last_clean_block[incident_id] = bigint(0)
        self.incident_trigger_sources[incident_id] = ""
        self.incident_response_speed_score[incident_id] = bigint(0)
        self.incident_communication_quality_score[incident_id] = bigint(0)
        self.incident_pool_adequacy_score[incident_id] = bigint(0)
        self.incident_post_mortem_score[incident_id] = bigint(0)
        self.incident_recovery_effort_score[incident_id] = bigint(0)

    @gl.public.write
    def create_security_incident(
        self,
        incident_id: str,
        protocol_id: str,
        start_ts: int,
        evidence_hash: str,
        last_clean_block: int,
        trigger_sources_csv: str,
    ):
        self.create_incident(incident_id, protocol_id, start_ts, evidence_hash)
        self.incident_type[incident_id] = "security"
        self.incident_last_clean_block[incident_id] = bigint(last_clean_block)
        self.incident_trigger_sources[incident_id] = trigger_sources_csv

    @gl.public.write
    def set_last_clean_block(self, incident_id: str, block_number: int):
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")
        if block_number < 0:
            raise Exception("invalid block number")
        self.incident_last_clean_block[incident_id] = bigint(block_number)

    @gl.public.write
    def attach_loss_snapshot(self, incident_id: str, wallets_csv: str, losses_csv: str):
        # Reuse common queue storage for security-loss based payouts.
        self.attach_affected_users(incident_id, wallets_csv, losses_csv)

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

    @gl.public.write
    def record_recovery(self, incident_id: str, amount: int):
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")
        if amount <= 0:
            raise Exception("invalid recovery amount")
        current = bigint(0)
        if incident_id in self.incident_recovery_pool:
            current = self.incident_recovery_pool[incident_id]
        self.incident_recovery_pool[incident_id] = current + bigint(amount)

    @gl.public.write
    def distribute_recovery_batch(self, incident_id: str, start_index: int, limit: int):
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")
        if start_index < 0 or limit <= 0:
            raise Exception("invalid batch range")

        wallets_raw = self.incident_queue_wallets_csv[incident_id]
        amounts_raw = self.incident_queue_amounts_csv[incident_id]
        wallets = wallets_raw.split(",") if wallets_raw != "" else []
        losses = amounts_raw.split(",") if amounts_raw != "" else []
        if len(wallets) != len(losses):
            raise Exception("corrupt loss snapshot")
        total_loss = self.incident_total_amount[incident_id]
        if total_loss <= bigint(0):
            raise Exception("invalid total loss")

        recovery_pool = self.incident_recovery_pool[incident_id]
        distributed = self.incident_recovery_distributed[incident_id]
        remaining = recovery_pool - distributed
        if remaining <= bigint(0):
            raise Exception("no recovery funds to distribute")

        end_index = start_index + limit
        if end_index > len(wallets):
            end_index = len(wallets)

        batch_amount = bigint(0)
        for i in range(start_index, end_index):
            loss_i = bigint(int(losses[i].strip()))
            share = (remaining * loss_i) // total_loss
            batch_amount = batch_amount + share

        if batch_amount > remaining:
            batch_amount = remaining

        for i in range(start_index, end_index):
            wallet = wallets[i].strip().lower()
            loss_i = bigint(int(losses[i].strip()))
            share = (remaining * loss_i) // total_loss
            previous = bigint(0)
            if wallet in self.wallet_compensation_balance:
                previous = self.wallet_compensation_balance[wallet]
            self.wallet_compensation_balance[wallet] = previous + share

        self.incident_recovery_distributed[incident_id] = distributed + batch_amount

    @gl.public.write
    def set_hack_response_scores(
        self,
        incident_id: str,
        response_speed: int,
        communication_quality: int,
        pool_adequacy: int,
        post_mortem_quality: int,
        recovery_effort: int,
    ):
        if incident_id not in self.incident_payload:
            raise Exception("incident not found")
        self.incident_response_speed_score[incident_id] = bigint(response_speed)
        self.incident_communication_quality_score[incident_id] = bigint(communication_quality)
        self.incident_pool_adequacy_score[incident_id] = bigint(pool_adequacy)
        self.incident_post_mortem_score[incident_id] = bigint(post_mortem_quality)
        self.incident_recovery_effort_score[incident_id] = bigint(recovery_effort)

    @gl.public.write
    def register_commitment(
        self,
        commitment_id: str,
        protocol_id: str,
        commitment_type: str,
        source_url: str,
        commitment_text_hash: str,
        deadline_ts: int,
        verification_rule: str,
    ):
        if commitment_id in self.commitment_protocol_id:
            raise Exception("commitment already exists")
        if protocol_id not in self.protocol_metadata:
            raise Exception("protocol not found")
        if deadline_ts <= 0:
            raise Exception("invalid deadline")

        self.commitment_protocol_id[commitment_id] = protocol_id
        self.commitment_type[commitment_id] = commitment_type
        self.commitment_source_url[commitment_id] = source_url
        self.commitment_text_hash[commitment_id] = commitment_text_hash
        self.commitment_deadline_ts[commitment_id] = bigint(deadline_ts)
        self.commitment_verification_rule[commitment_id] = verification_rule
        self.commitment_status[commitment_id] = "registered"
        self.commitment_evidence_hash[commitment_id] = ""
        self.commitment_grace_ends_ts[commitment_id] = bigint(0)

    @gl.public.write
    def evaluate_commitment(self, commitment_id: str, result: str, evidence_hash: str, current_ts: int):
        if commitment_id not in self.commitment_protocol_id:
            raise Exception("commitment not found")
        if result != "fulfilled" and result != "partial" and result != "missed":
            raise Exception("invalid result")

        self.commitment_evidence_hash[commitment_id] = evidence_hash
        if result == "missed":
            # 7-day grace window before permanent non-compliance.
            self.commitment_status[commitment_id] = "missed_grace"
            self.commitment_grace_ends_ts[commitment_id] = bigint(current_ts + 604800)
        else:
            self.commitment_status[commitment_id] = result
            self.commitment_grace_ends_ts[commitment_id] = bigint(0)

    @gl.public.write
    def submit_commitment_fulfillment_evidence(self, commitment_id: str, evidence_hash: str):
        if commitment_id not in self.commitment_protocol_id:
            raise Exception("commitment not found")
        if self.commitment_status[commitment_id] != "missed_grace":
            raise Exception("commitment not in grace window")
        self.commitment_evidence_hash[commitment_id] = evidence_hash
        self.commitment_status[commitment_id] = "fulfilled_grace"
        self.commitment_grace_ends_ts[commitment_id] = bigint(0)

    @gl.public.write
    def finalize_commitment(self, commitment_id: str, current_ts: int):
        if commitment_id not in self.commitment_protocol_id:
            raise Exception("commitment not found")
        if self.commitment_status[commitment_id] != "missed_grace":
            raise Exception("commitment not pending grace finalization")
        if bigint(current_ts) < self.commitment_grace_ends_ts[commitment_id]:
            raise Exception("grace window still open")

        self.commitment_status[commitment_id] = "missed_final"
        protocol_id = self.commitment_protocol_id[commitment_id]
        misses = bigint(0)
        if protocol_id in self.protocol_missed_commitments_count:
            misses = self.protocol_missed_commitments_count[protocol_id]
        misses = misses + bigint(1)
        self.protocol_missed_commitments_count[protocol_id] = misses

        if misses >= bigint(3):
            self.protocol_status[protocol_id] = "coverage_suspended"
        elif misses >= bigint(2):
            self.protocol_status[protocol_id] = "probationary"

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
    def get_incident_type(self, incident_id: str) -> str:
        if incident_id not in self.incident_type:
            return ""
        return self.incident_type[incident_id]

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
    def get_incident_recovery_pool(self, incident_id: str) -> int:
        if incident_id not in self.incident_recovery_pool:
            return 0
        return int(self.incident_recovery_pool[incident_id])

    @gl.public.view
    def get_incident_recovery_distributed(self, incident_id: str) -> int:
        if incident_id not in self.incident_recovery_distributed:
            return 0
        return int(self.incident_recovery_distributed[incident_id])

    @gl.public.view
    def get_last_clean_block(self, incident_id: str) -> int:
        if incident_id not in self.incident_last_clean_block:
            return 0
        return int(self.incident_last_clean_block[incident_id])

    @gl.public.view
    def get_trigger_sources(self, incident_id: str) -> str:
        if incident_id not in self.incident_trigger_sources:
            return ""
        return self.incident_trigger_sources[incident_id]

    @gl.public.view
    def get_hack_response_score_average(self, incident_id: str) -> int:
        if incident_id not in self.incident_payload:
            return 0
        total = (
            self.incident_response_speed_score[incident_id]
            + self.incident_communication_quality_score[incident_id]
            + self.incident_pool_adequacy_score[incident_id]
            + self.incident_post_mortem_score[incident_id]
            + self.incident_recovery_effort_score[incident_id]
        )
        return int(total // bigint(5))

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

    @gl.public.view
    def get_commitment_status(self, commitment_id: str) -> str:
        if commitment_id not in self.commitment_status:
            return ""
        return self.commitment_status[commitment_id]

    @gl.public.view
    def get_commitment_protocol_id(self, commitment_id: str) -> str:
        if commitment_id not in self.commitment_protocol_id:
            return ""
        return self.commitment_protocol_id[commitment_id]

    @gl.public.view
    def get_commitment_grace_ends_ts(self, commitment_id: str) -> int:
        if commitment_id not in self.commitment_grace_ends_ts:
            return 0
        return int(self.commitment_grace_ends_ts[commitment_id])

    @gl.public.view
    def get_protocol_missed_commitments_count(self, protocol_id: str) -> int:
        if protocol_id not in self.protocol_missed_commitments_count:
            return 0
        return int(self.protocol_missed_commitments_count[protocol_id])

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
