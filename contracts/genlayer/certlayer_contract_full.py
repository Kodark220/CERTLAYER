# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
import json
from genlayer import *
class CertLayerContract(gl.Contract):
    ca:str
    pm:TreeMap[str,str]
    po:TreeMap[str,str]
    pca:TreeMap[str,str]
    ps:TreeMap[str,str]
    pc:bigint
    ip:TreeMap[str,str]
    ist:TreeMap[str,str]
    idc:TreeMap[str,str]
    isv:TreeMap[str,bool]
    isn:TreeMap[str,str]
    ipd:TreeMap[str,str]
    ity:TreeMap[str,str]
    its:TreeMap[str,bigint]
    ieh:TreeMap[str,str]
    ice:TreeMap[str,bigint]
    iqw:TreeMap[str,str]
    iqa:TreeMap[str,str]
    ita:TreeMap[str,bigint]
    ipc:TreeMap[str,bigint]
    idd:TreeMap[str,str]
    ide:TreeMap[str,str]
    irp:TreeMap[str,bigint]
    ird:TreeMap[str,bigint]
    ilc:TreeMap[str,bigint]
    itr:TreeMap[str,str]
    irs:TreeMap[str,bigint]
    icq:TreeMap[str,bigint]
    ipa:TreeMap[str,bigint]
    ipm:TreeMap[str,bigint]
    ire:TreeMap[str,bigint]
    cpd:TreeMap[str,str]
    cty:TreeMap[str,str]
    csu:TreeMap[str,str]
    cth:TreeMap[str,str]
    cdt:TreeMap[str,bigint]
    cvr:TreeMap[str,str]
    cst:TreeMap[str,str]
    ceh:TreeMap[str,str]
    cge:TreeMap[str,bigint]
    pmc:TreeMap[str,bigint]
    pb:TreeMap[str,bigint]
    ien:TreeMap[str,bool]
    wcb:TreeMap[str,bigint]
    psc:TreeMap[str,bigint]
    pgr:TreeMap[str,str]
    def __init__(self):
        self.ca=str(gl.message.sender_address).lower()
        self.pc=bigint(0)
    def _dk(self,i,w):return i+"|"+w.lower()
    def _sw(self):return str(gl.message.sender_address).lower()
    def _s(self,v):
        while isinstance(v,list) and len(v)==1:v=v[0]
        v=str(v) if not isinstance(v,str) else v
        if len(v)>=2 and v[0]=='"' and v[-1]=='"':v=v[1:-1]
        return v
    def _i(self,v):
        while isinstance(v,list) and len(v)==1:v=v[0]
        if isinstance(v,str):
            if len(v)>=2 and v[0]=='"' and v[-1]=='"':v=v[1:-1]
        return int(v)
    def _ra(self):
        if self._sw()!=self.ca:raise gl.vm.UserError("admin only")
    def _rpo(self,pid):
        ow=self.po.get(pid,"");sw=self._sw()
        if sw!=self.ca and sw!=ow:raise gl.vm.UserError("not authorized")
    def _rio(self,iid):
        if iid not in self.ipd:raise gl.vm.UserError("not found")
        self._rpo(self.ipd[iid])
    def _rco(self,cid):
        if cid not in self.cpd:raise gl.vm.UserError("not found")
        self._rpo(self.cpd[cid])
    def _epid(self,pj):
        while isinstance(pj,list) and len(pj)==1:pj=pj[0]
        if not isinstance(pj,str):pj=str(pj)
        try:
            p=json.loads(pj)
            while isinstance(p,str):p=json.loads(p)
        except Exception:raise gl.vm.UserError("bad json")
        if not isinstance(p,dict):raise gl.vm.UserError("bad json")
        pid=str(p.get("protocolId",""))
        if pid=="":raise gl.vm.UserError("no protocolId")
        return pid
    def _g(self,s):
        if s>=9000:return "AAA"
        if s>=8000:return "AA"
        if s>=7000:return "A"
        if s>=6000:return "B"
        return "C"
    @gl.public.write
    def register_protocol(self,protocol_id:str,metadata_json:str,owner_wallet:str,contract_address:str=""):
        pid=self._s(protocol_id);mj=self._s(metadata_json);ow=self._s(owner_wallet);ca=self._s(contract_address)
        if pid in self.pm:raise gl.vm.UserError("exists")
        sw=self._sw();no=ow.lower()
        if sw!=self.ca and sw!=no:raise gl.vm.UserError("not authorized")
        self.pm[pid]=mj;self.po[pid]=no;self.pca[pid]=ca;self.ps[pid]="active"
        self.pc=self.pc+bigint(1)
    @gl.public.write
    def set_protocol_status(self,protocol_id:str,new_status:str):
        pid=self._s(protocol_id);ns=self._s(new_status)
        if pid not in self.pm:raise gl.vm.UserError("not found")
        self._rpo(pid);self.ps[pid]=ns
    @gl.public.write
    def set_protocol_contract_address(self,protocol_id:str,contract_address:str):
        pid=self._s(protocol_id);ca=self._s(contract_address)
        if pid not in self.pm:raise gl.vm.UserError("not found")
        self._rpo(pid);self.pca[pid]=ca
    @gl.public.view
    def get_protocol_metadata(self,protocol_id:str)->str:return self.pm.get(self._s(protocol_id),"")
    @gl.public.view
    def get_protocol_owner_wallet(self,protocol_id:str)->str:return self.po.get(self._s(protocol_id),"")
    @gl.public.view
    def get_protocol_contract_address(self,protocol_id:str)->str:return self.pca.get(self._s(protocol_id),"")
    @gl.public.view
    def get_contract_admin(self)->str:return self.ca
    @gl.public.view
    def get_protocol_status(self,protocol_id:str)->str:return self.ps.get(self._s(protocol_id),"unknown")
    @gl.public.view
    def get_protocol_count(self)->int:return int(self.pc)
    @gl.public.write
    def submit_incident_candidate(self,incident_id:str,payload_json:str):
        iid=self._s(incident_id);pj=self._s(payload_json)
        if iid in self.ip:raise gl.vm.UserError("exists")
        pid=self._epid(payload_json)
        if pid not in self.pm:raise gl.vm.UserError("not found")
        self._rpo(pid)
        self.ip[iid]=pj;self.ist[iid]="candidate";self.idc[iid]="pending";self.ipd[iid]=pid
    @gl.public.write
    def submit_verification_decision(self,incident_id:str,decision:str,reason:str):
        iid=self._s(incident_id);d=self._s(decision);r=self._s(reason)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        if d!="breach_confirmed" and d!="breach_rejected":raise gl.vm.UserError("bad decision")
        self._ra();self.idc[iid]=d;self.ist[iid]="decided"
        self.ip[iid]=self.ip[iid]+" | reason="+r
    @gl.public.write
    def ai_verify_incident(self,incident_id:str,evidence_url:str):
        iid=self._s(incident_id);url=self._s(evidence_url)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        self._ra();p=self.ip[iid];pid=self.ipd[iid]
        pr="DeFi analyst: incident "+iid+" protocol "+pid+". Payload: "+p+". Genuine breach? Answer BREACH_CONFIRMED or BREACH_REJECTED"
        def _l():
            d=gl.nondet.web.get(url).body.decode("utf-8")
            r=gl.nondet.exec_prompt(pr+"\nEvidence:\n"+d[:2000]).strip().upper()
            return "breach_confirmed" if "BREACH_CONFIRMED" in r else "breach_rejected"
        def _v(lr):
            if not isinstance(lr,gl.vm.Return):return False
            return _l()==lr.calldata
        dec=gl.vm.run_nondet_unsafe(_l,_v);self.idc[iid]=str(dec);self.ist[iid]="decided"
        self.ip[iid]=p+"|ai="+url
    @gl.public.write
    def verify_external_signal(self,incident_id:str,source_url:str,must_contain:str):
        iid=self._s(incident_id);url=self._s(source_url);mc=self._s(must_contain)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        self._ra()
        def _l():
            d=gl.nondet.web.get(url).body.decode("utf-8")
            return mc.lower() in d.lower()
        def _v(lr):
            if not isinstance(lr,gl.vm.Return):return False
            return _l()==lr.calldata
        m=gl.vm.run_nondet_unsafe(_l,_v);self.isv[iid]=bool(m);self.isn[iid]=url
        if m:self.ist[iid]="signal_verified"
    @gl.public.write
    def create_incident(self,incident_id:str,protocol_id:str,start_ts:int,evidence_hash:str):
        iid=self._s(incident_id);pid=self._s(protocol_id);st=self._i(start_ts);eh=self._s(evidence_hash)
        if iid in self.ip:raise gl.vm.UserError("exists")
        if pid not in self.pm:raise gl.vm.UserError("not found")
        if st<=0:raise gl.vm.UserError("bad ts")
        self._rpo(pid)
        self.ip[iid]="{}";self.ist[iid]="candidate";self.idc[iid]="pending";self.ipd[iid]=pid
        self.ity[iid]="availability";self.its[iid]=bigint(st);self.ieh[iid]=eh
        self.iqw[iid]="";self.iqa[iid]="";self.ita[iid]=bigint(0);self.ipc[iid]=bigint(0)
        self.irp[iid]=bigint(0);self.ird[iid]=bigint(0);self.ilc[iid]=bigint(0);self.itr[iid]=""
        self.irs[iid]=bigint(0);self.icq[iid]=bigint(0);self.ipa[iid]=bigint(0)
        self.ipm[iid]=bigint(0);self.ire[iid]=bigint(0)
    @gl.public.write
    def create_security_incident(self,incident_id:str,protocol_id:str,start_ts:int,evidence_hash:str,last_clean_block:int,trigger_sources_csv:str):
        iid=self._s(incident_id);pid=self._s(protocol_id);st=self._i(start_ts);eh=self._s(evidence_hash)
        lcb=self._i(last_clean_block);tsc=self._s(trigger_sources_csv)
        self.create_incident(iid,pid,st,eh)
        self.ity[iid]="security";self.ilc[iid]=bigint(lcb);self.itr[iid]=tsc
    @gl.public.write
    def set_last_clean_block(self,incident_id:str,block_number:int):
        iid=self._s(incident_id);bn=self._i(block_number)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        if bn<0:raise gl.vm.UserError("bad block")
        self._rio(iid);self.ilc[iid]=bigint(bn)
    @gl.public.write
    def attach_loss_snapshot(self,incident_id:str,wallets_csv:str,losses_csv:str):
        self.attach_affected_users(self._s(incident_id),self._s(wallets_csv),self._s(losses_csv))
    @gl.public.write
    def attach_affected_users(self,incident_id:str,wallets_csv:str,amounts_csv:str):
        iid=self._s(incident_id);wc=self._s(wallets_csv);ac=self._s(amounts_csv)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        self._rio(iid);ws=wc.split(",");ams=ac.split(",")
        if len(ws)!=len(ams):raise gl.vm.UserError("mismatch")
        if len(ws)==0:raise gl.vm.UserError("empty")
        t=bigint(0)
        for x in range(len(ws)):
            w=ws[x].strip().lower()
            if w=="":raise gl.vm.UserError("bad wallet")
            a=int(ams[x].strip())
            if a<=0:raise gl.vm.UserError("bad amount")
            t=t+bigint(a)
        self.iqw[iid]=wc;self.iqa[iid]=ac;self.ita[iid]=t
    @gl.public.write
    def open_challenge_window(self,incident_id:str,challenge_ends_ts:int):
        iid=self._s(incident_id);ce=self._i(challenge_ends_ts)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        if ce<=0:raise gl.vm.UserError("bad ts")
        self._rio(iid);self.ice[iid]=bigint(ce);self.ist[iid]="challenge_open"
    @gl.public.write
    def raise_dispute(self,incident_id:str,wallet:str,evidence_hash:str):
        iid=self._s(incident_id);w=self._s(wallet);eh=self._s(evidence_hash)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        sw=self._sw()
        if sw!=self.ca and sw!=w.lower():raise gl.vm.UserError("not authorized")
        k=self._dk(iid,w);self.idd[k]="pending";self.ide[k]=eh
    @gl.public.write
    def resolve_dispute(self,incident_id:str,wallet:str,decision:str):
        iid=self._s(incident_id);w=self._s(wallet);d=self._s(decision)
        if d!="approved" and d!="rejected":raise gl.vm.UserError("bad decision")
        self._ra();k=self._dk(iid,w)
        if k not in self.idd:raise gl.vm.UserError("not found")
        self.idd[k]=d
    @gl.public.write
    def ai_resolve_dispute(self,incident_id:str,wallet:str,evidence_url:str):
        iid=self._s(incident_id);w=self._s(wallet);url=self._s(evidence_url)
        k=self._dk(iid,w)
        if k not in self.idd:raise gl.vm.UserError("not found")
        self._ra();p=self.ip[iid];deh=self.ide[k]
        pr="DeFi adjudicator: incident "+iid+" wallet "+w+". Payload: "+p+". Hash: "+deh+". Approve or reject? Answer APPROVED or REJECTED"
        def _l():
            d=gl.nondet.web.get(url).body.decode("utf-8")
            r=gl.nondet.exec_prompt(pr+"\nEvidence:\n"+d[:2000]).strip().upper()
            return "approved" if "APPROVED" in r else "rejected"
        def _v(lr):
            if not isinstance(lr,gl.vm.Return):return False
            return _l()==lr.calldata
        self.idd[k]=str(gl.vm.run_nondet_unsafe(_l,_v))
    @gl.public.write
    def finalize_incident(self,incident_id:str,current_ts:int):
        iid=self._s(incident_id);ct=self._i(current_ts)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        if iid not in self.ice:raise gl.vm.UserError("no challenge")
        if bigint(ct)<self.ice[iid]:raise gl.vm.UserError("challenge open")
        self._ra();self.ist[iid]="finalized"
    @gl.public.write
    def execute_payout_batch(self,incident_id:str,protocol_id:str,start_index:int,limit:int,current_ts:int):
        iid=self._s(incident_id);pid=self._s(protocol_id);si=self._i(start_index)
        lm=self._i(limit);ct=self._i(current_ts)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        if iid in self.ien and self.ien[iid]:raise gl.vm.UserError("enforced")
        if self.ist[iid]!="finalized":raise gl.vm.UserError("not finalized")
        if iid not in self.ipd or self.ipd[iid]!=pid:raise gl.vm.UserError("mismatch")
        if bigint(ct)<self.ice[iid]:raise gl.vm.UserError("challenge open")
        if si<0 or lm<=0:raise gl.vm.UserError("bad range")
        self._ra()
        wr=self.iqw[iid];ar=self.iqa[iid]
        ws=wr.split(",") if wr!="" else [];ams=ar.split(",") if ar!="" else []
        if len(ws)!=len(ams):raise gl.vm.UserError("corrupt")
        ei=si+lm
        if ei>len(ws):ei=len(ws)
        bt=bigint(0)
        for x in range(si,ei):
            w=ws[x].strip().lower();a=int(ams[x].strip());dk=self._dk(iid,w)
            if dk in self.idd and self.idd[dk]=="rejected":continue
            bt=bt+bigint(a)
        cp=self.pb.get(pid,bigint(0))
        if cp<bt:raise gl.vm.UserError("insufficient")
        self.pb[pid]=cp-bt
        for x in range(si,ei):
            w=ws[x].strip().lower();a=int(ams[x].strip());dk=self._dk(iid,w)
            if dk in self.idd and self.idd[dk]=="rejected":continue
            pv=self.wcb.get(w,bigint(0));self.wcb[w]=pv+bigint(a)
        self.ipc[iid]=bigint(ei)
        if ei>=len(ws):self.ien[iid]=True;self.ist[iid]="paid"
    @gl.public.write
    def record_recovery(self,incident_id:str,amount:int):
        iid=self._s(incident_id);a=self._i(amount)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        if a<=0:raise gl.vm.UserError("bad amount")
        self._ra();cur=self.irp.get(iid,bigint(0));self.irp[iid]=cur+bigint(a)
    @gl.public.write
    def distribute_recovery_batch(self,incident_id:str,start_index:int,limit:int):
        iid=self._s(incident_id);si=self._i(start_index);lm=self._i(limit)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        if si<0 or lm<=0:raise gl.vm.UserError("bad range")
        self._ra()
        wr=self.iqw[iid];lr=self.iqa[iid]
        ws=wr.split(",") if wr!="" else [];ls=lr.split(",") if lr!="" else []
        if len(ws)!=len(ls):raise gl.vm.UserError("corrupt")
        tl=self.ita[iid]
        if tl<=bigint(0):raise gl.vm.UserError("bad total")
        rp=self.irp[iid];dd=self.ird[iid];rem=rp-dd
        if rem<=bigint(0):raise gl.vm.UserError("no funds")
        ei=si+lm
        if ei>len(ws):ei=len(ws)
        ba=bigint(0)
        for x in range(si,ei):
            li=bigint(int(ls[x].strip()));sh=(rem*li)//tl;ba=ba+sh
        if ba>rem:ba=rem
        for x in range(si,ei):
            w=ws[x].strip().lower();li=bigint(int(ls[x].strip()));sh=(rem*li)//tl
            pv=self.wcb.get(w,bigint(0));self.wcb[w]=pv+sh
        self.ird[iid]=dd+ba
    @gl.public.write
    def set_hack_response_scores(self,incident_id:str,response_speed:int,communication_quality:int,pool_adequacy:int,post_mortem_quality:int,recovery_effort:int):
        iid=self._s(incident_id);rs=self._i(response_speed);cq=self._i(communication_quality)
        pa=self._i(pool_adequacy);pm=self._i(post_mortem_quality);re=self._i(recovery_effort)
        if iid not in self.ip:raise gl.vm.UserError("not found")
        self._ra()
        self.irs[iid]=bigint(rs);self.icq[iid]=bigint(cq);self.ipa[iid]=bigint(pa)
        self.ipm[iid]=bigint(pm);self.ire[iid]=bigint(re)
    @gl.public.write
    def register_commitment(self,commitment_id:str,protocol_id:str,commitment_type:str,source_url:str,commitment_text_hash:str,deadline_ts:int,verification_rule:str):
        cid=self._s(commitment_id);pid=self._s(protocol_id);ct=self._s(commitment_type)
        su=self._s(source_url);ch=self._s(commitment_text_hash)
        dt=self._i(deadline_ts);vr=self._s(verification_rule)
        if cid in self.cpd:raise gl.vm.UserError("exists")
        if pid not in self.pm:raise gl.vm.UserError("not found")
        if dt<=0:raise gl.vm.UserError("bad deadline")
        self._rpo(pid)
        self.cpd[cid]=pid;self.cty[cid]=ct;self.csu[cid]=su;self.cth[cid]=ch
        self.cdt[cid]=bigint(dt);self.cvr[cid]=vr;self.cst[cid]="registered"
        self.ceh[cid]="";self.cge[cid]=bigint(0)
    @gl.public.write
    def evaluate_commitment(self,commitment_id:str,result:str,evidence_hash:str,current_ts:int):
        cid=self._s(commitment_id);r=self._s(result);eh=self._s(evidence_hash);ct=self._i(current_ts)
        if cid not in self.cpd:raise gl.vm.UserError("not found")
        if r!="fulfilled" and r!="partial" and r!="missed":raise gl.vm.UserError("bad result")
        self._rco(cid);self.ceh[cid]=eh
        if r=="missed":
            self.cst[cid]="missed_grace";self.cge[cid]=bigint(ct+604800)
        else:
            self.cst[cid]=r;self.cge[cid]=bigint(0)
    @gl.public.write
    def ai_evaluate_commitment(self,commitment_id:str,current_ts:int):
        cid=self._s(commitment_id);ct=self._i(current_ts)
        if cid not in self.cpd:raise gl.vm.UserError("not found")
        self._rco(cid);su=self.csu[cid];vr=self.cvr[cid];pid=self.cpd[cid]
        pr="DeFi auditor: commitment "+cid+" protocol "+pid+". Rule: "+vr+". Fulfilled? Answer FULFILLED or PARTIAL or MISSED"
        def _l():
            d=gl.nondet.web.get(su).body.decode("utf-8")
            r=gl.nondet.exec_prompt(pr+"\nSource:\n"+d[:2000]).strip().upper()
            if "FULFILLED" in r and "PARTIAL" not in r:return "fulfilled"
            if "PARTIAL" in r:return "partial"
            return "missed"
        def _v(lr):
            if not isinstance(lr,gl.vm.Return):return False
            return _l()==lr.calldata
        rs=str(gl.vm.run_nondet_unsafe(_l,_v));self.ceh[cid]="ai_verified"
        if rs=="missed":
            self.cst[cid]="missed_grace";self.cge[cid]=bigint(ct+604800)
        else:
            self.cst[cid]=rs;self.cge[cid]=bigint(0)
    @gl.public.write
    def submit_commitment_fulfillment_evidence(self,commitment_id:str,evidence_hash:str):
        cid=self._s(commitment_id);eh=self._s(evidence_hash)
        if cid not in self.cpd:raise gl.vm.UserError("not found")
        if self.cst[cid]!="missed_grace":raise gl.vm.UserError("not in grace")
        self._rco(cid);self.ceh[cid]=eh;self.cst[cid]="fulfilled_grace";self.cge[cid]=bigint(0)
    @gl.public.write
    def finalize_commitment(self,commitment_id:str,current_ts:int):
        cid=self._s(commitment_id);ct=self._i(current_ts)
        if cid not in self.cpd:raise gl.vm.UserError("not found")
        if self.cst[cid]!="missed_grace":raise gl.vm.UserError("not pending")
        if bigint(ct)<self.cge[cid]:raise gl.vm.UserError("grace open")
        self._ra();self.cst[cid]="missed_final"
        pid=self.cpd[cid];m=self.pmc.get(pid,bigint(0))+bigint(1);self.pmc[pid]=m
        if m>=bigint(3):self.ps[pid]="coverage_suspended"
        elif m>=bigint(2):self.ps[pid]="probationary"
    @gl.public.view
    def get_incident_payload(self,incident_id:str)->str:return self.ip.get(self._s(incident_id),"")
    @gl.public.view
    def get_incident_status(self,incident_id:str)->str:return self.ist.get(self._s(incident_id),"unknown")
    @gl.public.view
    def get_incident_decision(self,incident_id:str)->str:return self.idc.get(self._s(incident_id),"pending")
    @gl.public.view
    def get_incident_signal_verified(self,incident_id:str)->bool:return self.isv.get(self._s(incident_id),False)
    @gl.public.view
    def get_incident_signal_note(self,incident_id:str)->str:return self.isn.get(self._s(incident_id),"")
    @gl.public.view
    def get_incident_protocol_id(self,incident_id:str)->str:return self.ipd.get(self._s(incident_id),"")
    @gl.public.view
    def get_incident_type(self,incident_id:str)->str:return self.ity.get(self._s(incident_id),"")
    @gl.public.view
    def get_incident_challenge_ends_ts(self,incident_id:str)->int:return int(self.ice.get(self._s(incident_id),bigint(0)))
    @gl.public.view
    def get_incident_total_amount(self,incident_id:str)->int:return int(self.ita.get(self._s(incident_id),bigint(0)))
    @gl.public.view
    def get_incident_paid_count(self,incident_id:str)->int:return int(self.ipc.get(self._s(incident_id),bigint(0)))
    @gl.public.view
    def get_incident_recovery_pool(self,incident_id:str)->int:return int(self.irp.get(self._s(incident_id),bigint(0)))
    @gl.public.view
    def get_incident_recovery_distributed(self,incident_id:str)->int:return int(self.ird.get(self._s(incident_id),bigint(0)))
    @gl.public.view
    def get_last_clean_block(self,incident_id:str)->int:return int(self.ilc.get(self._s(incident_id),bigint(0)))
    @gl.public.view
    def get_trigger_sources(self,incident_id:str)->str:return self.itr.get(self._s(incident_id),"")
    @gl.public.view
    def get_hack_response_score_average(self,incident_id:str)->int:
        iid=self._s(incident_id)
        if iid not in self.ip:return 0
        t=self.irs[iid]+self.icq[iid]+self.ipa[iid]+self.ipm[iid]+self.ire[iid]
        return int(t//bigint(5))
    @gl.public.view
    def get_dispute_decision(self,incident_id:str,wallet:str)->str:return self.idd.get(self._dk(self._s(incident_id),self._s(wallet)),"")
    @gl.public.view
    def get_wallet_compensation_balance(self,wallet:str)->int:return int(self.wcb.get(self._s(wallet).lower(),bigint(0)))
    @gl.public.view
    def get_commitment_status(self,commitment_id:str)->str:return self.cst.get(self._s(commitment_id),"")
    @gl.public.view
    def get_commitment_protocol_id(self,commitment_id:str)->str:return self.cpd.get(self._s(commitment_id),"")
    @gl.public.view
    def get_commitment_grace_ends_ts(self,commitment_id:str)->int:return int(self.cge.get(self._s(commitment_id),bigint(0)))
    @gl.public.view
    def get_protocol_missed_commitments_count(self,protocol_id:str)->int:return int(self.pmc.get(self._s(protocol_id),bigint(0)))
    @gl.public.write
    def deposit(self,protocol_id:str,amount:int):
        pid=self._s(protocol_id);a=self._i(amount)
        if a<=0:raise gl.vm.UserError("bad amount")
        if pid not in self.pm:raise gl.vm.UserError("not found")
        self._rpo(pid);cur=self.pb.get(pid,bigint(0));self.pb[pid]=cur+bigint(a)
    @gl.public.write
    def execute_compensation(self,incident_id:str,protocol_id:str,total_amount:int):
        iid=self._s(incident_id);pid=self._s(protocol_id);ta=self._i(total_amount)
        if ta<=0:raise gl.vm.UserError("bad amount")
        if iid in self.ien and self.ien[iid]:raise gl.vm.UserError("enforced")
        self._ra();cur=self.pb.get(pid,bigint(0))
        if cur<bigint(ta):raise gl.vm.UserError("insufficient")
        self.pb[pid]=cur-bigint(ta);self.ien[iid]=True
    @gl.public.view
    def get_pool_balance(self,protocol_id:str)->int:return int(self.pb.get(self._s(protocol_id),bigint(0)))
    @gl.public.view
    def is_incident_enforced(self,incident_id:str)->bool:return self.ien.get(self._s(incident_id),False)
    @gl.public.write
    def recompute_score(self,protocol_id:str,uptime_component:int,incident_component:int,response_component:int,pool_health_component:int):
        pid=self._s(protocol_id);u=self._i(uptime_component);ic=self._i(incident_component)
        r=self._i(response_component);ph=self._i(pool_health_component)
        if pid not in self.pm:raise gl.vm.UserError("not found")
        self._ra();s=(u+ic+r+ph)//4
        self.psc[pid]=bigint(s);self.pgr[pid]=self._g(s)
    @gl.public.write
    def ai_recompute_score(self,protocol_id:str,data_url:str):
        pid=self._s(protocol_id);url=self._s(data_url)
        if pid not in self.pm:raise gl.vm.UserError("not found")
        self._ra();md=self.pm[pid]
        pr="DeFi rater: protocol "+pid+". Metadata: "+md+". Score 0-10000 for uptime, response, transparency, pool health. Answer single integer"
        def _l():
            d=gl.nondet.web.get(url).body.decode("utf-8")
            r=gl.nondet.exec_prompt(pr+"\nData:\n"+d[:2000]).strip()
            n=""
            for c in r:
                if c.isdigit():n+=c
            if n=="":return "5000"
            v=int(n)
            if v>10000:v=10000
            if v<0:v=0
            return str(v)
        def _v(lr):
            if not isinstance(lr,gl.vm.Return):return False
            vr=_l()
            try:ls=int(lr.calldata);vs=int(vr)
            except Exception:return False
            return abs(ls-vs)<=500
        s=int(str(gl.vm.run_nondet_unsafe(_l,_v)));self.psc[pid]=bigint(s);self.pgr[pid]=self._g(s)
    @gl.public.view
    def get_score(self,protocol_id:str)->int:return int(self.psc.get(self._s(protocol_id),bigint(0)))
    @gl.public.view
    def get_grade(self,protocol_id:str)->str:return self.pgr.get(self._s(protocol_id),"N/A")
