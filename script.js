/* ========================================================================
   PLATAFORMA DE INFORMES v7.0
   ------------------------------------------------------------------------
   Autor: Daniel Altamar (con Asistente de Programación)
   Fecha: 2025-11-07
   Descripción: Lógica principal para la plataforma de informes.
   (v7.0) - Actualización de diseño: Iconos de materias añadidos.
   ======================================================================== */

// --- 1. CONFIGURACIÓN GLOBAL Y VARIABLES DE ESTADO ---

const SUPER_USER_CREDENTIALS = { username: "admin", password: "admin2024" };
const BASE_DATA_URL = `https://raw.githubusercontent.com/daniel-alt-pages/backoup_informes/main/`;
const TIMESTAMP = Date.now(); // Cache-busting

// Rutas a los archivos de datos principales
const URLS = {
    studentDatabase: `${BASE_DATA_URL}database/student_database.csv?t=${TIMESTAMP}`,
    scoresDatabase: `${BASE_DATA_URL}database/scores_database.csv?t=${TIMESTAMP}`,
    testIndex: `${BASE_DATA_URL}database/test_index.json?t=${TIMESTAMP}`
};

// Almacenes de datos (Cargados al inicio)
let STUDENT_DB = {};           // Objeto para login rápido: { "docNumber": { ...datosEstudiante } }
let SCORES_DB = [];            // Array de TODOS los puntajes
let TEST_INDEX = {};           // Objeto con la info de test_index.json
let ALL_STUDENTS_ARRAY = [];   // Array para la tabla de admin

// Variables de estado de sesión
let CURRENT_USER_ROLE = null; // 'student' o 'admin'
let CURRENT_STUDENT_DATA = null; // Datos del estudiante que inició sesión
let CURRENT_STUDENT_REPORTS = []; // Reportes (de SCORES_DB) del estudiante actual

// Variables de estado de la UI (Admin)
let currentAdminPage = 1;
let adminRowsPerPage = 10;
let currentAdminFilter = "";
let currentAdminSort = { column: 'Nombre Completo del Estudiante', direction: 'asc' };
let filteredAdminStudents = [];

// Almacén para datos de pruebas cacheados (para no recargar CSVs)
let CACHED_TEST_DATA = {};
// Almacén para el CRUD de GitHub
let PENDING_CHANGES = {
    student_database: []
};

// Referencias al DOM (se poblarán en initializeDOMQueries)
const elements = {};


// --- 2. INICIALIZACIÓN DE LA APLICACIÓN ---

/**
 * Punto de entrada principal. Se dispara cuando el HTML y 
 * todas las librerías (Papa, Chart, lucide) están cargadas.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener referencias a todos los elementos del DOM
    initializeDOMQueries();
    
    // 2. Configurar todos los event listeners (clics, inputs, etc.)
    setupEventListeners();
    
    // 3. Iniciar la carga de datos
    loadAllData();
});

/**
 * Obtiene y almacena referencias a todos los elementos clave del DOM.
 */
function initializeDOMQueries() {
    // Pantallas principales
    elements.globalLoader = document.getElementById('global-loader');
    elements.loadingError = document.getElementById('loading-error-message');
    elements.loginScreen = document.getElementById('login-screen');
    elements.appContainer = document.getElementById('app-container');

    // Formulario de Login
    elements.loginForm = document.getElementById('login-form');
    elements.docType = document.getElementById('doc-type');
    elements.docNumber = document.getElementById('doc-number');
    elements.password = document.getElementById('password');
    elements.togglePassword = document.getElementById('toggle-password');
    elements.eyeIcon = document.getElementById('eye-icon');
    elements.eyeOffIcon = document.getElementById('eye-off-icon');
    elements.loginError = document.getElementById('login-error');

    // Layout Principal (Sidebar y Header)
    elements.sidebar = document.getElementById('sidebar');
    elements.sidebarOverlay = document.getElementById('sidebar-overlay');
    elements.sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    elements.sidebarOpenBtn = document.getElementById('sidebar-open-btn');
    elements.mainContent = document.getElementById('main-content');
    elements.mainContentTitle = document.getElementById('main-content-title');
    elements.userNameHeader = document.getElementById('user-name-header');
    elements.userRoleHeader = document.getElementById('user-role-header');
    elements.userAvatarHeader = document.getElementById('user-avatar-header');
    elements.logoutBtn = document.getElementById('logout-btn');
    elements.navLinks = document.querySelectorAll('.nav-link');
    elements.navSections = {
        student: document.querySelectorAll('.nav-section.student-nav'),
        admin: document.querySelectorAll('.nav-section.admin-nav')
    };

    // Secciones de Contenido
    elements.appSections = document.querySelectorAll('.app-section');
    elements.studentDashboard = document.getElementById('student-dashboard-section');
    elements.studentReport = document.getElementById('student-report-section');
    elements.adminDashboard = document.getElementById('admin-dashboard-section');
    elements.adminStudents = document.getElementById('admin-students-section');
    elements.adminStats = document.getElementById('admin-stats-section');
    elements.adminCrud = document.getElementById('admin-crud-section');
    
    // Dashboard Estudiante
    elements.studentReportsContainer = document.getElementById('student-reports-container');
    elements.showGrowthChartBtn = document.getElementById('show-growth-chart-btn');

    // Informe Individual Estudiante
    elements.backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
    elements.reportTitle = document.getElementById('report-title');
    elements.reportDate = document.getElementById('report-date');
    elements.reportContentContainer = document.getElementById('report-content-container');

    // Dashboard Admin (KPIs y Gráficos)
    elements.kpiTotalStudents = document.getElementById('kpi-total-students');
    elements.kpiAvgGlobal = document.getElementById('kpi-avg-global');
    elements.kpiAvgSimulacros = document.getElementById('kpi-avg-simulacros');
    elements.kpiAvgMinis = document.getElementById('kpi-avg-minis');
    elements.adminAvgSubjectsChart = document.getElementById('admin-avg-subjects-chart');
    elements.adminGlobalScoreDistChart = document.getElementById('admin-global-score-dist-chart');

    // Gestión Estudiantes (Admin)
    elements.adminStudentSearch = document.getElementById('admin-student-search');
    elements.adminPaginationControls = document.getElementById('admin-pagination-controls');
    elements.adminStudentTableBody = document.getElementById('admin-student-table-body');
    elements.adminNoResults = document.getElementById('admin-no-results');
    elements.adminTableHeaders = document.querySelectorAll('#admin-students-section .table-header');

    // Análisis de Ítems (Admin)
    elements.statsTestSelect = document.getElementById('stats-test-select');
    elements.statsSubjectFilter = document.getElementById('stats-subject-filter');
    elements.statsAnalyzeBtn = document.getElementById('stats-analyze-btn');
    elements.statsLoading = document.getElementById('stats-loading');
    elements.statsResultsContainer = document.getElementById('stats-results-container');
    elements.statsResultsTitle = document.getElementById('stats-results-title');
    elements.statsResultsCardsContainer = document.getElementById('stats-results-cards-container');

    // CRUD (Admin)
    elements.addStudentForm = document.getElementById('add-student-form');
    elements.pendingChangesContainer = document.getElementById('pending-changes-container');
    elements.noPendingChanges = document.getElementById('no-pending-changes');
    elements.clearCacheBtn = document.getElementById('clear-cache-btn');
    elements.saveChangesBtn = document.getElementById('save-changes-btn');

    // Modals
    elements.growthChartModal = document.getElementById('growth-chart-modal');
    elements.growthChartFilters = document.getElementById('growth-chart-filters');
    elements.growthChartCanvas = document.getElementById('growthChart');
    
    elements.adminStudentModal = document.getElementById('admin-student-modal');
    elements.adminStudentModalTitle = document.getElementById('admin-student-modal-title');
    elements.adminStudentModalBody = document.getElementById('admin-student-modal-body');

    elements.githubTokenModal = document.getElementById('github-token-modal');
    elements.githubTokenInput = document.getElementById('github-token-input');
    elements.githubTokenError = document.getElementById('github-token-error');
    elements.githubTokenConfirmBtn = document.getElementById('github-token-confirm-btn');
    
    elements.modalCloseBtns = document.querySelectorAll('.modal-close-btn');
}

