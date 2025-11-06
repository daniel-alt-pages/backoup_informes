// --- Variables Globales y Configuración (v5) ---
const SUPER_USER_CREDENTIALS = { username: "admin", password: "20/7/2023" };
const BASE_DATA_URL = `https://raw.githubusercontent.com/daniel-alt-pages/backoup_informes/main/`;
const TIMESTAMP = Date.now(); // Cache-busting

// Rutas a los archivos de la arquitectura
const URLS = {
    studentDatabase: `${BASE_DATA_URL}database/student_database.csv?t=${TIMESTAMP}`,
    scoresDatabase: `${BASE_DATA_URL}database/scores_database.csv?t=${TIMESTAMP}`,
    testIndex: `${BASE_DATA_URL}database/test_index.json?t=${TIMESTAMP}`
};

// Almacenes de datos
let STUDENT_DB = {};           // Objeto, { doc_number: { ...datos } }
let SCORES_DB = [];            // Array, [ { ...puntajes } ]
let TEST_INDEX = {};           // Objeto, { test_id: { ...info } }
let ALL_STUDENTS_ARRAY = [];   // (Admin) Array, [ { ...datos } ]
let CURRENT_STUDENT_REPORTS = []; // (Estudiante) Array de informes del estudiante logueado
let CURRENT_STUDENT_DATA = null; // (Estudiante) Objeto con datos del estudiante logueado
let CACHED_TEST_DATA = {};     // Almacén para claves y respuestas de pruebas

// Estado de la UI
let currentAdminPage = 1;
const ADMIN_ROWS_PER_PAGE = 10;
let currentAdminSort = { column: 'Nombre Completo del Estudiante', direction: 'asc' };
let isAdminViewingReport = false; // Flag para el botón "Volver"

// Configuración del CRUD (API de GitHub)
const GITHUB_API_CONFIG = {
    owner: "daniel-alt-pages",
    repo: "backoup_informes",
    branch: "main",
    studentDbPath: "database/student_database.csv"
};
// (NUEVO v5) Caché de cambios del CRUD
let crudCache = {
    studentDb: null // Almacenará el contenido de student_database.csv
};


// --- 1. INICIALIZACIÓN DE LA APLICACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Flatpickr (Selector de Fecha de Nacimiento)
    flatpickr("#password", {
        locale: "es",
        dateFormat: "d/m/Y",
        allowInput: true, // Permite escribir la fecha
    });
    
    // Asignar listeners de eventos
    setupEventListeners();

    // Iniciar la carga de datos
    loadAllData();
});

/**
 * Carga todos los datos esenciales de la plataforma (CSV y JSON).
 * Esta es la función principal de arranque.
 * (CORREGIDO v5.1: Se eliminó la función 'showLoading' y se
 * inlinó la lógica aquí para evitar errores de 'null' en la carga.)
 */
async function loadAllData() {
    const loadingMessage = document.getElementById('loading-message');
    const loadingError = document.getElementById('loading-error');
    const loadingScreen = document.getElementById('loading-section');
    const loginScreen = document.getElementById('login-section');

    // Asegurarse de que los elementos de carga existen
    if (!loadingMessage || !loadingError || !loadingScreen || !loginScreen) {
        console.error("Error fatal: No se encontraron los elementos de la pantalla de carga en el HTML.");
        alert("Error fatal. No se pudo cargar la aplicación. Faltan elementos de carga.");
        return;
    }

    try {
        // 1. Cargar el índice de pruebas (JSON)
        loadingMessage.textContent = 'Cargando índice de pruebas...';
        const indexResponse = await fetch(URLS.testIndex);
        if (!indexResponse.ok) throw new Error(`No se pudo cargar test_index.json: ${indexResponse.statusText}`);
        TEST_INDEX = await indexResponse.json();

        // 2. Cargar la base de datos de puntajes (CSV)
        loadingMessage.textContent = 'Cargando historial de puntajes...';
        const scoresData = await fetchAndParseCSV(URLS.scoresDatabase);
        // Limpiar datos: asegurar que los puntajes sean números
        SCORES_DB = scoresData.map(score => ({
            ...score,
            global_score: parseInt(score.global_score, 10) || 0,
            mat_score: parseInt(score.mat_score, 10) || 0,
            lec_score: parseInt(score.lec_score, 10) || 0,
            soc_score: parseInt(score.soc_score, 10) || 0,
            cie_score: parseInt(score.cie_score, 10) || 0,
            ing_score: parseInt(score.ing_score, 10) || 0,
        })).filter(score => score.doc_number); // Filtrar filas vacías

        // 3. Cargar la base de datos de estudiantes (CSV)
        loadingMessage.textContent = 'Cargando base de datos de estudiantes...';
        const studentData = await fetchAndParseCSV(URLS.studentDatabase);
        
        // Convertir el array de estudiantes en un objeto (mapa) para búsqueda rápida O(1)
        STUDENT_DB = {};
        ALL_STUDENTS_ARRAY = []; // Poblar también el array para el admin
        studentData.forEach(student => {
            const docNumber = student['Número de Documento'];
            if (docNumber) {
                STUDENT_DB[docNumber] = student;
                ALL_STUDENTS_ARRAY.push(student);
            }
        });

        // 4. Éxito: Ocultar carga y mostrar login
        loadingScreen.style.display = 'none';
        loginScreen.style.display = 'block';

    } catch (error) {
        console.error('Error fatal durante la carga de datos:', error);
        loadingMessage.textContent = 'Error al cargar datos.';
        loadingError.textContent = `${error.message}. Revisa la consola y recarga la página.`;
        loadingError.style.display = 'block';
    }
}


// --- 2. MANEJO DE EVENTOS (LISTENERS) ---

/**
 * Configura todos los listeners de eventos principales de la aplicación.
 * (CORREGIDO v5.1: Se usa '?' (encadenamiento opcional) en todos los 
 * listeners para evitar errores si el elemento no existe en la vista actual)
 */
