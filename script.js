// --- Variables Globales y Configuración (v6) ---

// (v5.4) Credenciales de admin simplificadas
const SUPER_USER_CREDENTIALS = { username: "admin", password: "admin2024" };
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
let currentActivePanel = ''; // (v6) Panel activo
let globalStudentName = ''; // (v6) Nombre del usuario logueado
let globalStudentRole = ''; // (v6) Rol del usuario logueado

// Configuración del CRUD (API de GitHub)
const GITHUB_API_CONFIG = {
    owner: "daniel-alt-pages",
    repo: "backoup_informes",
    branch: "main",
    studentDbPath: "database/student_database.csv"
};
// (v5) Caché de cambios del CRUD
let crudCache = {
    studentDb: null
};


// --- 1. INICIALIZACIÓN DE LA APLICACIÓN ---

document.addEventListener('DOMContentLoaded', () => {
    // Asignar listeners de eventos
    setupEventListeners();

    // Iniciar la carga de datos
    loadAllData();
    
    // Inicializar Lucide Icons (por si se añaden dinámicamente)
    // (Asegúrate de llamarlo también después de insertar HTML con iconos)
    try {
        lucide.createIcons();
    } catch (e) {
        console.warn("Lucide icons no se pudieron inicializar (puede ser normal en la carga inicial).");
    }
});

/**
 * Carga todos los datos esenciales de la plataforma (CSV y JSON).
 * (v5.4) Lógica de 'trim' (limpieza) movida a 'processStudentData'
 */
async function loadAllData() {
    const loadingMessage = document.getElementById('loading-message');
    const loadingError = document.getElementById('loading-error');
    const loadingScreen = document.getElementById('loading-section');
    const loginScreen = document.getElementById('login-section');

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
        
        // (v5.4) Procesar y limpiar los datos de estudiantes
        processStudentData(studentData);

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

/**
 * (v5.4) Procesa, limpia (trim) y almacena los datos de estudiantes.
 */
function processStudentData(studentData) {
    STUDENT_DB = {};
    ALL_STUDENTS_ARRAY = [];
    
    studentData.forEach(originalStudent => {
        const student = {};
        for (const key in originalStudent) {
            const cleanKey = key.trim(); 
            if (typeof originalStudent[key] === 'string') {
                student[cleanKey] = originalStudent[key].trim();
            } else {
                student[cleanKey] = originalStudent[key];
            }
        }
        
        const docNumber = student['Número de Documento'];
        if (docNumber) {
            STUDENT_DB[docNumber] = student;
            ALL_STUDENTS_ARRAY.push(student);
        }
    });
    
    console.log(`Base de datos de estudiantes cargada y procesada. ${ALL_STUDENTS_ARRAY.length} registros.`);
}


// --- 2. MANEJO DE EVENTOS (LISTENERS) ---

/**
 * Configura todos los listeners de eventos principales de la aplicación.
 * (v6) Adaptado para el nuevo layout de Sidebar
 */
function setupEventListeners() {
    // --- Selectores (Cache) ---
    const elements = {
        // Layout
        loginForm: document.getElementById('login-form'),
        logoutButton: document.getElementById('logout-button'),
        sidebar: document.getElementById('sidebar'),
        mobileSidebarToggle: document.getElementById('mobile-sidebar-toggle'),
        backToDashboardBtn: document.getElementById('back-to-dashboard-btn'),

        // Navegación Sidebar (v6)
        navStudentDashboard: document.getElementById('nav-student-dashboard'),
        navAdminDashboard: document.getElementById('nav-admin-dashboard'),
        navAdminStudents: document.getElementById('nav-admin-students'),
        navAdminStats: document.getElementById('nav-admin-stats'),
        navAdminCrud: document.getElementById('nav-admin-crud'),
        
        // Login
        togglePassword: document.getElementById('toggle-password'),
        
        // Dashboard Estudiante
        studentReportsGrid: document.getElementById('student-reports-grid'),
        growthChartFilters: document.getElementById('growth-chart-filters'),
        
        // Dashboard Admin (General)
        adminSearchInput: document.getElementById('admin-search-input'),
        adminTableBody: document.getElementById('admin-table-body'),
        adminPaginationControls: document.getElementById('admin-pagination-controls'),
        
        // Admin (Análisis Estadístico)
        statsAnalyzeBtn: document.getElementById('stats-analyze-btn'),
        statsTestSelect: document.getElementById('stats-test-select'),
        
        // Admin (CRUD)
        addStudentForm: document.getElementById('add-student-form'),
        
        // Modales
        adminModalBackdrop: document.getElementById('admin-modal-backdrop'),
        adminModalCloseBtn: document.getElementById('admin-modal-close-btn'),
        adminModalBody: document.getElementById('admin-modal-body'),
        githubTokenModal: document.getElementById('github-token-modal'),
        cancelTokenBtn: document.getElementById('cancel-token-btn'),
        confirmTokenBtn: document.getElementById('confirm-token-btn'),
    };

    // --- Asignación de Listeners (con Encadenamiento Opcional '?.') ---

    // Formulario de Login
    elements.loginForm?.addEventListener('submit', handleLogin);

    // Ver/Ocultar Contraseña
    elements.togglePassword?.addEventListener('click', togglePasswordVisibility);
    
    // --- Navegación Principal (v6) ---
    elements.logoutButton?.addEventListener('click', logout);
    elements.backToDashboardBtn?.addEventListener('click', () => {
        if (globalStudentRole === 'admin') {
            showAdminDashboard();
        } else {
            showStudentDashboard();
        }
    });

    // Toggle de Sidebar Móvil (v6)
    elements.mobileSidebarToggle?.addEventListener('click', toggleMobileSidebar);

    // Clic en el overlay para cerrar sidebar móvil
    document.body.addEventListener('click', (e) => {
        if (e.target.id === 'sidebar-overlay') {
            toggleMobileSidebar(false); // Forzar cierre
        }
    });

    // Navegación del Sidebar (v6)
    elements.navStudentDashboard?.addEventListener('click', (e) => { e.preventDefault(); showStudentDashboard(); });
    elements.navAdminDashboard?.addEventListener('click', (e) => { e.preventDefault(); showAdminDashboard(); });
    elements.navAdminStudents?.addEventListener('click', (e) => { e.preventDefault(); showAdminStudentsPanel(); });
    elements.navAdminStats?.addEventListener('click', (e) => { e.preventDefault(); showAdminStatsPanel(); });
    elements.navAdminCrud?.addEventListener('click', (e) => { e.preventDefault(); showAdminCrudPanel(); });

    // --- Dashboard Estudiante ---
    
    // Clic en "Ver Informe" (Tarjeta de informe)
    elements.studentReportsGrid?.addEventListener('click', (e) => {
        const card = e.target.closest('.report-card[data-testid]');
        if (card) {
            const testId = card.dataset.testid;
            showIndividualReport(testId);
        }
    });

    // (v5.1) Filtros del Gráfico de Crecimiento
    elements.growthChartFilters?.addEventListener('click', (e) => {
        if (e.target.classList.contains('chart-filter-btn')) {
            elements.growthChartFilters.querySelectorAll('.chart-filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            const filterType = e.target.dataset.filter;
            renderGrowthChart(CURRENT_STUDENT_REPORTS, filterType);
        }
    });

    // --- Dashboard Admin ---

    // Búsqueda en tabla de estudiantes
    elements.adminSearchInput?.addEventListener('input', () => {
        currentAdminPage = 1;
        renderAdminTable();
    });

    // Paginación de tabla de estudiantes
    elements.adminPaginationControls?.addEventListener('click', (e) => {
        const btn = e.target.closest('.pagination-btn');
        if (btn && !btn.disabled) {
            const newPage = parseInt(btn.dataset.page, 10);
            if (newPage) {
                currentAdminPage = newPage;
                renderAdminTable();
            }
        }
    });

    // Ordenar tabla de estudiantes
    document.querySelector('#admin-students-section table thead')?.addEventListener('click', (e) => {
        const header = e.target.closest('.table-header');
        if (header && header.dataset.sort) {
            const sortKey = header.dataset.sort;
            if (currentAdminSort.column === sortKey) {
                currentAdminSort.direction = currentAdminSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentAdminSort.column = sortKey;
                currentAdminSort.direction = 'asc';
            }
            currentAdminPage = 1;
            renderAdminTable();
        }
    });
    
    // Clic en "Ver" (fila de estudiante)
    elements.adminTableBody?.addEventListener('click', (e) => {
        const viewButton = e.target.closest('.view-student-history-btn');
        if (viewButton) {
            const studentId = viewButton.dataset.studentId;
            showAdminStudentHistory(studentId);
        }
    });

    // Clic en un informe DENTRO del modal de admin
    elements.adminModalBody?.addEventListener('click', async (e) => {
       const card = e.target.closest('.report-card[data-testid]');
       if (card) {
           const testId = card.dataset.testid;
           const docNumber = card.dataset.docNumber;

           // Simular estado de "estudiante"
           const tempStudentData = STUDENT_DB[docNumber];
           const tempStudentReports = SCORES_DB.filter(score => score.doc_number === docNumber);
           
           // (v5.1) Guardar estado del admin
           isAdminViewingReport = true; 
           
           // Ocultar modal y mostrar informe
           closeModal(elements.adminModalBackdrop);
           await showIndividualReport(testId, tempStudentData, tempStudentReports);
           
           // (v5.1) Restaurar estado de admin
           isAdminViewingReport = false;
       }
    });

    // Cerrar modal de admin
    elements.adminModalCloseBtn?.addEventListener('click', () => closeModal(elements.adminModalBackdrop));
    elements.adminModalBackdrop?.addEventListener('click', (e) => {
        if (e.target === elements.adminModalBackdrop) {
            closeModal(elements.adminModalBackdrop);
        }
    });

    // --- Análisis Estadístico ---
    elements.statsAnalyzeBtn?.addEventListener('click', handleAnalyzeTest);

    // --- CRUD ---
    elements.addStudentForm?.addEventListener('submit', handleAddStudentSubmit);
    
    // Modales del CRUD
    elements.cancelTokenBtn?.addEventListener('click', () => {
        closeModal(elements.githubTokenModal);
        document.getElementById('github-token-input').value = '';
        document.getElementById('github-token-error').style.display = 'none';
    });
    
    elements.confirmTokenBtn?.addEventListener('click', handleConfirmGithubToken);
}


// --- 3. LÓGICA DE AUTENTICACIÓN Y NAVEGACIÓN (v6) ---

/**
 * Maneja el envío del formulario de login.
 * (v5.4) Incluye depuración
 */
function handleLogin(e) {
    e.preventDefault();
    const docType = document.getElementById('doc-type').value;
    const docNumber = document.getElementById('doc-number').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginError = document.getElementById('login-error');

    // --- Depuración (Paso 1: ¿Qué se está recibiendo?) ---
    console.log("--- Intento de Login ---");
    console.log(`Input DocType: [${docType}]`);
    console.log(`Input DocNumber (admin?): [${docNumber}]`);
    console.log(`Input Password (fecha?): [${password}]`);
    console.log(`Comparando con Admin PASS: [${SUPER_USER_CREDENTIALS.password}]`);

    // --- Flujo de Admin (Paso 2: Comparación de Admin) ---
    if (docNumber === SUPER_USER_CREDENTIALS.username && password === SUPER_USER_CREDENTIALS.password) {
        console.log("¡ÉXITO de Admin!");
        loginError.style.display = 'none';
        
        globalStudentName = "Administrador";
        globalStudentRole = "admin";
        
        showMainLayout(); // (v6) Mostrar layout
        showAdminDashboard(); // (v6) Mostrar panel
        return;
    }

    // --- Flujo de Estudiante (Paso 3: Comparación de Estudiante) ---
    const studentData = STUDENT_DB[docNumber];

    if (studentData) {
        console.log("Estudiante encontrado en DB:", studentData);
        console.log(`Comparando Password/Fecha: [${studentData['Fecha de Nacimiento']}] === [${password}]`);

        if (studentData['Tipo de Documento'] === docType && 
            studentData['Fecha de Nacimiento'] === password) {
            
            console.log("¡ÉXITO de Estudiante!");
            loginError.style.display = 'none';
            
            // Guardar datos globales del estudiante
            CURRENT_STUDENT_DATA = studentData;
            CURRENT_STUDENT_REPORTS = SCORES_DB.filter(score => score.doc_number === docNumber);
            globalStudentName = studentData['Nombre Completo del Estudiante'];
            globalStudentRole = "student";

            showMainLayout(); // (v6) Mostrar layout
            showStudentDashboard(); // (v6) Mostrar panel
            return;
        }
    } else {
        console.log(`Estudiante con DocNumber [${docNumber}] NO encontrado en STUDENT_DB.`);
    }

    // --- Error (Paso 4: Falla) ---
    console.log("--- FALLO DE LOGIN ---");
    loginError.style.display = 'block';
}

/**
 * (v6) Muestra el layout principal (sidebar + content) y oculta el login.
 * Actualiza el perfil en el sidebar.
 */
function showMainLayout() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-layout').style.display = 'block';
    
    // Actualizar perfil del Sidebar
    document.getElementById('sidebar-username').textContent = globalStudentName;
    document.getElementById('sidebar-userrole').textContent = globalStudentRole === 'admin' ? 'Administrador' : 'Estudiante';
    
    // Configurar visibilidad de navegación del sidebar
    const isAdmin = globalStudentRole === 'admin';
    document.getElementById('nav-student-dashboard').style.display = isAdmin ? 'none' : 'flex';
    document.getElementById('nav-admin-dashboard').style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('nav-admin-students').style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('nav-admin-stats').style.display = isAdmin ? 'flex' : 'none';
    document.getElementById('nav-admin-crud').style.display = isAdmin ? 'flex' : 'none';
}

/**
 * (v6) Muestra un panel de contenido específico y actualiza el sidebar.
 * @param {string} panelId El ID de la sección a mostrar (ej. 'student-dashboard-section')
 * @param {string} navId El ID del enlace de navegación a activar (ej. 'nav-student-dashboard')
 */
function showPanel(panelId, navId) {
    // Ocultar todos los paneles
    document.querySelectorAll('.dashboard-panel').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar el panel solicitado
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.style.display = 'block';
    }
    
    // Actualizar estado activo en sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    const navLink = document.getElementById(navId);
    if (navLink) {
        navLink.classList.add('active');
    }
    
    currentActivePanel = panelId;
    
    // Cerrar sidebar móvil después de la navegación
    toggleMobileSidebar(false);
}