/**
 * Configura todos los event listeners para la aplicación.
 */
function setupEventListeners() {
    // Login
    elements.loginForm?.addEventListener('submit', handleLogin);
    elements.togglePassword?.addEventListener('click', togglePasswordVisibility);

    // Navegación Principal (Sidebar y Header)
    elements.sidebarOpenBtn?.addEventListener('click', openSidebar);
    elements.sidebarCloseBtn?.addEventListener('click', closeSidebar);
    elements.sidebarOverlay?.addEventListener('click', closeSidebar);
    elements.logoutBtn?.addEventListener('click', handleLogout);

    // Navegación de Secciones
    elements.navLinks?.forEach(link => {
        link.addEventListener('click', (e) => handleNavigation(e, link.id));
    });

    // Dashboard Estudiante
    elements.showGrowthChartBtn?.addEventListener('click', () => showModal(elements.growthChartModal));
    elements.studentReportsContainer?.addEventListener('click', (e) => {
        const card = e.target.closest('.report-card');
        if (card && card.dataset.testid) {
            showIndividualReport(card.dataset.testid);
        }
    });

    // Informe Individual
    elements.backToDashboardBtn?.addEventListener('click', () => showStudentDashboard());

    // Dashboard Admin (Gestión Estudiantes)
    elements.adminStudentSearch?.addEventListener('input', (e) => {
        currentAdminFilter = e.target.value;
        currentAdminPage = 1;
        renderAdminStudentTable();
    });
    elements.adminPaginationControls?.addEventListener('click', (e) => {
        if (e.target.dataset.page) {
            currentAdminPage = parseInt(e.target.dataset.page, 10);
            renderAdminStudentTable();
        }
    });
    elements.adminTableHeaders?.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            if (currentAdminSort.column === column) {
                currentAdminSort.direction = currentAdminSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentAdminSort.column = column;
                currentAdminSort.direction = 'asc';
            }
            renderAdminStudentTable();
        });
    });
    elements.adminStudentTableBody?.addEventListener('click', (e) => {
        const viewButton = e.target.closest('.view-student-history-btn');
        if (viewButton) {
            showAdminStudentHistory(viewButton.dataset.docNumber);
        }
    });

    // Dashboard Admin (Análisis de Ítems)
    elements.statsAnalyzeBtn?.addEventListener('click', handleAnalyzeItems);

    // CRUD Admin
    elements.addStudentForm?.addEventListener('submit', handleAddStudentSubmit);
    elements.saveChangesBtn?.addEventListener('click', () => showModal(elements.githubTokenModal));
    elements.githubTokenConfirmBtn?.addEventListener('click', handleSaveChanges);
    elements.clearCacheBtn?.addEventListener('click', clearPendingChanges);
    loadPendingChanges(); // Cargar cambios pendientes al inicio

    // Modals
    elements.modalCloseBtns?.forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.closest('.modal-backdrop')));
    });
    elements.growthChartFilters?.addEventListener('click', (e) => {
        if (e.target.classList.contains('chart-filter-btn')) {
            elements.growthChartFilters.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderGrowthChart(e.target.dataset.filter);
        }
    });
    elements.adminStudentModalBody?.addEventListener('click', (e) => {
        const card = e.target.closest('.report-card');
        if (card && card.dataset.testid && card.dataset.docnumber) {
            handleAdminViewReport(card.dataset.docnumber, card.dataset.testid);
        }
    });
}


// --- 3. LÓGICA DE CARGA DE DATOS ---

/**
 * Carga todos los datos base (JSON y CSVs principales) al iniciar la app.
 */
async function loadAllData() {
    try {
        const [testIndexData, scoresData, studentData] = await Promise.all([
            fetchJSON(URLS.testIndex),
            fetchAndParseCSV(URLS.scoresDatabase),
            fetchAndParseCSV(URLS.studentDatabase)
        ]);

        // Procesar Test Index
        TEST_INDEX = testIndexData;
        console.log("Índice de Pruebas cargado:", TEST_INDEX);
        
        // Procesar Scores DB
        SCORES_DB = scoresData.map(score => ({
            ...score,
            global_score: parseInt(score.global_score, 10),
            mat_score: parseInt(score.mat_score, 10),
            lec_score: parseInt(score.lec_score, 10),
            soc_score: parseInt(score.soc_score, 10),
            cie_score: parseInt(score.cie_score, 10),
            ing_score: parseInt(score.ing_score, 10)
        }));
        console.log("Base de datos de Puntajes cargada:", SCORES_DB.length, "registros");

        // Procesar Student DB
        ALL_STUDENTS_ARRAY = [];
        studentData.forEach(student => {
            // Limpiar datos que vienen del CSV
            const docNumber = student["Número de Documento"]?.trim();
            if (docNumber) {
                const cleanedStudent = {
                    "Nombre Completo del Estudiante": student["Nombre Completo del Estudiante"]?.trim(),
                    "Email": student["Email"]?.trim(),
                    "Tipo de Documento": student["Tipo de Documento"]?.trim(),
                    "Número de Documento": docNumber,
                    "Fecha de Nacimiento": student["Fecha de Nacimiento"]?.trim(), // Esta es la contraseña
                    "Departamento": student["Departamento"]?.trim(),
                    "Colegio/institución": student["Colegio/institución"]?.trim()
                };
                
                STUDENT_DB[docNumber] = cleanedStudent;
                ALL_STUDENTS_ARRAY.push(cleanedStudent);
            }
        });
        console.log("Base de datos de Estudiantes cargada:", ALL_STUDENTS_ARRAY.length, "usuarios");
        filteredAdminStudents = [...ALL_STUDENTS_ARRAY]; // Inicializar filtro de admin

        // Éxito: Ocultar loader y mostrar login
        elements.globalLoader?.classList.add('opacity-0', 'invisible');
        elements.loginScreen?.classList.remove('hidden');

    } catch (error) {
        console.error("Error fatal durante la carga de datos:", error);
        elements.loadingError?.classList.remove('hidden');
    }
}

/**
 * Función helper para cargar y parsear un archivo JSON.
 * @param {string} url - La URL del archivo JSON.
 * @returns {Promise<object>}
 */
async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error cargando JSON: ${url}`);
    return await response.json();
}

/**
 * Función helper para cargar y parsear un archivo CSV usando PapaParse.
 * @param {string} url - La URL del archivo CSV.
 * @returns {Promise<Array<object>>}
 */
function fetchAndParseCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length) {
                    reject(new Error(`Error parseando CSV: ${results.errors[0].message}`));
                } else {
                    resolve(results.data);
                }
            },
            error: (error) => {
                reject(new Error(`Error descargando CSV: ${error.message}`));
            }
        });
    });
}

/**
 * Carga los datos de una prueba específica (claves y respuestas) bajo demanda.
 * Utiliza caché para evitar recargas.
 * @param {string} testId - El ID de la prueba (ej. "sg11_07").
 * @returns {Promise<object>} - Un objeto con los datos de la prueba.
 */
async function getTestAnswersAndKey(testId) {
    // 1. Revisar caché
    if (CACHED_TEST_DATA[testId]) {
        return CACHED_TEST_DATA[testId];
    }

    const testInfo = TEST_INDEX[testId];
    if (!testInfo) throw new Error(`No se encontró info para la prueba ${testId}`);

    const isSimulacro = testInfo.type === 'simulacro';
    const dataToLoad = {};

    try {
        if (isSimulacro) {
            // Cargar 4 archivos para simulacro
            const [ans1, ans2, key1, key2] = await Promise.all([
                fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.answers_s1}`),
                fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.answers_s2}`),
                fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.keys_s1}`),
                fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.keys_s2}`)
            ]);
            dataToLoad.answers_s1 = ans1;
            dataToLoad.answers_s2 = ans2;
            dataToLoad.key_s1 = key1[0]; // Las claves son solo la primera fila
            dataToLoad.key_s2 = key2[0];
        } else {
            // Cargar 2 archivos para minisimulacro
            const [ans, key] = await Promise.all([
                fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.answers}`),
                fetchAndParseCSV(`${BASE_DATA_URL}${testInfo.keys}`)
            ]);
            dataToLoad.answers = ans;
            dataToLoad.key = key[0];
        }
        
        // Cargar archivo de videos (si existe)
        if (testInfo.videos) {
            const videoResponse = await fetch(`${BASE_DATA_URL}${testInfo.videos}?t=${TIMESTAMP}`);
            if (videoResponse.ok) {
                dataToLoad.videos = await videoResponse.text();
            }
        }

        // 2. Guardar en caché
        CACHED_TEST_DATA[testId] = dataToLoad;
        return dataToLoad;

    } catch (error) {
        console.error(`Error cargando datos para la prueba ${testId}:`, error);
        throw error;
    }
}


