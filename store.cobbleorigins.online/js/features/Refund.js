
window.Refund = {
    data: null,
    offset: 0, 
    intervals: { countdown: null, deadline: null },

    
    parseDate(dateStr) {
        if (!dateStr) return null;
        try {
            const parts = dateStr.split(/[- :]/);
            if (parts.length >= 6) {
                return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]).getTime();
            }
            return new Date(dateStr).getTime();
        } catch (e) { return null; }
    },

    async checkVisibility() {
        try {
            const btn = document.getElementById('nav-refund-btn');
            if (!btn) return;

            const res = await fetch('/backend/api/refund.php?action=check');
            const data = await res.json();

            if (data.status === 'success' && data.has_refund) {
                btn.classList.remove('d-none');
                btn.style.display = 'block'; 
            } else {
                btn.classList.add('d-none');
                btn.style.display = 'none';
            }
        } catch (e) {
            
        }
    },

    openModal() {
        const modal = document.getElementById('refund-modal');
        if (modal) {
            modal.classList.add('active');
            this.showLoading();
            this.loadData();
        }
    },

    closeModal() {
        const modal = document.getElementById('refund-modal');
        if (modal) modal.classList.remove('active');
        this.clearTimers();
    },

    async loadData() {
        const Toast = window.Toast || { success: () => { }, error: console.error };
        try {
            const res = await fetch('/backend/api/refund.php?action=check');
            const data = await res.json();

            if (data.status === 'success') {
                this.data = data;

                
                if (data.server_time) {
                    const serverTime = this.parseDate(data.server_time);
                    const clientTime = new Date().getTime();
                    this.offset = serverTime - clientTime;
                } else {
                    this.offset = 0;
                }

                this.render(data);
            } else {
                Toast.error('Error', data.message || 'ไม่สามารถโหลดข้อมูลได้');
            }
        } catch (e) {
            Toast.error('Error', 'Connection Failed');
        }
    },

    async claim() {
        const Toast = window.Toast || { success: () => { }, error: console.error };
        const btn = document.getElementById('btn-claim-cycle') || document.getElementById('btn-claim-onetime') || document.getElementById('btn-claim-refund');
        if (btn) btn.disabled = true;

        try {
            const res = await fetch('/backend/api/refund.php', { method: 'POST', body: JSON.stringify({ action: 'claim' }) });
            const data = await res.json();

            if (data.status === 'success') {
                this.closeModal();

                
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'success',
                        title: 'สำเร็จ!',
                        text: `ได้รับคืน ${Number(data.amount).toLocaleString()} ${data.currency || 'POINT'}`,
                        confirmButtonText: 'ตกลง',
                        background: '#1e293b',
                        color: '#fff',
                        confirmButtonColor: '#3b82f6'
                    });
                } else {
                    Toast.success('สำเร็จ', `ได้รับคืน +${data.amount} ${data.currency || 'POINT'}`);
                }

                
                if (window.Auth && window.Auth.check) window.Auth.check();
                
                this.checkVisibility();
            } else {
                Toast.error('ล้มเหลว', data.message);
                if (btn) btn.disabled = false;
            }
        } catch (e) {
            if (btn) btn.disabled = false;
            Toast.error('Error', 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
        }
    },

    render(data) {
        
        const loading = document.getElementById('refund-loading');
        if (loading) {
            loading.classList.add('d-none');
            loading.style.display = 'none';
        }

        const content = document.getElementById('refund-content');
        const empty = document.getElementById('refund-empty');
        const layoutOnetime = document.getElementById('rf-layout-onetime');
        const layoutCycle = document.getElementById('rf-layout-cycle');
        const layoutExpired = document.getElementById('rf-layout-expired');
        const footerInfo = content ? content.querySelector('.rf-footer-info') : null;
        const btnCycle = document.getElementById('btn-claim-cycle');

        
        if (content) content.classList.remove('rf-expired-mode');

        if (!data.has_refund) {
            if (content) content.classList.add('d-none');
            if (empty) {
                empty.classList.remove('d-none');
                empty.style.display = 'block';
            }
            return;
        }

        if (content) {
            content.classList.remove('d-none');
            content.style.display = 'block';
        }
        if (empty) empty.classList.add('d-none');

        const d = data.data;
        const isOnetime = (d.refund_type === 'instant' || d.refund_type === 'onetime');

        
        let forceWaiting = false;
        if (d.is_expired && !isOnetime && d.next_refund_date) {
            forceWaiting = true;
        }

        
        if (d.is_expired && !forceWaiting) {
            if (layoutOnetime) layoutOnetime.classList.add('d-none');
            if (layoutCycle) layoutCycle.classList.add('d-none');

            if (layoutExpired) {
                layoutExpired.classList.remove('d-none');
                layoutExpired.style.display = 'block';
                const expAmount = document.getElementById('rf-expired-amount');
                if (expAmount) expAmount.textContent = Number(d.amount_to_receive || 0).toLocaleString();
            }

            if (footerInfo) footerInfo.classList.add('d-none');
            if (btnCycle) btnCycle.classList.add('d-none');

            return; 
        }

        
        if (layoutExpired) layoutExpired.classList.add('d-none');
        if (footerInfo) {
            footerInfo.classList.remove('d-none');
            footerInfo.style.display = 'block';
        }
        if (btnCycle) {
            btnCycle.classList.remove('d-none');
            btnCycle.style.display = 'block';
        }

        
        if (layoutOnetime) layoutOnetime.classList.add('d-none');
        if (layoutCycle) layoutCycle.classList.add('d-none');

        if (isOnetime) {
            
            if (layoutOnetime) {
                layoutOnetime.classList.remove('d-none');
                layoutOnetime.style.display = 'block';

                
                if (footerInfo) {
                    footerInfo.classList.add('d-none');
                    footerInfo.style.display = 'none';
                }

                if (btnCycle) btnCycle.classList.add('d-none'); 

                const amountEl = document.getElementById('rf-onetime-amount');
                if (amountEl) amountEl.textContent = Number(d.amount_to_receive || 0).toLocaleString();

                const btnOne = document.getElementById('btn-claim-onetime');
                const btnOneWaiting = document.getElementById('btn-onetime-waiting');
                const readyBox = document.getElementById('rf-onetime-ready-box');
                const countdownBox = document.getElementById('rf-onetime-countdown-box');

                if (d.can_claim) {
                    
                    if (readyBox) {
                        readyBox.classList.remove('d-none');
                        readyBox.style.display = 'block';
                    }
                    if (countdownBox) {
                        countdownBox.classList.add('d-none');
                        countdownBox.style.display = 'none';
                    }
                    if (btnOneWaiting) {
                        btnOneWaiting.style.display = 'none';
                    }
                    if (btnOne) {
                        btnOne.style.display = 'block';
                        btnOne.onclick = () => this.claim();
                    }
                    if (d.deadline_date) {
                        this.startDeadlineTimer(d.deadline_date, 'rf-onetime-deadline-timer');
                    }
                } else {
                    
                    if (readyBox) {
                        readyBox.classList.add('d-none');
                        readyBox.style.display = 'none';
                    }
                    if (countdownBox) {
                        countdownBox.classList.remove('d-none');
                        countdownBox.style.display = 'block';
                    }
                    if (btnOne) btnOne.style.display = 'none';
                    if (btnOneWaiting) {
                        btnOneWaiting.style.display = 'block';
                    }

                    const targetDate = d.start_date || d.next_refund_date || d.can_claim_at;
                    if (targetDate) {
                        this.startCountdown(targetDate, 'rf-onetime-countdown-box');
                    }
                }
            }

        } else {
            
            if (layoutCycle) {
                layoutCycle.classList.remove('d-none');
                layoutCycle.style.display = 'block';

                const amountEl = document.getElementById('refund-amount');
                if (amountEl) amountEl.textContent = Number(d.amount_to_receive || 0).toLocaleString();

                const unitEl = document.querySelector('.refund-unit');
                if (unitEl) unitEl.textContent = d.currency_type || 'POINT';

                
                const labelEl = layoutCycle.querySelector('.rf-amount-label');
                if (labelEl) {
                    let text = "ยอดเงินที่จะได้รับคืนรอบนี้";
                    
                    if (d.round_info) {
                        text += d.round_info;
                    }
                    labelEl.textContent = text;
                }

                if (!forceWaiting && d.can_claim) {
                    this.unlockClaimButton(d.deadline_date);
                } else {
                    this.showState('waiting');
                    const targetDate = d.next_refund_date || d.can_claim_at;
                    if (targetDate) {
                        this.startCountdown(targetDate, 'rf-countdown-box');
                    }
                }
            }
        }

        
        const remainingEl = document.getElementById('refund-remaining');
        if (remainingEl) {
            const totalRemaining = d.remaining_points || 0;
            const currentRound = d.amount_to_receive || 0;
            const futureRemaining = totalRemaining - currentRound;
            remainingEl.textContent = Number(Math.max(0, futureRemaining)).toLocaleString();
        }
    },

    

    unlockClaimButton(deadlineStr) {
        this.clearTimers();
        const countdownBox = document.getElementById('rf-countdown-box');
        const readyBox = document.getElementById('rf-ready-box');

        if (countdownBox) {
            countdownBox.classList.add('d-none');
            countdownBox.style.display = 'none';
        }
        if (readyBox) {
            readyBox.classList.remove('d-none');
            readyBox.style.display = 'block';
        }

        if (deadlineStr) {
            this.startDeadlineTimer(deadlineStr);
        } else {
            const deadlineEl = document.getElementById('rf-deadline-timer');
            if (deadlineEl && deadlineEl.parentElement) deadlineEl.parentElement.style.display = 'none';
        }

        const btn = document.getElementById('btn-claim-cycle');
        if (btn) {
            btn.classList.remove('d-none');
            btn.style.display = 'block';
            btn.disabled = false;
            btn.classList.remove('disabled', 'btn-secondary', 'btn-danger');
            btn.classList.add('btn-primary');

            btn.style.background = '';
            btn.style.border = '';
            btn.style.color = '';
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.innerHTML = '<i class="fas fa-hand-holding-usd mr-2"></i> กดรับเงินคืน';
            btn.onclick = () => window.claimRefund();
        }
    },

    showState(state) {
        const btn = document.getElementById('btn-claim-cycle');
        const countdownBox = document.getElementById('rf-countdown-box');
        const readyBox = document.getElementById('rf-ready-box');

        if (state === 'waiting') {
            if (countdownBox) {
                countdownBox.classList.remove('d-none');
                countdownBox.style.display = 'block';
            }
            if (readyBox) {
                readyBox.classList.add('d-none');
                readyBox.style.display = 'none';
            }

            if (btn) {
                btn.classList.remove('d-none');
                btn.style.display = 'block';
                btn.disabled = true;
                btn.classList.add('disabled');
                btn.classList.remove('btn-primary', 'btn-danger', 'btn-secondary');

                btn.style.background = '#334155';
                btn.style.border = '1px solid rgba(255,255,255,0.1)';
                btn.style.color = '#cbd5e1';
                btn.style.opacity = '1';
                btn.style.cursor = 'not-allowed';

                btn.innerHTML = '<i class="far fa-clock mr-2"></i> ยังไม่ถึงเวลา';
            }
        }
    },

    startCountdown(targetDateStr, containerId) {
        this.clearTimers();
        const container = document.getElementById(containerId);
        if (!container) return;

        const timerEls = container.querySelectorAll('.rf-timer-item .rf-time-val');
        if (!timerEls || timerEls.length < 4) return;

        const targetTimestamp = this.parseDate(targetDateStr);
        if (!targetTimestamp) return;

        const updateTimer = () => {
            const now = new Date().getTime() + this.offset;
            const diff = targetTimestamp - now;

            if (diff <= 0) {
                this.loadData();
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            timerEls[0].textContent = String(days).padStart(2, '0');
            timerEls[1].textContent = String(hours).padStart(2, '0');
            timerEls[2].textContent = String(minutes).padStart(2, '0');
            timerEls[3].textContent = String(seconds).padStart(2, '0');
        };

        updateTimer();
        this.intervals.countdown = setInterval(updateTimer, 1000);
    },

    startDeadlineTimer(targetDateStr, elementId = 'rf-deadline-timer') {
        const timerEl = document.getElementById(elementId);
        if (!timerEl) return;

        const target = this.parseDate(targetDateStr);
        if (!target) return;

        const update = () => {
            const now = new Date().getTime() + this.offset;
            const diff = target - now;

            if (diff <= 0) {
                timerEl.textContent = "หมดเวลา";
                clearInterval(this.intervals.deadline);
                this.loadData();
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            let text = "";
            if (days > 0) text += `${days}วัน `;
            text += `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            timerEl.textContent = text;
        };

        update();
        if (this.intervals.deadline) clearInterval(this.intervals.deadline);
        this.intervals.deadline = setInterval(update, 1000);
    },

    showLoading() {
        if (document.getElementById('refund-loading')) document.getElementById('refund-loading').style.display = 'block';
        if (document.getElementById('refund-content')) document.getElementById('refund-content').style.display = 'none';
        if (document.getElementById('refund-empty')) document.getElementById('refund-empty').style.display = 'none';
    },

    clearTimers() {
        if (this.intervals.countdown) clearInterval(this.intervals.countdown);
        if (this.intervals.deadline) clearInterval(this.intervals.deadline);
        this.intervals.countdown = null;
        this.intervals.deadline = null;
    }
};

window.openRefundModal = () => window.Refund.openModal();
window.closeRefundModal = () => window.Refund.closeModal();
window.claimRefund = () => window.Refund.claim();
window.checkRefundButtonVisibility = () => window.Refund.checkVisibility();

document.addEventListener('DOMContentLoaded', () => {
    window.Refund.checkVisibility();
});