function setupEventListeners() {
    // Elementos de la UI
    const elements = {
        loginForm: document.getElementById('login-form'),
        togglePasswordBtn: document.getElementById('toggle-password'),
        studentLogoutBtn: document.getElementById('student-logout-btn'),
        adminLogoutBtn: document.getElementById('admin-logout-btn'),
        viewGrowthChartBtn: document.getElementById('view-growth-chart-btn'),
        closeGrowthChartBtn: document.getElementById('close-growth-chart-btn'),
        growthChartFilters: document.getElementById('growth-chart-filters'),
        reportsGrid: document.getElementById('reports-grid'),
        backToDashboardBtn: document.getElementById('back-to-dashboard-btn'),
        adminSearchInput: document.getElementById('admin-search-input'),
        adminTableHead: document.querySelector('#admin-dashboard thead'),
        adminTableBody: document.getElementById('admin-table-body'),
        adminPagination: document.getElementById('admin-pagination'),
        adminModalBackdrop: document.getElementById('admin-modal-backdrop'),
        adminModalCloseBtn: document.getElementById('admin-modal-close-btn'),
        adminModalBody: document.getElementById('admin-modal-body'),
        adminTabs: document.getElementById('admin-tabs'),
        crudTabs: document.getElementById('crud-tabs'),
        statsAnalyzeBtn: document.getElementById('stats-analyze-btn'),
        statsSortBy: document.getElementById('stats-sort-by'),
        statsFilterBy: document.getElementById('stats-filter-by'),
        addStudentForm: document.getElementById('add-student-form'),
        githubTokenModal: document.getElementById('github-token-modal'),
        closeTokenModalBtn: document.getElementById('close-token-modal-btn'),
        cancelTokenBtn: document.getElementById('cancel-token-btn'),
        confirmTokenBtn: document.getElementById('confirm-token-btn'),
    };

    // Formulario de Login
    elements.loginForm?.addEventListener('submit', handleLogin);

    // Botón de ver/ocultar contraseña
    elements.togglePasswordBtn?.addEventListener('click', togglePasswordVisibility);

    // Botones de Logout
    elements.studentLogoutBtn?.addEventListener('click', handleLogout);
    elements.adminLogoutBtn?.addEventListener('click', handleLogout);

    // Botón "Volver al Dashboard" (en informe)
    elements.backToDashboardBtn?.addEventListener('click', () => {
        // Devuelve al dashboard correcto (estudiante o admin)
        if (isAdminViewingReport) {
            showAdminDashboard(false); // No recargar datos, solo mostrar
        } else {
            showStudentDashboard(false); // No recargar datos, solo mostrar
        }
    });

    // --- Eventos del Estudiante ---
    elements.viewGrowthChartBtn?.addEventListener('click', () => {
        renderGrowthChart(CURRENT_STUDENT_REPORTS, 'all'); // Renderizar gráfico
        openModal(document.getElementById('growth-chart-modal'));
    });
    elements.closeGrowthChartBtn?.addEventListener('click', () => {
        closeModal(document.getElementById('growth-chart-modal'));
    });
    elements.growthChartFilters?.addEventListener('click', handleGrowthChartFilter);
    elements.reportsGrid?.addEventListener('click', handleReportCardClick);

    // --- Eventos del Administrador ---
    elements.adminSearchInput?.addEventListener('input', (e) => {
        currentAdminPage = 1; // Resetear a página 1 al buscar
        renderAdminTable(e.target.value);
    });
    elements.adminTableHead?.addEventListener('click', handleAdminTableSort);
    elements.adminPagination?.addEventListener('click', handleAdminPagination);
    elements.adminModalCloseBtn?.addEventListener('click', () => {
        closeModal(elements.adminModalBackdrop);
    });
    elements.adminTabs?.addEventListener('click', handleAdminTabSwitch);
    elements.crudTabs?.addEventListener('click', handleCrudTabSwitch);

    // Click en "Ver" (historial) en la tabla de Admin
    elements.adminTableBody?.addEventListener('click', (e) => {
        const viewButton = e.target.closest('.view-report-btn');
        if (viewButton) {
            const studentId = viewButton.dataset.studentId;
            showAdminStudentHistory(studentId);
        }
    });

    // Click en una tarjeta de informe DENTRO del modal de admin
    elements.adminModalBody?.addEventListener('click', handleAdminModalCardClick);

    // Análisis Estadístico (Admin)
    elements.statsAnalyzeBtn?.addEventListener('click', handleStatsAnalysis);
    
    // (CORREGIDO) Añadir '?' para evitar errores si los elementos no existen
    elements.statsSortBy?.addEventListener('change', (e) => {
        // Re-renderizar las tarjetas con el nuevo orden
        if (CACHED_TEST_DATA.currentStats) {
             renderStatsCards(CACHED_TEST_DATA.currentStats, e.target.value);
        }
    });
    elements.statsFilterBy?.addEventListener('change', (e) => {
        // Filtrar las tarjetas visibles
        filterStatsCards(e.target.value);
    });
    
    // CRUD (Admin)
    elements.addStudentForm?.addEventListener('submit', handleAddStudentSubmit);
    
    // Listeners del Modal de Token
    elements.closeTokenModalBtn?.addEventListener('click', () => closeModal(elements.githubTokenModal));
    elements.cancelTokenBtn?.addEventListener('click', () => closeModal(elements.githubTokenModal));
    elements.confirmTokenBtn?.addEventListener('click', handleConfirmGithubToken);
}


// --- 3. LÓGICA DE AUTENTICACIÓN Y NAVEGACIÓN ---

/**
 * Maneja el envío del formulario de login.
 * Valida credenciales de admin o estudiante.
 */
function handleLogin(e) {
    e.preventDefault();
    const docType = document.getElementById('doc-type').value;
    const docNumber = document.getElementById('doc-number').value.trim();
    // (CORREGIDO v5) La contraseña es la fecha de nacimiento (password)
    const password = document.getElementById('password').value.trim(); // DD/MM/YYYY
    const loginError = document.getElementById('login-error');

    // Flujo de Admin
    if (docNumber === SUPER_USER_CREDENTIALS.username && password === SUPER_USER_CREDENTIALS.password) {
        loginError.style.display = 'none';
        showAdminDashboard(true); // Cargar datos y mostrar
        return;
    }

    // Flujo de Estudiante
    const studentData = STUDENT_DB[docNumber];

    // (CORREGIDO v5) Validar Tipo de Documento Y Fecha de Nacimiento
    if (studentData && 
        studentData['Tipo de Documento'] === docType && 
        studentData['Fecha de Nacimiento'] === password) {
        
        loginError.style.display = 'none';
        CURRENT_STUDENT_DATA = studentData;
        // Filtrar los puntajes solo para este estudiante
        CURRENT_STUDENT_REPORTS = SCORES_DB.filter(score => score.doc_number === docNumber);
        
        showStudentDashboard(true); // Mostrar dashboard
        return;
    }

    // Error
    loginError.style.display = 'block';
}

/**
 * Cierra sesión y resetea la aplicación al estado de login.
 */