// --- 4. LÓGICA DE AUTENTICACIÓN Y NAVEGACIÓN ---

/**
 * Maneja el envío del formulario de login.
 */
function handleLogin(e) {
    e.preventDefault();
    elements.loginError?.classList.add('hidden');

    const docType = elements.docType?.value;
    const docNumber = elements.docNumber?.value.trim();
    const password = elements.password?.value.trim();

    // 1. Validar Admin
    if (docNumber === SUPER_USER_CREDENTIALS.username && password === SUPER_USER_CREDENTIALS.password) {
        CURRENT_USER_ROLE = 'admin';
        CURRENT_STUDENT_DATA = { "Nombre Completo del Estudiante": "Administrador" };
        initializeApp();
        return;
    }

    // 2. Validar Estudiante
    const studentData = STUDENT_DB[docNumber];
    if (studentData && studentData["Tipo de Documento"] === docType && studentData["Fecha de Nacimiento"] === password) {
        CURRENT_USER_ROLE = 'student';
        CURRENT_STUDENT_DATA = studentData;
        // Filtrar solo los reportes de este estudiante
        CURRENT_STUDENT_REPORTS = SCORES_DB.filter(score => score.doc_number === docNumber);
        initializeApp();
        return;
    }

    // 3. Fallo de Login
    elements.loginError?.classList.remove('hidden');
    elements.loginForm?.classList.add('animate-shake');
    setTimeout(() => elements.loginForm?.classList.remove('animate-shake'), 500);
}

/**
 * Inicializa la aplicación después de un login exitoso.
 */
function initializeApp() {
    console.log(`Iniciando sesión como: ${CURRENT_USER_ROLE}`);
    
    // Configurar Header
    const name = CURRENT_STUDENT_DATA["Nombre Completo del Estudiante"];
    elements.userNameHeader.textContent = name;
    elements.userAvatarHeader.textContent = name.substring(0, 1).toUpperCase();
    
    // Configurar Sidebar y mostrar la app
    if (CURRENT_USER_ROLE === 'admin') {
        elements.userRoleHeader.textContent = "Administrador";
        elements.navSections.admin.forEach(el => el.style.display = 'block');
        elements.navSections.student.forEach(el => el.style.display = 'none');
        showAdminDashboard();
    } else {
        elements.userRoleHeader.textContent = "Estudiante";
        elements.navSections.admin.forEach(el => el.style.display = 'none');
        elements.navSections.student.forEach(el => el.style.display = 'block');
        showStudentDashboard();
    }

    // Ocultar login y mostrar app
    elements.loginScreen?.classList.add('hidden');
    elements.appContainer?.classList.remove('hidden');
    
    // (DISEÑO v7.0) Llamar a createIcons DESPUÉS de mostrar la app
    lucide.createIcons();
}

/**
 * Maneja el clic en los enlaces de navegación del sidebar.
 */
function handleNavigation(e, navId) {
    e.preventDefault();
    
    // Resaltar link activo
    elements.navLinks.forEach(link => link.classList.remove('active'));
    document.getElementById(navId)?.classList.add('active');

    // Ocultar todas las secciones
    elements.appSections.forEach(section => section.classList.add('hidden'));

    // Mostrar la sección correspondiente
    switch (navId) {
        // Estudiante
        case 'nav-student-dashboard':
            showStudentDashboard();
            break;
        case 'nav-student-growth':
            showModal(elements.growthChartModal);
            break;
        // Admin
        case 'nav-admin-dashboard':
            showAdminDashboard();
            break;
        case 'nav-admin-students':
            showAdminStudents();
            break;
        case 'nav-admin-stats':
            showAdminStats();
            break;
        case 'nav-admin-crud':
            showAdminCrud();
            break;
    }

    closeSidebar(); // Cerrar sidebar en móvil después de navegar
}

/**
 * Maneja el cierre de sesión.
 */
function handleLogout() {
    // Limpiar estado
    CURRENT_USER_ROLE = null;
    CURRENT_STUDENT_DATA = null;
    CURRENT_STUDENT_REPORTS = [];
    CACHED_TEST_DATA = {};
    
    // Resetear UI
    elements.appContainer?.classList.add('hidden');
    elements.loginScreen?.classList.remove('hidden');
    elements.loginError?.classList.add('hidden');
    elements.loginForm?.reset();
    
    // Ocultar todas las secciones y links de nav
    elements.appSections.forEach(section => section.classList.add('hidden'));
    elements.navSections.admin.forEach(el => el.style.display = 'none');
    elements.navSections.student.forEach(el => el.style.display = 'none');
    
    console.log("Sesión cerrada.");
}


// --- 5. LÓGICA DE RENDERIZADO DE SECCIONES ---

/**
 * Muestra el Dashboard del Estudiante (lista de informes).
 */
function showStudentDashboard() {
    elements.mainContentTitle.textContent = "Mis Informes";
    elements.studentDashboard.classList.remove('hidden');
    elements.studentReport.classList.add('hidden'); // Ocultar informe individual
    
    elements.studentReportsContainer.innerHTML = ""; // Limpiar
    
    if (CURRENT_STUDENT_REPORTS.length === 0) {
        elements.studentReportsContainer.innerHTML = `<p class="text-brand-text/80 col-span-full">No tienes informes disponibles.</p>`;
        return;
    }

    // Ordenar por fecha, más reciente primero
    const sortedReports = [...CURRENT_STUDENT_REPORTS].sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    sortedReports.forEach(report => {
        const testInfo = TEST_INDEX[report.test_id];
        if (!testInfo) return; // Omitir si la prueba no está en el índice

        const testTypeLabel = testInfo.type === 'simulacro' ? "Simulacro General" : "Minisimulacro";
        const testTypeColor = testInfo.type === 'simulacro' ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800";

        elements.studentReportsContainer.innerHTML += `
            <div class="report-card cursor-pointer" data-testid="${report.test_id}">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="text-xs font-medium ${testTypeColor} inline-block px-2 py-0.5 rounded-full">${testTypeLabel}</p>
                        <h3 class="text-lg font-bold text-brand-header mt-2">${testInfo.name}</h3>
                        <p class="text-sm text-brand-text/80">Realizado el: ${formatDate(report.test_date)}</p>
                    </div>
                    <span class="text-3xl font-extrabold text-brand-secondary">${report.global_score}</span>
                </div>
                <div class="flex justify-end">
                    <span class="inline-flex items-center text-sm font-medium text-brand-secondary hover:underline">
                        Ver Informe Completo
                        <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                    </span>
                </div>
            </div>
        `;
    });

    lucide.createIcons();
}

/**
 * Muestra el Dashboard del Administrador (KPIs y gráficos).
 */
