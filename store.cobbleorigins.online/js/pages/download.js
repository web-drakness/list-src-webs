

window.DownloadPage = {
    init() {
        this.fetchData();
    },

    async fetchData() {
        try {
            const response = await fetch('/api/get_download_settings.php');
            const data = await response.json();

            if (data.success) {
                this.renderPage(data.links);
            }
        } catch (error) {
            console.error('Failed to load download settings:', error);
        }
    },

    formatSize(size) {
        if (!size) return '';
        
        const mb = parseFloat(size);
        if (!isNaN(mb) && isFinite(size)) {
            if (mb >= 1000) {
                return (mb / 1024).toFixed(2) + ' GB';
            }
            return mb + ' MB';
        }
        return size;
    },

    renderPage(links) {
        
        const clientLinks = links.filter(l => l.category_id == 1);
        const toolLinks = links.filter(l => l.category_id == 2);

        
        const clientList = document.getElementById('download-list-game-client');
        if (clientLinks.length > 0) {
            document.getElementById('download-category-1-wrapper').style.display = 'block';
            clientList.innerHTML = clientLinks.map(link => `
                <div class="download-list-item ${link.is_recommended ? 'recommended' : ''}">
                    <div class="d-list-icon">
                        <i class="${link.icon || 'fas fa-server'}"></i>
                    </div>
                    <div class="d-list-content">
                        <div class="d-list-title">
                            <h3>${link.title}</h3>
                            ${link.is_recommended ? '<span style="font-size:0.7rem; background:color-mix(in srgb, var(--nav-accent-color, #3b82f6), transparent 85%); color:var(--nav-accent-color, #3b82f6); padding:2px 8px; border-radius:6px; font-weight:600; margin-left:8px; border:1px solid color-mix(in srgb, var(--nav-accent-color, #3b82f6), transparent 70%);">แนะนำ</span>' : ''}
                        </div>
                        <p class="d-list-desc">${link.description || ''}</p>
                    </div>
                    <div class="d-list-action">
                        <div class="d-list-size">
                            <span class="size-val">${this.formatSize(link.size)}</span>
                            <span class="size-label">File Size</span>
                        </div>
                        <a href="${link.link}" target="_blank" class="btn-provider">
                            <i class="fas fa-cloud-download-alt"></i>
                        </a>
                    </div>
                </div>
            `).join('');
        }

        
        const toolGrid = document.getElementById('download-list-tools');
        if (toolLinks.length > 0) {
            document.getElementById('download-category-2-wrapper').style.display = 'block';
            toolGrid.innerHTML = toolLinks.map(link => `
                <div class="download-card ${link.is_recommended ? 'recommended' : ''}">
                    <div class="d-card-top">
                        <div class="d-card-icon">
                            <i class="${link.icon || 'fas fa-tools'}"></i>
                        </div>
                        <div class="d-card-title">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <h3>${link.title}</h3>
                                ${link.is_recommended ? '<span style="font-size:0.75rem; color:#94a3b8; font-weight:normal;">แนะนำ</span>' : ''}
                            </div>
                            <span>${this.formatSize(link.size)}</span>
                        </div>
                    </div>
                    <div class="d-card-body">
                        <p>${link.description || ''}</p>
                        <a href="${link.link}" target="_blank" class="btn-download-secondary">
                            <i class="fas fa-download"></i> ดาวน์โหลด
                        </a>
                    </div>
                </div>
            `).join('');
        }
    }
};