function handleLogout() {
    // Limpiar datos de sesión
    CURRENT_STUDENT_DATA = null;
    CURRENT_STUDENT_REPORTS = [];
    CACHED_TEST_DATA = {};
    isAdminViewingReport = false;
    
    // Limpiar campos de login
    document.getElementById('doc-number').value = '';
    document.getElementById('password').value = '';
    document.getElementById('login-error').style.display = 'none';

    // Ocultar todas las secciones y mostrar solo el login
    document.getElementById('student-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('report-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

/**
 * Muestra/Oculta la contraseña en el campo de login.
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
    } else {
        passwordInput.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
    }
}

/**
 * Cambia la visibilidad de las secciones principales.
 * @param {string} sectionToShow - ID de la sección a mostrar ('login-section', 'student-dashboard', etc.)
 */
function showSection(sectionToShow) {
    const sections = ['login-section', 'loading-section', 'student-dashboard', 'admin-dashboard', 'report-section'];
    sections.forEach(sectionId => {
        const el = document.getElementById(sectionId);
        if (el) {
            el.style.display = (sectionId === sectionToShow) ? 'block' : 'none';
        }
    });
}

/**
 * Abre un modal (backdrop + container).
 * @param {HTMLElement} modalBackdrop - El elemento de fondo del modal.
 */
function openModal(modalBackdrop) {
    if (!modalBackdrop) return;
    // (NUEVO v5) Corrección de bug: Forzar al body a no moverse
    document.body.style.overflow = 'hidden';
    modalBackdrop.classList.remove('hidden');
}

/**
 * Cierra un modal.
 * @param {HTMLElement} modalBackdrop - El elemento de fondo del modal.
 */
function closeModal(modalBackdrop) {
    if (!modalBackdrop) return;
    document.body.style.overflow = ''; // Devolver scroll al body
    modalBackdrop.classList.add('hidden');
}


// --- 4. DASHBOARD DEL ESTUDIANTE ---

/**
 * Muestra el dashboard del estudiante y pobla sus informes.
 * @param {boolean} shouldShow - Si es true, muestra la sección.
 */
function showStudentDashboard(shouldShow = true) {
    if (shouldShow) {
        showSection('student-dashboard');
    }

    // Poblar nombre
    const studentName = CURRENT_STUDENT_DATA['Nombre Completo del Estudiante'];
    document.getElementById('student-name-header').textContent = `Hola, ${studentName.split(' ')[0]}`;

    // Poblar tarjetas de informes
    const reportsGrid = document.getElementById('reports-grid');
    reportsGrid.innerHTML = ''; // Limpiar

    if (CURRENT_STUDENT_REPORTS.length === 0) {
        reportsGrid.innerHTML = '<p class="text-gray-500 col-span-full">No tienes informes disponibles todavía.</p>';
        return;
    }
    
    // Ordenar informes por fecha (más reciente primero)
    const sortedReports = [...CURRENT_STUDENT_REPORTS].sort((a, b) => {
        // Manejar fechas inválidas o nulas
        const dateA = new Date(a.test_date);
        const dateB = new Date(b.test_date);
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
    });

    sortedReports.forEach(report => {
        const testInfo = TEST_INDEX[report.test_id];
        if (!testInfo) return; // Si la prueba no existe en el índice, omitirla

        const isSimulacro = testInfo.type === 'simulacro';
        const badgeColor = isSimulacro ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
        const badgeText = isSimulacro ? 'Simulacro' : 'Minisimulacro';
        
        const cardHTML = `
            <div class="report-card" data-testid="${report.test_id}">
                <div class="report-card-header">
                    <div>
                        <h3 class="report-card-title">${testInfo.name}</h3>
                        <p class="report-card-date text-sm text-gray-500">Realizado: ${new Date(report.test_date).toLocaleDateString('es-CO')}</p>
                    </div>
                    <span class="report-card-badge ${badgeColor}">${badgeText}</span>
                </div>
                <div class="report-card-body">
                    <div class="report-card-score">
                        <span class="text-lg font-medium text-brand-text">Puntaje Global</span>
                        <span class="global-score">${report.global_score}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div class="bg-brand-secondary h-2 rounded-full" style="width: ${report.global_score / 5}%"></div>
                    </div>
                </div>
            </div>
        `;
        reportsGrid.innerHTML += cardHTML;
    });
}

/**
 * Maneja el clic en una tarjeta de informe del estudiante.
 * @param {Event} e - El evento de clic.
 */
function handleReportCardClick(e) {
    const card = e.target.closest('.report-card');
    if (card && card.dataset.testid) {
        const testId = card.dataset.testid;
        showIndividualReport(testId);
    }
}

/**
 * Maneja el filtro del gráfico de progreso del estudiante.
 * @param {Event} e - El evento de clic.
 */
function handleGrowthChartFilter(e) {
    if (e.target.classList.contains('chart-filter-btn')) {
        // Actualizar estilo de botones
        document.querySelectorAll('#growth-chart-filters .chart-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');

        // Obtener filtro y re-renderizar el gráfico
        const filterType = e.target.dataset.filter; // 'all', 'simulacro', 'minisimulacro'
        renderGrowthChart(CURRENT_STUDENT_REPORTS, filterType);
    }
}

/**
 * Renderiza la gráfica de crecimiento del estudiante (Mejora 2).
 * @param {Array} studentReports - Array de reportes del estudiante (de SCORES_DB).
 * @param {string} filterType - 'all', 'simulacro', o 'minisimulacro'.
 */
function renderGrowthChart(studentReports, filterType = 'all') {
    const ctx = document.getElementById('growthChart')?.getContext('2d');
    if (!ctx) return;

    // 1. Filtrar Datos
    const filteredReports = studentReports
        .filter(report => {
            const testType = TEST_INDEX[report.test_id]?.type;
            if (filterType === 'all') {
                return true;
            }
            return testType === filterType;
        })
        .sort((a, b) => new Date(a.test_date) - new Date(b.test_date)); // Orden cronológico

    // 2. Preparar Datos para Chart.js
    const chartData = filteredReports.map(report => ({
        x: new Date(report.test_date).getTime(), // Usar timestamp para el eje X
        y: report.global_score
    }));
    
    const chartLabels = filteredReports.map(report => TEST_INDEX[report.test_id]?.name || 'Prueba');

    // 3. Destruir gráfico anterior
    if (window.myGrowthChart instanceof Chart) {
        window.myGrowthChart.destroy();
    }

    // 4. Renderizar nuevo gráfico
    window.myGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels, // Usar nombres como etiquetas
            datasets: [{
                label: 'Puntaje Global (0-500)',
                data: chartData,
                borderColor: 'var(--brand-secondary)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.1,
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: 'var(--brand-secondary)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    // Usar 'category' para mostrar las etiquetas (nombres de prueba)
                    type: 'category', 
                    title: {
                        display: true,
                        text: 'Pruebas Realizadas (en orden cronológico)'
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 500,
                    title: {
                        display: true,
                        text: 'Puntaje Global'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (tooltipItems) => {
                            // Mostrar el nombre de la prueba en el tooltip
                            return tooltipItems[0].label;
                        },
                        label: (tooltipItem) => {
                            // Mostrar puntaje y fecha
                            const report = filteredReports[tooltipItem.dataIndex];
                            const date = new Date(report.test_date).toLocaleDateString('es-CO');
                            return `Puntaje: ${report.global_score} (Fecha: ${date})`;
                        }
                    }
                }
            }
        }
    });
}


// --- 5. DASHBOARD DEL ADMINISTRADOR ---

/**
 * Muestra el dashboard del administrador y calcula métricas globales.
 * @param {boolean} shouldShow - Si es true, muestra la sección.
 */
function showAdminDashboard(shouldShow = true) {
    if (shouldShow) {
        showSection('admin-dashboard');
    }

    // (NUEVO v5) Calcular y mostrar KPIs
    const totalStudents = ALL_STUDENTS_ARRAY.length;
    const totalTests = Object.keys(TEST_INDEX).length;
    
    const simulacroScores = SCORES_DB
        .filter(score => TEST_INDEX[score.test_id]?.type === 'simulacro')
        .map(score => score.global_score);
    const miniScores = SCORES_DB
        .filter(score => TEST_INDEX[score.test_id]?.type === 'minisimulacro')
        .map(score => score.global_score);

    const avgSimulacro = simulacroScores.length ? (simulacroScores.reduce((a, b) => a + b, 0) / simulacroScores.length).toFixed(0) : 'N/A';
    const avgMini = miniScores.length ? (miniScores.reduce((a, b) => a + b, 0) / miniScores.length).toFixed(0) : 'N/A';

    document.getElementById('kpi-total-students').textContent = totalStudents;
    document.getElementById('kpi-total-tests').textContent = totalTests;
    document.getElementById('kpi-avg-simulacro').textContent = avgSimulacro;
    document.getElementById('kpi-avg-mini').textContent = avgMini;


    // Poblar pestañas de Admin (NUEVO v5)
    const adminTabsContainer = document.getElementById('admin-tabs');
    adminTabsContainer.innerHTML = ''; // Limpiar
    const adminTabs = [
        { id: 'students', name: 'Gestión de Estudiantes' },
        { id: 'stats', name: 'Análisis Estadístico' },
        { id: 'crud', name: 'Gestión de Contenido (CRUD)' },
    ];
    adminTabs.forEach((tab, index) => {
        const isActive = index === 0;
        adminTabsContainer.innerHTML += `
            <button class="admin-tab-btn ${isActive ? 'active' : ''}" data-target="tab-panel-${tab.id}">
                ${tab.name}
            </button>
        `;
        // Ocultar todos los paneles (JS se encargará de mostrar el activo)
        const panel = document.getElementById(`tab-panel-${tab.id}`);
        if(panel) panel.style.display = isActive ? 'block' : 'none';
    });

    // Poblar selector de pruebas (Análisis Estadístico)
    const statsTestSelect = document.getElementById('stats-test-select');
    statsTestSelect.innerHTML = '<option value="">Seleccione una prueba</option>';
    for (const testId in TEST_INDEX) {
        statsTestSelect.innerHTML += `<option value="${testId}">${TEST_INDEX[testId].name}</option>`;
    }

    // Renderizar tabla de estudiantes (Pestaña 1)
    renderAdminTable();
}

/**
 * Maneja el cambio de pestañas en el panel de admin.
 * @param {Event} e - El evento de clic.
 */
