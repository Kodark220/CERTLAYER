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

    # Coverage / Enforcement
    pool_balance: TreeMap[str, bigint]
    incident_enforced: TreeMap[str, bool]

    # Reputation
    protocol_score: TreeMap[str, bigint]
    protocol_grade: TreeMap[str, str]

    def __init__(self):
        self.protocol_count = bigint(0)

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