/**
 * Cierra sesión y resetea la aplicación al estado de login.
 */
function logout(e) {
    if(e) e.preventDefault();
    
    // Limpiar datos
    CURRENT_STUDENT_DATA = null;
    CURRENT_STUDENT_REPORTS = [];
    globalStudentName = '';
    globalStudentRole = '';
    isAdminViewingReport = false;
    
    // (v6) Ocultar layout del dashboard y mostrar login
    document.getElementById('dashboard-layout').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
    
    // Ocultar todos los paneles para un reinicio limpio
    document.querySelectorAll('.dashboard-panel').forEach(section => {
        section.style.display = 'none';
    });

    // Limpiar campos de login
    document.getElementById('login-form').reset();
    document.getElementById('login-error').style.display = 'none';
}

/**
 * (v5.3) Muestra/Oculta la contraseña en el formulario de login.
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
 * (v6) Controla la visibilidad del sidebar en móvil.
 * @param {boolean} [forceOpen] - Opcional. Forzar apertura (true) o cierre (false).
 */
function toggleMobileSidebar(forceOpen = null) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    let isOpen;
    if (forceOpen !== null) {
        isOpen = !forceOpen; // Si queremos forzar apertura, fingimos que está cerrado
    } else {
        isOpen = sidebar.classList.contains('is-open');
    }

    if (isOpen) {
        // Cerrar
        sidebar.classList.remove('is-open');
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) {
            overlay.remove();
        }
    } else {
        // Abrir
        sidebar.classList.add('is-open');
        const overlay = document.createElement('div');
        overlay.id = 'sidebar-overlay';
        overlay.className = 'sidebar-overlay lg:hidden'; // 'lg:hidden' asegura que no se muestre en desktop
        document.body.appendChild(overlay);
    }
}


// --- 4. LÓGICA DEL DASHBOARD DE ESTUDIANTE ---