function handleAdminTabSwitch(e) {
    const tabButton = e.target.closest('.admin-tab-btn');
    if (!tabButton) return;

    // Quitar 'active' de todas las pestañas
    document.querySelectorAll('#admin-tabs .admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    // Añadir 'active' a la pestaña clicada
    tabButton.classList.add('active');

    // Ocultar todos los paneles
    document.querySelectorAll('.admin-tab-panel').forEach(panel => {
        panel.style.display = 'none';
    });
    // Mostrar el panel objetivo
    const targetPanelId = tabButton.dataset.target;
    document.getElementById(targetPanelId).style.display = 'block';
}

/**
 * Maneja el cambio de sub-pestañas en el panel de CRUD.
 * @param {Event} e - El evento de clic.
 */
function handleCrudTabSwitch(e) {
    const tabButton = e.target.closest('.crud-tab-btn');
    if (!tabButton) return;

    document.querySelectorAll('#crud-tabs .crud-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    tabButton.classList.add('active');

    document.querySelectorAll('.crud-tab-panel').forEach(panel => {
        panel.style.display = 'none';
    });
    const targetPanelId = tabButton.dataset.target;
    document.getElementById(targetPanelId).style.display = 'block';
}


/**
 * Renderiza la tabla de estudiantes del admin, con paginación, búsqueda y orden.
 * @param {string} [searchTerm=''] - Término de búsqueda para filtrar.
 */
function renderAdminTable(searchTerm = '') {
    const tableBody = document.getElementById('admin-table-body');
    const paginationContainer = document.getElementById('admin-pagination');
    if (!tableBody || !paginationContainer) return;

    // 1. Filtrar (Búsqueda)
    const lowerSearchTerm = searchTerm.toLowerCase();
    let filteredData = ALL_STUDENTS_ARRAY;
    if (lowerSearchTerm) {
        filteredData = ALL_STUDENTS_ARRAY.filter(student => 
            student['Nombre Completo del Estudiante'].toLowerCase().includes(lowerSearchTerm) ||
            student['Número de Documento'].toLowerCase().includes(lowerSearchTerm)
        );
    }

    // 2. Ordenar (Sort)
    filteredData.sort((a, b) => {
        const col = currentAdminSort.column;
        const valA = a[col] || '';
        const valB = b[col] || '';
        
        const comparison = valA.localeCompare(valB, 'es', { numeric: true });
        return currentAdminSort.direction === 'asc' ? comparison : -comparison;
    });

    // 3. Paginar
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / ADMIN_ROWS_PER_PAGE);
    if (currentAdminPage > totalPages) currentAdminPage = 1;

    const startIndex = (currentAdminPage - 1) * ADMIN_ROWS_PER_PAGE;
    const endIndex = startIndex + ADMIN_ROWS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // 4. Renderizar Tabla
    tableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">No se encontraron estudiantes.</td></tr>`;
    } else {
        paginatedData.forEach(student => {
            const docNumber = student['Número de Documento'];
            tableBody.innerHTML += `
                <tr class="hover:bg-gray-50">
                    <td class="admin-td font-medium text-brand-header">${student['Nombre Completo del Estudiante']}</td>
                    <td class="admin-td text-gray-600">${student['Tipo de Documento']} ${docNumber}</td>
                    <td class="admin-td text-gray-600">${student['Email']}</td>
                    <td class="admin-td text-gray-600">${student['Colegio/institución']}</td>
                    <td class="admin-td">
                        <button class="view-report-btn text-brand-secondary hover:text-brand-blue-dark font-medium" data-student-id="${docNumber}">
                            Ver Historial
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // 5. Renderizar Paginación
    paginationContainer.innerHTML = `
        <span class="text-sm text-gray-600">
            Mostrando ${startIndex + 1}-${Math.min(endIndex, totalItems)} de ${totalItems}
        </span>
        <div>
            <button class="pagination-btn" ${currentAdminPage === 1 ? 'disabled' : ''} data-page="${currentAdminPage - 1}">
                Anterior
            </button>
            <button class="pagination-btn" ${currentAdminPage === totalPages || totalPages === 0 ? 'disabled' : ''} data-page="${currentAdminPage + 1}">
                Siguiente
            </button>
        </div>
    `;
}

/**
 * Maneja el clic en las cabeceras de la tabla de admin para ordenar.
 * @param {Event} e - El evento de clic.
 */
function handleAdminTableSort(e) {
    const th = e.target.closest('th');
    if (!th || !th.dataset.sort) return;

    const column = th.dataset.sort;
    
    // Cambiar dirección o cambiar de columna
    if (currentAdminSort.column === column) {
        currentAdminSort.direction = currentAdminSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentAdminSort.column = column;
        currentAdminSort.direction = 'asc';
    }

    // Actualizar UI de cabeceras
    document.querySelectorAll('#admin-dashboard th[data-sort]').forEach(header => {
        header.querySelector('span').textContent = '';
        if (header.dataset.sort === column) {
            header.querySelector('span').textContent = currentAdminSort.direction === 'asc' ? '▲' : '▼';
        }
    });

    // Re-renderizar tabla
    renderAdminTable(document.getElementById('admin-search-input').value);
}

/**
 * Maneja el clic en los botones de paginación del admin.
 * @param {Event} e - El evento de clic.
 */
function handleAdminPagination(e) {
    const button = e.target.closest('.pagination-btn');
    if (button && !button.disabled) {
        currentAdminPage = parseInt(button.dataset.page, 10);
        renderAdminTable(document.getElementById('admin-search-input').value);
    }
}

/**
 * Muestra el historial de informes de un estudiante en un modal (Admin).
 * @param {string} docNumber - El número de documento del estudiante.
 */
function showAdminStudentHistory(docNumber) {
    const studentData = STUDENT_DB[docNumber];
    if (!studentData) return;

    const studentReports = SCORES_DB.filter(score => score.doc_number === docNumber);
    const modalHeader = document.getElementById('admin-modal-header');
    const modalBody = document.getElementById('admin-modal-body');

    modalHeader.textContent = `Historial de: ${studentData['Nombre Completo del Estudiante']}`;
    modalBody.innerHTML = ''; // Limpiar

    if (studentReports.length === 0) {
        modalBody.innerHTML = '<p class="text-gray-500 col-span-full">Este estudiante no tiene informes.</p>';
        openModal(document.getElementById('admin-modal-backdrop'));
        return;
    }
    
    // Ordenar (más reciente primero)
    studentReports.sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    studentReports.forEach(report => {
        const testInfo = TEST_INDEX[report.test_id];
        if (!testInfo) return;

        const isSimulacro = testInfo.type === 'simulacro';
        const badgeColor = isSimulacro ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
        const badgeText = isSimulacro ? 'Simulacro' : 'Minisimulacro';
        
        // (NUEVO) Añadir data-doc-number a la tarjeta
        modalBody.innerHTML += `
            <div class="report-card admin-report-card" data-testid="${report.test_id}" data-doc-number="${docNumber}">
                <div class="report-card-header">
                    <div>
                        <h3 class="report-card-title">${testInfo.name}</h3>
                        <p class="report-card-date text-sm text-gray-500">Realizado: ${new Date(report.test_date).toLocaleDateString('es-CO')}</p>
                    </div>
                    <span class="report-card-badge ${badgeColor}">${badgeText}</span>
                </div>
                <div class="report-card-body">
                    <div class="report-card-score">
                        <span class="text-lg font-medium text-brand-text">Puntaje Global</span>
                        <span class="global-score">${report.global_score}</span>
                    </div>
                </div>
            </div>
        `;
    });

    openModal(document.getElementById('admin-modal-backdrop'));
}

/**
 * Maneja el clic en una tarjeta de informe DENTRO del modal de admin.
 * @param {Event} e - El evento de clic.
 */
async function handleAdminModalCardClick(e) {
    const card = e.target.closest('.admin-report-card');
    if (!card || !card.dataset.testid) return;

    const testId = card.dataset.testid;
    const docNumber = card.dataset.docNumber;

    // Simular el estado de "estudiante" para mostrar el informe
    CURRENT_STUDENT_DATA = STUDENT_DB[docNumber];
    CURRENT_STUDENT_REPORTS = SCORES_DB.filter(score => score.doc_number === docNumber);
    isAdminViewingReport = true; // Poner bandera de admin

    closeModal(document.getElementById('admin-modal-backdrop')); // Cerrar modal de admin
    
    // Mostrar el informe (la función se encargará del resto)
    await showIndividualReport(testId); 

    // Limpiar estado
    isAdminViewingReport = false;
    // (No limpiar CURRENT_STUDENT... por si quiere ver otro informe)
}


// --- 6. VISTA DE INFORME INDIVIDUAL (Estudiante y Admin) ---

/**
 * (NUEVO v5.1) Función de ayuda para mostrar la carga
 * dentro de showIndividualReport.
 */
function showReportLoading(message) {
    const loadingScreen = document.getElementById('loading-section');
    const loadingMessage = document.getElementById('loading-message');
    const loadingError = document.getElementById('loading-error');
    
    if(loadingMessage) loadingMessage.textContent = message;
    if(loadingError) loadingError.style.display = 'none';
    
    showSection('loading-section');
}

/**
 * Muestra el informe detallado de una prueba específica.
 * (CORREGIDO v5.1: Se movió la lógica de carga a 'showReportLoading')
 * @param {string} testId - El ID de la prueba (ej. "sg11_07").
 */
async function showIndividualReport(testId) {
    showReportLoading('Cargando datos del informe...');

    try {
        const testInfo = TEST_INDEX[testId];
        const report = CURRENT_STUDENT_REPORTS.find(r => r.test_id === testId);
        
        if (!testInfo || !report) {
            throw new Error(`No se encontraron datos para el informe ${testId}`);
        }

        // 1. Poblar cabecera
        document.getElementById('report-title').textContent = `Reporte: ${testInfo.name}`;
        document.getElementById('report-student-name').textContent = `Estudiante: ${CURRENT_STUDENT_DATA['Nombre Completo del Estudiante']}`;

        // 2. Poblar puntaje global
        const globalScore = report.global_score;
        document.getElementById('report-global-score').textContent = globalScore;
        document.getElementById('report-global-bar').style.width = `${globalScore / 5}%`;
        // (Falta lógica de promedio grupal, se omite por ahora)
        document.getElementById('report-global-avg').textContent = `Promedio Grupal: N/A`;

        // 3. Poblar tarjetas de materias y Gráfico Radar
        const radarData = [];
        const subjectAreas = [
            { key: 'mat', name: 'Matemáticas', score: report.mat_score, icon: 'img/Matematicas (logo).svg', color: 'var(--color-matematicas)' },
            { key: 'lec', name: 'Lectura Crítica', score: report.lec_score, icon: 'img/Lectura Crítica (logo).svg', color: 'var(--color-lectura)' },
            { key: 'soc', name: 'Sociales', score: report.soc_score, icon: 'img/Ciudadanas (logo).svg', color: 'var(--color-sociales)' },
            { key: 'cie', name: 'Ciencias', score: report.cie_score, icon: 'img/Ciencias (logo).svg', color: 'var(--color-ciencias)' },
            { key: 'ing', name: 'Inglés', score: report.ing_score, icon: 'img/Inglés (logo).svg', color: 'var(--color-ingles)' },
        ];
        
        const subjectsContainer = document.querySelector('#report-section .grid[class*="lg:grid-cols-3"]');
        subjectsContainer.innerHTML = ''; // Limpiar tarjetas de materias
        
        subjectAreas.forEach(subject => {
            const score = subject.score;
            radarData.push(score);
            // (Lógica de Nivel y Avg se omite por simplicidad)
            const level = 'N/A';
            const avg = 'N/A';

            subjectsContainer.innerHTML += `
                <div class="subject-card" style="--subject-color: ${subject.color}">
                    <div class="subject-card-header">
                        <img src="${subject.icon}" class="subject-card-icon" alt="${subject.name}">
                        <span class="subject-card-title">${subject.name}</span>
                    </div>
                    <div class="subject-card-score">
                        <span>${score}</span> / 100
                    </div>
                    <div class="subject-card-bar-container">
                        <div class="subject-card-bar" style="width: ${score}%;"></div>
                    </div>
                    <div class="subject-card-footer">
                        <span>Nivel: ${level}</span>
                        <span>Avg: ${avg}</span>
                    </div>
                </div>
            `;
        });
        
        // Renderizar Gráfico Radar (Mejora 2)
        renderRadarChart(radarData, testInfo.name);

        // 4. Cargar datos de la prueba (Claves y Respuestas)
        showReportLoading('Cargando detalle de preguntas...');
        const { studentAnswers, correctKeys, videoLinks } = await loadTestData(testId, CURRENT_STUDENT_DATA['Número de Documento']);

        // 5. Configurar Pestañas (Simulacro vs. Minisimulacro)
        const tabsNav = document.getElementById('report-tabs-nav');
        const s1Panel = document.getElementById('tab-panel-s1');
        const s2Panel = document.getElementById('tab-panel-s2');
        const s1Title = document.getElementById('report-s1-title');
        
        if (testInfo.type === 'simulacro') {
            // --- VISTA SIMULACRO (2 Pestañas) ---
            tabsNav.innerHTML = `
                <button class="report-tab-btn active" data-target="tab-panel-s1">Sesión 1</button>
                <button class="report-tab-btn" data-target="tab-panel-s2">Sesión 2</button>
            `;
            tabsNav.style.display = 'flex';
            s1Panel.style.display = 'block';
            s2Panel.style.display = 'none'; // Ocultar s2 por defecto
            s1Title.textContent = 'Retroalimentación (Sesión 1)';

            // Asignar listeners a las nuevas pestañas
            tabsNav.querySelectorAll('.report-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    tabsNav.querySelectorAll('.report-tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.querySelectorAll('.report-tab-panel').forEach(p => p.style.display = 'none');
                    document.getElementById(btn.dataset.target).style.display = 'block';
                });
            });

            // Poblar ambas pestañas
            const s1Keys = correctKeys.s1 || {};
            const s1Answers = studentAnswers.s1 || {};
            populateFeedbackPanel('s1', s1Keys, s1Answers, videoLinks);

            const s2Keys = correctKeys.s2 || {};
            const s2Answers = studentAnswers.s2 || {};
            populateFeedbackPanel('s2', s2Keys, s2Answers, videoLinks);

        } else {
            // --- VISTA MINISIMULACRO (1 Pestaña) ---
            tabsNav.innerHTML = '';
            tabsNav.style.display = 'none';
            s1Panel.style.display = 'block';
            s2Panel.style.display = 'none';
            s1Title.textContent = 'Retroalimentación';
            
            // Poblar el panel único
            populateFeedbackPanel('s1', correctKeys, studentAnswers, videoLinks);
        }

        // 6. Mostrar la sección del informe
        showSection('report-section');

    } catch (error) {
        console.error('Error al mostrar el informe:', error);
        // Mostrar el error en la pantalla de carga
        const loadingMessage = document.getElementById('loading-message');
        const loadingError = document.getElementById('loading-error');
        if(loadingMessage) loadingMessage.textContent = 'Error al cargar el informe.';
        if(loadingError) {
            loadingError.textContent = error.message;
            loadingError.style.display = 'block';
        }
        // No volver al dashboard, permitir que el usuario vea el error
        // showSection('student-dashboard'); 
        alert(`Error al cargar el informe: ${error.message}`);
    }
}

/**
 * Carga los datos de una prueba (claves, respuestas del estudiante y videos).
 * Maneja la lógica de caché.
 * @param {string} testId - El ID de la prueba.
 * @param {string} docNumber - El documento del estudiante.
 * @returns {Object} - { studentAnswers, correctKeys, videoLinks }
 */
async function loadTestData(testId, docNumber) {
    const testInfo = TEST_INDEX[testId];
    
    // Si no está en caché, cargarlo
    if (!CACHED_TEST_DATA[testId]) {
        CACHED_TEST_DATA[testId] = {};
        const isSimulacro = testInfo.type === 'simulacro';

        // 1. Cargar Claves
        if (isSimulacro) {
            const [keys_s1, keys_s2] = await Promise.all([
                fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.keys_s1}`),
                fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.keys_s2}`)
            ]);
            // Guardar claves como un mapa { Pregunta: Respuesta }
            CACHED_TEST_DATA[testId].keys = {
                s1: keys_s1[0] || {},
                s2: keys_s2[0] || {}
            };
        } else {
            const keys = await fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.keys}`);
            CACHED_TEST_DATA[testId].keys = keys[0] || {};
        }
        
        // 2. Cargar Respuestas (¡TODOS los estudiantes, para el análisis!)
        if (isSimulacro) {
            const [ans_s1, ans_s2] = await Promise.all([
                fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.answers_s1}`),
                fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.answers_s2}`)
            ]);
            // Guardar respuestas como un mapa { doc_number: { ...respuestas } }
            CACHED_TEST_DATA[testId].answers = {
                s1: ans_s1.reduce((acc, row) => { acc[row.ID] = row; return acc; }, {}),
                s2: ans_s2.reduce((acc, row) => { acc[row.ID] = row; return acc; }, {})
            };
        } else {
            const ans = await fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.answers}`);
            CACHED_TEST_DATA[testId].answers = ans.reduce((acc, row) => { acc[row.ID] = row; return acc; }, {});
        }
        
        // 3. Cargar Videos
        const videoResponse = await fetch(`${BASE_DATA_URL}${testInfo.videos}?t=${TIMESTAMP}`);
        const videoText = await videoResponse.text();
        CACHED_TEST_DATA[testId].videos = parseVideoText(videoText);
    }

    // 4. Devolver los datos (desde el caché)
    const cached = CACHED_TEST_DATA[testId];
    const isSimulacro = testInfo.type === 'simulacro';

    if (isSimulacro) {
        return {
            studentAnswers: {
                s1: cached.answers.s1[docNumber] || {},
                s2: cached.answers.s2[docNumber] || {}
            },
            correctKeys: cached.keys, // { s1: {...}, s2: {...} }
            videoLinks: cached.videos
        };
    } else {
        return {
            studentAnswers: cached.answers[docNumber] || {},
            correctKeys: cached.keys, // { "Pregunta 1": "A", ... }
            videoLinks: cached.videos
        };
    }
}

/**
 * Pobla un panel de feedback (videos y preguntas).
 * @param {string} panelSuffix - 's1' o 's2'.
 * @param {Object} correctKeys - Mapa de { Pregunta: Respuesta }.
 * @param {Object} studentAnswers - Mapa de { Pregunta: Respuesta }.
 * @param {Object} videoLinks - Objeto de videos parseados.
 */
function populateFeedbackPanel(panelSuffix, correctKeys, studentAnswers, videoLinks) {
    const videoContainer = document.getElementById(`report-videos-${panelSuffix}`);
    const questionsContainer = document.getElementById(`report-questions-${panelSuffix}`).querySelector('.question-list-container');
    
    videoContainer.innerHTML = '';
    questionsContainer.innerHTML = '';
    
    // 1. Poblar Videos
    // (Lógica de videos por rango de puntaje/desempeño omitida por simplicidad)
    // (Mostrando todos los videos de las áreas presentes en esta sesión)
    const areasInThisSession = new Set(Object.keys(correctKeys).map(q => q.split(' ')[0].toUpperCase()));
    const videoGrid = videoContainer.querySelector('.video-grid');
    if (videoGrid) {
        videoLinks.forEach(video => {
            if (areasInThisSession.has(video.subject.toUpperCase())) {
                videoGrid.innerHTML += createVideoCardHTML(video);
            }
        });
        if (!videoGrid.innerHTML) {
            videoContainer.innerHTML = '<p class="text-gray-500">No hay videos recomendados para esta sesión.</p>';
        }
    }


    // 2. Poblar Preguntas
    for (const questionName in correctKeys) {
        // Omitir columnas que no son preguntas (como ID, Email, etc.)
        if (!studentAnswers.hasOwnProperty(questionName)) continue; 
        
        const correctAnswer = correctKeys[questionName];
        const studentAnswer = studentAnswers[questionName] || 'Omitida';
        const isCorrect = studentAnswer === correctAnswer;
        
        const statusClass = isCorrect ? 'correct' : 'incorrect';
        const statusIconBg = isCorrect ? 'bg-brand-green' : 'bg-brand-red';
        const statusIcon = isCorrect ? '&#10003;' : '&#10005;'; // Check o X
        
        // Extraer materia del nombre de la pregunta (ej. "Matemáticas S1 [1.]")
        const subject = questionName.split(' ')[0];

        questionsContainer.innerHTML += `
            <div class="question-row ${statusClass}">
                <div class="question-info">
                    <span class="question-title">${questionName}</span>
                    <div class="question-answers">
                        <span>Tu Rta: <strong class="font-bold">${studentAnswer}</strong></span>
                        ${!isCorrect ? `<span>Rta Correcta: <strong class="font-bold">${correctAnswer}</strong></span>` : ''}
                    </div>
                </div>
                <div class="question-status-icon ${statusIconBg}">
                    ${statusIcon}
                </div>
            </div>
        `;
    }
}

/**
 * Crea el HTML para una tarjeta de video.
 * @param {Object} video - Objeto de video (subject, range, url, title, img).
 * @returns {string} - El string HTML de la tarjeta.
 */
function createVideoCardHTML(video) {
    // (NUEVO v5) Diseño mejorado de tarjeta de video
    // Extraer ID de YouTube para la miniatura
    let thumbnailUrl = 'img/Saber 11 (logo).svg'; // Fallback
    const youtubeId = video.url.match(/(?:v=|\/embed\/|\/youtu.be\/)([a-zA-Z0-9_-]{11})/);
    if (youtubeId && youtubeId[1]) {
        thumbnailUrl = `https://img.youtube.com/vi/${youtubeId[1]}/mqdefault.jpg`;
    }

    return `
        <div class="video-card">
            <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="video-thumbnail-link">
                <img src="${thumbnailUrl}" alt="Miniatura de ${video.title}" class="video-thumbnail" onerror="this.src='img/Saber 11 (logo).svg'">
                <div class="video-play-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                    </svg>
                </div>
            </a>
            <div class="video-info">
                <h4 class="video-title">${video.title}</h4>
                <p class="video-subject">${video.subject} (Preguntas ${video.range})</p>
            </div>
        </div>
    `;
}

