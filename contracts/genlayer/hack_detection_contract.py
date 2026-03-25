# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *


class HackDetection(gl.Contract):
    is_paused: bool
    admin: Address
    roles: TreeMap[Address, str]
    tx_risk_scores: TreeMap[str, u8]
    tx_analysis: TreeMap[str, str]
    protected_protocols: TreeMap[Address, bool]

    def __init__(self):
        self.is_paused = False
        self.admin = gl.message.sender_address
        self.roles[gl.message.sender_address] = "admin"

    def _require_admin(self):
        sender = gl.message.sender_address
        if self.roles.get(sender, "") != "admin":
            raise Exception("Only admin allowed")

    @gl.public.view
    def explain_intelligence(self) -> str:
        return (
            "GenLayer Intelligent Contract for hack detection. "
            "Uses AI-powered validators and LLM-based analysis "
            "to detect and respond to threats in real time."
        )

    @gl.public.view
    def get_paused(self) -> bool:
        return self.is_paused

    @gl.public.view
    def get_role(self, user: Address) -> str:
        return self.roles.get(Address(user), "user")

    @gl.public.view
    def get_risk_score(self, tx_hash: str) -> int:
        if tx_hash not in self.tx_risk_scores:
            return 0
        return int(self.tx_risk_scores[tx_hash])

    @gl.public.view
    def get_tx_analysis_readable(self, tx_hash: str) -> str:
        return self.tx_analysis.get(tx_hash, "")

    @gl.public.write
    def emergency_pause(self):
        self._require_admin()
        self.is_paused = True

    @gl.public.write
    def unpause(self):
        self._require_admin()
        self.is_paused = False

    @gl.public.write
    def register_protocol(self, protocol: Address):
        self._require_admin()
        self.protected_protocols[Address(protocol)] = True

    @gl.public.write
    def analyze_transaction(self, tx_data: str, tx_hash: str):
        if self.is_paused:
            raise Exception("Contract is paused")
        prompt = (
            "SYSTEM: You are a security classifier. Output ONLY TRUE or FALSE. "
            "Return TRUE only if the transaction is clearly malicious. "
            "Data: " + tx_data + " OUTPUT: TRUE or FALSE"
        )
        raw = gl.eq_principle.strict_eq(lambda: gl.nondet.exec_prompt(prompt))
        is_threat = "TRUE" in raw.strip().upper()
        score = u8(80) if is_threat else u8(20)
        self.tx_risk_scores[tx_hash] = score
        level = "HIGH" if int(score) >= 71 else "MEDIUM" if int(score) >= 31 else "LOW"
        msg = level + " LEVEL THREAT DETECTED." if is_threat else "NO THREAT DETECTED."
        self.tx_analysis[tx_hash] = json.dumps({"threat": is_threat, "risk_score": int(score), "risk_level": level, "message": msg})
        if is_threat:
            self.is_paused = True