function showAdminDashboard() {
    elements.mainContentTitle.textContent = "Dashboard General";
    elements.adminDashboard.classList.remove('hidden');

    // 1. Calcular KPIs
    elements.kpiTotalStudents.textContent = ALL_STUDENTS_ARRAY.length;

    const allScores = SCORES_DB.map(s => s.global_score);
    const avgGlobal = allScores.length ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(0) : 0;
    elements.kpiAvgGlobal.textContent = avgGlobal;

    const simulacroScores = SCORES_DB.filter(s => TEST_INDEX[s.test_id]?.type === 'simulacro').map(s => s.global_score);
    const avgSimulacros = simulacroScores.length ? (simulacroScores.reduce((a, b) => a + b, 0) / simulacroScores.length).toFixed(0) : 0;
    elements.kpiAvgSimulacros.textContent = avgSimulacros;

    const miniScores = SCORES_DB.filter(s => TEST_INDEX[s.test_id]?.type === 'minisimulacro').map(s => s.global_score);
    const avgMinis = miniScores.length ? (miniScores.reduce((a, b) => a + b, 0) / miniScores.length).toFixed(0) : 0;
    elements.kpiAvgMinis.textContent = avgMinis;

    // 2. Renderizar Gráficos
    renderAdminAvgSubjectsChart();
    renderAdminGlobalScoreDistChart();
    
    lucide.createIcons();
}

/**
 * Muestra la sección de Gestión de Estudiantes (Admin).
 */
function showAdminStudents() {
    elements.mainContentTitle.textContent = "Gestión de Estudiantes";
    elements.adminStudents.classList.remove('hidden');
    renderAdminStudentTable();
}

/**
 * Muestra la sección de Análisis de Ítems (Admin).
 */
function showAdminStats() {
    elements.mainContentTitle.textContent = "Análisis de Ítems";
    elements.adminStats.classList.remove('hidden');

    // Poblar el selector de pruebas
    elements.statsTestSelect.innerHTML = '<option value="">Seleccione una prueba</option>';
    for (const testId in TEST_INDEX) {
        elements.statsTestSelect.innerHTML += `<option value="${testId}">${TEST_INDEX[testId].name}</option>`;
    }
    
    lucide.createIcons();
}

/**
 * Muestra la sección de Gestión de Datos (CRUD Admin).
 */
function showAdminCrud() {
    elements.mainContentTitle.textContent = "Gestión de Datos";
    elements.adminCrud.classList.remove('hidden');
    lucide.createIcons();
}

/**
 * Muestra el informe individual detallado para un estudiante.
 * @param {string} testId - El ID de la prueba seleccionada.
 */
async function showIndividualReport(testId) {
    elements.mainContentTitle.textContent = "Cargando Informe...";
    elements.studentDashboard.classList.add('hidden');
    elements.reportContentContainer.innerHTML = `<div class="text-center py-10"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-brand-secondary" role="status"></div><p class="mt-3 text-brand-text/80">Cargando datos del informe...</p></div>`;
    elements.studentReport.classList.remove('hidden');

    try {
        const testInfo = TEST_INDEX[testId];
        const report = CURRENT_STUDENT_REPORTS.find(r => r.test_id === testId);
        
        if (!testInfo || !report) {
            throw new Error("No se encontraron datos del informe.");
        }

        elements.mainContentTitle.textContent = testInfo.name;
        elements.reportTitle.textContent = testInfo.name;
        elements.reportDate.textContent = `Realizado el: ${formatDate(report.test_date)}`;

        // Cargar datos de la prueba (respuestas y claves)
        const testData = await getTestAnswersAndKey(testId);

        // Encontrar la fila de respuestas del estudiante
        let studentAnswers = null;
        const docNumber = CURRENT_STUDENT_DATA["Número de Documento"];
        
        if (testInfo.type === 'simulacro') {
            const ans1 = testData.answers_s1.find(r => r.ID === docNumber);
            const ans2 = testData.answers_s2.find(r => r.ID === docNumber);
            studentAnswers = { ...ans1, ...ans2 }; // Combinar ambas sesiones
        } else {
            studentAnswers = testData.answers.find(r => r.ID === docNumber);
        }

        if (!studentAnswers) {
            throw new Error("No se encontraron las respuestas del estudiante para esta prueba.");
        }

        // Generar HTML del informe
        const scoreCardsHtml = generateScoreCardsHtml(report);
        const radarChartHtml = `<div class="bg-brand-surface p-6 rounded-xl shadow-sm border border-brand-border"><h3 class="text-xl font-bold text-brand-header mb-4">Perfil de Desempeño (Radar)</h3><div class="h-80 max-w-lg mx-auto"><canvas id="radarChart"></canvas></div></div>`;
        const feedbackHtml = generateFeedbackHtml(testInfo, testData, studentAnswers);

        elements.reportContentContainer.innerHTML = `
            ${scoreCardsHtml}
            ${radarChartHtml}
            ${feedbackHtml}
        `;

        // Renderizar el gráfico de Radar
        renderRadarChart(report);
        
        // Renderizar iconos
        lucide.createIcons();

    } catch (error) {
        console.error("Error al mostrar informe individual:", error);
        elements.reportContentContainer.innerHTML = `<p class="text-brand-red text-center py-10">Error al cargar el informe: ${error.message}</p>`;
    }
}


// --- 6. LÓGICA DE RENDERIZADO DE COMPONENTES ---

/**
 * Genera el HTML para las tarjetas de puntaje (Global y por materia).
 * @param {object} report - El objeto de puntaje de SCORES_DB.
 * @returns {string} HTML
 */