/**
 * Renderiza el gráfico de Radar (Mejora 2).
 * @param {Array<number>} data - Array de 5 puntajes [mat, lec, soc, cie, ing].
 * @param {string} testName - Nombre de la prueba.
 */
function renderRadarChart(data, testName) {
    const radarCtx = document.getElementById('radarChart')?.getContext('2d');
    if (!radarCtx) return;

    // Destruir gráfico anterior
    if (window.myRadarChart instanceof Chart) {
        window.myRadarChart.destroy();
    }
    
    window.myRadarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: ['Matemáticas', 'Lectura', 'Sociales', 'Ciencias', 'Inglés'],
            datasets: [{
                label: `Puntajes (0-100) - ${testName}`,
                data: data,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Permitir que no sea cuadrado
            scales: {
                r: {
                    angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    pointLabels: {
                        font: { size: 12, weight: 'bold' }
                    },
                    ticks: {
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        stepSize: 20,
                        backdropColor: 'rgba(255, 255, 255, 0.75)',
                        backdropPadding: 4
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Ocultar leyenda, es redundante
                }
            }
        }
    });
}


// --- 7. ANÁLISIS ESTADÍSTICO (Admin - Mejora 1) ---

/**
 * Maneja el clic en el botón "Analizar" del panel de estadísticas.
 */