/**
 * Muestra el dashboard del estudiante.
 */
function showStudentDashboard() {
    showPanel('student-dashboard-section', 'nav-student-dashboard');

    const grid = document.getElementById('student-reports-grid');
    grid.innerHTML = ''; // Limpiar
    
    if (!CURRENT_STUDENT_REPORTS || CURRENT_STUDENT_REPORTS.length === 0) {
        grid.innerHTML = '<p class="text-gray-600 col-span-full">No tienes informes disponibles todavía.</p>';
        return;
    }

    // Ordenar por fecha (más reciente primero)
    const sortedReports = [...CURRENT_STUDENT_REPORTS].sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    sortedReports.forEach(report => {
        const testInfo = TEST_INDEX[report.test_id];
        if (!testInfo) return; // Omitir si la prueba no está en el índice

        const cardHTML = `
            <div class="report-card" data-testid="${report.test_id}">
                <h3 class="text-xl font-bold text-brand-header mb-2">${testInfo.name}</h3>
                <p class="text-sm text-gray-500 mb-4">Realizado el: ${new Date(report.test_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div class="mb-5">
                    <p class="text-sm font-medium text-gray-600">Puntaje Global</p>
                    <p class="text-5xl font-extrabold text-brand-secondary">${report.global_score}<span class="text-3xl font-medium text-gray-400">/500</span></p>
                </div>
                <button class="btn-primary w-full py-3">
                    Ver Informe Detallado
                    <i data-lucide="arrow-right" class="ml-2 h-4 w-4"></i>
                </button>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });

    // Renderizar gráfico de crecimiento
    renderGrowthChart(sortedReports, 'all');
    
    // Resetear filtros del gráfico
    document.querySelectorAll('#growth-chart-filters .chart-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === 'all') {
            btn.classList.add('active');
        }
    });

    lucide.createIcons(); // Actualizar iconos
}

/**
 * (v5.1) Renderiza la gráfica de crecimiento del estudiante.
 * @param {Array} studentReports - Array de reportes del estudiante (DEBE ESTAR PRE-ORDENADO)
 * @param {string} filterType - 'all', 'simulacro', o 'minisimulacro'
 */
function renderGrowthChart(studentReports, filterType = 'all') {
    const ctx = document.getElementById('growthChart')?.getContext('2d');
    if (!ctx) return;

    // 1. FILTRAR DATOS
    const filteredReports = studentReports.filter(report => {
        const testType = TEST_INDEX[report.test_id]?.type;
        if (filterType === 'all') return true;
        return testType === filterType;
    });

    // 2. PREPARAR DATOS PARA CHART.JS
    const chartData = filteredReports.map(report => ({
        x: new Date(report.test_date).valueOf(), // Usar timestamp para Chart.js
        y: parseInt(report.global_score, 10)
    }));
    
    // Invertir datos para que la fecha más antigua esté primero (Chart.js lo prefiere)
    chartData.reverse(); 

    // 3. RENDERIZAR GRÁFICO
    if (window.myGrowthChart instanceof Chart) {
        window.myGrowthChart.destroy();
    }

    window.myGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Puntaje Global',
                data: chartData,
                borderColor: 'var(--brand-secondary)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.3,
                borderWidth: 3,
                pointBackgroundColor: 'var(--brand-secondary)',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'dd MMM yyyy',
                        displayFormats: {
                            month: 'MMM yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Fecha de la Prueba'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Puntaje Global (0-500)'
                    },
                    min: 0,
                    max: 500,
                    grid: {
                        color: '#e5e7eb' // brand-border
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    padding: 12,
                    titleFont: { weight: 'bold' },
                    bodyFont: { size: 14 },
                    callbacks: {
                        title: (tooltipItems) => {
                            const date = new Date(tooltipItems[0].parsed.x);
                            return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
                        },
                        label: (tooltipItem) => {
                            return ` Puntaje: ${tooltipItem.parsed.y}`;
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}


// --- 5. LÓGICA DEL INFORME INDIVIDUAL ---

/**
 * Muestra el informe detallado de una prueba específica.
 * (v5.1) Modificado para aceptar datos de estudiante (para suplantación de admin)
 * @param {string} testId
 * @param {Object} [studentData=CURRENT_STUDENT_DATA] - Datos del estudiante (opcional)
 * @param {Array} [studentReports=CURRENT_STUDENT_REPORTS] - Reportes del estudiante (opcional)
 */
async function showIndividualReport(testId, studentData = CURRENT_STUDENT_DATA, studentReports = CURRENT_STUDENT_REPORTS) {
    // (v6) Mostrar el panel de informe
    showPanel('report-content-section', ''); // No hay enlace de sidebar para esto
    
    const reportHeader = document.getElementById('report-header');
    const reportBody = document.getElementById('report-body-content');
    const backBtn = document.getElementById('back-to-dashboard-btn');

    // Configurar botón de "Volver"
    backBtn.style.display = 'block';
    
    // Mostrar estado de carga
    reportHeader.querySelector('h1').textContent = 'Cargando informe...';
    reportHeader.querySelector('p').textContent = '';
    reportBody.innerHTML = `
        <div class="text-center py-10">
            <svg class="animate-spin h-8 w-8 text-brand-secondary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-3 text-gray-600">Cargando datos de la prueba...</p>
        </div>`;

    try {
        const testInfo = TEST_INDEX[testId];
        const report = studentReports.find(r => r.test_id === testId);
        if (!testInfo || !report || !studentData) {
            throw new Error("No se encontraron los datos del informe.");
        }

        // Cargar datos de la prueba (claves y respuestas)
        const { keys, answers } = await getTestAnswersAndKey(testId, studentData['Número de Documento']);
        
        // Cargar videos de retroalimentación
        const videoLinks = await getTestVideoLinks(testId);

        // Actualizar cabecera
        reportHeader.querySelector('h1').textContent = testInfo.name;
        reportHeader.querySelector('p').textContent = `Realizado el: ${new Date(report.test_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}`;
        
        // Generar HTML del informe
        const reportHTML = generateReportHTML(report, keys, answers, videoLinks, testId);
        reportBody.innerHTML = reportHTML;

        // Renderizar el Gráfico de Radar (Mejora 2)
        renderRadarChart(report, testId);
        
        // Inicializar iconos y listeners de los acordeones
        lucide.createIcons();
        setupAccordionListeners();

    } catch (error) {
        console.error("Error al mostrar informe individual:", error);
        reportBody.innerHTML = `<p class="text-brand-red text-center">Error al cargar el informe: ${error.message}</p>`;
    }
}

/**
 * (v5.1) Renderiza el Gráfico de Radar para el informe.
 */
function renderRadarChart(report, testId) {
    const radarCtx = document.getElementById('radarChart')?.getContext('2d');
    if (!radarCtx || !report) return;

    if (window.myRadarChart instanceof Chart) {
        window.myRadarChart.destroy();
    }
    
    window.myRadarChart = new Chart(radarCtx, {
        type: 'radar',
        data: {
            labels: ['Matemáticas', 'Lectura Crítica', 'Sociales', 'Ciencias', 'Inglés'],
            datasets: [{
                label: `Puntajes (0-100)`,
                data: [
                    report.mat_score,
                    report.lec_score,
                    report.soc_score,
                    report.cie_score,
                    report.ing_score
                ],
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    pointLabels: { font: { size: 13, weight: '600' } },
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
                    display: false
                }
            }
        }
    });
}

/**
 * Genera el HTML completo para el cuerpo de un informe.
 */
function generateReportHTML(report, keys, answers, videoLinks, testId) {
    const testInfo = TEST_INDEX[testId];
    
    // (v5) Función para Nivel de Desempeño
    const getLevel = (score) => {
        if (score >= 80) return { text: 'Avanzado', color: 'text-green-600' };
        if (score >= 60) return { text: 'Satisfactorio', color: 'text-blue-600' };
        if (score >= 40) return { text: 'Mínimo', color: 'text-yellow-600' };
        return { text: 'Insuficiente', color: 'text-red-600' };
    };
    
    const levels = {
        mat: getLevel(report.mat_score),
        lec: getLevel(report.lec_score),
        soc: getLevel(report.soc_score),
        cie: getLevel(report.cie_score),
        ing: getLevel(report.ing_score), // Simplificado
    };

    // (v5) Lógica de pestañas (Simulacro vs Minisimulacro)
    const isSimulacro = testInfo.type === 'simulacro';
    
    // Generar HTML de las pestañas
    const tabsHTML = isSimulacro ? `
        <div class="mb-6 border-b border-brand-border">
            <nav class="-mb-px flex space-x-6" aria-label="Tabs">
                <button class="tab-btn active" data-tab="sesion1">Sesión 1</button>
                <button class="tab-btn" data-tab="sesion2">Sesión 2</button>
                <button class="tab-btn" data-tab="videos">Videos de Retroalimentación</button>
            </nav>
        </div>
    ` : `
        <div class="mb-6 border-b border-brand-border">
            <nav class="-mb-px flex space-x-6" aria-label="Tabs">
                <button class="tab-btn active" data-tab="sesion1">Resultados Detallados</button>
                <button class="tab-btn" data-tab="videos">Videos de Retroalimentación</button>
            </nav>
        </div>
    `;

    // Generar HTML del feedback de preguntas
    const feedbackS1HTML = generateFeedbackTable(keys.s1 || keys, answers.s1 || answers);
    const feedbackS2HTML = isSimulacro ? generateFeedbackTable(keys.s2, answers.s2) : '';
    const videoHTML = generateVideoLinksHTML(videoLinks);

    // Contenido de las Pestañas
    const tabsContentHTML = `
        <div id="tab-content-sesion1" class="tab-content active">
            ${feedbackS1HTML}
        </div>
        ${isSimulacro ? `
        <div id="tab-content-sesion2" class="tab-content">
            ${feedbackS2HTML}
        </div>
        ` : ''}
        <div id="tab-content-videos" class="tab-content">
            ${videoHTML}
        </div>
    `;

    return `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Columna Izquierda: Puntajes y Radar -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Puntaje Global -->
                <div class="bg-brand-surface p-6 rounded-2xl shadow-lg text-center">
                    <p class="text-sm font-medium text-gray-600 uppercase tracking-wider">Puntaje Global</p>
                    <p class="text-7xl font-extrabold text-brand-secondary my-2">${report.global_score}<span class="text-4xl font-medium text-gray-400">/500</span></p>
                </div>
                
                <!-- (MEJORA 2) Gráfico de Radar -->
                <div class="bg-brand-surface p-6 rounded-2xl shadow-lg">
                    <h3 class="text-xl font-bold text-brand-header mb-4 text-center">
                        Perfil de Desempeño
                    </h3>
                    <div class="w-full max-w-sm mx-auto h-72">
                        <canvas id="radarChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Columna Derecha: Puntajes por Área -->
            <div class="lg:col-span-2 bg-brand-surface p-6 rounded-2xl shadow-lg">
                <h3 class="text-xl font-bold text-brand-header mb-6">Puntajes por Área</h3>
                <div class="space-y-5">
                    <!-- Matemáticas -->
                    <div class="score-area-card">
                        <div class="score-area-icon" style="--color: var(--color-matematicas);"><i data-lucide="calculator"></i></div>
                        <div>
                            <p class="font-bold text-lg text-brand-header">Matemáticas</p>
                            <p class="font-medium ${levels.mat.color}">${levels.mat.text}</p>
                        </div>
                        <div class="text-3xl font-bold ml-auto">${report.mat_score}<span class="text-xl text-gray-400">/100</span></div>
                    </div>
                    <!-- Lectura Crítica -->
                    <div class="score-area-card">
                        <div class="score-area-icon" style="--color: var(--color-lectura);"><i data-lucide="book-open"></i></div>
                        <div>
                            <p class="font-bold text-lg text-brand-header">Lectura Crítica</p>
                            <p class="font-medium ${levels.lec.color}">${levels.lec.text}</p>
                        </div>
                        <div class="text-3xl font-bold ml-auto">${report.lec_score}<span class="text-xl text-gray-400">/100</span></div>
                    </div>
                    <!-- Sociales -->
                    <div class="score-area-card">
                        <div class="score-area-icon" style="--color: var(--color-sociales);"><i data-lucide="landmark"></i></div>
                        <div>
                            <p class="font-bold text-lg text-brand-header">Sociales y Ciudadanas</p>
                            <p class="font-medium ${levels.soc.color}">${levels.soc.text}</p>
                        </div>
                        <div class="text-3xl font-bold ml-auto">${report.soc_score}<span class="text-xl text-gray-400">/100</span></div>
                    </div>
                    <!-- Ciencias -->
                    <div class="score-area-card">
                        <div class="score-area-icon" style="--color: var(--color-ciencias);"><i data-lucide="flask-conical"></i></div>
                        <div>
                            <p class="font-bold text-lg text-brand-header">Ciencias Naturales</p>
                            <p class="font-medium ${levels.cie.color}">${levels.cie.text}</p>
                        </div>
                        <div class="text-3xl font-bold ml-auto">${report.cie_score}<span class="text-xl text-gray-400">/100</span></div>
                    </div>
                    <!-- Inglés -->
                    <div class="score-area-card">
                        <div class="score-area-icon" style="--color: var(--color-ingles);"><i data-lucide="globe-2"></i></div>
                        <div>
                            <p class="font-bold text-lg text-brand-header">Inglés</p>
                            <p class="font-medium ${levels.ing.color}">${levels.ing.text}</p>
                        </div>
                        <div class="text-3xl font-bold ml-auto">${report.ing_score}<span class="text-xl text-gray-400">/100</span></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sección de Acordeones (Detalles) -->
        <div class="bg-brand-surface p-6 rounded-2xl shadow-lg mt-6">
            <h3 class="text-2xl font-bold text-brand-header mb-4">Análisis Detallado</h3>
            <!-- Pestañas (Simulacro vs Minisimulacro) -->
            ${tabsHTML}
            <!-- Contenido de las Pestañas -->
            ${tabsContentHTML}
        </div>
    `;
}

/**
 * Genera la tabla HTML para el feedback de preguntas de una sesión.
 */
function generateFeedbackTable(keys, answers) {
    if (!keys || !answers) return '<p class="text-gray-600">No hay datos de feedback disponibles para esta sesión.</p>';

    let tableHTML = `
        <div class="overflow-x-auto">
            <table class="w-full feedback-table">
                <thead>
                    <tr>
                        <th>Pregunta</th>
                        <th>Tu Respuesta</th>
                        <th>Respuesta Correcta</th>
                        <th>Resultado</th>
                    </tr>
                </thead>
                <tbody>
    `;

    for (const questionName in keys) {
        if (questionName.toLowerCase() === 'id' || questionName.toLowerCase() === 'email' || questionName.toLowerCase() === 'nombre') {
            continue;
        }

        const correctAnswer = keys[questionName]?.trim() || 'N/A';
        const userAnswer = answers[questionName]?.trim() || 'Omitida';
        
        const isCorrect = userAnswer === correctAnswer;
        
        tableHTML += `
            <tr>
                <td class="font-medium text-brand-header">${questionName}</td>
                <td class="${isCorrect ? 'text-muted' : 'highlight-incorrect'}">${userAnswer}</td>
                <td class="highlight-correct">${correctAnswer}</td>
                <td>
                    ${isCorrect 
                        ? '<i data-lucide="check-circle-2" class="icon-correct"></i>' 
                        : '<i data-lucide="x-circle" class="icon-incorrect"></i>'}
                </td>
            </tr>
        `;
    }

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;
    return tableHTML;
}

/**
 * Genera el HTML para los enlaces de video.
 */
function generateVideoLinksHTML(videoLinks) {
    if (!videoLinks || videoLinks.length === 0) {
        return '<p class="text-gray-600">No hay videos de retroalimentación disponibles para esta prueba.</p>';
    }

    let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
    
    videoLinks.forEach(link => {
        // (v5.1) Usar imagen de placeholder si no se define una
        const placeholderImg = `https://placehold.co/600x400/3B82F6/FFFFFF?text=${encodeURIComponent(link.subject)}`;
        const imgSrc = link.img || placeholderImg;

        html += `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="video-card-link">
                <div class="video-card-thumbnail">
                    <img src="${imgSrc}" alt="Miniatura de ${link.subject}" class="w-full h-full object-cover">
                </div>
                <div class="p-4">
                    <h4 class="font-bold text-brand-header">${link.subject}</h4>
                    <p class="text-sm text-gray-500">${link.range}</p>
                </div>
            </a>
        `;
    });
    
    html += '</div>';
    return html;
}

/**
 * (v5.1) Añade listeners a los acordeones y pestañas
 */
function setupAccordionListeners() {
    // Listeners para Pestañas
    const tabContainer = document.querySelector('.dashboard-panel.active');
    if (!tabContainer) return;

    const tabButtons = tabContainer.querySelectorAll('.tab-btn');
    const tabContents = tabContainer.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            // Ocultar todo
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Mostrar seleccionado
            button.classList.add('active');
            const activeContent = tabContainer.querySelector(`#tab-content-${tabId}`);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
}


// --- 6. LÓGICA DEL DASHBOARD DE ADMINISTRADOR ---

/**
 * (v6) Muestra el panel principal del dashboard de admin.
 */
function showAdminDashboard() {
    showPanel('admin-dashboard-section', 'nav-admin-dashboard');
    
    // (v5) Calcular y mostrar KPIs
    calculateAndShowAdminKPIs();
    
    // (v5) Renderizar gráficos (si no existen)
    if (!window.myAdminBarChart) {
        renderAdminBarChart();
    }
    if (!window.myAdminDoughnutChart) {
        renderAdminDoughnutChart();
    }
}

/**
 * (v6) Muestra el panel de gestión de estudiantes.
 */
function showAdminStudentsPanel() {
    showPanel('admin-students-section', 'nav-admin-students');
    
    // Poblar el selector de análisis (si existe)
    populateStatsTestSelect();

    // Resetear y renderizar la tabla
    currentAdminPage = 1;
    currentAdminSort = { column: 'Nombre Completo del Estudiante', direction: 'asc' };
    document.getElementById('admin-search-input').value = '';
    renderAdminTable();
}

/**
 * (v6) Muestra el panel de análisis estadístico.
 */
function showAdminStatsPanel() {
    showPanel('admin-stats-section', 'nav-admin-stats');
    
    // Poblar el selector de análisis
    populateStatsTestSelect();
    
    // Limpiar resultados anteriores
    document.getElementById('stats-results-container').style.display = 'none';
    document.getElementById('stats-results-cards-grid').innerHTML = '';
}

/**
 * (v6) Muestra el panel de CRUD.
 */
function showAdminCrudPanel() {
    showPanel('admin-crud-section', 'nav-admin-crud');
    
    // Limpiar formulario y estado
    document.getElementById('add-student-form').reset();
    const statusEl = document.getElementById('crud-status');
    statusEl.style.display = 'none';
    statusEl.textContent = '';
}

/**
 * (v5) Calcula y muestra las tarjetas de KPI del admin.
 */
function calculateAndShowAdminKPIs() {
    // KPI 1: Total Estudiantes
    const totalStudents = ALL_STUDENTS_ARRAY.length;
    document.getElementById('admin-kpi-students').textContent = totalStudents;
    
    // KPI 2: Total Pruebas
    const totalTests = Object.keys(TEST_INDEX).length;
    document.getElementById('admin-kpi-tests').textContent = totalTests;
    
    // KPIs 3 y 4: Promedios
    let simCount = 0, simTotal = 0;
    let miniCount = 0, miniTotal = 0;

    SCORES_DB.forEach(score => {
        const testType = TEST_INDEX[score.test_id]?.type;
        const globalScore = parseInt(score.global_score, 10);
        if (testType === 'simulacro') {
            simTotal += globalScore;
            simCount++;
        } else if (testType === 'minisimulacro') {
            miniTotal += globalScore;
            miniCount++;
        }
    });

    const avgSim = simCount > 0 ? (simTotal / simCount).toFixed(0) : 'N/A';
    const avgMini = miniCount > 0 ? (miniTotal / miniCount).toFixed(0) : 'N/A';

    document.getElementById('admin-kpi-avg-sim').textContent = avgSim;
    document.getElementById('admin-kpi-avg-mini').textContent = avgMini;
}

/**
 * (v5) Renderiza el gráfico de barras (promedio por materia) del admin.
 */
function renderAdminBarChart() {
    const ctx = document.getElementById('adminBarChart')?.getContext('2d');
    if (!ctx) return;

    // Calcular promedios
    let totals = { mat: 0, lec: 0, soc: 0, cie: 0, ing: 0 };
    const count = SCORES_DB.length;
    
    if (count === 0) return;

    SCORES_DB.forEach(score => {
        totals.mat += parseInt(score.mat_score, 10);
        totals.lec += parseInt(score.lec_score, 10);
        totals.soc += parseInt(score.soc_score, 10);
        totals.cie += parseInt(score.cie_score, 10);
        totals.ing += parseInt(score.ing_score, 10);
    });

    const avgs = [
        (totals.mat / count).toFixed(0),
        (totals.lec / count).toFixed(0),
        (totals.soc / count).toFixed(0),
        (totals.cie / count).toFixed(0),
        (totals.ing / count).toFixed(0)
    ];

    window.myAdminBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mat', 'Lec', 'Soc', 'Cie', 'Ing'],
            datasets: [{
                label: 'Promedio General (0-100)',
                data: avgs,
                backgroundColor: [
                    'var(--color-matematicas)',
                    'var(--color-lectura)',
                    'var(--color-sociales)',
                    'var(--color-ciencias)',
                    'var(--color-ingles)'
                ],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: '#e5e7eb' }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

/**
 * (v5) Renderiza el gráfico de dona (distribución de puntajes) del admin.
 */
function renderAdminDoughnutChart() {
    const ctx = document.getElementById('adminDoughnutChart')?.getContext('2d');
    if (!ctx) return;

    let ranges = {
        '0-200': 0,
        '201-250': 0,
        '251-300': 0,
        '301-350': 0,
        '351-400': 0,
        '401-500': 0
    };

    SCORES_DB.forEach(score => {
        const s = parseInt(score.global_score, 10);
        if (s <= 200) ranges['0-200']++;
        else if (s <= 250) ranges['201-250']++;
        else if (s <= 300) ranges['251-300']++;
        else if (s <= 350) ranges['301-350']++;
        else if (s <= 400) ranges['351-400']++;
        else ranges['401-500']++;
    });

    window.myAdminDoughnutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(ranges),
            datasets: [{
                label: '# de Estudiantes',
                data: Object.values(ranges),
                backgroundColor: [
                    '#ef4444', // red-500
                    '#f97316', // orange-500
                    '#eab308', // yellow-500
                    '#84cc16', // lime-500
                    '#22c55e', // green-500
                    '#14b8a6', // teal-500
                ],
                borderColor: 'var(--brand-surface)',
                borderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

/**
 * Renderiza la tabla de estudiantes del admin, aplicando filtros, orden y paginación.
 */
function renderAdminTable() {
    const tableBody = document.getElementById('admin-table-body');
    const paginationControls = document.getElementById('admin-pagination-controls');
    if (!tableBody || !paginationControls) return;

    // 1. Filtrar
    const searchTerm = document.getElementById('admin-search-input').value.toLowerCase();
    const filteredStudents = ALL_STUDENTS_ARRAY.filter(student => 
        student['Nombre Completo del Estudiante'].toLowerCase().includes(searchTerm) ||
        student['Número de Documento'].toLowerCase().includes(searchTerm)
    );

    // 2. Ordenar
    const sortKey = currentAdminSort.column;
    const sortDir = currentAdminSort.direction;
    filteredStudents.sort((a, b) => {
        let valA = a[sortKey] || '';
        let valB = b[sortKey] || '';
        
        // (v5.1) Asegurar que la comparación sea numérica si es documento
        if (sortKey === 'Número de Documento') {
            valA = parseInt(valA, 10) || 0;
            valB = parseInt(valB, 10) || 0;
            return sortDir === 'asc' ? valA - valB : valB - valA;
        } else {
            valA = valA.toString().toLowerCase();
            valB = valB.toString().toLowerCase();
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
    });
    
    // (v5.1) Actualizar iconos de ordenamiento en cabecera
    document.querySelectorAll('#admin-students-section .table-header').forEach(th => {
        th.classList.remove('sorted');
        th.querySelector('.sort-icon')?.remove();
        if (th.dataset.sort === sortKey) {
            th.classList.add('sorted');
            const icon = sortDir === 'asc' ? 'chevron-up' : 'chevron-down';
            th.innerHTML += ` <i data-lucide="${icon}" class="sort-icon h-4 w-4"></i>`;
        }
    });

    // 3. Paginar
    const totalPages = Math.ceil(filteredStudents.length / ADMIN_ROWS_PER_PAGE);
    const startIndex = (currentAdminPage - 1) * ADMIN_ROWS_PER_PAGE;
    const endIndex = startIndex + ADMIN_ROWS_PER_PAGE;
    const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

    // 4. Renderizar Tabla
    tableBody.innerHTML = '';
    if (paginatedStudents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-500 py-10">No se encontraron estudiantes.</td></tr>`;
    } else {
        paginatedStudents.forEach(student => {
            const docNumber = student['Número de Documento'];
            tableBody.innerHTML += `
                <tr class="hover:bg-gray-50">
                    <td class="table-cell font-medium text-brand-header">${student['Nombre Completo del Estudiante']}</td>
                    <td class="table-cell text-gray-600">${docNumber}</td>
                    <td class="table-cell text-gray-600">${student['Email']}</td>
                    <td class="table-cell text-gray-600">${student['Colegio/institución']}</td>
                    <td class="table-cell text-center">
                        <button class="btn-icon view-student-history-btn" data-student-id="${docNumber}" title="Ver Historial de Informes">
                            <i data-lucide="eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // 5. Renderizar Paginación
    renderAdminPagination(totalPages);
    
    // (v5.1) Actualizar iconos de Lucide
    lucide.createIcons();
}

/**
 * Renderiza los controles de paginación para la tabla de admin.
 */
function renderAdminPagination(totalPages) {
    const controls = document.getElementById('admin-pagination-controls');
    controls.innerHTML = '';
    if (totalPages <= 1) return;

    // Botón "Anterior"
    controls.innerHTML += `
        <button class="pagination-btn" data-page="${currentAdminPage - 1}" ${currentAdminPage === 1 ? 'disabled' : ''}>
            <i data-lucide="chevron-left" class="h-5 w-5"></i>
        </button>
    `;

    // (v5.1) Lógica de "..." para paginación
    const pagesToShow = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pagesToShow.push(i);
    } else {
        pagesToShow.push(1);
        if (currentAdminPage > 3) pagesToShow.push('...');
        
        let start = Math.max(2, currentAdminPage - 1);
        let end = Math.min(totalPages - 1, currentAdminPage + 1);

        if (currentAdminPage <= 3) end = 3;
        if (currentAdminPage >= totalPages - 2) start = totalPages - 2;

        for (let i = start; i <= end; i++) pagesToShow.push(i);
        
        if (currentAdminPage < totalPages - 2) pagesToShow.push('...');
        pagesToShow.push(totalPages);
    }

    // Botones de Página
    pagesToShow.forEach(page => {
        if (page === '...') {
            controls.innerHTML += `<span class="pagination-btn" disabled>...</span>`;
        } else {
            controls.innerHTML += `
                <button class="pagination-btn ${page === currentAdminPage ? 'active' : ''}" data-page="${page}">
                    ${page}
                </button>
            `;
        }
    });

    // Botón "Siguiente"
    controls.innerHTML += `
        <button class="pagination-btn" data-page="${currentAdminPage + 1}" ${currentAdminPage === totalPages ? 'disabled' : ''}>
            <i data-lucide="chevron-right" class="h-5 w-5"></i>
        </button>
    `;
    
    lucide.createIcons();
}

/**
 * Muestra el historial de informes de un estudiante en un modal (para Admin).
 */
function showAdminStudentHistory(studentDocNumber) {
    const student = STUDENT_DB[studentDocNumber];
    if (!student) return;

    const modalBackdrop = document.getElementById('admin-modal-backdrop');
    const modalHeader = document.getElementById('admin-modal-header');
    const modalBody = document.getElementById('admin-modal-body');

    modalHeader.textContent = `Historial de: ${student['Nombre Completo del Estudiante']}`;
    modalBody.innerHTML = ''; // Limpiar

    const studentReports = SCORES_DB.filter(score => score.doc_number === studentDocNumber)
                                 .sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    if (studentReports.length === 0) {
        modalBody.innerHTML = '<p class="text-gray-600 text-center py-5">Este estudiante no tiene informes registrados.</p>';
    } else {
        let gridHTML = '<div class="grid grid-cols-1 md:grid-cols-2 gap-5">';
        studentReports.forEach(report => {
            const testInfo = TEST_INDEX[report.test_id];
            if (!testInfo) return;
            
            // (v5.1) Usar 'report-card' pero con data-doc-number
            gridHTML += `
                <div class="report-card cursor-pointer" data-testid="${report.test_id}" data-doc-number="${studentDocNumber}">
                    <h3 class="text-lg font-bold text-brand-header">${testInfo.name}</h3>
                    <p class="text-sm text-gray-500 mb-3">Realizado el: ${new Date(report.test_date).toLocaleDateString('es-CO')}</p>
                    <p class_alias="text-sm font-medium text-gray-600">Puntaje Global</p>
                    <p class="text-3xl font-bold text-brand-secondary">${report.global_score}</p>
                    <span class_alias="text-xs text-gray-500">Haz clic para ver el informe detallado</span>
                </div>
            `;
        });
        gridHTML += '</div>';
        modalBody.innerHTML = gridHTML;
    }

    openModal(modalBackdrop);
}


// --- 7. LÓGICA DE ANÁLISIS ESTADÍSTICO (MEJORA 1) ---

/**
 * (v5.1) Pobla el selector de pruebas en el panel de análisis.
 */
function populateStatsTestSelect() {
    const statsTestSelect = document.getElementById('stats-test-select');
    if (statsTestSelect && statsTestSelect.options.length <= 1) {
        statsTestSelect.innerHTML = '<option value="">Seleccione una prueba...</option>';
        for (const testId in TEST_INDEX) {
            const testName = TEST_INDEX[testId].name;
            statsTestSelect.innerHTML += `<option value="${testId}">${testName}</option>`;
        }
    }
}

/**
 * (v5.1) Manejador para el botón "Analizar".
 */
async function handleAnalyzeTest() {
    const statsTestSelectEl = document.getElementById('stats-test-select');
    const statsLoadingEl = document.getElementById('stats-loading');
    const statsResultsContainerEl = document.getElementById('stats-results-container');
    const statsResultsTitleEl = document.getElementById('stats-results-title');
    const statsResultsCardsGridEl = document.getElementById('stats-results-cards-grid');

    const testId = statsTestSelectEl.value;
    if (!testId) {
        alert('Por favor, seleccione una prueba para analizar.');
        return;
    }

    // Mostrar spinner y ocultar resultados anteriores
    statsLoadingEl.style.display = 'block';
    statsResultsContainerEl.style.display = 'none';
    statsResultsCardsGridEl.innerHTML = '';
    statsResultsTitleEl.textContent = `Resultados de Análisis: ${TEST_INDEX[testId].name}`;

    try {
        // 1. Analizar la prueba
        const analysisResults = await analyzeTestItems(testId);

        // 2. Renderizar los resultados
        renderStatsCards(analysisResults);

    } catch (error) {
        console.error(`Error analizando la prueba ${testId}:`, error);
        alert(`Error al analizar la prueba. Revise la consola.`);
    } finally {
        // Ocultar spinner y mostrar tarjetas
        statsLoadingEl.style.display = 'none';
        statsResultsContainerEl.style.display = 'block';
        lucide.createIcons(); // (v5) Actualizar iconos
    }
}

/**
 * (v5.1) Realiza el análisis estadístico de una prueba.
 * @param {string} testId
 * @returns {Object}
 */
async function analyzeTestItems(testId) {
    const testInfo = TEST_INDEX[testId];
    if (!testInfo) throw new Error(`No se encontró información para la prueba ${testId}`);

    const stats = {};
    const keysMap = {}; 
    const isSimulacro = testInfo.type === 'simulacro';
    
    const keysFiles = isSimulacro ? [testInfo.keys_s1, testInfo.keys_s2] : [testInfo.keys];
    const answersFiles = isSimulacro ? [testInfo.answers_s1, testInfo.answers_s2] : [testInfo.answers];

    // --- 1. Cargar y mapear claves ---
    for (const keysPath of keysFiles) {
        if (!keysPath) continue;
        const keysData = await fetchAndParseCSV(`${BASE_DATA_URL}${keysPath}`);
        
        const keysHeaders = Object.keys(keysData[0]);
        const keysValues = keysData[0];
        
        for(const header of keysHeaders) {
            if (header.toLowerCase() === 'id' || header.toLowerCase() === 'email' || header.toLowerCase() === 'nombre') continue;
            
            const cleanHeader = header.trim();
            const cleanKey = keysValues[header]?.trim() || 'N/A';
            
            keysMap[cleanHeader] = cleanKey;
            stats[cleanHeader] = {
                pregunta: cleanHeader,
                correcta: cleanKey,
                A: 0, B: 0, C: 0, D: 0, Omision: 0,
                total: 0,
                correctas: 0
            };
        }
    }

    // --- 2. Procesar Respuestas de TODOS los estudiantes ---
    for (const answersPath of answersFiles) {
        if (!answersPath) continue;
        const answersData = await fetchAndParseCSV(`${BASE_DATA_URL}${answersPath}`);

        for (const studentRow of answersData) {
            for (const questionHeader in keysMap) {
                if (studentRow.hasOwnProperty(questionHeader)) {
                    
                    const studentAnswer = (studentRow[questionHeader] || 'OMISION').trim().toUpperCase();
                    const correctAnswer = keysMap[questionHeader];
                    const statsEntry = stats[questionHeader];
                    
                    if (!statsEntry) continue; // Seguridad

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
    }
    
    return stats;
}

/**
 * (v5.1) Renderiza los resultados del análisis en TARJETAS (diseño mejorado).
 * @param {Object} stats
 */
function renderStatsCards(stats) {
    const gridEl = document.getElementById('stats-results-cards-grid');
    gridEl.innerHTML = '';
    
    // (v5.1) Ordenar por nombre de pregunta
    const sortedQuestions = Object.keys(stats).sort((a, b) => {
        // Extraer números para ordenar correctamente (ej. "Mat [1.]" vs "Mat [10.]")
        const numA = parseInt(a.match(/\[(\d+)\.*\]/)?.[1] || 0, 10);
        const numB = parseInt(b.match(/\[(\d+)\.*\]/)?.[1] || 0, 10);
        return numA - numB;
    });

    for (const pregunta of sortedQuestions) {
        const item = stats[pregunta];
        if (item.total === 0) continue;

        // Calcular porcentajes
        const pctAcierto = ((item.correctas / item.total) * 100).toFixed(0);
        const pctOmision = ((item.Omision / item.total) * 100).toFixed(0);
        const pctA = ((item.A / item.total) * 100).toFixed(0);
        const pctB = ((item.B / item.total) * 100).toFixed(0);
        const pctC = ((item.C / item.total) * 100).toFixed(0);
        const pctD = ((item.D / item.total) * 100).toFixed(0);

        // Dificultad
        let dificultadClase = 'text-yellow-600';
        let dificultadTexto = 'Medio';
        if (pctAcierto >= 75) {
            dificultadClase = 'text-brand-green';
            dificultadTexto = 'Fácil';
        } else if (pctAcierto <= 35) {
            dificultadClase = 'text-brand-red';
            dificultadTexto = 'Difícil';
        }
        
        // Clases de resaltado
        const classA = item.correcta === 'A' ? 'correct' : '';
        const classB = item.correcta === 'B' ? 'correct' : '';
        const classC = item.correcta === 'C' ? 'correct' : '';
        const classD = item.correcta === 'D' ? 'correct' : '';

        const cardHTML = `
            <div class="stats-card">
                <div class="flex justify-between items-center mb-3">
                    <h4 class="text-lg font-bold text-brand-header">${item.pregunta}</h4>
                    <span class="text-sm font-bold text-brand-green">Correcta: ${item.correcta}</span>
                </div>
                <div class="space-y-4">
                    <div class="flex justify-between items-baseline">
                        <span class="text-sm font-medium text-gray-600">Acierto:</span>
                        <span class="text-2xl font-bold ${dificultadClase}">${pctAcierto}%</span>
                        <span class="text-sm font-medium text-gray-500">(${dificultadTexto})</span>
                    </div>
                     <div class="flex justify-between items-baseline">
                        <span class="text-sm font-medium text-gray-600">Omisión:</span>
                        <span class="text-2xl font-bold text-gray-700">${pctOmision}%</span>
                    </div>
                    
                    <hr class="my-3">
                    <h5 class="text-sm font-semibold text-gray-800">Distribución de Distractores:</h5>
                    
                    <div class="space-y-2">
                        <div class="distractor-bar ${classA}">
                            <span class="label">A: ${pctA}%</span>
                            <div class="bar" style="width: ${pctA}%;"></div>
                        </div>
                        <div class="distractor-bar ${classB}">
                            <span class="label">B: ${pctB}%</span>
                            <div class="bar" style="width: ${pctB}%;"></div>
                        </div>
                        <div class="distractor-bar ${classC}">
                            <span class="label">C: ${pctC}%</span>
                            <div class="bar" style="width: ${pctC}%;"></div>
                        </div>
                        <div class="distractor-bar ${classD}">
                            <span class="label">D: ${pctD}%</span>
                            <div class="bar" style="width: ${pctD}%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        gridEl.innerHTML += cardHTML;
    }
}


// --- 8. LÓGICA DEL CRUD (MEJORA 3) ---

/**
 * (v5.1) Maneja el envío del formulario de "Añadir Estudiante".
 * Guarda en caché local y abre el modal del token.
 */
async function handleAddStudentSubmit(e) {
    e.preventDefault();
    const statusEl = document.getElementById('crud-status');
    const buttonEl = document.getElementById('add-student-btn');
    
    buttonEl.disabled = true;
    statusEl.textContent = 'Validando...';
    statusEl.style.display = 'inline';
    statusEl.style.color = 'var(--brand-text)';

    try {
        // 1. Obtener datos del formulario
        const newStudent = {
            'Nombre Completo del Estudiante': document.getElementById('student-name').value.trim(),
            'Email': document.getElementById('student-email').value.trim(),
            'Tipo de Documento': document.getElementById('student-doc-type').value,
            'Número de Documento': document.getElementById('student-doc-number').value.trim(),
            'Fecha de Nacimiento': document.getElementById('student-birthdate').value.trim(),
            'Departamento': document.getElementById('student-department').value.trim(),
            'Colegio/institución': document.getElementById('student-school').value.trim(),
        };

        // 2. Validar
        if (!newStudent['Nombre Completo del Estudiante'] || !newStudent['Número de Documento'] || !newStudent['Fecha de Nacimiento']) {
            throw new Error('Nombre, Documento y Fecha de Nacimiento son obligatorios.');
        }

        // 3. Cargar el CSV de estudiantes actual (si no está en caché)
        if (!crudCache.studentDb) {
            statusEl.textContent = 'Cargando base de datos actual...';
            const fileData = await getGitHubFile(GITHUB_API_CONFIG.studentDbPath);
            crudCache.studentDb = atob(fileData.content); // Decodificar Base64
            crudCache.studentDbSha = fileData.sha;
        }

        // 4. Convertir la nueva fila a CSV
        // (v5.1) Usar PapaParse para generar la fila, asegurando comillas
        const newCsvRow = Papa.unparse([newStudent], {
            header: false, // No añadir cabecera
            quotes: true  // Poner comillas a todo
        });

        // 5. Guardar en caché local
        // (v5.1) Asegurarse de que haya un salto de línea
        let newContent = crudCache.studentDb;
        if (!newContent.endsWith('\n')) {
            newContent += '\n';
        }
        newContent += newCsvRow;
        
        localStorage.setItem('crud_pending_studentDb', newContent);
        
        // 6. Abrir modal para pedir token
        statusEl.textContent = 'Datos validados.';
        openModal(document.getElementById('github-token-modal'));

    } catch (error) {
        console.error('Error al preparar estudiante:', error);
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.style.color = 'var(--brand-red)';
    } finally {
        buttonEl.disabled = false;
    }
}

/**
 * (v5.1) Maneja la confirmación del token y el guardado en GitHub.
 */
async function handleConfirmGithubToken() {
    const tokenInput = document.getElementById('github-token-input');
    const token = tokenInput.value.trim();
    const errorEl = document.getElementById('github-token-error');
    const confirmBtn = document.getElementById('confirm-token-btn');

    if (!token) {
        errorEl.textContent = 'El token no puede estar vacío.';
        errorEl.style.display = 'block';
        return;
    }

    // Deshabilitar botón
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Guardando...';
    errorEl.style.display = 'none';

    try {
        // 1. Obtener el contenido pendiente de localStorage
        const newContent = localStorage.getItem('crud_pending_studentDb');
        if (!newContent) {
            throw new Error('No hay cambios pendientes para guardar.');
        }

        // 2. Codificar a Base64
        const newContentBase64 = btoa(unescape(encodeURIComponent(newContent))); // (v5.1) Seguro para UTF-8

        // 3. Obtener el SHA (del caché)
        const sha = crudCache.studentDbSha;
        if (!sha) {
            throw new Error('No se encontró el SHA del archivo. Intente recargar la página.');
        }

        // 4. Escribir (Hacer Commit) del nuevo archivo
        const commitMessage = `Commit automático: Añadidos nuevos estudiantes desde la plataforma.`;
        const { owner, repo, branch, studentDbPath } = GITHUB_API_CONFIG;
        
        await updateGitHubFile(studentDbPath, token, commitMessage, newContentBase64, sha, owner, repo, branch);

        // 5. Éxito
        closeModal(document.getElementById('github-token-modal'));
        tokenInput.value = '';
        localStorage.removeItem('crud_pending_studentDb');
        
        // Actualizar caché local para el próximo guardado
        crudCache.studentDb = newContent;
        // (v5.1) Es necesario recargar el SHA para el *próximo* commit
        const newFileData = await getGitHubFile(studentDbPath, token);
        crudCache.studentDbSha = newFileData.sha;
        
        // Actualizar UI
        const statusEl = document.getElementById('crud-status');
        statusEl.textContent = '¡Estudiante(s) guardado(s) con éxito!';
        statusEl.style.color = 'var(--brand-green)';
        document.getElementById('add-student-form').reset();
        
        // (v5.1) Recargar la base de datos de estudiantes en la app
        processStudentData(Papa.parse(newContent, { header: true, skipEmptyLines: true }).data);
        renderAdminTable(); // Refrescar la tabla

    } catch (error) {
        console.error('Error al guardar en GitHub:', error);
        errorEl.textContent = `Error al guardar: ${error.message}`;
        errorEl.style.display = 'block';
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirmar y Guardar';
    }
}

/**
 * (v5.1) Obtiene el contenido y 'sha' de un archivo de GitHub.
 */
async function getGitHubFile(filePath, token = null) {
    const { owner, repo, branch } = GITHUB_API_CONFIG;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
    
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache', // Asegurar datos frescos
        'Pragma': 'no-cache'
    };
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(apiUrl, { method: 'GET', headers });
    
    if (!response.ok) {
        throw new Error(`Error al leer archivo [${filePath}] de GitHub: ${response.statusText}`);
    }
    return await response.json(); // Devuelve { content: '...', sha: '...' }
}

/**
 * (v5.1) Actualiza (hace commit) de un archivo en GitHub.
 */
async function updateGitHubFile(filePath, token, commitMessage, contentBase64, sha, owner, repo, branch) {
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
            sha: sha,
            branch: branch
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al escribir archivo en GitHub: ${errorData.message || response.statusText}`);
    }
    return await response.json();
}


// --- 9. FUNCIONES UTILITARIAS ---

/**
 * (v5.1) Abre un modal.
 */
function openModal(modalBackdrop) {
    if (!modalBackdrop) return;
    modalBackdrop.style.display = 'flex';
    document.body.classList.add('modal-open');
    // Pequeño delay para permitir la transición de opacidad
    setTimeout(() => modalBackdrop.classList.add('is-open'), 10);
}

/**
 * (v5.1) Cierra un modal.
 */
function closeModal(modalBackdrop) {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    // Esperar a que termine la transición antes de ocultarlo
    setTimeout(() => modalBackdrop.style.display = 'none', 300); // 300ms (duración de la transición)
}

/**
 * Carga y parsea un archivo CSV desde una URL.
 * @param {string} url - La URL del archivo CSV.
 * @returns {Promise<Array<Object>>} - Una promesa que resuelve a un array de objetos.
 */
async function fetchAndParseCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data) {
                    resolve(results.data);
                } else {
                    reject(new Error(`Error al parsear CSV de ${url}: ${results.errors.join(', ')}`));
                }
            },
            error: (error) => {
                reject(new Error(`Error al descargar CSV de ${url}: ${error.message}`));
            }
        });
    });
}

/**
 * Carga los datos de una prueba (claves y respuestas del estudiante).
 * Usa la caché si está disponible.
 * @param {string} testId
 * @param {string} studentDocNumber
 * @returns {Promise<Object>} - { keys: {s1, s2}, answers: {s1, s2} }
 */
async function getTestAnswersAndKey(testId, studentDocNumber) {
    const testInfo = TEST_INDEX[testId];
    if (!testInfo) throw new Error("Índice de prueba no encontrado");

    const cacheKey = `${testId}_${studentDocNumber}`;
    if (CACHED_TEST_DATA[cacheKey]) {
        return CACHED_TEST_DATA[cacheKey];
    }

    const isSimulacro = testInfo.type === 'simulacro';
    let keys = {}, answers = {};

    // Cargar Claves
    if (isSimulacro) {
        const [keysS1, keysS2] = await Promise.all([
            fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.keys_s1}`),
            fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.keys_s2}`)
        ]);
        keys = { s1: keysS1[0], s2: keysS2[0] };
    } else {
        const keysData = await fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.keys}`);
        keys = keysData[0];
    }

    // Cargar Respuestas del Estudiante
    if (isSimulacro) {
        const [answersS1, answersS2] = await Promise.all([
            fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.answers_s1}`),
            fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.answers_s2}`)
        ]);
        answers = {
            s1: answersS1.find(row => row.ID.trim() === studentDocNumber),
            s2: answersS2.find(row => row.ID.trim() === studentDocNumber)
        };
    } else {
        const answersData = await fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.answers}`);
        answers = answersData.find(row => row.ID.trim() === studentDocNumber);
    }
    
    if (!answers || (!isSimulacro && !answers) || (isSimulacro && (!answers.s1 || !answers.s2))) {
        console.warn(`No se encontraron las respuestas del estudiante ${studentDocNumber} para la prueba ${testId}.`);
        // Continuar de todas formas para mostrar al menos las claves
    }

    const result = { keys, answers };
    CACHED_TEST_DATA[cacheKey] = result; // Guardar en caché
    return result;
}

/**
 * Carga y parsea el archivo de videos de retroalimentación.
 * @param {string} testId
 * @returns {Promise<Array<Object>>}
 */
async function getTestVideoLinks(testId) {
    const videoPath = TEST_INDEX[testId]?.videos;
    if (!videoPath) return [];

    const cacheKey = `videos_${testId}`;
    if (CACHED_TEST_DATA[cacheKey]) {
        return CACHED_TEST_DATA[cacheKey];
    }

    try {
        const response = await fetch(`${BASE_DATA_URL}${videoPath}?t=${TIMESTAMP}`);
        if (!response.ok) throw new Error("Archivo de video no encontrado.");
        
        const text = await response.text();
        const links = parseVideoText(text);
        
        CACHED_TEST_DATA[cacheKey] = links; // Guardar en caché
        return links;
    } catch (error) {
        console.error("Error cargando videos:", error);
        return [];
    }
}

/**
 * Parsea el texto de retroalimentación de video.
 * @param {string} text - El contenido del archivo bd_retro_...txt.
 * @returns {Array<Object>}
 */
function parseVideoText(text) {
    const links = [];
    const lines = text.split('\n');
    lines.forEach(line => {
        const parts = line.split(';');
        if (parts.length >= 3) {
            links.push({
                subject: parts[0].trim(),
                range: parts[1].trim(),
                url: parts[2].trim(),
                img: parts[3]?.trim() || null
            });
        }
    });
    return links;
}
