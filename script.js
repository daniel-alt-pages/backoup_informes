// ... existing code ... -->
    tokenModalSubmitBtn: document.getElementById('token-modal-submit-btn'),
    tokenModalStatus: document.getElementById('token-modal-status'),
    githubTokenInput: document.getElementById('github-token'),

    // (NUEVO) Show/Hide Password
    togglePasswordBtn: document.getElementById('toggle-password'),
    eyeIcon: document.getElementById('eye-icon'),
    eyeOffIcon: document.getElementById('eye-off-icon'),

    // (NUEVO) Student Stats (Mejora 2)
    growthChartFilters: document.getElementById('growth-chart-filters')
};

// --- Inicialización ---
// ... existing code ... -->
    elements.tokenModal?.addEventListener('click', (e) => {
        if (e.target === elements.tokenModal) {
            closeModal(elements.tokenModal);
        }
    });

    // (NUEVO) Listener para mostrar/ocultar contraseña
    if (elements.togglePasswordBtn) {
        elements.togglePasswordBtn.addEventListener('click', () => {
            const isPassword = elements.passwordInput.type === 'password';
            elements.passwordInput.type = isPassword ? 'text' : 'password';
            elements.eyeIcon.classList.toggle('hidden', isPassword);
            elements.eyeOffIcon.classList.toggle('hidden', !isPassword);
        });
    }
    // ======================================================
    // FIN: MEJORA 3 - Listener de Formulario CRUD
// ... existing code ... -->
    // Validar contraseña (Fecha de Nacimiento)
    // if (studentData && studentData['Número de Documento']?.trim() === password) { // (BUG ANTIGUO)
    if (studentData && studentData['Fecha de Nacimiento']?.trim() === password) { // (CORREGIDO)
        CURRENT_STUDENT_DATA = studentData;
        CURRENT_STUDENT_REPORTS = SCORES_DB.filter(score => score.doc_number === studentData['Número de Documento']?.trim()); // Usar el doc_number para buscar puntajes
        showSection('student-dashboard-section');
// ... existing code ... -->
