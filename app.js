// Manufacturing Planner Pro - Additional JavaScript Functionality

// Session Management
class SessionManager {
    constructor() {
        this.timeout = 30 * 60 * 1000; // 30 minutes
        this.warningTime = 5 * 60 * 1000; // 5 minutes warning
        this.lastActivity = Date.now();
        this.warningShown = false;
        this.init();
    }

    init() {
        // Track user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, () => this.updateActivity(), true);
        });

        // Check session timeout every minute
        setInterval(() => this.checkTimeout(), 60000);
    }

    updateActivity() {
        this.lastActivity = Date.now();
        this.warningShown = false;
    }

    checkTimeout() {
        const now = Date.now();
        const timeSinceActivity = now - this.lastActivity;

        if (timeSinceActivity >= this.timeout) {
            this.logout();
        } else if (timeSinceActivity >= this.timeout - this.warningTime && !this.warningShown) {
            this.showWarning();
        }
    }

    showWarning() {
        this.warningShown = true;
        const remainingTime = Math.ceil((this.timeout - (Date.now() - this.lastActivity)) / 60000);
        
        if (confirm(`Your session will expire in ${remainingTime} minutes due to inactivity. Click OK to continue your session.`)) {
            this.updateActivity();
        }
    }

    logout() {
        localStorage.removeItem('currentUser');
        window.location.reload();
    }
}

// Data Change History Tracker
class ChangeHistoryTracker {
    constructor() {
        this.history = JSON.parse(localStorage.getItem('changeHistory') || '[]');
        this.maxEntries = 100;
    }

    logChange(type, details, user) {
        const entry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: type, // 'data_change', 'user_added', 'user_deleted', etc.
            details: details,
            user: user.username,
            userRole: user.role
        };

        this.history.unshift(entry);
        
        // Keep only the most recent entries
        if (this.history.length > this.maxEntries) {
            this.history = this.history.slice(0, this.maxEntries);
        }

        localStorage.setItem('changeHistory', JSON.stringify(this.history));
    }

    getHistory(limit = 20) {
        return this.history.slice(0, limit);
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('changeHistory');
    }
}

// Keyboard Shortcuts Manager
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = {
            'ctrl+s': () => this.saveData(),
            'ctrl+e': () => this.exportData(),
            'ctrl+i': () => this.importData(),
            'ctrl+n': () => this.addNewRow(),
            'ctrl+u': () => this.goToUsers(),
            'ctrl+d': () => this.goToDashboard(),
            'ctrl+h': () => this.showHelp(),
            'f1': () => this.showHelp(),
            'ctrl+p': () => this.printData(),
            'esc': () => this.closeModals()
        };
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    handleKeydown(e) {
        const key = this.getKeyString(e);
        
        if (this.shortcuts[key]) {
            e.preventDefault();
            this.shortcuts[key]();
        }
    }

    getKeyString(e) {
        let keys = [];
        
        if (e.ctrlKey) keys.push('ctrl');
        if (e.altKey) keys.push('alt');
        if (e.shiftKey) keys.push('shift');
        
        if (e.key === 'Escape') {
            keys.push('esc');
        } else if (e.key === 'F1') {
            keys.push('f1');
        } else {
            keys.push(e.key.toLowerCase());
        }
        
        return keys.join('+');
    }

    saveData() {
        const event = new CustomEvent('quickSave');
        document.dispatchEvent(event);
        this.showToast('Data saved', 'success');
    }

    exportData() {
        const event = new CustomEvent('quickExport');
        document.dispatchEvent(event);
    }

    importData() {
        const fileInput = document.querySelector('input[type="file"][accept=".csv"]');
        if (fileInput) {
            fileInput.click();
        }
    }

    addNewRow() {
        const event = new CustomEvent('quickAddRow');
        document.dispatchEvent(event);
    }

    goToUsers() {
        const event = new CustomEvent('navigateToUsers');
        document.dispatchEvent(event);
    }

    goToDashboard() {
        const event = new CustomEvent('navigateToDashboard');
        document.dispatchEvent(event);
    }

    printData() {
        window.print();
    }

    closeModals() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => {
            const event = new CustomEvent('closeModal');
            modal.dispatchEvent(event);
        });
    }

    showHelp() {
        const helpContent = `
Manufacturing Planner Pro - Keyboard Shortcuts:

Ctrl+S - Save data
Ctrl+E - Export data to CSV
Ctrl+I - Import data from CSV
Ctrl+N - Add new equipment row
Ctrl+U - Go to User Management (Super Admin only)
Ctrl+D - Go to Dashboard
Ctrl+P - Print current view
F1 or Ctrl+H - Show this help
Esc - Close modals/dialogs

Navigation Tips:
- Use Tab to navigate between form fields
- Use Enter to submit forms
- Use Space to activate buttons
- Click on table cells to edit (if permitted)
        `;
        
        alert(helpContent);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 2000);
    }
}

