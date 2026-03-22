
window.TopupBank = {
    selectedSlip: null,
    promptpayNumber: '',

    init() {
        this.fetchConfig();
    },

    async fetchConfig() {
        try {
            const res = await fetch('/backend/api/topup/bank_config.php');
            const data = await res.json();
            if (data.success) {
                
                if (parseInt(data.status) === 0) {
                    Toast.error('ขออภัย', 'ระบบเติมเงินผ่านธนาคารปิดปรับปรุงชั่วคราว');
                    setTimeout(() => navigate('topup'), 1500);
                    return;
                }

                
                const elPoint = document.getElementById('bank-rate-point');
                const elRp = document.getElementById('bank-rate-rp');
                if (elPoint) elPoint.innerText = data.rate_point || '1.0';
                if (elRp) elRp.innerText = data.rate_rp || '1.0';

                
                const promoBanner = document.getElementById('promo-banner');
                if (promoBanner && data.promotion && data.promotion.name) {
                    document.getElementById('promo-name').innerText = data.promotion.name;
                    document.getElementById('promo-period').innerText = 'ระยะเวลา: ' + (data.promotion.period || '-');
                    promoBanner.style.display = 'flex';
                } else if (promoBanner) {
                    promoBanner.style.display = 'none';
                }

                
                const elAccLabel = document.getElementById('bank-info-label');
                const elAccTitle = document.getElementById('bank-info-title');
                const elAccLogo = document.getElementById('bank-acc-logo');
                const elAccIcon = document.getElementById('bank-info-icon');

                const bankType = parseInt(data.bank_type || 1);
                const modeBank = document.getElementById('mode-bank-acc');
                const modePromptPay = document.getElementById('mode-promptpay');
                const elStep1 = document.getElementById('bank-step-1');

                const uploadSection = document.getElementById('bank-upload-section');
                const ctaContainer = document.getElementById('bank-cta-container');
                const howTo = document.getElementById('bank-how-to-steps');

                this.bankType = bankType;

                if (bankType === 2) {
                    
                    if (modeBank) modeBank.style.display = 'none';
                    if (ctaContainer) ctaContainer.style.display = 'none';
                    if (howTo) howTo.style.display = 'none';
                    if (uploadSection) {
                        uploadSection.style.display = 'none';
                        const label = uploadSection.querySelector('.bank-form-label');
                        if (label) label.style.display = 'none';
                    }

                    
                    if (elAccLogo) elAccLogo.style.display = 'none';
                    if (elAccIcon) elAccIcon.style.display = 'flex';
                    if (elAccTitle) elAccTitle.innerText = 'ชำระเงินผ่าน QR Code';
                    if (elAccLabel) elAccLabel.innerText = 'ระบบเติมเงินอัตโนมัติ 24 ชม.';

                    if (modePromptPay) {
                        modePromptPay.style.display = 'block';
                        this.setupAmountListeners();
                        this.goToStep(1);
                    }

                    const elPpName = document.getElementById('pp-qr-name-display');
                    if (elPpName) elPpName.innerText = 'ชื่อบัญชี: ' + data.bank_acc_name;

                    this.promptpayNumber = data.promptpay_number;
                } else {
                    
                    if (modeBank) modeBank.style.display = 'flex';
                    if (modePromptPay) modePromptPay.style.display = 'none';
                    if (ctaContainer) ctaContainer.style.display = 'block';
                    if (howTo) howTo.style.display = 'block';

                    if (uploadSection) {
                        const accInfo = document.getElementById('bank-account-info');
                        if (accInfo) accInfo.appendChild(uploadSection);
                        uploadSection.style.display = 'block';
                        const label = uploadSection.querySelector('.bank-form-label');
                        if (label) label.style.display = 'block';
                    }

                    if (elStep1) elStep1.innerText = 'คัดลอกเลขบัญชีข้างบน และโอนเงินจำนวนที่ต้องการ';

                    const elAccNo = document.getElementById('bank-acc-no-display');
                    if (elAccNo) {
                        const raw = data.bank_acc_no.replace(/[^0-9]/g, '');
                        if (raw.length >= 10) {
                            elAccNo.innerText = `${raw.substring(0, 3)}-${raw.substring(3, 4)}-${raw.substring(4, 9)}-${raw.substring(9)}`;
                        } else {
                            elAccNo.innerText = data.bank_acc_no;
                        }
                    }

                    
                    if (elAccLogo) {
                        elAccLogo.style.display = 'block';
                        elAccLogo.src = `/assets/img/logobank/${data.bank_code}.png`;
                        elAccLogo.onerror = () => elAccLogo.src = '/assets/img/logobank/kbank.png';
                    }
                    if (elAccIcon) elAccIcon.style.display = 'none';
                    if (elAccTitle) elAccTitle.innerText = data.bank_acc_name;
                    if (elAccLabel) elAccLabel.innerText = 'โอนเงินไปยังบัญชี';

                    window.currentBankAccNo = data.bank_acc_no.replace(/[^0-9]/g, '');
                }
            }
        } catch (e) { console.error('Bank Config Error', e); }
    },

    goToStep(step) {
        if (step === 2) {
            const input = document.getElementById('pp-amount-input');
            const amount = parseFloat(input?.value || 0);
            if (amount < 1) {
                Toast.error('ข้อผิดพลาด', 'กรุณาระบุจำนวนเงินอย่างน้อย 1 บาท');
                return;
            }
            this.generateQRWithAmount(amount);
        }

        
        document.querySelectorAll('.pp-step-content').forEach(el => el.classList.remove('active'));
        const targetStep = document.getElementById(`pp-step-${step}`);
        if (targetStep) targetStep.classList.add('active');

        
        const uploadSection = document.getElementById('bank-upload-section');
        const sharedContainer = document.getElementById('shared-upload-container');

        if (uploadSection) {
            if (step === 3) {
                if (sharedContainer) sharedContainer.appendChild(uploadSection);
                uploadSection.style.display = 'block';
            } else if (this.bankType === 2) {
                uploadSection.style.display = 'none';
            }
        }

        this.updateStepUI(step);
    },

    updateStepUI(currentStep) {
        document.querySelectorAll('.step-dot').forEach(dot => {
            const stepNum = parseInt(dot.getAttribute('data-step'));
            dot.classList.remove('active', 'completed');
            if (stepNum === currentStep) dot.classList.add('active');
            else if (stepNum < currentStep) dot.classList.add('completed');
        });

        document.querySelectorAll('.step-line').forEach((line, index) => {
            line.classList.remove('completed');
            if (index < currentStep - 1) line.classList.add('completed');
        });
    },

    setupAmountListeners() {
        const input = document.getElementById('pp-amount-input');
        if (!input) return;
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.goToStep(2);
        });
    },

    generateQRWithAmount(amount) {
        const payload = this.generatePromptPayPayload(this.promptpayNumber, amount);
        const qrImg = document.getElementById('promptpay-qr-image');
        if (qrImg) {
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(payload)}&size=300x300&margin=0&ecc=H`;
        }
        const elAmt = document.getElementById('pp-qr-amount-val');
        if (elAmt) elAmt.innerText = amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
    },

    generatePromptPayPayload(number, amount = null) {
        let target = number.replace(/[^0-9]/g, '');
        let type = target.length === 10 ? '01' : (target.length === 13 ? '02' : '03');
        let ppId = target;
        if (type === '01') ppId = '0066' + target.substring(1);

        const f = (id, val) => id + (val.length.toString().padStart(2, '0')) + val;
        let parts = [
            f('00', '01'),
            f('01', amount ? '12' : '11'),
            f('29', f('00', 'A000000677010111') + f(type, ppId)),
            f('53', '764'),
            f('58', 'TH')
        ];
        if (amount) parts.push(f('54', parseFloat(amount).toFixed(2)));

        let payload = parts.join('');
        const crc16 = (data) => {
            let crc = 0xFFFF;
            for (let i = 0; i < data.length; i++) {
                let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF;
                x ^= x >> 4;
                crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
            }
            return crc.toString(16).toUpperCase().padStart(4, '0');
        };
        payload += '6304';
        payload += crc16(payload);
        return payload;
    },

    handleUpload(e) {
        const file = e.target.files[0];
        if (file) this.processFile(file);
    },

    processFile(file) {
        this.selectedSlip = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('slip-preview');
            if (preview) {
                preview.src = e.target.result;
                document.getElementById('slip-preview-container').style.display = 'block';
                document.getElementById('slip-upload-placeholder').style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    },

    async extractPayloadFromImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);
                    resolve(code ? code.data : null);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    async submit() {
        if (!this.selectedSlip) return Toast.error('ข้อผิดพลาด', 'กรุณาอัปโหลดสลิป');

        const btn = document.getElementById('btn-submit-slip') || document.getElementById('btn-submit-slip-bank');
        if (btn) btn.disabled = true;

        try {
            
            const extractedPayload = await this.extractPayloadFromImage(this.selectedSlip);
            if (extractedPayload) console.log('Extracted QR Payload:', extractedPayload);

            const reader = new FileReader();
            reader.readAsDataURL(this.selectedSlip);
            reader.onload = async () => {
                const base64 = reader.result;
                const res = await fetch('/backend/api/topup/bank_verify.php', {
                    method: 'POST',
                    body: JSON.stringify({
                        slip_image: base64,
                        payload: extractedPayload 
                    })
                });
                const data = await res.json();
                if (data.success) {
                    Toast.success('สำเร็จ', data.message);
                    this.selectedSlip = null;
                    if (preview = document.getElementById('slip-preview')) preview.src = '';
                    if (cont = document.getElementById('slip-preview-container')) cont.style.display = 'none';
                    if (placeholder = document.getElementById('slip-upload-placeholder')) placeholder.style.display = 'flex';

                    if (data.updated_balance && typeof window.updateUserBalance === 'function') {
                        window.updateUserBalance(data.updated_balance);
                    }
                    setTimeout(() => navigate('topup'), 2000);
                } else {
                    Toast.error('ไม่สำเร็จ', data.message);
                }
                if (btn) btn.disabled = false;
            };
        } catch (e) {
            if (btn) btn.disabled = false;
        }
    }
};

window.handleSlipUpload = (e) => window.TopupBank.handleUpload(e);
window.handleSlipDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) window.TopupBank.processFile(file);
};
window.submitBankSlip = () => window.TopupBank.submit();
window.copyBankAccountNo = () => {
    if (window.currentBankAccNo) {
        navigator.clipboard.writeText(window.currentBankAccNo).then(() => {
            Toast.success('คัดลอกสำเร็จ', 'คัดลอกเลขบัญชีเรียบร้อยแล้ว');
        });
    }
};

if (document.getElementById('bank-how-to-steps')) {
    window.TopupBank.init();
}
