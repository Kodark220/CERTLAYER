# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from genlayer import *


class CertLayerContract(gl.Contract):
    contract_admin: str
    protocol_metadata: TreeMap[str, str]
    protocol_owner_wallet: TreeMap[str, str]
    protocol_contract_address: TreeMap[str, str]
    protocol_status: TreeMap[str, str]
    protocol_count: bigint
    incident_data: TreeMap[str, str]
    pool_balance: TreeMap[str, bigint]
    protocol_score: TreeMap[str, bigint]
    protocol_grade: TreeMap[str, str]

    def __init__(self):
        self.contract_admin = str(gl.message.sender_address).lower()
        self.protocol_count = bigint(0)

    def _sender_wallet(self) -> str:
        return str(gl.message.sender_address).lower()

    def _require_admin(self):
        if self._sender_wallet() != self.contract_admin:
            raise Exception("only contract admin allowed")

    def _require_protocol_operator(self, protocol_id: str):
        owner = self.protocol_owner_wallet.get(protocol_id, "")
        sender = self._sender_wallet()
        if sender != self.contract_admin and sender != owner:
            raise Exception("only protocol owner or admin allowed")

    @gl.public.write
    def register_protocol(self, protocol_id: str, metadata_json: str, owner_wallet: str, contract_address: str = ""):
        if protocol_id in self.protocol_metadata:
            raise Exception("protocol already registered")
        sender = self._sender_wallet()
        owner = owner_wallet.lower()
        if sender != self.contract_admin and sender != owner:
            raise Exception("owner_wallet must match sender unless sender is admin")
        self.protocol_metadata[protocol_id] = metadata_json
        self.protocol_owner_wallet[protocol_id] = owner
        self.protocol_contract_address[protocol_id] = contract_address
        self.protocol_status[protocol_id] = "active"
        self.protocol_count = self.protocol_count + bigint(1)

    @gl.public.write
    def set_protocol_status(self, protocol_id: str, new_status: str):
        if protocol_id not in self.protocol_metadata:
            raise Exception("protocol not found")
        self._require_protocol_operator(protocol_id)
        self.protocol_status[protocol_id] = new_status

    @gl.public.write
    def set_protocol_contract_address(self, protocol_id: str, contract_address: str):
        if protocol_id not in self.protocol_metadata:
            raise Exception("protocol not found")
        self._require_protocol_operator(protocol_id)
        self.protocol_contract_address[protocol_id] = contract_address

    @gl.public.view
    def get_contract_admin(self) -> str:
        return self.contract_admin

    @gl.public.view
    def get_protocol_metadata(self, protocol_id: str) -> str:
        return self.protocol_metadata.get(protocol_id, "")

    @gl.public.view
    def get_protocol_owner_wallet(self, protocol_id: str) -> str:
        return self.protocol_owner_wallet.get(protocol_id, "")

    @gl.public.view
    def get_protocol_contract_address(self, protocol_id: str) -> str:
        return self.protocol_contract_address.get(protocol_id, "")

    @gl.public.view
    def get_protocol_status(self, protocol_id: str) -> str:
        return self.protocol_status.get(protocol_id, "unknown")

    @gl.public.view
    def get_protocol_count(self) -> int:
        return int(self.protocol_count)

    @gl.public.write
    def submit_incident_candidate(self, incident_id: str, payload_json: str):
        if incident_id in self.incident_data:
            raise Exception("incident already exists")
        try:
            p = json.loads(payload_json)
        except Exception:
            raise Exception("payload_json must be valid json")
        pid = str(p.get("protocolId", ""))
        if pid == "" or pid not in self.protocol_metadata:
            raise Exception("invalid or missing protocolId")
        self._require_protocol_operator(pid)
        d = {"payload": payload_json, "status": "candidate", "decision": "pending", "protocol_id": pid}
        self.incident_data[incident_id] = json.dumps(d)

    @gl.public.write
    def create_incident(self, incident_id: str, protocol_id: str, start_ts: int, evidence_hash: str):
        if incident_id in self.incident_data:
            raise Exception("incident already exists")
        if protocol_id not in self.protocol_metadata:
            raise Exception("protocol not found")
        self._require_protocol_operator(protocol_id)
        d = {"status": "candidate", "decision": "pending", "protocol_id": protocol_id, "type": "availability", "start_ts": start_ts, "evidence_hash": evidence_hash}
        self.incident_data[incident_id] = json.dumps(d)

    @gl.public.write
    def submit_verification_decision(self, incident_id: str, decision: str, reason: str):
        if incident_id not in self.incident_data:
            raise Exception("incident not found")
        if decision != "breach_confirmed" and decision != "breach_rejected":
            raise Exception("invalid decision")
        self._require_admin()
        d = json.loads(self.incident_data[incident_id])
        d["decision"] = decision
        d["status"] = "decided"
        d["reason"] = reason
        self.incident_data[incident_id] = json.dumps(d)

    @gl.public.view
    def get_incident_status(self, incident_id: str) -> str:
        if incident_id not in self.incident_data:
            return "unknown"
        return json.loads(self.incident_data[incident_id]).get("status", "unknown")

    @gl.public.view
    def get_incident_decision(self, incident_id: str) -> str:
        if incident_id not in self.incident_data:
            return "pending"
        return json.loads(self.incident_data[incident_id]).get("decision", "pending")

    @gl.public.view
    def get_incident_protocol_id(self, incident_id: str) -> str:
        if incident_id not in self.incident_data:
            return ""
        return json.loads(self.incident_data[incident_id]).get("protocol_id", "")

    @gl.public.view
    def get_score(self, protocol_id: str) -> int:
        if protocol_id not in self.protocol_score:
            return 0
        return int(self.protocol_score[protocol_id])

    @gl.public.view
    def get_grade(self, protocol_id: str) -> str:
        return self.protocol_grade.get(protocol_id, "")

    @gl.public.view
    def get_pool_balance(self, protocol_id: str) -> int:
        if protocol_id not in self.pool_balance:
            return 0
        return int(self.pool_balance[protocol_id])

    @gl.public.write
    def add_pool_balance(self, protocol_id: str, amount: int):
        if protocol_id not in self.protocol_metadata:
            raise Exception("protocol not found")
        self._require_protocol_operator(protocol_id)
        current = bigint(0)
        if protocol_id in self.pool_balance:
            current = self.pool_balance[protocol_id]
        self.pool_balance[protocol_id] = current + bigint(amount)