// Data Validation Utilities
class DataValidator {
    static validateNumericInput(value, min = 0, max = Infinity) {
        const num = parseFloat(value);
        if (isNaN(num)) return { valid: false, error: 'Must be a valid number' };
        if (num < min) return { valid: false, error: `Must be at least ${min}` };
        if (num > max) return { valid: false, error: `Must not exceed ${max}` };
        return { valid: true, value: num };
    }

    static validateUsername(username) {
        if (!username || username.length < 3) {
            return { valid: false, error: 'Username must be at least 3 characters' };
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
        }
        return { valid: true };
    }

    static validatePassword(password) {
        if (password.length < 8) {
            return { valid: false, error: 'Password must be at least 8 characters' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, error: 'Password must contain at least one uppercase letter' };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, error: 'Password must contain at least one lowercase letter' };
        }
        if (!/\d/.test(password)) {
            return { valid: false, error: 'Password must contain at least one number' };
        }
        if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password)) {
            return { valid: false, error: 'Password must contain at least one special character' };
        }
        return { valid: true };
    }

    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes
            .trim();
    }
}

// Auto-save Indicator
class AutoSaveIndicator {
    constructor() {
        this.indicator = this.createIndicator();
        this.lastSaved = null;
        this.isDirty = false;
    }

    createIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.innerHTML = `
            <span class="autosave-status">All changes saved</span>
            <span class="autosave-time"></span>
        `;
        document.body.appendChild(indicator);
        return indicator;
    }

    markDirty() {
        this.isDirty = true;
        this.updateDisplay('Unsaved changes...', 'warning');
    }

    markSaved() {
        this.isDirty = false;
        this.lastSaved = new Date();
        this.updateDisplay('All changes saved', 'success');
        this.updateTime();
    }

    updateDisplay(message, type) {
        const status = this.indicator.querySelector('.autosave-status');
        status.textContent = message;
        this.indicator.className = `autosave-indicator autosave-indicator--${type}`;
    }

    updateTime() {
        if (this.lastSaved) {
            const timeSpan = this.indicator.querySelector('.autosave-time');
            timeSpan.textContent = `Last saved: ${this.lastSaved.toLocaleTimeString()}`;
        }
    }
}

// Print Utilities
class PrintManager {
    static printTable(tableSelector = '.data-table') {
        const table = document.querySelector(tableSelector);
        if (!table) return;

        const printWindow = window.open('', '_blank');
        const tableHTML = table.outerHTML;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Manufacturing Schedule - ${new Date().toLocaleDateString()}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                    th { background-color: #f0f0f0; font-weight: bold; }
                    .equipment-column { background-color: #f9f9f9; font-weight: bold; }
                    @media print {
                        body { margin: 0; }
                        table { font-size: 10px; }
                        th, td { padding: 4px; }
                    }
                </style>
            </head>
            <body>
                <h1>Manufacturing Schedule</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                ${tableHTML}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
            printWindow.onafterprint = () => printWindow.close();
        };
    }

    static printDashboard() {
        window.print();
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            saveOperations: 0,
            errors: 0
        };
        this.init();
    }