async function handleStatsAnalysis() {
    const testId = document.getElementById('stats-test-select').value;
    if (!testId) {
        alert('Por favor, seleccione una prueba.');
        return;
    }

    const loadingEl = document.getElementById('stats-loading');
    const resultsContainerEl = document.getElementById('stats-results-container');
    const resultsTitleEl = document.getElementById('stats-results-title');
    const filterSelect = document.getElementById('stats-filter-by');

    loadingEl.style.display = 'block';
    resultsContainerEl.style.display = 'none';
    filterSelect.innerHTML = '<option value="all">Todas las Áreas</option>'; // Resetear filtros

    try {
        // 1. Analizar la prueba
        const analysisResults = await analyzeTestItems(testId);
        resultsTitleEl.textContent = `Resultados de Análisis: ${TEST_INDEX[testId].name}`;
        
        // 2. Poblar filtros de área (NUEVO v5)
        const areas = new Set(Object.values(analysisResults).map(item => item.area));
        areas.forEach(area => {
            if (area !== 'N/A') {
                filterSelect.innerHTML += `<option value="${area}">${area}</option>`;
            }
        });

        // 3. Guardar en caché para ordenar/filtrar
        CACHED_TEST_DATA.currentStats = Object.values(analysisResults);
        
        // 4. Renderizar las tarjetas
        renderStatsCards(CACHED_TEST_DATA.currentStats);

    } catch (error) {
        console.error(`Error analizando la prueba ${testId}:`, error);
        alert(`Error al analizar la prueba. Revise la consola.`);
    } finally {
        loadingEl.style.display = 'none';
        resultsContainerEl.style.display = 'block';
    }
}

/**
 * Realiza el análisis estadístico de una prueba (Mejora 1).
 * Carga respuestas, claves, y procesa los datos.
 * @param {string} testId - El ID de la prueba (ej. "sg11_07" o "mini_1")
 * @returns {Object} - Un objeto con los resultados del análisis
 */