function generateScoreCardsHtml(report) {
    // (DISEÑO v7.0) - Iconos de Lucide añadidos
    const subjects = [
        { name: 'Lectura Crítica', score: report.lec_score, color: 'color-lectura', icon: 'book-open' },
        { name: 'Matemáticas', score: report.mat_score, color: 'color-matematicas', icon: 'calculator' },
        { name: 'Sociales', score: report.soc_score, color: 'color-sociales', icon: 'landmark' },
        { name: 'Ciencias', score: report.cie_score, color: 'color-ciencias', icon: 'flask-conical' },
        { name: 'Inglés', score: report.ing_score, color: 'color-ingles', icon: 'languages' },
    ];

    let subjectCardsHtml = subjects.map(s => `
        <div class="score-card" style="--subject-color: var(--${s.color});">
            <i data-lucide="${s.icon}" class="subject-icon" style="color: var(--subject-color);"></i>
            <p class="score-value" style="color: var(--subject-color);">${s.score}<span class="text-2xl text-brand-text/50">/100</span></p>
            <p class="score-label">${s.name}</p>
        </div>
    `).join('');

    return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Puntaje Global -->
            <div class="md:col-span-1 bg-brand-surface p-6 rounded-xl shadow-sm border border-brand-border flex flex-col items-center justify-center text-center">
                <p class="text-sm font-medium text-brand-text/80 uppercase tracking-wide">Puntaje Global</p>
                <p class="text-7xl font-extrabold text-brand-header my-2">${report.global_score}</p>
                <p class="text-2xl font-medium text-brand-text/50">/ 500</p>
            </div>
            <!-- Puntajes por Materia -->
            <div class="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                ${subjectCardsHtml}
            </div>
        </div>
    `;
}

/**
 * Genera el HTML para la tabla de retroalimentación (preguntas).
 * @param {object} testInfo - Info de TEST_INDEX.
 * @param {object} testData - Datos de la prueba (claves, etc.).
 * @param {object} studentAnswers - Fila de respuestas del estudiante.
 * @returns {string} HTML
 */
function generateFeedbackHtml(testInfo, testData, studentAnswers) {
    let feedbackHtml = "";
    
    if (testInfo.type === 'simulacro') {
        // Generar 2 tablas con pestañas
        const tableS1 = generateFeedbackTable(testData.key_s1, studentAnswers);
        const tableS2 = generateFeedbackTable(testData.key_s2, studentAnswers);
        feedbackHtml = `
            <div class="bg-brand-surface p-6 rounded-xl shadow-sm border border-brand-border">
                <h3 class="text-xl font-bold text-brand-header mb-4">Feedback Detallado por Pregunta</h3>
                <!-- Pestañas -->
                <div class="border-b border-brand-border">
                    <nav class="-mb-px flex gap-6" id="feedback-tabs">
                        <button class="tab-btn active" data-tab="s1">Sesión 1</button>
                        <button class="tab-btn" data-tab="s2">Sesión 2</button>
                    </nav>
                </div>
                <!-- Contenido Pestañas -->
                <div id="tab-content-s1" class="tab-content py-4">${tableS1}</div>
                <div id="tab-content-s2" class="tab-content py-4 hidden">${tableS2}</div>
            </div>
        `;
    } else {
        // Generar 1 tabla (minisimulacro)
        const table = generateFeedbackTable(testData.key, studentAnswers);
        feedbackHtml = `
            <div class="bg-brand-surface p-6 rounded-xl shadow-sm border border-brand-border">
                <h3 class="text-xl font-bold text-brand-header mb-4">Feedback Detallado por Pregunta</h3>
                <div class="py-4">${table}</div>
            </div>
        `;
    }

    // Registrar listeners para las pestañas (si existen)
    setTimeout(() => {
        document.getElementById('feedback-tabs')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                const tabId = e.target.dataset.tab;
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
                document.getElementById(`tab-content-${tabId}`)?.classList.remove('hidden');
            }
        });
    }, 0);

    return feedbackHtml;
}

/**
 * Helper que genera el HTML de la tabla de preguntas.
 * @param {object} key - Objeto de claves (ej. testData.key_s1).
 * @param {object} answers - Objeto de respuestas del estudiante.
 * @returns {string} HTML de la tabla
 */
function generateFeedbackTable(key, answers) {
    let rowsHtml = "";
    const headers = Object.keys(key);

    for (const header of headers) {
        if (!header) continue; // Saltar cabeceras vacías

        const studentAns = answers[header]?.trim() || "---";
        const correctAns = key[header]?.trim() || "N/A";
        const isCorrect = studentAns === correctAns;

        const icon = isCorrect 
            ? `<i data-lucide="check-circle" class="icon-correct"></i>`
            : `<i data-lucide="x-circle" class="icon-incorrect"></i>`;
        
        rowsHtml += `
            <tr class="border-b border-brand-border last:border-b-0 hover:bg-brand-bg">
                <td class="table-cell font-medium text-brand-header">${header}</td>
                <td class="table-cell text-center">${studentAns}</td>
                <td class="table-cell text-center font-bold text-brand-green">${correctAns}</td>
                <td class="table-cell text-center">${icon}</td>
            </tr>
        `;
    }

    return `
        <div class="overflow-x-auto border border-brand-border rounded-lg">
            <table class="w-full min-w-max feedback-table">
                <thead>
                    <tr>
                        <th class="w-1/2">Pregunta</th>
                        <th class="text-center">Tu Respuesta</th>
                        <th class="text-center">Resp. Correcta</th>
                        <th class="text-center">Resultado</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Renderiza la tabla de estudiantes del panel de admin con paginación y filtros.
 */
function renderAdminStudentTable() {
    const tableBody = elements.adminStudentTableBody;
    if (!tableBody) return;

    tableBody.innerHTML = ""; // Limpiar tabla

    // 1. Aplicar Filtro (Búsqueda)
    const filterText = currentAdminFilter.toLowerCase();
    filteredAdminStudents = ALL_STUDENTS_ARRAY.filter(student => {
        return student["Nombre Completo del Estudiante"].toLowerCase().includes(filterText) ||
               student["Número de Documento"].includes(filterText);
    });

    // 2. Aplicar Ordenamiento
    filteredAdminStudents.sort((a, b) => {
        const valA = a[currentAdminSort.column] || '';
        const valB = b[currentAdminSort.column] || '';
        
        if (valA < valB) return currentAdminSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentAdminSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. Aplicar Paginación
    const totalPages = Math.ceil(filteredAdminStudents.length / adminRowsPerPage);
    const startIndex = (currentAdminPage - 1) * adminRowsPerPage;
    const endIndex = startIndex + adminRowsPerPage;
    const paginatedStudents = filteredAdminStudents.slice(startIndex, endIndex);

    // 4. Renderizar Filas
    if (paginatedStudents.length === 0) {
        elements.adminNoResults.classList.remove('hidden');
    } else {
        elements.adminNoResults.classList.add('hidden');
        paginatedStudents.forEach(student => {
            tableBody.innerHTML += `
                <tr class="table-row">
                    <td class="table-cell font-medium text-brand-header">${student["Nombre Completo del Estudiante"]}</td>
                    <td class="table-cell text-brand-text/90">${student["Tipo de Documento"]} - ${student["Número de Documento"]}</td>
                    <td class="table-cell text-brand-text/90">${student["Email"]}</td>
                    <td class="table-cell text-brand-text/90">${student["Colegio/institución"]}</td>
                    <td class="table-cell text-center">
                        <button class="button-secondary text-xs !py-1 !px-2 view-student-history-btn" data-doc-number="${student["Número de Documento"]}">
                            <i data-lucide="eye" class="w-4 h-4"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    // 5. Renderizar Controles de Paginación
    renderAdminPagination(totalPages);
    
    // 6. Actualizar Iconos
    lucide.createIcons();
}

/**
 * Renderiza los botones de paginación para la tabla de admin.
 */
function renderAdminPagination(totalPages) {
    const pagination = elements.adminPaginationControls;
    if (!pagination) return;
    
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    // Botón "Anterior"
    pagination.innerHTML += `
        <button class="px-3 py-1 border border-brand-border rounded-md ${currentAdminPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-bg'}" 
                data-page="${currentAdminPage - 1}" ${currentAdminPage === 1 ? 'disabled' : ''}>
            Ant.
        </button>
    `;

    // Indicador de página
    pagination.innerHTML += `
        <span class="text-sm text-brand-text/80 px-2">
            Página ${currentAdminPage} de ${totalPages}
        </span>
    `;

    // Botón "Siguiente"
    pagination.innerHTML += `
        <button class="px-3 py-1 border border-brand-border rounded-md ${currentAdminPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-bg'}" 
                data-page="${currentAdminPage + 1}" ${currentAdminPage === totalPages ? 'disabled' : ''}>
            Sig.
        </button>
    `;
}

/**
 * Muestra el historial de informes de un estudiante en un modal (para Admin).
 */
function showAdminStudentHistory(docNumber) {
    const student = STUDENT_DB[docNumber];
    if (!student) return;

    elements.adminStudentModalTitle.textContent = `Historial de: ${student["Nombre Completo del Estudiante"]}`;
    elements.adminStudentModalBody.innerHTML = ""; // Limpiar

    const studentReports = SCORES_DB.filter(score => score.doc_number === docNumber)
                                     .sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    if (studentReports.length === 0) {
        elements.adminStudentModalBody.innerHTML = `<p class="text-brand-text/80 text-center py-4">Este estudiante no tiene informes.</p>`;
    } else {
        studentReports.forEach(report => {
            const testInfo = TEST_INDEX[report.test_id];
            if (!testInfo) return;

            elements.adminStudentModalBody.innerHTML += `
                <div class="report-card cursor-pointer" data-testid="${report.test_id}" data-docnumber="${docNumber}">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="text-lg font-bold text-brand-header">${testInfo.name}</h3>
                            <p class="text-sm text-brand-text/80">Realizado el: ${formatDate(report.test_date)}</p>
                        </div>
                        <span class="text-3xl font-extrabold text-brand-secondary">${report.global_score}</span>
                    </div>
                    <div class="flex justify-end">
                        <span class="inline-flex items-center text-sm font-medium text-brand-secondary hover:underline">
                            Suplantar y Ver Informe
                            <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>
                        </span>
                    </div>
                </div>
            `;
        });
    }

    lucide.createIcons();
    showModal(elements.adminStudentModal);
}

/**
 * Maneja el clic de "Ver Informe" desde el modal de admin (Suplantación).
 */
async function handleAdminViewReport(docNumber, testId) {
    // 1. Establecer temporalmente el estado como si fuéramos el estudiante
    CURRENT_STUDENT_DATA = STUDENT_DB[docNumber];
    CURRENT_STUDENT_REPORTS = SCORES_DB.filter(score => score.doc_number === docNumber);
    
    // 2. Cerrar el modal y mostrar el informe
    closeModal(elements.adminStudentModal);
    await showIndividualReport(testId);

    // 3. Importante: Limpiar el estado para volver a ser admin
    // Usamos setTimeout para asegurar que la navegación se complete
    setTimeout(() => {
        CURRENT_STUDENT_DATA = { "Nombre Completo del Estudiante": "Administrador" };
        CURRENT_STUDENT_REPORTS = [];
    }, 1000);
}


// --- 7. LÓGICA DE GRÁFICOS (CHART.JS) ---

/**
 * Renderiza el gráfico de progreso del estudiante (en el modal).
 * @param {string} filterType - 'all', 'simulacro', 'minisimulacro'.
 */
function renderGrowthChart(filterType = 'all') {
    const ctx = elements.growthChartCanvas?.getContext('2d');
    if (!ctx) return;

    // 1. Filtrar datos
    const filteredReports = CURRENT_STUDENT_REPORTS
        .filter(report => {
            const testType = TEST_INDEX[report.test_id]?.type;
            if (filterType === 'all') return true;
            return testType === filterType;
        })
        .sort((a, b) => new Date(a.test_date) - new Date(b.test_date)); // Orden cronológico

    // 2. Preparar datos
    const chartData = filteredReports.map(report => ({
        x: new Date(report.test_date),
        y: report.global_score
    }));
    const labels = filteredReports.map(report => TEST_INDEX[report.test_id]?.name || 'Prueba');

    // 3. Destruir gráfico anterior
    if (window.myGrowthChart instanceof Chart) {
        window.myGrowthChart.destroy();
    }

    // 4. Renderizar nuevo gráfico
    window.myGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels, // Usado para tooltips
            datasets: [{
                label: 'Puntaje Global',
                data: chartData,
                fill: false,
                borderColor: 'var(--brand-secondary)',
                backgroundColor: 'var(--brand-secondary)',
                tension: 0.1,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
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
                        tooltipFormat: 'dd/MM/yyyy',
                        displayFormats: {
                            month: 'MMM yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Fecha'
                    },
                    ticks: {
                        display: false // Ocultar fechas en el eje X
                    }
                },
                y: {
                    beginAtZero: false,
                    min: Math.max(0, Math.min(...chartData.map(d => d.y)) - 20),
                    max: Math.min(500, Math.max(...chartData.map(d => d.y)) + 20),
                    title: {
                        display: true,
                        text: 'Puntaje Global (0-500)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: (tooltipItems) => {
                            // Mostrar nombre de la prueba en el tooltip
                            return tooltipItems[0].label;
                        },
                        label: (tooltipItem) => {
                            return `Puntaje: ${tooltipItem.raw.y}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Renderiza el gráfico de Radar en el informe individual.
 * @param {object} report - El objeto de puntaje de SCORES_DB.
 */
function renderRadarChart(report) {
    const ctx = document.getElementById('radarChart')?.getContext('2d');
    if (!ctx) return;

    if (window.myRadarChart instanceof Chart) {
        window.myRadarChart.destroy();
    }
    
    window.myRadarChart = new Chart(ctx, {
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
                backgroundColor: 'rgba(59, 130, 246, 0.2)', // brand-secondary con alpha
                borderColor: 'rgba(59, 130, 246, 1)',     // brand-secondary
                borderWidth: 2,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                    grid: { color: 'rgba(0, 0, 0, 0.1)' },
                    pointLabels: { font: { size: 13, weight: '500' } },
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
                    display: false // Ocultar leyenda
                }
            }
        }
    });
}

/**
 * Renderiza el gráfico de barras de Promedio por Materia (Admin).
 */
function renderAdminAvgSubjectsChart() {
    const ctx = elements.adminAvgSubjectsChart?.getContext('2d');
    if (!ctx) return;

    const avgScores = { mat: [], lec: [], soc: [], cie: [], ing: [] };
    SCORES_DB.forEach(s => {
        avgScores.mat.push(s.mat_score);
        avgScores.lec.push(s.lec_score);
        avgScores.soc.push(s.soc_score);
        avgScores.cie.push(s.cie_score);
        avgScores.ing.push(s.ing_score);
    });

    const data = [
        (avgScores.mat.reduce((a, b) => a + b, 0) / avgScores.mat.length) || 0,
        (avgScores.lec.reduce((a, b) => a + b, 0) / avgScores.lec.length) || 0,
        (avgScores.soc.reduce((a, b) => a + b, 0) / avgScores.soc.length) || 0,
        (avgScores.cie.reduce((a, b) => a + b, 0) / avgScores.cie.length) || 0,
        (avgScores.ing.reduce((a, b) => a + b, 0) / avgScores.ing.length) || 0,
    ];

    if (window.myAdminAvgSubjectsChart instanceof Chart) {
        window.myAdminAvgSubjectsChart.destroy();
    }

    window.myAdminAvgSubjectsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Matemáticas', 'Lectura Crítica', 'Sociales', 'Ciencias', 'Inglés'],
            datasets: [{
                label: 'Promedio (0-100)',
                data: data,
                backgroundColor: [
                    'var(--color-matematicas)',
                    'var(--color-lectura)',
                    'var(--color-sociales)',
                    'var(--color-ciencias)',
                    'var(--color-ingles)',
                ],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, max: 100 }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

/**
 * Renderiza el gráfico de distribución de puntajes (Admin).
 */
function renderAdminGlobalScoreDistChart() {
    const ctx = elements.adminGlobalScoreDistChart?.getContext('2d');
    if (!ctx) return;

    const scores = SCORES_DB.map(s => s.global_score);
    const bins = [0, 200, 250, 300, 350, 400, 450, 500];
    const distribution = Array(bins.length - 1).fill(0);

    scores.forEach(score => {
        for (let i = 0; i < bins.length - 1; i++) {
            if (score >= bins[i] && score < bins[i+1]) {
                distribution[i]++;
                break;
            }
        }
        if (score === 500) distribution[distribution.length - 1]++; // Incluir 500
    });

    const labels = bins.slice(0, -1).map((bin, i) => `${bin}-${bins[i+1]}`);
    labels[labels.length - 1] = "450-500";

    if (window.myAdminGlobalScoreDistChart instanceof Chart) {
        window.myAdminGlobalScoreDistChart.destroy();
    }

    window.myAdminGlobalScoreDistChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nº de Estudiantes',
                data: distribution,
                backgroundColor: 'rgba(249, 115, 22, 0.7)', // brand-primary
                borderColor: 'var(--brand-primary)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { title: { display: true, text: 'Nº Estudiantes' } },
                x: { title: { display: true, text: 'Rango de Puntaje' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}


// --- 8. LÓGICA DE ANÁLISIS DE ÍTEMS (MEJORA 1) ---

/**
 * Maneja el clic en el botón "Analizar" del panel de admin.
 */
async function handleAnalyzeItems() {
    const testId = elements.statsTestSelect.value;
    if (!testId) {
        alert("Por favor, seleccione una prueba.");
        return;
    }

    elements.statsLoading.classList.remove('hidden');
    elements.statsResultsContainer.classList.add('hidden');
    elements.statsResultsCardsContainer.innerHTML = "";
    elements.statsSubjectFilter.innerHTML = '<option value="all">Todas las Materias</option>';
    elements.statsSubjectFilter.disabled = true;

    try {
        const testData = await getTestAnswersAndKey(testId);
        const analysis = await analyzeTestItems(testId, testData);
        
        renderStatsCards(analysis); // Renderizar todas las tarjetas
        
        // Poblar filtro de materias
        const subjects = [...new Set(Object.values(analysis).map(item => item.materia))];
        subjects.sort().forEach(subject => {
            elements.statsSubjectFilter.innerHTML += `<option value="${subject}">${subject}</option>`;
        });
        
        elements.statsSubjectFilter.disabled = false;
        elements.statsSubjectFilter.onchange = () => {
            renderStatsCards(analysis, elements.statsSubjectFilter.value);
        };
        
        elements.statsResultsTitle.textContent = `Análisis de ${Object.keys(analysis).length} ítems para: ${TEST_INDEX[testId].name}`;
        elements.statsResultsContainer.classList.remove('hidden');

    } catch (error) {
        console.error("Error en el análisis de ítems:", error);
        alert(`Error al analizar: ${error.message}`);
    } finally {
        elements.statsLoading.classList.add('hidden');
    }
}

/**
 * Lógica principal de análisis estadístico de ítems.
 * @param {string} testId - El ID de la prueba.
 * @param {object} testData - Los datos cargados (claves, respuestas) de getTestAnswersAndKey.
 * @returns {Promise<object>} - Objeto con los resultados del análisis.
 */
async function analyzeTestItems(testId, testData) {
    const testInfo = TEST_INDEX[testId];
    const isSimulacro = testInfo.type === 'simulacro';

    const stats = {};
    const keysMap = {};
    const answersData = [];

    // 1. Unificar Claves y Respuestas (manejar S1/S2 o sesión única)
    if (isSimulacro) {
        Object.assign(keysMap, testData.key_s1, testData.key_s2);
        // Mapear respuestas de estudiantes por ID
        const answersMap = {};
        testData.answers_s1.forEach(r => answersMap[r.ID] = { ...r });
        testData.answers_s2.forEach(r => answersMap[r.ID] = { ...(answersMap[r.ID] || {}), ...r });
        answersData.push(...Object.values(answersMap));
    } else {
        Object.assign(keysMap, testData.key);
        answersData.push(...testData.answers);
    }

    // 2. Inicializar objeto de estadísticas
    for (const header in keysMap) {
        if (!header || !keysMap[header]) continue; // Omitir cabeceras vacías
        
        // Extraer materia del header (ej. "Matemáticas S1 [1.]")
        const materia = header.split(' ')[0];
        
        stats[header] = {
            pregunta: header,
            materia: materia,
            correcta: keysMap[header].trim().toUpperCase(),
            A: 0, B: 0, C: 0, D: 0, Omision: 0,
            total: 0,
            correctas: 0
        };
    }

    // 3. Procesar Respuestas de TODOS los estudiantes
    for (const studentRow of answersData) {
        for (const questionHeader in stats) {
            if (studentRow.hasOwnProperty(questionHeader)) {
                const studentAnswer = studentRow[questionHeader]?.trim().toUpperCase() || 'OMISION';
                const statsEntry = stats[questionHeader];

                statsEntry.total++;

                // Conteo de distractores
                if (studentAnswer === 'A') statsEntry.A++;
                else if (studentAnswer === 'B') statsEntry.B++;
                else if (studentAnswer === 'C') statsEntry.C++;
                else if (studentAnswer === 'D') statsEntry.D++;
                else statsEntry.Omision++;
                
                // Conteo de aciertos
                if (studentAnswer === statsEntry.correcta) {
                    statsEntry.correctas++;
                }
            }
        }
    }
    
    return stats;
}

/**
 * Renderiza las tarjetas de estadísticas de ítems.
 * @param {object} stats - Resultados del análisis.
 * @param {string} [subjectFilter='all'] - Filtro de materia opcional.
 */
function renderStatsCards(stats, subjectFilter = 'all') {
    elements.statsResultsCardsContainer.innerHTML = ""; // Limpiar
    
    let itemsToShow = Object.values(stats);

    // Aplicar filtro
    if (subjectFilter !== 'all') {
        itemsToShow = itemsToShow.filter(item => item.materia === subjectFilter);
    }

    // Ordenar (ej. por dificultad)
    itemsToShow.sort((a, b) => (a.correctas / a.total) - (b.correctas / b.total));

    if (itemsToShow.length === 0) {
        elements.statsResultsCardsContainer.innerHTML = `<p class="text-brand-text/80 text-center py-4">No hay datos para esta selección.</p>`;
        return;
    }

    itemsToShow.forEach(item => {
        if (item.total === 0) return;

        // Calcular porcentajes
        const pctAcierto = (item.correctas / item.total) * 100;
        const pctOmision = (item.Omision / item.total) * 100;
        const pctA = (item.A / item.total) * 100;
        const pctB = (item.B / item.total) * 100;
        const pctC = (item.C / item.total) * 100;
        const pctD = (item.D / item.total) * 100;

        // Determinar dificultad
        let dificultadClase, dificultadTexto;
        if (pctAcierto >= 75) {
            dificultadClase = 'stats-pill-green'; dificultadTexto = 'Fácil';
        } else if (pctAcierto <= 35) {
            dificultadClase = 'stats-pill-red'; dificultadTexto = 'Difícil';
        } else {
            dificultadClase = 'stats-pill-yellow'; dificultadTexto = 'Media';
        }

        // Resaltar respuesta correcta
        const correctClass = 'font-bold text-brand-green';
        const distA = item.correcta === 'A' ? correctClass : '';
        const distB = item.correcta === 'B' ? correctClass : '';
        const distC = item.correcta === 'C' ? correctClass : '';
        const distD = item.correcta === 'D' ? correctClass : '';

        const cardHtml = `
            <div class="stats-card">
                <div class="stats-card-header">
                    <h4 class="stats-card-title">${item.pregunta}</h4>
                    <div class="stats-card-pills">
                        <span class="${dificultadClase} stats-pill">${dificultadTexto} (${pctAcierto.toFixed(0)}%)</span>
                        <span class="stats-pill-gray stats-pill">Omisión: ${pctOmision.toFixed(0)}%</span>
                    </div>
                </div>
                <div class="pt-4 space-y-2">
                    ${generateDistractorBar('A', pctA, distA)}
                    ${generateDistractorBar('B', pctB, distB)}
                    ${generateDistractorBar('C', pctC, distC)}
                    ${generateDistractorBar('D', pctD, distD)}
                </div>
            </div>
        `;
        elements.statsResultsCardsContainer.innerHTML += cardHtml;
    });
}

/**
 * Helper para generar una barra de distractor visual.
 */
function generateDistractorBar(option, percentage, extraClass = '') {
    const color = extraClass ? 'bg-brand-green' : 'bg-brand-secondary';
    return `
        <div class="flex items-center gap-3">
            <span class="w-10 text-sm font-medium text-right ${extraClass}">${option}:</span>
            <div class="distractor-bar-container flex-1">
                <div class="distractor-bar ${color}" style="width: ${percentage.toFixed(0)}%"></div>
            </div>
            <span class="w-12 text-sm font-semibold text-left ${extraClass}">${percentage.toFixed(0)}%</span>
        </div>
    `;
}


// --- 9. LÓGICA DE CRUD (MEJORA 3) ---

/**
 * Maneja el envío del formulario "Añadir Estudiante".
 */
function handleAddStudentSubmit(e) {
    e.preventDefault();
    
    // 1. Obtener datos del formulario
    const newStudent = {
        "Nombre Completo del Estudiante": document.getElementById('student-name').value.trim(),
        "Email": document.getElementById('student-email').value.trim(),
        "Tipo de Documento": document.getElementById('student-doc-type').value,
        "Número de Documento": document.getElementById('student-doc-number').value.trim(),
        "Fecha de Nacimiento": document.getElementById('student-birthdate').value.trim(),
        "Departamento": document.getElementById('student-department').value.trim(),
        "Colegio/institución": document.getElementById('student-school').value.trim(),
    };

    // 2. Validar (simple)
    if (!newStudent["Nombre Completo del Estudiante"] || !newStudent["Número de Documento"] || !newStudent["Fecha de Nacimiento"]) {
        alert("Nombre, Número de Documento y Fecha de Nacimiento son obligatorios.");
        return;
    }

    // 3. Añadir a la cola de pendientes
    PENDING_CHANGES.student_database.push(newStudent);
    
    // 4. Guardar en caché y actualizar UI
    savePendingChanges();
    renderPendingChanges();
    elements.addStudentForm.reset();
}

/**
 * Renderiza la lista de cambios pendientes en la UI.
 */
function renderPendingChanges() {
    const container = elements.pendingChangesContainer;
    container.innerHTML = ""; // Limpiar

    const students = PENDING_CHANGES.student_database;

    if (students.length === 0) {
        container.innerHTML = `<p id="no-pending-changes" class="text-brand-text/70 text-sm">No hay cambios pendientes para guardar.</p>`;
        elements.saveChangesBtn.disabled = true;
        elements.clearCacheBtn.disabled = true;
    } else {
        students.forEach((student, index) => {
            container.innerHTML += `
                <div class="flex justify-between items-center p-2 rounded ${index % 2 === 0 ? 'bg-slate-100' : ''}">
                    <span class="text-sm text-brand-header">
                        <i data-lucide="user-plus" class="w-4 h-4 inline-block mr-2 text-brand-green"></i>
                        Añadir: <strong>${student["Nombre Completo del Estudiante"]}</strong> (${student["Número de Documento"]})
                    </span>
                </div>
            `;
        });
        elements.saveChangesBtn.disabled = false;
        elements.clearCacheBtn.disabled = false;
        lucide.createIcons();
    }
}

/**
 * Carga los cambios pendientes desde localStorage.
 */
function loadPendingChanges() {
    const cached = localStorage.getItem('pendingChanges');
    if (cached) {
        PENDING_CHANGES = JSON.parse(cached);
    }
    renderPendingChanges();
}

/**
 * Guarda los cambios pendientes en localStorage.
 */
function savePendingChanges() {
    localStorage.setItem('pendingChanges', JSON.stringify(PENDING_CHANGES));
}

/**
 * Limpia la cola de cambios pendientes.
 */
function clearPendingChanges() {
    if (confirm("¿Estás seguro de que quieres descartar todos los cambios pendientes? Esta acción no se puede deshacer.")) {
        PENDING_CHANGES = { student_database: [] };
        savePendingChanges();
        renderPendingChanges();
    }
}

/**
 * Maneja el guardado final de cambios en GitHub.
 */
async function handleSaveChanges() {
    const token = elements.githubTokenInput.value.trim();
    if (!token) {
        elements.githubTokenError.textContent = "El token es obligatorio.";
        elements.githubTokenError.classList.remove('hidden');
        return;
    }

    elements.githubTokenError.classList.add('hidden');
    elements.githubTokenConfirmBtn.disabled = true;
    elements.githubTokenConfirmBtn.innerHTML = `<div class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div> Guardando...`;

    try {
        // --- 1. Definir Repositorio y Archivo ---
        const REPO_OWNER = "daniel-alt-pages";
        const REPO_NAME = "backoup_informes";
        const REPO_BRANCH = "main";
        const FILE_PATH = "database/student_database.csv";
        const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

        // --- 2. Leer el archivo actual de GitHub ---
        const fileData = await getGitHubFile(API_URL, token);
        
        // --- 3. Decodificar y Modificar ---
        const currentContent = atob(fileData.content); // atob() decodifica Base64
        let newContent = currentContent;
        
        // Añadir las nuevas filas de estudiantes
        PENDING_CHANGES.student_database.forEach(student => {
            // El orden debe coincidir EXACTAMENTE con student_database.csv
            const newCsvRow = [
                student["Nombre Completo del Estudiante"],
                student["Email"],
                student["Tipo de Documento"],
                student["Número de Documento"],
                student["Fecha de Nacimiento"],
                student["Departamento"],
                student["Colegio/institución"]
            ].join(',');
            newContent += `\n${newCsvRow}`;
        });

        // --- 4. Recodificar y Escribir (Commit) ---
        const newContentBase64 = btoa(newContent); // btoa() codifica a Base64
        const commitMessage = `Commit automático: Añadidos ${PENDING_CHANGES.student_database.length} nuevos estudiantes`;

        await updateGitHubFile(API_URL, token, commitMessage, newContentBase64, fileData.sha, REPO_BRANCH);

        // --- 5. Éxito ---
        alert("¡Cambios guardados con éxito en GitHub!");
        closeModal(elements.githubTokenModal);
        clearPendingChanges(); // Limpiar la cola
        
        // Recargar los datos de la app
        elements.globalLoader.classList.remove('opacity-0', 'invisible');
        await loadAllData();
        renderAdminStudentTable(); // Actualizar la tabla
        elements.globalLoader.classList.add('opacity-0', 'invisible');

    } catch (error) {
        console.error("Error al guardar cambios en GitHub:", error);
        elements.githubTokenError.textContent = `Error: ${error.message}`;
        elements.githubTokenError.classList.remove('hidden');
    } finally {
        elements.githubTokenConfirmBtn.disabled = false;
        elements.githubTokenConfirmBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4 mr-2"></i> Confirmar y Guardar`;
        lucide.createIcons();
    }
}

/**
 * Helper: Obtiene el contenido y 'sha' de un archivo de GitHub.
 */
async function getGitHubFile(apiUrl, token) {
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache', // Forzar la última versión
            'Pragma': 'no-cache'
        }
    });
    if (!response.ok) {
        throw new Error(`Error al leer archivo de GitHub: ${response.statusText}`);
    }
    return await response.json(); // Devuelve { content: '...', sha: '...' }
}

/**
 * Helper: Actualiza (hace commit) de un archivo en GitHub.
 */
async function updateGitHubFile(apiUrl, token, commitMessage, contentBase64, sha, branch) {
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
            sha: sha, // OBLIGATORIO para actualizar
            branch: branch
        })
    });
    if (!response.ok) {
        throw new Error(`Error al escribir archivo en GitHub: ${response.statusText}`);
    }
    return await response.json();
}


// --- 10. FUNCIONES UTILITARIAS ---

/**
 * Muestra u oculta la contraseña en el formulario de login.
 */
function togglePasswordVisibility() {
    const isPassword = elements.password.type === 'password';
    elements.password.type = isPassword ? 'text' : 'password';
    elements.eyeIcon.classList.toggle('hidden', isPassword);
    elements.eyeOffIcon.classList.toggle('hidden', !isPassword);
}

/**
 * Abre el sidebar (móvil).
 */
function openSidebar() {
    elements.sidebar.classList.remove('-translate-x-full');
    elements.sidebarOverlay.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
}

/**
 * Cierra el sidebar (móvil).
 */
function closeSidebar() {
    elements.sidebar.classList.add('-translate-x-full');
    elements.sidebarOverlay.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

/**
 * Muestra un modal por su ID.
 * @param {HTMLElement} modalElement - El elemento del modal backdrop.
 */
function showModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.add('shown');
    document.body.classList.add('overflow-hidden'); // Evitar scroll de fondo

    // Si es el modal de gráfico, renderizarlo
    if (modalElement.id === 'growth-chart-modal') {
        renderGrowthChart('all'); // Renderizar con filtro "all" por defecto
    }
}

/**
 * Cierra un modal.
 * @param {HTMLElement} modalElement - El elemento del modal backdrop.
 */
function closeModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.remove('shown');
    document.body.classList.remove('overflow-hidden');

    // Limpiar modal de token
    if (modalElement.id === 'github-token-modal') {
        elements.githubTokenInput.value = "";
        elements.githubTokenError.classList.add('hidden');
    }
}

/**
 * Formatea una fecha de "YYYY-MM-DD" a "DD de Mes de YYYY".
 * @param {string} dateString - Fecha en formato YYYY-MM-DD.
 * @returns {string} Fecha formateada.
 */
function formatDate(dateString) {
    try {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC' // Importante para evitar desfase de día
        });
    } catch (e) {
        return dateString; // Devolver original si falla
    }
}