    init() {
        // Track page load time
        window.addEventListener('load', () => {
            this.metrics.loadTime = performance.now();
        });

        // Track errors
        window.addEventListener('error', () => {
            this.metrics.errors++;
        });
    }

    startTimer(name) {
        this[`${name}Start`] = performance.now();
    }

    endTimer(name) {
        if (this[`${name}Start`]) {
            this.metrics[name] = performance.now() - this[`${name}Start`];
            delete this[`${name}Start`];
        }
    }

    getMetrics() {
        return { ...this.metrics };
    }
}

// Initialize all managers when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers
    window.sessionManager = new SessionManager();
    window.changeTracker = new ChangeHistoryTracker();
    window.keyboardShortcuts = new KeyboardShortcuts();
    window.autoSaveIndicator = new AutoSaveIndicator();
    window.performanceMonitor = new PerformanceMonitor();

    // Add auto-save indicator styles
    const style = document.createElement('style');
    style.textContent = `
        .autosave-indicator {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-base);
            padding: var(--space-8) var(--space-12);
            font-size: var(--font-size-xs);
            box-shadow: var(--shadow-sm);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
            min-width: 150px;
        }

        .autosave-indicator--success {
            border-color: var(--color-success);
        }

        .autosave-indicator--warning {
            border-color: var(--color-warning);
        }

        .autosave-status {
            font-weight: var(--font-weight-medium);
        }

        .autosave-indicator--success .autosave-status {
            color: var(--color-success);
        }

        .autosave-indicator--warning .autosave-status {
            color: var(--color-warning);
        }

        .autosave-time {
            color: var(--color-text-secondary);
            font-size: var(--font-size-xs);
        }
    `;
    document.head.appendChild(style);

    // Listen for custom events
    document.addEventListener('quickSave', () => {
        const data = JSON.parse(localStorage.getItem('manufacturingData') || '[]');
        localStorage.setItem('manufacturingData', JSON.stringify(data));
        window.autoSaveIndicator?.markSaved();
    });

    document.addEventListener('quickExport', () => {
        const data = JSON.parse(localStorage.getItem('manufacturingData') || '[]');
        if (data.length > 0 && window.Papa) {
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `manufacturing_data_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    });

    // Track data changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        if (key === 'manufacturingData') {
            window.autoSaveIndicator?.markDirty();
            setTimeout(() => window.autoSaveIndicator?.markSaved(), 1000);
        }
        return originalSetItem.apply(this, arguments);
    };

    // Add keyboard shortcut help button
    const helpButton = document.createElement('button');
    helpButton.textContent = '?';
    helpButton.title = 'Keyboard Shortcuts (F1)';
    helpButton.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: var(--color-primary);
        color: var(--color-btn-primary-text);
        border: none;
        cursor: pointer;
        font-weight: bold;
        box-shadow: var(--shadow-sm);
        z-index: 1000;
    `;
    helpButton.addEventListener('click', () => {
        window.keyboardShortcuts?.showHelp();
    });
    document.body.appendChild(helpButton);

    console.log('Manufacturing Planner Pro - Additional functionality loaded');
    console.log('Available keyboard shortcuts: Ctrl+S, Ctrl+E, Ctrl+I, Ctrl+N, Ctrl+U, Ctrl+D, Ctrl+H, F1, Esc');
});

// Export utilities for use in React components
window.ManufacturingUtils = {
    DataValidator,
    PrintManager,
    showToast: (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    },
    generateId: () => Date.now() + Math.random().toString(36).substr(2, 9),
    formatDate: (date) => new Date(date).toLocaleDateString(),
    formatTime: (date) => new Date(date).toLocaleTimeString(),
    formatDateTime: (date) => new Date(date).toLocaleString(),
    exportToCSV: (data, filename) => {
        if (window.Papa) {
            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || `export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    }
};