async function analyzeTestItems(testId) {
    const testInfo = TEST_INDEX[testId];
    if (!testInfo) throw new Error(`No se encontró información para la prueba ${testId}`);

    // stats = { "Matemáticas [1.]": { ... }, ... }
    const stats = {};
    const isSimulacro = testInfo.type === 'simulacro';

    // --- 1. Cargar Claves y Respuestas (usando la función de caché) ---
    // (loadTestData cargará los datos si no están en caché)
    await loadTestData(testId, ''); // Cargar datos globales de la prueba

    const cachedTest = CACHED_TEST_DATA[testId];
    const keysData = isSimulacro ? { ...cachedTest.keys.s1, ...cachedTest.keys.s2 } : cachedTest.keys;
    const answersData = isSimulacro ? { ...cachedTest.answers.s1, ...cachedTest.answers.s2 } : cachedTest.answers;

    // --- 2. Inicializar el objeto de Estadísticas ---
    for (const questionHeader in keysData) {
        if (!keysData.hasOwnProperty(questionHeader)) continue;
        // (NUEVO v5) Extraer área
        const areaMatch = questionHeader.match(/^([a-zA-Záéíóúñ\s]+)/);
        const area = areaMatch ? areaMatch[1].trim() : 'N/A';
        
        stats[questionHeader] = {
            pregunta: questionHeader,
            area: area,
            correcta: keysData[questionHeader],
            A: 0, B: 0, C: 0, D: 0, Omision: 0,
            total: 0,
            correctas: 0
        };
    }

    // --- 3. Procesar Respuestas de TODOS los estudiantes ---
    // (answersData es { doc1: { ... }, doc2: { ... } })
    for (const docNumber in answersData) {
        const studentRow = answersData[docNumber];
        
        for (const questionHeader in stats) {
            if (studentRow.hasOwnProperty(questionHeader)) {
                const studentAnswer = studentRow[questionHeader]?.trim().toUpperCase() || 'OMISION';
                const correctAnswer = stats[questionHeader].correcta;
                
                const statsEntry = stats[questionHeader];
                statsEntry.total++;

                // Conteo de distractores
                if (studentAnswer === 'A') statsEntry.A++;
                else if (studentAnswer === 'B') statsEntry.B++;
                else if (studentAnswer === 'C') statsEntry.C++;
                else if (studentAnswer === 'D') statsEntry.D++;
                else statsEntry.Omision++;
                
                // Conteo de aciertos
                if (studentAnswer === correctAnswer) {
                    statsEntry.correctas++;
                }
            }
        }
    }
    
    return stats;
}

/**
 * Renderiza los resultados del análisis en TARJETAS VISUALES (NUEVO v5).
 * @param {Array} statsArray - Array de objetos de estadísticas (de CACHED_TEST_DATA.currentStats).
 * @param {string} [sortBy='default'] - Criterio de orden.
 */
function renderStatsCards(statsArray, sortBy = 'default') {
    const gridContainer = document.getElementById('stats-results-grid');
    gridContainer.innerHTML = '';
    
    let sortedStats = [...statsArray];

    // 1. Ordenar
    if (sortBy === 'easiest') {
        sortedStats.sort((a, b) => ((b.correctas / b.total) || 0) - ((a.correctas / a.total) || 0)); // Más fácil primero
    } else if (sortBy === 'hardest') {
        sortedStats.sort((a, b) => ((a.correctas / a.total) || 0) - ((b.correctas / b.total) || 0)); // Más difícil primero
    } else if (sortBy === 'most-omitted') {
        sortedStats.sort((a, b) => ((b.Omision / b.total) || 0) - ((a.Omision / a.total) || 0)); // Más omitida primero
    }
    // 'default' es el orden original (por pregunta)

    // 2. Renderizar
    if (sortedStats.length === 0) {
        gridContainer.innerHTML = '<p class="text-gray-500 col-span-full">No hay datos de preguntas para esta prueba.</p>';
        return;
    }

    sortedStats.forEach(item => {
        if (item.total === 0) return; // No mostrar preguntas sin respuestas

        // Calcular porcentajes
        const pctAcierto = (item.correctas / item.total) * 100;
        const pctOmision = (item.Omision / item.total) * 100;
        
        // Encontrar el distractor principal (que no es la respuesta correcta)
        const distractors = {
            A: (item.A / item.total) * 100,
            B: (item.B / item.total) * 100,
            C: (item.C / item.total) * 100,
            D: (item.D / item.total) * 100
        };
        let maxDistractorPct = 0;
        let maxDistractorOpt = '';
        for(const opt in distractors) {
            if (opt !== item.correcta && distractors[opt] > maxDistractorPct) {
                maxDistractorPct = distractors[opt];
                maxDistractorOpt = opt;
            }
        }

        // Determinar dificultad (para el tag)
        let dificultadClase = 'bg-yellow-100 text-yellow-800'; // Medio
        let dificultadTexto = 'Medio';
        if (pctAcierto >= 75) {
            dificultadClase = 'bg-green-100 text-green-800'; // Fácil
            dificultadTexto = 'Fácil';
        } else if (pctAcierto <= 35) {
            dificultadClase = 'bg-red-100 text-red-800'; // Difícil
            dificultadTexto = 'Difícil';
        }

        // Generar barras de distractores
        let distractorHTML = '';
        ['A', 'B', 'C', 'D'].forEach(opt => {
            const pct = distractors[opt];
            const isCorrect = opt === item.correcta;
            const isMainDistractor = opt === maxDistractorOpt && maxDistractorPct > 0;
            
            let barColor = 'bg-gray-400';
            let labelClass = '';
            if (isCorrect) {
                barColor = 'bg-brand-green';
                labelClass = 'correct';
            } else if (isMainDistractor && !isCorrect) {
                barColor = 'bg-brand-red'; // Resaltar distractor principal
            }
            
            distractorHTML += `
                <div class="stat-distractor ${labelClass}">
                    <div class="stat-distractor-label">
                        <span>${opt}. (${pct.toFixed(0)}%)</span>
                        ${isCorrect ? '<span>(Correcta)</span>' : ''}
                    </div>
                    <div class="stat-distractor-bar-container">
                        <div class="stat-distractor-bar ${barColor}" style="width: ${pct.toFixed(0)}%;"></div>
                    </div>
                </div>
            `;
        });

        // Crear tarjeta
        const cardHTML = `
            <div class="stat-card" data-area="${item.area}">
                <div class="stat-card-header">
                    <span class="stat-card-title">${item.pregunta}</span>
                    <span class="stat-card-tag ${dificultadClase}">${dificultadTexto} (${pctAcierto.toFixed(0)}%)</span>
                </div>
                <div class="stat-card-body">
                    ${distractorHTML}
                </div>
                <div class="stat-card-footer">
                    <span>Omisión: ${pctOmision.toFixed(0)}%</span>
                </div>
            </div>
        `;
        gridContainer.innerHTML += cardHTML;
    });
}

/**
 * Filtra las tarjetas de estadísticas visibles por área (NUEVO v5).
 * @param {string} area - El área a mostrar (ej. "Matemáticas" o "all").
 */
function filterStatsCards(area) {
    const cards = document.querySelectorAll('#stats-results-grid .stat-card');
    let visibleCards = 0;
    
    cards.forEach(card => {
        if (area === 'all' || card.dataset.area === area) {
            card.style.display = 'block';
            visibleCards++;
        } else {
            card.style.display = 'none';
        }
    });

    // Mostrar mensaje si no hay resultados
    const noResultsEl = document.getElementById('stats-no-results');
    if (visibleCards === 0) {
        noResultsEl.style.display = 'block';
    } else {
        noResultsEl.style.display = 'none';
    }
}


// --- 8. GESTIÓN DE CONTENIDO (Admin CRUD - Mejora 3) ---

// Variable global para almacenar el callback post-token
let afterTokenSuccess = null;

/**
 * Maneja el envío del formulario "Añadir Estudiante".
 * Inicia el flujo de caché y solicitud de token.
 * @param {Event} e - El evento de submit.
 */
