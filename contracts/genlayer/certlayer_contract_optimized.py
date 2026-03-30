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
    pool_balance: TreeMap[str, bigint]
    incident_enforced: TreeMap[str, bool]
    wallet_compensation_balance: TreeMap[str, bigint]
    protocol_score: TreeMap[str, bigint]
    protocol_grade: TreeMap[str, str]

    def __init__(self):
        self.contract_admin = str(gl.message.sender_address).lower()
        self.protocol_count = bigint(0)

    def _dk(self, iid: str, w: str) -> str:
        return iid + "|" + w.lower()

    def _sw(self) -> str:
        return str(gl.message.sender_address).lower()

    def _s(self, v) -> str:
        while isinstance(v, list) and len(v) == 1:
            v = v[0]
        return str(v) if not isinstance(v, str) else v

    def _i(self, v) -> int:
        while isinstance(v, list) and len(v) == 1:
            v = v[0]
        return int(v)

    def _ra(self):
        if self._sw() != self.contract_admin:
            raise gl.vm.UserError("admin only")

    def _rpo(self, pid: str):
        ow = self.protocol_owner_wallet.get(pid, "")
        sw = self._sw()
        if sw != self.contract_admin and sw != ow:
            raise gl.vm.UserError("not authorized")

    def _rio(self, iid: str):
        if iid not in self.incident_protocol_id:
            raise gl.vm.UserError("incident not found")
        self._rpo(self.incident_protocol_id[iid])

    def _rco(self, cid: str):
        if cid not in self.commitment_protocol_id:
            raise gl.vm.UserError("commitment not found")
        self._rpo(self.commitment_protocol_id[cid])

    def _epid(self, pj: str) -> str:
        try:
            p = json.loads(pj)
        except Exception:
            raise gl.vm.UserError("invalid json")
        pid = str(p.get("protocolId", ""))
        if pid == "":
            raise gl.vm.UserError("missing protocolId")
        return pid

    @gl.public.write
    def register_protocol(self, protocol_id: str, metadata_json: str, owner_wallet: str, contract_address: str = ""):
        pid = self._s(protocol_id)
        mj = self._s(metadata_json)
        ow = self._s(owner_wallet)
        ca = self._s(contract_address)
        if pid in self.protocol_metadata:
            raise gl.vm.UserError("already registered")
        sw = self._sw()
        no = ow.lower()
        if sw != self.contract_admin and sw != no:
            raise gl.vm.UserError("not authorized")
        self.protocol_metadata[pid] = mj
        self.protocol_owner_wallet[pid] = no
        self.protocol_contract_address[pid] = ca
        self.protocol_status[pid] = "active"
        self.protocol_count = self.protocol_count + bigint(1)

    @gl.public.write
    def set_protocol_status(self, protocol_id: str, new_status: str):
        pid = self._s(protocol_id)
        ns = self._s(new_status)
        if pid not in self.protocol_metadata:
            raise gl.vm.UserError("not found")
        self._rpo(pid)
        self.protocol_status[pid] = ns

    @gl.public.write
    def set_protocol_contract_address(self, protocol_id: str, contract_address: str):
        pid = self._s(protocol_id)
        ca = self._s(contract_address)
        if pid not in self.protocol_metadata:
            raise gl.vm.UserError("not found")
        self._rpo(pid)
        self.protocol_contract_address[pid] = ca

    @gl.public.view
    def get_protocol_metadata(self, protocol_id: str) -> str:
        pid = self._s(protocol_id)
        return self.protocol_metadata.get(pid, "")

    @gl.public.view
    def get_protocol_owner_wallet(self, protocol_id: str) -> str:
        pid = self._s(protocol_id)
        return self.protocol_owner_wallet.get(pid, "")

    @gl.public.view
    def get_protocol_contract_address(self, protocol_id: str) -> str:
        pid = self._s(protocol_id)
        return self.protocol_contract_address.get(pid, "")

    @gl.public.view
    def get_contract_admin(self) -> str:
        return self.contract_admin

    @gl.public.view
    def get_protocol_status(self, protocol_id: str) -> str:
        pid = self._s(protocol_id)
        return self.protocol_status.get(pid, "unknown")

    @gl.public.view
    def get_protocol_count(self) -> int:
        return int(self.protocol_count)

    @gl.public.write
    def submit_incident_candidate(self, incident_id: str, payload_json: str):
        iid = self._s(incident_id)
        pj = self._s(payload_json)
        if iid in self.incident_payload:
            raise gl.vm.UserError("already exists")
        pid = self._epid(pj)
        if pid not in self.protocol_metadata:
            raise gl.vm.UserError("protocol not found")
        self._rpo(pid)
        self.incident_payload[iid] = pj
        self.incident_status[iid] = "candidate"
        self.incident_decision[iid] = "pending"
        self.incident_protocol_id[iid] = pid

    @gl.public.write
    def submit_verification_decision(self, incident_id: str, decision: str, reason: str):
        iid = self._s(incident_id)
        d = self._s(decision)
        r = self._s(reason)
        if iid not in self.incident_payload:
            raise gl.vm.UserError("not found")
        if d != "breach_confirmed" and d != "breach_rejected":
            raise gl.vm.UserError("invalid decision")
        self._ra()
        self.incident_decision[iid] = d
        self.incident_status[iid] = "decided"
        self.incident_payload[iid] = self.incident_payload[iid] + " | reason=" + r

    @gl.public.write
    def create_incident(self, incident_id: str, protocol_id: str, start_ts: int, evidence_hash: str):
        iid = self._s(incident_id)
        pid = self._s(protocol_id)
        st = self._i(start_ts)
        eh = self._s(evidence_hash)
        if iid in self.incident_payload:
            raise gl.vm.UserError("already exists")
        if pid not in self.protocol_metadata:
            raise gl.vm.UserError("protocol not found")
        if st <= 0:
            raise gl.vm.UserError("invalid start_ts")
        self._rpo(pid)
        self.incident_payload[iid] = "{}"
        self.incident_status[iid] = "candidate"
        self.incident_decision[iid] = "pending"
        self.incident_protocol_id[iid] = pid
        self.incident_type[iid] = "availability"
        self.incident_start_ts[iid] = bigint(st)
        self.incident_evidence_hash[iid] = eh
        self.incident_queue_wallets_csv[iid] = ""
        self.incident_queue_amounts_csv[iid] = ""
        self.incident_total_amount[iid] = bigint(0)
        self.incident_paid_count[iid] = bigint(0)
        self.incident_recovery_pool[iid] = bigint(0)
        self.incident_recovery_distributed[iid] = bigint(0)
        self.incident_last_clean_block[iid] = bigint(0)
        self.incident_trigger_sources[iid] = ""
        self.incident_response_speed_score[iid] = bigint(0)
        self.incident_communication_quality_score[iid] = bigint(0)
        self.incident_pool_adequacy_score[iid] = bigint(0)
        self.incident_post_mortem_score[iid] = bigint(0)
        self.incident_recovery_effort_score[iid] = bigint(0)

    @gl.public.write
    def create_security_incident(self, incident_id: str, protocol_id: str, start_ts: int, evidence_hash: str, last_clean_block: int, trigger_sources_csv: str):
        iid = self._s(incident_id)
        pid = self._s(protocol_id)
        st = self._i(start_ts)
        eh = self._s(evidence_hash)
        lcb = self._i(last_clean_block)
        tsc = self._s(trigger_sources_csv)
        self.create_incident(iid, pid, st, eh)
        self.incident_type[iid] = "security"
        self.incident_last_clean_block[iid] = bigint(lcb)
        self.incident_trigger_sources[iid] = tsc

    @gl.public.write
    def attach_loss_snapshot(self, incident_id: str, wallets_csv: str, losses_csv: str):
        self.attach_affected_users(self._s(incident_id), self._s(wallets_csv), self._s(losses_csv))

    @gl.public.write
    def attach_affected_users(self, incident_id: str, wallets_csv: str, amounts_csv: str):
        iid = self._s(incident_id)
        wc = self._s(wallets_csv)
        ac = self._s(amounts_csv)
        if iid not in self.incident_payload:
            raise gl.vm.UserError("not found")
        self._rio(iid)
        ws = wc.split(",")
        ams = ac.split(",")
        if len(ws) != len(ams):
            raise gl.vm.UserError("length mismatch")
        if len(ws) == 0:
            raise gl.vm.UserError("empty")
        t = bigint(0)
        for i in range(len(ws)):
            w = ws[i].strip().lower()
            if w == "":
                raise gl.vm.UserError("invalid wallet")
            a = int(ams[i].strip())
            if a <= 0:
                raise gl.vm.UserError("invalid amount")
            t = t + bigint(a)
        self.incident_queue_wallets_csv[iid] = wc
        self.incident_queue_amounts_csv[iid] = ac
        self.incident_total_amount[iid] = t

    @gl.public.write
    def open_challenge_window(self, incident_id: str, challenge_ends_ts: int):
        iid = self._s(incident_id)
        ce = self._i(challenge_ends_ts)
        if iid not in self.incident_payload:
            raise gl.vm.UserError("not found")
        if ce <= 0:
            raise gl.vm.UserError("invalid")
        self._rio(iid)
        self.incident_challenge_ends_ts[iid] = bigint(ce)
        self.incident_status[iid] = "challenge_open"

    @gl.public.write
    def raise_dispute(self, incident_id: str, wallet: str, evidence_hash: str):
        iid = self._s(incident_id)
        w = self._s(wallet)
        eh = self._s(evidence_hash)
        if iid not in self.incident_payload:
            raise gl.vm.UserError("not found")
        sw = self._sw()
        if sw != self.contract_admin and sw != w.lower():
            raise gl.vm.UserError("not authorized")
        k = self._dk(iid, w)
        self.incident_dispute_decision[k] = "pending"
        self.incident_dispute_evidence[k] = eh

    @gl.public.write
    def resolve_dispute(self, incident_id: str, wallet: str, decision: str):
        iid = self._s(incident_id)
        w = self._s(wallet)
        d = self._s(decision)
        if d != "approved" and d != "rejected":
            raise gl.vm.UserError("invalid decision")
        self._ra()
        k = self._dk(iid, w)
        if k not in self.incident_dispute_decision:
            raise gl.vm.UserError("not found")
        self.incident_dispute_decision[k] = d

    @gl.public.write
    def finalize_incident(self, incident_id: str, current_ts: int):
        iid = self._s(incident_id)
        ct = self._i(current_ts)
        if iid not in self.incident_payload:
            raise gl.vm.UserError("not found")
        if iid not in self.incident_challenge_ends_ts:
            raise gl.vm.UserError("no challenge window")
        if bigint(ct) < self.incident_challenge_ends_ts[iid]:
            raise gl.vm.UserError("challenge window open")
        self._ra()
        self.incident_status[iid] = "finalized"

    @gl.public.write
    def execute_payout_batch(self, incident_id: str, protocol_id: str, start_index: int, limit: int, current_ts: int):
        iid = self._s(incident_id)
        pid = self._s(protocol_id)
        si = self._i(start_index)
        lm = self._i(limit)
        ct = self._i(current_ts)
        if iid not in self.incident_payload:
            raise gl.vm.UserError("not found")
        if iid in self.incident_enforced and self.incident_enforced[iid]:
            raise gl.vm.UserError("already enforced")
        if self.incident_status[iid] != "finalized":
            raise gl.vm.UserError("not finalized")
        if iid not in self.incident_protocol_id or self.incident_protocol_id[iid] != pid:
            raise gl.vm.UserError("protocol mismatch")
        if bigint(ct) < self.incident_challenge_ends_ts[iid]:
            raise gl.vm.UserError("challenge window open")
        if si < 0 or lm <= 0:
            raise gl.vm.UserError("invalid range")
        self._ra()
        wr = self.incident_queue_wallets_csv[iid]
        ar = self.incident_queue_amounts_csv[iid]
        ws = wr.split(",") if wr != "" else []
        ams = ar.split(",") if ar != "" else []
        if len(ws) != len(ams):
            raise gl.vm.UserError("corrupt queue")
        ei = si + lm
        if ei > len(ws):
            ei = len(ws)
        bt = bigint(0)
        for i in range(si, ei):
            w = ws[i].strip().lower()
            a = int(ams[i].strip())
            dk = self._dk(iid, w)
            if dk in self.incident_dispute_decision and self.incident_dispute_decision[dk] == "rejected":
                continue
            bt = bt + bigint(a)
        cp = self.pool_balance.get(pid, bigint(0))
        if cp < bt:
            raise gl.vm.UserError("insufficient balance")
        self.pool_balance[pid] = cp - bt
        for i in range(si, ei):
            w = ws[i].strip().lower()
            a = int(ams[i].strip())
            dk = self._dk(iid, w)
            if dk in self.incident_dispute_decision and self.incident_dispute_decision[dk] == "rejected":
                continue
            prev = self.wallet_compensation_balance.get(w, bigint(0))
            self.wallet_compensation_balance[w] = prev + bigint(a)
        self.incident_paid_count[iid] = bigint(ei)
        if ei >= len(ws):
            self.incident_enforced[iid] = True
            self.incident_status[iid] = "paid"

    @gl.public.write
    def record_recovery(self, incident_id: str, amount: int):
        iid = self._s(incident_id)
        a = self._i(amount)
        if iid not in self.incident_payload:
            raise gl.vm.UserError("not found")
        if a <= 0:
            raise gl.vm.UserError("invalid amount")
        self._ra()
        cur = self.incident_recovery_pool.get(iid, bigint(0))
        self.incident_recovery_pool[iid] = cur + bigint(a)

    @gl.public.write
    def distribute_recovery_batch(self, incident_id: str, start_index: int, limit: int):
        iid = self._s(incident_id)
        si = self._i(start_index)
        lm = self._i(limit)
        if iid not in self.incident_payload:
            raise gl.vm.UserError("not found")
        if si < 0 or lm <= 0:
            raise gl.vm.UserError("invalid range")
        self._ra()
        wr = self.incident_queue_wallets_csv[iid]
        lr = self.incident_queue_amounts_csv[iid]
        ws = wr.split(",") if wr != "" else []
        ls = lr.split(",") if lr != "" else []
        if len(ws) != len(ls):
            raise gl.vm.UserError("corrupt snapshot")
        tl = self.incident_total_amount[iid]
        if tl <= bigint(0):
            raise gl.vm.UserError("invalid total")
        rp = self.incident_recovery_pool[iid]
        dd = self.incident_recovery_distributed[iid]
        rem = rp - dd
        if rem <= bigint(0):
            raise gl.vm.UserError("no funds")
        ei = si + lm
        if ei > len(ws):
            ei = len(ws)
        ba = bigint(0)
        for i in range(si, ei):
            li = bigint(int(ls[i].strip()))
            sh = (rem * li) // tl
            ba = ba + sh
        if ba > rem:
            ba = rem
        for i in range(si, ei):
            w = ws[i].strip().lower()
            li = bigint(int(ls[i].strip()))
            sh = (rem * li) // tl
            prev = self.wallet_compensation_balance.get(w, bigint(0))
            self.wallet_compensation_balance[w] = prev + sh
        self.incident_recovery_distributed[iid] = dd + ba

    @gl.public.write
    def set_hack_response_scores(self, incident_id: str, response_speed: int, communication_quality: int, pool_adequacy: int, post_mortem_quality: int, recovery_effort: int):
        iid = self._s(incident_id)
        rs = self._i(response_speed)
        cq = self._i(communication_quality)
        pa = self._i(pool_adequacy)
        pm = self._i(post_mortem_quality)
        re = self._i(recovery_effort)
        if iid not in self.incident_payload:
            raise gl.vm.UserError("not found")
        self._ra()
        self.incident_response_speed_score[iid] = bigint(rs)
        self.incident_communication_quality_score[iid] = bigint(cq)
        self.incident_pool_adequacy_score[iid] = bigint(pa)
        self.incident_post_mortem_score[iid] = bigint(pm)
        self.incident_recovery_effort_score[iid] = bigint(re)

    @gl.public.write
    def register_commitment(self, commitment_id: str, protocol_id: str, commitment_type: str, source_url: str, commitment_text_hash: str, deadline_ts: int, verification_rule: str):
        cid = self._s(commitment_id)
        pid = self._s(protocol_id)
        ct = self._s(commitment_type)
        su = self._s(source_url)
        cth = self._s(commitment_text_hash)
        dt = self._i(deadline_ts)
        vr = self._s(verification_rule)
        if cid in self.commitment_protocol_id:
            raise gl.vm.UserError("already exists")
        if pid not in self.protocol_metadata:
            raise gl.vm.UserError("protocol not found")
        if dt <= 0:
            raise gl.vm.UserError("invalid deadline")
        self._rpo(pid)
        self.commitment_protocol_id[cid] = pid
        self.commitment_type[cid] = ct
        self.commitment_source_url[cid] = su
        self.commitment_text_hash[cid] = cth
        self.commitment_deadline_ts[cid] = bigint(dt)
        self.commitment_verification_rule[cid] = vr
        self.commitment_status[cid] = "registered"
        self.commitment_evidence_hash[cid] = ""
        self.commitment_grace_ends_ts[cid] = bigint(0)

    @gl.public.write
    def evaluate_commitment(self, commitment_id: str, result: str, evidence_hash: str, current_ts: int):
        cid = self._s(commitment_id)
        r = self._s(result)
        eh = self._s(evidence_hash)
        ct = self._i(current_ts)
        if cid not in self.commitment_protocol_id:
            raise gl.vm.UserError("not found")
        if r != "fulfilled" and r != "partial" and r != "missed":
            raise gl.vm.UserError("invalid result")
        self._rco(cid)
        self.commitment_evidence_hash[cid] = eh
        if r == "missed":
            self.commitment_status[cid] = "missed_grace"
            self.commitment_grace_ends_ts[cid] = bigint(ct + 604800)
        else:
            self.commitment_status[cid] = r
            self.commitment_grace_ends_ts[cid] = bigint(0)

    @gl.public.write
    def submit_commitment_fulfillment_evidence(self, commitment_id: str, evidence_hash: str):
        cid = self._s(commitment_id)
        eh = self._s(evidence_hash)
        if cid not in self.commitment_protocol_id:
            raise gl.vm.UserError("not found")
        if self.commitment_status[cid] != "missed_grace":
            raise gl.vm.UserError("not in grace window")
        self._rco(cid)
        self.commitment_evidence_hash[cid] = eh
        self.commitment_status[cid] = "fulfilled_grace"
        self.commitment_grace_ends_ts[cid] = bigint(0)

    @gl.public.write
    def finalize_commitment(self, commitment_id: str, current_ts: int):
        cid = self._s(commitment_id)
        ct = self._i(current_ts)
        if cid not in self.commitment_protocol_id:
            raise gl.vm.UserError("not found")
        if self.commitment_status[cid] != "missed_grace":
            raise gl.vm.UserError("not pending finalization")
        if bigint(ct) < self.commitment_grace_ends_ts[cid]:
            raise gl.vm.UserError("grace window open")
        self._ra()
        self.commitment_status[cid] = "missed_final"
        pid = self.commitment_protocol_id[cid]
        m = self.protocol_missed_commitments_count.get(pid, bigint(0)) + bigint(1)
        self.protocol_missed_commitments_count[pid] = m
        if m >= bigint(3):
            self.protocol_status[pid] = "coverage_suspended"
        elif m >= bigint(2):
            self.protocol_status[pid] = "probationary"

    @gl.public.view
    def get_incident_payload(self, incident_id: str) -> str:
        return self.incident_payload.get(self._s(incident_id), "")

    @gl.public.view
    def get_incident_status(self, incident_id: str) -> str:
        return self.incident_status.get(self._s(incident_id), "unknown")

    @gl.public.view
    def get_incident_decision(self, incident_id: str) -> str:
        return self.incident_decision.get(self._s(incident_id), "pending")

    @gl.public.view
    def get_incident_signal_verified(self, incident_id: str) -> bool:
        return self.incident_signal_verified.get(self._s(incident_id), False)

    @gl.public.view
    def get_incident_signal_note(self, incident_id: str) -> str:
        return self.incident_signal_note.get(self._s(incident_id), "")

    @gl.public.view
    def get_incident_protocol_id(self, incident_id: str) -> str:
        return self.incident_protocol_id.get(self._s(incident_id), "")

    @gl.public.view
    def get_incident_type(self, incident_id: str) -> str:
        return self.incident_type.get(self._s(incident_id), "")

    @gl.public.view
    def get_incident_challenge_ends_ts(self, incident_id: str) -> int:
        return int(self.incident_challenge_ends_ts.get(self._s(incident_id), bigint(0)))

    @gl.public.view
    def get_incident_total_amount(self, incident_id: str) -> int:
        return int(self.incident_total_amount.get(self._s(incident_id), bigint(0)))

    @gl.public.view
    def get_incident_paid_count(self, incident_id: str) -> int:
        return int(self.incident_paid_count.get(self._s(incident_id), bigint(0)))

    @gl.public.view
    def get_incident_recovery_pool(self, incident_id: str) -> int:
        return int(self.incident_recovery_pool.get(self._s(incident_id), bigint(0)))

    @gl.public.view
    def get_incident_recovery_distributed(self, incident_id: str) -> int:
        return int(self.incident_recovery_distributed.get(self._s(incident_id), bigint(0)))

    @gl.public.view
    def get_last_clean_block(self, incident_id: str) -> int:
        return int(self.incident_last_clean_block.get(self._s(incident_id), bigint(0)))

    @gl.public.view
    def get_trigger_sources(self, incident_id: str) -> str:
        return self.incident_trigger_sources.get(self._s(incident_id), "")

    @gl.public.view
    def get_hack_response_score_average(self, incident_id: str) -> int:
        iid = self._s(incident_id)
        if iid not in self.incident_payload:
            return 0
        t = self.incident_response_speed_score[iid] + self.incident_communication_quality_score[iid] + self.incident_pool_adequacy_score[iid] + self.incident_post_mortem_score[iid] + self.incident_recovery_effort_score[iid]
        return int(t // bigint(5))

    @gl.public.view
    def get_dispute_decision(self, incident_id: str, wallet: str) -> str:
        k = self._dk(self._s(incident_id), self._s(wallet))
        return self.incident_dispute_decision.get(k, "")

    @gl.public.view
    def get_wallet_compensation_balance(self, wallet: str) -> int:
        k = self._s(wallet).lower()
        return int(self.wallet_compensation_balance.get(k, bigint(0)))

    @gl.public.view
    def get_commitment_status(self, commitment_id: str) -> str:
        return self.commitment_status.get(self._s(commitment_id), "")

    @gl.public.view
    def get_commitment_protocol_id(self, commitment_id: str) -> str:
        return self.commitment_protocol_id.get(self._s(commitment_id), "")

    @gl.public.view
    def get_commitment_grace_ends_ts(self, commitment_id: str) -> int:
        return int(self.commitment_grace_ends_ts.get(self._s(commitment_id), bigint(0)))

    @gl.public.view
    def get_protocol_missed_commitments_count(self, protocol_id: str) -> int:
        return int(self.protocol_missed_commitments_count.get(self._s(protocol_id), bigint(0)))

    @gl.public.write
    def deposit(self, protocol_id: str, amount: int):
        pid = self._s(protocol_id)
        a = self._i(amount)
        if a <= 0:
            raise gl.vm.UserError("invalid amount")
        if pid not in self.protocol_metadata:
            raise gl.vm.UserError("not found")
        self._rpo(pid)
        cur = self.pool_balance.get(pid, bigint(0))
        self.pool_balance[pid] = cur + bigint(a)

    @gl.public.write
    def execute_compensation(self, incident_id: str, protocol_id: str, total_amount: int):
        iid = self._s(incident_id)
        pid = self._s(protocol_id)
        ta = self._i(total_amount)
        if ta <= 0:
            raise gl.vm.UserError("invalid amount")
        if iid in self.incident_enforced and self.incident_enforced[iid]:
            raise gl.vm.UserError("already enforced")
        self._ra()
        cur = self.pool_balance.get(pid, bigint(0))
        if cur < bigint(ta):
            raise gl.vm.UserError("insufficient balance")
        self.pool_balance[pid] = cur - bigint(ta)
        self.incident_enforced[iid] = True

    @gl.public.view
    def get_pool_balance(self, protocol_id: str) -> int:
        return int(self.pool_balance.get(self._s(protocol_id), bigint(0)))

    @gl.public.view
    def is_incident_enforced(self, incident_id: str) -> bool:
        return self.incident_enforced.get(self._s(incident_id), False)

    @gl.public.write
    def recompute_score(self, protocol_id: str, uptime_component: int, incident_component: int, response_component: int, pool_health_component: int):
        pid = self._s(protocol_id)
        u = self._i(uptime_component)
        ic = self._i(incident_component)
        r = self._i(response_component)
        ph = self._i(pool_health_component)
        if pid not in self.protocol_metadata:
            raise gl.vm.UserError("not found")
        self._ra()
        s = (u + ic + r + ph) // 4
        g = "C"
        if s >= 9000:
            g = "AAA"
        elif s >= 8000:
            g = "AA"
        elif s >= 7000:
            g = "A"
        elif s >= 6000:
            g = "B"
        self.protocol_score[pid] = bigint(s)
        self.protocol_grade[pid] = g

    @gl.public.view
    def get_score(self, protocol_id: str) -> int:
        return int(self.protocol_score.get(self._s(protocol_id), bigint(0)))

    @gl.public.view
    def get_grade(self, protocol_id: str) -> str:
        return self.protocol_grade.get(self._s(protocol_id), "N/A")