async function handleAddStudentSubmit(e) {
    e.preventDefault();
    const statusEl = document.getElementById('crud-student-status');
    const buttonEl = document.getElementById('add-student-btn');

    buttonEl.disabled = true;
    statusEl.textContent = 'Procesando...';
    statusEl.style.color = 'var(--brand-text)';

    try {
        // 1. Obtener datos del formulario
        const newStudent = {
            'Nombre Completo del Estudiante': document.getElementById('student-name').value.trim(),
            'Email': document.getElementById('student-email').value.trim(),
            'Tipo de Documento': document.getElementById('student-doc-type').value,
            'Número de Documento': document.getElementById('student-doc-number').value.trim(),
            'Fecha de Nacimiento': document.getElementById('student-birthdate').value.trim(),
            'Departamento': '', // Campo no existente en el form v5
            'Colegio/institución': document.getElementById('student-school').value.trim(),
        };

        // 2. Validar que el estudiante no exista
        if (STUDENT_DB[newStudent['Número de Documento']]) {
            throw new Error(`El estudiante con documento ${newStudent['Número de Documento']} ya existe.`);
        }

        // 3. Cargar el contenido actual del CSV si no está en caché
        if (!crudCache.studentDb) {
            statusEl.textContent = 'Cargando base de datos...';
            // (CORREGIDO v5.1) Se debe pedir el token ANTES de leer
            // si el repositorio es privado.
            
            // Paso 1: Pedir el token
            afterTokenSuccess = async (token) => {
                // Paso 2: Ahora que tenemos token, leer el archivo
                statusEl.textContent = 'Cargando base de datos...';
                const fileData = await getGitHubFile(GITHUB_API_CONFIG.studentDbPath, token);
                crudCache.studentDb = atob(fileData.content);
                crudCache.studentDbSha = fileData.sha;
                
                // Paso 3: Proceder con la adición
                await processNewStudent(newStudent, token, statusEl);
            };
            
            openModal(document.getElementById('github-token-modal'));
            document.getElementById('token-modal-error').style.display = 'none';
            // El resto de la lógica se mueve a 'handleConfirmGithubToken' y 'processNewStudent'
            
        } else {
            // El caché ya existe, solo pedir token para escribir
            afterTokenSuccess = async (token) => {
                 await processNewStudent(newStudent, token, statusEl);
            };
            openModal(document.getElementById('github-token-modal'));
            document.getElementById('token-modal-error').style.display = 'none';
        }
        
    } catch (error) {
        console.error('Error al añadir estudiante:', error);
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.style.color = 'var(--brand-red)';
    } finally {
         // (v5.1) El botón se reactiva en el modal o en el catch
         // No reactivarlo aquí, sino en el 'finally' del modal
    }
}

/**
 * (NUEVO v5.1) Procesa y guarda al nuevo estudiante
 * después de que el caché está listo y el token está disponible.
 */
async function processNewStudent(newStudent, token, statusEl) {
     // 1. Crear la nueva fila CSV
    // (Asegurar el orden de columnas del CSV original)
    const headers = Object.keys(ALL_STUDENTS_ARRAY[0]);
    const newCsvRow = headers.map(header => `"${newStudent[header] || ''}"`).join(',');

    // 2. Añadir al caché local
    crudCache.studentDb += `\n${newCsvRow}`;
    
    // 3. Guardar en GitHub
    statusEl.textContent = 'Guardando en GitHub...';
    
    // Codificar el nuevo contenido a Base64
    const newContentBase64 = btoa(crudCache.studentDb);

    // Hacer el commit a GitHub
    const commitData = await updateGitHubFile(
        GITHUB_API_CONFIG.studentDbPath,
        token,
        `CRUD: Añadido estudiante ${newStudent['Número de Documento']}`,
        newContentBase64,
        crudCache.studentDbSha
    );

    // 4. Actualizar el SHA en caché para el próximo commit
    crudCache.studentDbSha = commitData.content.sha;

    // 5. Éxito
    statusEl.textContent = '¡Estudiante añadido con éxito!';
    statusEl.style.color = 'var(--brand-green)';
    document.getElementById('add-student-form').reset();

    // 6. Actualizar la DB local de la app
    STUDENT_DB[newStudent['Número de Documento']] = newStudent;
    ALL_STUDENTS_ARRAY.push(newStudent);
    renderAdminTable(); // Re-renderizar la tabla de admin
}


/**
 * Maneja la confirmación del modal de token.
 * Ejecuta el callback 'afterTokenSuccess' si existe.
 */
async function handleConfirmGithubToken() {
    const token = document.getElementById('github-token-input').value;
    const errorEl = document.getElementById('token-modal-error');
    const confirmBtn = document.getElementById('confirm-token-btn');
    const addStudentBtn = document.getElementById('add-student-btn');

    if (!token) {
        errorEl.textContent = 'El token no puede estar vacío.';
        errorEl.style.display = 'block';
        return;
    }

    if (typeof afterTokenSuccess === 'function') {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Guardando...';
        errorEl.style.display = 'none';
        
        try {
            // Ejecutar la acción pendiente (ej. leer y guardar estudiante)
            await afterTokenSuccess(token);
            
            // Éxito: limpiar token y cerrar modal
            document.getElementById('github-token-input').value = '';
            closeModal(document.getElementById('github-token-modal'));
            
        } catch (error) {
            console.error('Error durante la acción (post-token):', error);
            errorEl.textContent = `Error: ${error.message}. ¿Token válido?`;
            errorEl.style.display = 'block';
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirmar y Guardar';
            addStudentBtn.disabled = false; // Reactivar el botón principal
            afterTokenSuccess = null; // Limpiar callback
        }
    }
}

/**
 * (Helper API) Obtiene el contenido y 'sha' de un archivo de GitHub.
 * (CORREGIDO v5.1: Requiere token para leer repos privados)
 * @param {string} filePath - Ruta al archivo en el repo (ej. "database/student_database.csv").
 * @param {string} token - El GitHub PAT.
 * @returns {Object} - { content, sha }
 */
async function getGitHubFile(filePath, token) {
    if (!token) {
        throw new Error("Se requiere un token de GitHub para leer el archivo.");
    }
    
    const { owner, repo, branch } = GITHUB_API_CONFIG;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache', // Siempre obtener el más reciente
            'Pragma': 'no-cache'
        }
    });
    if (!response.ok) {
        throw new Error(`Error [GET] al leer archivo de GitHub (${filePath}): ${response.statusText}`);
    }
    return await response.json(); // Devuelve { content: '...', sha: '...' }
}


/**
 * (Helper API) Actualiza (hace commit) de un archivo en GitHub.
 * @param {string} filePath - Ruta al archivo en el repo.
 * @param {string} token - El GitHub PAT.
 *img/Matematicas (logo).svg * @param {string} commitMessage - Mensaje del commit.
 * @param {string} contentBase64 - Contenido del archivo en Base64.
 * @param {string} sha - El SHA del archivo que se está actualizando.
 * @returns {Object} - Datos del commit.
 */
async function updateGitHubFile(filePath, token, commitMessage, contentBase64, sha) {
    const { owner, repo, branch } = GITHUB_API_CONFIG;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: commitMessage,
            content: contentBase64,
            sha: sha, // SHA del archivo base (obligatorio)
            branch: branch
        })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error [PUT] al escribir en GitHub: ${errorData.message || response.statusText}`);
    }
    return await response.json();
}


// --- 9. FUNCIONES UTILITARIAS ---

/**
 * Descarga y parsea un archivo CSV desde una URL.
 * @param {string} url - La URL del archivo CSV.
 * @returns {Promise<Array>} - Una promesa que se resuelve con los datos parseados.
 */
async function fetchAndParseCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                resolve(results.data);
            },
            error: (error) => {
                console.error(`Error al parsear CSV desde ${url}:`, error);
                reject(error);
            }
        });
    });
}

/**
 * Parsea el texto de retroalimentación de video.
 * @param {string} text - El contenido del archivo bd_retro_...txt.
 * @returns {Array<Object>} - Un array de objetos de video.
 */
function parseVideoText(text) {
    const links = [];
    const lines = text.split('\n');
    lines.forEach(line => {
        // Formato esperado: MATERIA;RANGO;URL;[TÍTULO OPCIONAL];[IMG OPCIONAL]
        const parts = line.split(';');
        if (parts.length >= 3) {
            links.push({
                subject: parts[0].trim(),
                range: parts[1].trim(),
                url: parts[2].trim(),
                title: parts[3]?.trim() || `Retroalimentación: ${parts[0]} (Preguntas ${parts[1]})`,
                img: parts[4]?.trim() || null
            });
        }
    });
    return links;
}
