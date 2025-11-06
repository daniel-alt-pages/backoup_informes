// --- Variables Globales y Configuración ---
const SUPER_USER_CREDENTIALS = { username: "admin", password: "20/7/2023" };
const BASE_DATA_URL = `https://raw.githubusercontent.com/daniel-alt-pages/backoup_informes/main/`;
const TIMESTAMP = Date.now(); // Cache-busting

// Rutas a los archivos de la arquitectura
const URLS = {
    studentDatabase: `${BASE_DATA_URL}database/student_database.csv?t=${TIMESTAMP}`,
    scoresDatabase: `${BASE_DATA_URL}database/scores_database.csv?t=${TIMESTAMP}`,
    testIndex: `${BASE_DATA_URL}database/test_index.json?t=${TIMESTAMP}`
};

// ======================================================
// INICIO: MEJORA 3 - Configuración de GitHub API (Actualizado)
// ======================================================
// ¡Token ELIMINADO de aquí! Se pedirá en un modal.
const REPO_OWNER = "daniel-alt-pages";
const REPO_NAME = "backoup_informes";
const REPO_BRANCH = "main";
const STUDENT_DB_PATH = "database/student_database.csv";
const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${STUDENT_DB_PATH}`;

// (NUEVO) Variable para guardar los cambios pendientes
let PENDING_STUDENT_CSV_UPDATE = null;
// ======================================================
// FIN: MEJORA 3 - Configuración de GitHub API
// ======================================================


// Almacenes de datos
let STUDENT_DB = {};           // Almacena datos de login (1 fila por estudiante)
let SCORES_DB = [];            // Almacena TODOS los puntajes (múltiples filas por estudiante)
let TEST_INDEX = {};           // Almacena el "mapa" de pruebas desde test_index.json
let ALL_STUDENTS_ARRAY = [];   // (Admin) Lista única de estudiantes de STUDENT_DB
let CURRENT_STUDENT_REPORTS = []; // (Estudiante) Informes del estudiante que inició sesión
let CURRENT_STUDENT_DATA = null; // (Estudiante) Datos de login del estudiante
let isAdminViewingReport = false; // (Admin) Bandera de suplantación

// Almacenes para datos de pruebas cacheados
let CACHED_TEST_DATA = {};

// Estado de la tabla de Admin
let currentAdminPage = 1;
let adminRowsPerPage = 10;
let adminFilteredData = [];
let currentAdminSort = { column: 'Nombre Completo del Estudiante', direction: 'asc' };

// Referencias a elementos del DOM
const elements = {
    loginSection: document.getElementById('login-section'),
    loadingSection: document.getElementById('loading-section'),
    loadingText: document.getElementById('loading-text'),
    studentDashboard: document.getElementById('student-dashboard-section'),
    adminDashboard: document.getElementById('admin-dashboard-section'),
    reportContentSection: document.getElementById('report-content-section'),
    reportContentBody: document.getElementById('report-content-body'),
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginError: document.getElementById('login-error'),
    logoutBtn: document.getElementById('logout-btn'),
    studentName: document.getElementById('student-name'),
    reportCardsContainer: document.getElementById('report-cards-container'),
    backToDashboardBtn: document.getElementById('back-to-dashboard-btn'),
    
    // Admin
    adminTableBody: document.getElementById('admin-table-body'),
    adminSearch: document.getElementById('admin-search'),
    adminRowsPerPage: document.getElementById('admin-rows-per-page'),
    adminPageInfo: document.getElementById('admin-page-info'),
    adminPrevPage: document.getElementById('admin-prev-page'),
    adminNextPage: document.getElementById('admin-next-page'),
    
    // Admin Modal
    adminModalBackdrop: document.getElementById('admin-modal-backdrop'),
    adminModalContainer: document.getElementById('admin-modal-container'),
    adminModalHeader: document.getElementById('admin-modal-header'),
    adminModalBody: document.getElementById('admin-modal-body'),
    adminModalCloseBtn: document.getElementById('admin-modal-close-btn'),

    // (NUEVO) Admin Stats (Mejora 1)
    statsTestSelect: document.getElementById('stats-test-select'),
    statsAnalyzeBtn: document.getElementById('stats-analyze-btn'),
    statsLoading: document.getElementById('stats-loading'),
    statsResultsContainer: document.getElementById('stats-results-container'),
    statsResultsTitle: document.getElementById('stats-results-title'),
    statsResultsTableBody: document.getElementById('stats-results-table-body'),

    // (NUEVO) Admin CRUD (Mejora 3)
    addStudentForm: document.getElementById('add-student-form'),
    addStudentBtn: document.getElementById('add-student-btn'),
    crudStatus: document.getElementById('crud-status'),

    // (NUEVO) CRUD Modal (Mejora 3)
    tokenModal: document.getElementById('token-modal'),
    tokenModalCloseBtn: document.getElementById('token-modal-close-btn'),
    tokenModalSubmitBtn: document.getElementById('token-modal-submit-btn'),
    tokenModalStatus: document.getElementById('token-modal-status'),
    githubTokenInput: document.getElementById('github-token'),

    // (NUEVO) Student Stats (Mejora 2)
    growthChartFilters: document.getElementById('growth-chart-filters')
};

// --- Inicialización ---

document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos principales
    loadAllData();

    // Manejadores de eventos
    elements.loginForm?.addEventListener('submit', handleLogin);
    elements.logoutBtn?.addEventListener('click', handleLogout);
    elements.backToDashboardBtn?.addEventListener('click', showDashboard);
    
    // Manejadores de Admin
    elements.adminSearch?.addEventListener('input', () => {
        currentAdminPage = 1;
        renderAdminTable();
    });
    elements.adminRowsPerPage?.addEventListener('change', (e) => {
        adminRowsPerPage = parseInt(e.target.value, 10);
        currentAdminPage = 1;
        renderAdminTable();
    });
    elements.adminPrevPage?.addEventListener('click', () => {
        if (currentAdminPage > 1) {
            currentAdminPage--;
            renderAdminTable();
        }
    });
    elements.adminNextPage?.addEventListener('click', () => {
        const totalPages = Math.ceil(adminFilteredData.length / adminRowsPerPage);
        if (currentAdminPage < totalPages) {
            currentAdminPage++;
            renderAdminTable();
        }
    });
    
    // Ordenar tabla de Admin
    document.querySelector('thead')?.addEventListener('click', (e) => {
        const header = e.target.closest('.admin-table-header');
        if (header && header.dataset.sort) {
            const column = header.dataset.sort;
            if (currentAdminSort.column === column) {
                currentAdminSort.direction = currentAdminSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentAdminSort.column = column;
                currentAdminSort.direction = 'asc';
            }
            currentAdminPage = 1;
            renderAdminTable();
        }
    });
    
    // Click en "Ver" en la tabla de Admin
    elements.adminTableBody?.addEventListener('click', (e) => {
        const viewButton = e.target.closest('.view-report-btn');
        if (viewButton) {
            const studentId = viewButton.dataset.studentId;
            showAdminStudentHistory(studentId);
        }
    });

    // (NUEVO) Click en un informe DENTRO del modal de admin
    elements.adminModalBody?.addEventListener('click', async (e) => {
       const card = e.target.closest('.admin-report-card');
       if (card && card.dataset.testid) {
           const testId = card.dataset.testid;
           const docNumber = card.dataset.docNumber;

           // Simular el estado de "estudiante" para mostrar el informe
           CURRENT_STUDENT_DATA = STUDENT_DB[docNumber];
           CURRENT_STUDENT_REPORTS = SCORES_DB.filter(score => score.doc_number === docNumber);
           isAdminViewingReport = true; // Poner bandera de admin

           closeModal(elements.adminModalBackdrop); // Cerrar modal de admin
           
           // Mostrar el informe (la función se encargará del resto)
           await showIndividualReport(testId); 

           // Limpiar estado
           isAdminViewingReport = false;
           CURRENT_STUDENT_DATA = null;
           CURRENT_STUDENT_REPORTS = [];
       }
    });

    // Clicks en Modales (Cerrar)
    elements.adminModalCloseBtn?.addEventListener('click', () => closeModal(elements.adminModalBackdrop));
    elements.adminModalBackdrop?.addEventListener('click', (e) => {
        if (e.target === elements.adminModalBackdrop) {
            closeModal(elements.adminModalBackdrop);
        }
    });

    // ======================================================
    // INICIO: MEJORA 2 - Listeners de Filtros de Gráfico
    // ======================================================
    if (elements.growthChartFilters) {
        elements.growthChartFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('chart-filter-btn')) {
                // Actualizar estilo de botones
                elements.growthChartFilters.querySelectorAll('.chart-filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');

                // Obtener filtro y re-renderizar el gráfico
                const filterType = e.target.dataset.filter; // 'all', 'simulacro', 'minisimulacro'
                
                // Re-renderizar el gráfico con los datos actuales del estudiante
                renderGrowthChart(CURRENT_STUDENT_REPORTS, filterType);
            }
        });
    }
    // ======================================================
    // FIN: MEJORA 2 - Listeners de Filtros de Gráfico
    // ======================================================

    // ======================================================
    // INICIO: MEJORA 1 - Listener de Análisis Estadístico
    // ======================================================
    if (elements.statsAnalyzeBtn) {
        elements.statsAnalyzeBtn.addEventListener('click', async () => {
            const testId = elements.statsTestSelect.value;
            if (!testId) {
                showModalAlert('Por favor, seleccione una prueba para analizar.');
                return;
            }

            // Mostrar spinner y ocultar resultados anteriores
            elements.statsLoading.style.display = 'block';
            elements.statsResultsContainer.style.display = 'none';
            elements.statsResultsTableBody.innerHTML = '';
            elements.statsResultsTitle.textContent = `Resultados de Análisis: ${TEST_INDEX[testId].name}`;

            try {
                // 1. Analizar la prueba
                const analysisResults = await analyzeTestItems(testId);

                // 2. Renderizar los resultados
                renderStatsTable(analysisResults);

            } catch (error) {
                console.error(`Error analizando la prueba ${testId}:`, error);
                showModalAlert(`Error al analizar la prueba. Revise la consola.`);
            } finally {
                // Ocultar spinner y mostrar tabla
                elements.statsLoading.style.display = 'none';
                elements.statsResultsContainer.style.display = 'block';
            }
        });
    }
    // ======================================================
    // FIN: MEJORA 1 - Listener de Análisis Estadístico
    // ======================================================

    // ======================================================
    // INICIO: MEJORA 3 - Listener de Formulario CRUD (Actualizado)
    // ======================================================
    if (elements.addStudentForm) {
        elements.addStudentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Paso 1: Validar datos y guardarlos en caché (localStorage)
            // No se pide token aquí
            
            const statusEl = elements.crudStatus;
            const buttonEl = elements.addStudentBtn;
            
            buttonEl.disabled = true; // Deshabilitar botón de "Añadir"
            statusEl.textContent = 'Validando...';
            statusEl.style.color = '#374151';
            statusEl.style.display = 'inline';

            try {
                const newStudent = {
                    nombre: document.getElementById('student-name-crud').value.trim(),
                    email: document.getElementById('student-email-crud').value.trim(),
                    docType: document.getElementById('student-doc-type-crud').value,
                    docNumber: document.getElementById('student-doc-number-crud').value.trim(),
                    birthdate: document.getElementById('student-birthdate-crud').value.trim(),
                    dept: document.getElementById('student-dept-crud').value.trim(),
                    school: document.getElementById('student-school-crud').value.trim(),
                };
                
                // Validar que el estudiante no exista en la BD actual
                if (STUDENT_DB[newStudent.docNumber] || ALL_STUDENTS_ARRAY.find(s => s.Email === newStudent.email)) {
                    throw new Error("El número de documento o el email ya existen.");
                }

                // El orden DEBE coincidir con student_database.csv
                // Nombre Completo del Estudiante,Email,Tipo de Documento,Número de Documento,Fecha de Nacimiento,Departamento,Colegio/institución
                const newCsvRow = `\n${newStudent.nombre},${newStudent.email},${newStudent.docType},${newStudent.docNumber},${newStudent.birthdate},${newStudent.dept},${newStudent.school}`;

                // Guardar en la variable de "cambios pendientes"
                PENDING_STUDENT_CSV_UPDATE = newCsvRow;
                // Guardar en localStorage (como en tu repo 'editor_de_comits')
                localStorage.setItem('pendingCsvChanges', newCsvRow); 

                // Éxito (Local)
                statusEl.textContent = '¡Estudiante listo para guardar!';
                statusEl.style.color = 'var(--brand-green)';
                elements.addStudentForm.reset();
                
                // Pedir el token para confirmar
                showTokenModal('Añadir Estudiante', 'Para confirmar y añadir este estudiante al repositorio, introduce tu token.');

            } catch (error) {
                console.error('Error al validar estudiante:', error);
                statusEl.textContent = `Error: ${error.message}`;
                statusEl.style.color = 'var(--brand-red)';
            } finally {
                buttonEl.disabled = false; // Rehabilitar botón "Añadir"
            }
        });
    }

    // (NUEVO) Listener para el botón de submit DEL MODAL DE TOKEN
    if (elements.tokenModalSubmitBtn) {
        elements.tokenModalSubmitBtn.addEventListener('click', async () => {
            const token = elements.githubTokenInput.value.trim();
            if (!token) {
                elements.tokenModalStatus.textContent = 'Por favor, introduce un token.';
                elements.tokenModalStatus.style.display = 'block';
                return;
            }

            // Verificar si hay cambios pendientes
            const newCsvRow = PENDING_STUDENT_CSV_UPDATE || localStorage.getItem('pendingCsvChanges');
            if (!newCsvRow) {
                elements.tokenModalStatus.textContent = 'No hay cambios pendientes para guardar.';
                elements.tokenModalStatus.style.display = 'block';
                return;
            }

            const statusEl = elements.crudStatus; // Mensaje en el formulario principal
            const tokenStatusEl = elements.tokenModalStatus;
            const tokenButtonEl = elements.tokenModalSubmitBtn;

            tokenButtonEl.disabled = true;
            tokenStatusEl.textContent = 'Procesando...';
            tokenStatusEl.style.display = 'block';
            
            try {
                // 3. Leer el archivo actual de GitHub (usando el token)
                tokenStatusEl.textContent = 'Leyendo base de datos...';
                const fileData = await getGitHubFile(GITHUB_API_URL, token);
                
                // 4. Decodificar, Añadir, y Recodificar
                const currentContent = atob(fileData.content); // atob() decodifica Base64
                
                // Evitar duplicados si se hace doble clic
                if (currentContent.includes(newCsvRow.trim())) {
                    throw new Error("Este estudiante ya fue añadido.");
                }

                const newContent = currentContent + newCsvRow;
                const newContentBase64 = btoa(newContent); // btoa() codifica a Base64

                // 5. Escribir (Hacer Commit) del nuevo archivo
                tokenStatusEl.textContent = 'Guardando en GitHub...';
                await updateGitHubFile(
                    GITHUB_API_URL,
                    token,
                    `Commit automático: Añadido estudiante`, // Mensaje genérico por seguridad
                    newContentBase64,
                    fileData.sha // El 'sha' es OBLIGATORIO
                );

                // Éxito Final
                statusEl.textContent = '¡Estudiante añadido con éxito a GitHub!';
                statusEl.style.color = 'var(--brand-green)';
                
                // Limpiar caché y cerrar modal
                PENDING_STUDENT_CSV_UPDATE = null;
                localStorage.removeItem('pendingCsvChanges');
                elements.githubTokenInput.value = ''; // Limpiar token del input
                closeModal(elements.tokenModal);

                // Forzar recarga de datos para actualizar la tabla de admin
                statusEl.textContent = 'Actualizando tabla local...';
                await loadAllData(true); // true = forzar recarga
                renderAdminTable(); // Re-renderizar la tabla de admin
                statusEl.textContent = '¡Estudiante añadido con éxito!';

            } catch (error) {
                console.error('Error al guardar en GitHub:', error);
                tokenStatusEl.textContent = `Error: ${error.message}`;
            } finally {
                tokenButtonEl.disabled = false;
                 setTimeout(() => {
                    statusEl.style.display = 'none';
                    tokenStatusEl.style.display = 'none';
                }, 5000);
            }
        });
    }
    
    // (NUEVO) Listener para CERRAR el modal de token
    elements.tokenModalCloseBtn?.addEventListener('click', () => closeModal(elements.tokenModal));
    elements.tokenModal?.addEventListener('click', (e) => {
        if (e.target === elements.tokenModal) {
            closeModal(elements.tokenModal);
        }
    });
    // ======================================================
    // FIN: MEJORA 3 - Listener de Formulario CRUD
    // ======================================================
});

// --- Funciones de Carga de Datos ---

/**
 * Carga todos los datos iniciales (estudiantes, puntajes, índice)
 * @param {boolean} force - Si es true, fuerza la recarga de los CSV
 */
async function loadAllData(force = false) {
    showLoading(true, 'Cargando datos maestros...');
    try {
        // Cargar el índice de pruebas primero (siempre desde la red)
        elements.loadingText.textContent = 'Cargando índice de pruebas...';
        const indexResponse = await fetch(URLS.testIndex);
        if (!indexResponse.ok) throw new Error(`No se pudo cargar ${URLS.testIndex}`);
        TEST_INDEX = await indexResponse.json();
        
        // Cargar bases de datos principales (solo si están vacías o se fuerza)
        if (force || Object.keys(STUDENT_DB).length === 0) {
            elements.loadingText.textContent = 'Cargando base de datos de estudiantes...';
            const studentsData = await fetchAndParseCSV(URLS.studentDatabase);
            // Convertir array a objeto (diccionario) para login rápido
            STUDENT_DB = {};
            ALL_STUDENTS_ARRAY = [];
            for (const student of studentsData) {
                const docNumber = student['Número de Documento']?.trim();
                if (docNumber) {
                    STUDENT_DB[docNumber] = student;
                    ALL_STUDENTS_ARRAY.push(student);
                }
            }
        }
        
        if (force || SCORES_DB.length === 0) {
            elements.loadingText.textContent = 'Cargando base de datos de puntajes...';
            SCORES_DB = await fetchAndParseCSV(URLS.scoresDatabase);
        }

        showLoading(false);
        showSection('login-section');

    } catch (error) {
        console.error('Error fatal al cargar datos:', error);
        elements.loadingText.textContent = `Error al cargar datos. Revisa la consola y recarga la página. ${error.message}`;
    }
}

/**
 * Función helper para cargar y parsear archivos CSV usando PapaParse
 * @param {string} url - La URL del archivo CSV
 * @returns {Promise<Array>} - Una promesa que resuelve a un array de objetos
 */
function fetchAndParseCSV(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length) {
                    reject(new Error(`Error al parsear ${url}: ${results.errors[0].message}`));
                } else {
                    resolve(results.data);
                }
            },
            error: (error) => {
                reject(new Error(`Error al descargar ${url}: ${error.message}`));
            }
        });
    });
}

// --- Lógica de Autenticación y Navegación ---

function handleLogin(e) {
    e.preventDefault();
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value.trim();

    // 1. Check Admin Login
    if (username === SUPER_USER_CREDENTIALS.username && password === SUPER_USER_CREDENTIALS.password) {
        showSection('admin-dashboard-section');
        showAdminDashboard();
        return;
    }

    // 2. Check Student Login
    // Intentar login por email o por documento
    let studentData = STUDENT_DB[username]; // Intento por Documento
    if (!studentData) {
        // Intento por Email
        const foundStudent = ALL_STUDENTS_ARRAY.find(s => s.Email?.trim().toLowerCase() === username.toLowerCase());
        if (foundStudent) {
            studentData = foundStudent;
        }
    }

    // Validar contraseña (Número de Documento)
    if (studentData && studentData['Número de Documento']?.trim() === password) {
        CURRENT_STUDENT_DATA = studentData;
        CURRENT_STUDENT_REPORTS = SCORES_DB.filter(score => score.doc_number === password);
        showSection('student-dashboard-section');
        showStudentDashboard();
    } else {
        elements.loginError.textContent = 'Usuario o contraseña incorrectos.';
        elements.loginError.style.display = 'block';
    }
}

function handleLogout() {
    // Limpiar estado
    CURRENT_STUDENT_DATA = null;
    CURRENT_STUDENT_REPORTS = [];
    adminFilteredData = [];
    currentAdminPage = 1;
    isAdminViewingReport = false;
    
    // Limpiar inputs
    elements.usernameInput.value = '';
    elements.passwordInput.value = '';
    elements.loginError.style.display = 'none';
    
    // Mostrar login
    showSection('login-section');
}

/**
 * Muestra una sección principal y oculta las demás
 * @param {string} sectionId - ID de la sección a mostrar
 */
function showSection(sectionId) {
    const sections = [
        elements.loginSection,
        elements.loadingSection,
        elements.studentDashboard,
        elements.adminDashboard,
        elements.reportContentSection
    ];
    sections.forEach(section => {
        if (section) {
            section.style.display = section.id === sectionId ? 'block' : 'none';
        }
    });
    // Mostrar/Ocultar botón de logout
    elements.logoutBtn.style.display = (sectionId !== 'login-section' && sectionId !== 'loading-section') ? 'block' : 'none';
}

function showLoading(show, text = 'Cargando...') {
    if (show) {
        elements.loadingText.textContent = text;
        showSection('loading-section');
    } else {
        showSection('login-section'); // Oculta el loading y vuelve al login por defecto
    }
}

function showDashboard() {
    // Limpiar contenido del informe
    elements.reportContentBody.innerHTML = '';
    
    // Destruir gráficos si existen
    if (window.myRadarChart instanceof Chart) {
        window.myRadarChart.destroy();
    }
    
    if (isAdminViewingReport) {
        showSection('admin-dashboard-section');
        showAdminDashboard(); // Vuelve al panel de admin
    } else {
        showSection('student-dashboard-section');
        showStudentDashboard(); // Vuelve al panel de estudiante
    }
}


// --- Lógica de Dashboard de Estudiante ---

function showStudentDashboard() {
    if (!CURRENT_STUDENT_DATA) return;
    
    elements.studentName.textContent = CURRENT_STUDENT_DATA['Nombre Completo del Estudiante'];
    elements.reportCardsContainer.innerHTML = ''; // Limpiar tarjetas

    if (CURRENT_STUDENT_REPORTS.length === 0) {
        elements.reportCardsContainer.innerHTML = '<p class="text-gray-600">No tienes informes disponibles.</p>';
        
        // Destruir gráfico si no hay datos
        if (window.myGrowthChart instanceof Chart) {
            window.myGrowthChart.destroy();
        }
        return;
    }
    
    // Ordenar reportes por fecha
    const sortedReports = [...CURRENT_STUDENT_REPORTS].sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    // 1. Renderizar tarjetas de informes
    sortedReports.forEach(report => {
        const testId = report.test_id;
        const testInfo = TEST_INDEX[testId];
        if (!testInfo) return; // Omitir si la prueba no está en el índice

        const card = document.createElement('div');
        card.className = "bg-brand-surface p-6 rounded-xl shadow-sm border border-brand-border cursor-pointer hover:shadow-md hover:border-brand-secondary transition-all";
        card.dataset.testid = testId;
        card.innerHTML = `
            <h4 class="text-xl font-bold text-brand-header mb-2">${testInfo.name}</h4>
            <p class="text-sm text-gray-500 mb-4">Fecha: ${new Date(report.test_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div class="flex items-center justify-between">
                <span class="text-3xl font-extrabold text-brand-secondary">${report.global_score}</span>
                <span class="text-sm font-medium text-gray-500">Puntaje Global</span>
            </div>
            <div class="mt-4 pt-4 border-t border-brand-border grid grid-cols-5 gap-2 text-center">
                <div><span class="font-bold text-xs text-matematicas">MAT</span><p class="font-bold text-lg text-matematicas">${report.mat_score}</p></div>
                <div><span class="font-bold text-xs text-lectura">LEC</span><p class="font-bold text-lg text-lectura">${report.lec_score}</p></div>
                <div><span class="font-bold text-xs text-sociales">SOC</span><p class="font-bold text-lg text-sociales">${report.soc_score}</p></div>
                <div><span class="font-bold text-xs text-ciencias">CIE</span><p class="font-bold text-lg text-ciencias">${report.cie_score}</p></div>
                <div><span class="font-bold text-xs text-ingles">ING</span><p class="font-bold text-lg text-ingles">${report.ing_score}</p></div>
            </div>
        `;
        card.addEventListener('click', () => showIndividualReport(testId));
        elements.reportCardsContainer.appendChild(card);
    });

    // 2. Renderizar gráfico de progreso
    // Iniciar con el filtro "all"
    renderGrowthChart(sortedReports, 'all'); 
    // Asegurar que el botón "all" esté activo
    elements.growthChartFilters.querySelectorAll('.chart-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === 'all');
    });
}

// ======================================================
// INICIO: MEJORA 2 - Función de Gráfico de Progreso (Modificada)
// ======================================================
/**
 * Renderiza la gráfica de crecimiento del estudiante.
 * @param {Array} studentReports - Array de reportes del estudiante (de SCORES_DB)
 * @param {string} filterType - 'all', 'simulacro', o 'minisimulacro'
 */
function renderGrowthChart(studentReports, filterType = 'all') {
    const ctx = document.getElementById('growthChart')?.getContext('2d');
    if (!ctx) return;

    // 3. DESTRUIR GRÁFICO ANTERIOR
    if (window.myGrowthChart instanceof Chart) {
        window.myGrowthChart.destroy();
    }

    // 1. FILTRAR DATOS
    const filteredReports = studentReports
        .filter(report => {
            // Necesitamos el tipo de prueba desde TEST_INDEX
            const testType = TEST_INDEX[report.test_id]?.type;
            if (filterType === 'all') {
                return true; // Mostrar todos
            }
            return testType === filterType; // Mostrar solo el tipo seleccionado
        })
        .sort((a, b) => new Date(a.test_date) - new Date(b.test_date)); // Asegurar orden cronológico

    // 2. PREPARAR DATOS PARA CHART.JS
    const chartData = filteredReports.map(report => ({
        x: new Date(report.test_date), // Eje X es la fecha
        y: parseInt(report.global_score) // Eje Y es el puntaje
    }));

    // 4. RENDERIZAR NUEVO GRÁFICO
    window.myGrowthChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Puntaje Global (0-500)',
                data: chartData,
                borderColor: 'var(--brand-primary)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                fill: true,
                tension: 0.1,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: 'var(--brand-primary)',
                pointBorderColor: 'var(--brand-surface)',
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
                        text: 'Fecha'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: false, // Empezar cerca del puntaje más bajo
                    min: 100,
                    max: 500,
                    title: {
                        display: true,
                        text: 'Puntaje Global'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(context) {
                            // Formatear la fecha en el tooltip
                            return new Date(context[0].parsed.x).toLocaleDateString('es-CO', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            });
                        },
                        label: function(context) {
                            // Mostrar el nombre de la prueba en el tooltip
                            const reportIndex = context.dataIndex;
                            const testId = filteredReports[reportIndex].test_id;
                            const testName = TEST_INDEX[testId]?.name || 'Prueba';
                            return `${testName}: ${context.parsed.y}`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            }
        }
    });
}
// ======================================================
// FIN: MEJORA 2 - Función de Gráfico de Progreso
// ======================================================


// --- Lógica de Dashboard de Administrador ---

function showAdminDashboard() {
    renderAdminTable();

    // ======================================================
    // INICIO: MEJORA 1 - Poblar selector de pruebas
    // ======================================================
    if (elements.statsTestSelect) {
        elements.statsTestSelect.innerHTML = '<option value="">Seleccione una prueba</option>';
        for (const testId in TEST_INDEX) {
            const testName = TEST_INDEX[testId].name;
            elements.statsTestSelect.innerHTML += `<option value="${testId}">${testName}</option>`;
        }
    }
    // ======================================================
    // FIN: MEJORA 1 - Poblar selector de pruebas
    // ======================================================
}

function renderAdminTable() {
    if (!elements.adminTableBody) return;

    // 1. Filtrar
    const searchTerm = elements.adminSearch.value.toLowerCase();
    adminFilteredData = ALL_STUDENTS_ARRAY.filter(student => {
        const name = student['Nombre Completo del Estudiante']?.toLowerCase() || '';
        const doc = student['Número de Documento']?.toLowerCase() || '';
        return name.includes(searchTerm) || doc.includes(searchTerm);
    });

    // 2. Ordenar
    adminFilteredData.sort((a, b) => {
        const valA = a[currentAdminSort.column] || '';
        const valB = b[currentAdminSort.column] || '';
        if (valA < valB) return currentAdminSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentAdminSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // 3. Paginar
    const totalPages = Math.ceil(adminFilteredData.length / adminRowsPerPage);
    const start = (currentAdminPage - 1) * adminRowsPerPage;
    const end = start + adminRowsPerPage;
    const paginatedData = adminFilteredData.slice(start, end);

    // 4. Renderizar
    elements.adminTableBody.innerHTML = '';
    if (paginatedData.length === 0) {
        elements.adminTableBody.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-gray-500">No se encontraron estudiantes.</td></tr>`;
    } else {
        paginatedData.forEach(student => {
            const docNumber = student['Número de Documento'];
            const row = document.createElement('tr');
            row.className = "hover:bg-gray-50";
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-brand-header">${student['Nombre Completo del Estudiante']}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-brand-text">${student['Email']}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-brand-text">${student['Tipo de Documento']} ${student['Número de Documento']}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-brand-text">${student['Colegio/institución']}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="view-report-btn text-brand-secondary hover:text-brand-blue-dark" data-student-id="${docNumber}">
                        Ver Informes
                    </button>
                </td>
            `;
            elements.adminTableBody.appendChild(row);
        });
    }

    // 5. Actualizar info de paginación
    elements.adminPageInfo.textContent = `Mostrando ${start + 1}-${Math.min(end, adminFilteredData.length)} de ${adminFilteredData.length}`;
    elements.adminPrevPage.disabled = currentAdminPage === 1;
    elements.adminNextPage.disabled = currentAdminPage === totalPages;
}

function showAdminStudentHistory(studentId) {
    const student = STUDENT_DB[studentId];
    if (!student) return;

    const studentReports = SCORES_DB.filter(score => score.doc_number === studentId)
                                   .sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    elements.adminModalHeader.textContent = `Historial de: ${student['Nombre Completo del Estudiante']}`;
    elements.adminModalBody.innerHTML = ''; // Limpiar

    if (studentReports.length === 0) {
        elements.adminModalBody.innerHTML = '<p class="text-gray-600">Este estudiante no tiene informes disponibles.</p>';
        openModal(elements.adminModalBackdrop);
        return;
    }
    
    // Renderizar tarjetas de informes (versión admin)
    const cardsGrid = document.createElement('div');
    cardsGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";

    studentReports.forEach(report => {
        const testId = report.test_id;
        const testInfo = TEST_INDEX[testId];
        if (!testInfo) return;

        cardsGrid.innerHTML += `
            <div class="admin-report-card bg-brand-surface p-4 rounded-lg shadow-sm border border-brand-border cursor-pointer hover:border-brand-secondary" data-testid="${testId}" data-doc-number="${studentId}">
                <h5 class="font-bold text-brand-header">${testInfo.name}</h5>
                <p class="text-sm text-gray-500 mb-3">Fecha: ${new Date(report.test_date).toLocaleDateString('es-CO')}</p>
                <div class="flex items-center justify-between">
                    <span class="text-2xl font-bold text-brand-secondary">${report.global_score}</span>
                    <span class="text-sm font-medium text-gray-500">Puntaje Global</span>
                </div>
            </div>
        `;
    });
    
    elements.adminModalBody.appendChild(cardsGrid);
    openModal(elements.adminModalBackdrop);
}


// --- Lógica de Informe Individual ---

/**
 * Carga los datos de UNA prueba (claves, respuestas, videos) si no están cacheados
 * @param {string} testId - El ID de la prueba (ej. "sg11_07")
 */
async function loadTestSpecificData(testId) {
    if (CACHED_TEST_DATA[testId]) {
        return CACHED_TEST_DATA[testId];
    }
    
    const testInfo = TEST_INDEX[testId];
    if (!testInfo) throw new Error(`No se encontró la prueba ${testId} en el índice.`);

    showLoading(true, `Cargando datos del informe ${testInfo.name}...`);
    
    try {
        const testData = {
            keys: {},
            answers: {},
            videos: {}
        };

        // Función helper para cargar y parsear
        const loadAndParse = async (url) => {
            if (!url) return null;
            const fullUrl = `${BASE_DATA_URL}${url}?t=${TIMESTAMP}`;
            return await fetchAndParseCSV(fullUrl);
        };
        
        // ======================================================
        // INICIO: LÓGICA POLIMÓRFICA (Simulacro vs Minisimulacro)
        // ======================================================
        let keysData = [];
        let answersData = [];
        
        if (testInfo.type === 'simulacro') {
            // Simulacro: Cargar S1 y S2
            elements.loadingText.textContent = 'Cargando claves (S1)...';
            const keysS1 = await loadAndParse(testInfo.keys_s1);
            elements.loadingText.textContent = 'Cargando claves (S2)...';
            const keysS2 = await loadAndParse(testInfo.keys_s2);
            
            elements.loadingText.textContent = 'Cargando respuestas (S1)...';
            const answersS1 = await loadAndParse(testInfo.answers_s1);
            elements.loadingText.textContent = 'Cargando respuestas (S2)...';
            const answersS2 = await loadAndParse(testInfo.answers_s2);

            // Combinar datos
            keysData = [...(keysS1 || []), ...(keysS2 || [])];
            answersData = [...(answersS1 || []), ...(answersS2 || [])];
            
        } else {
            // Minisimulacro: Cargar singular
            elements.loadingText.textContent = 'Cargando claves...';
            keysData = await loadAndParse(testInfo.keys);
            elements.loadingText.textContent = 'Cargando respuestas...';
            answersData = await loadAndParse(testInfo.answers);
        }
        // ======================================================
        // FIN: LÓGICA POLIMÓRFICA
        // ======================================================

        // Procesar claves (1 fila de datos)
        if (keysData && keysData.length > 0) {
            // Combinar todas las claves en un solo objeto (para S1 y S2)
            testData.keys = keysData.reduce((acc, obj) => ({...acc, ...obj}), {});
        }

        // Procesar respuestas (múltiples filas)
        const docNumber = CURRENT_STUDENT_DATA['Número de Documento'];
        const studentAnswers = answersData.find(row => 
            row.ID === docNumber || // (Compatibilidad con formato antiguo)
            row['Número de Documento'] === docNumber ||
            row['Documento'] === docNumber
        );
        if (studentAnswers) {
            testData.answers = studentAnswers;
        }

        // Cargar base de datos de videos (formato TXT especial)
        elements.loadingText.textContent = 'Cargando retroalimentación...';
        if(testInfo.videos) {
            const videoUrl = `${BASE_DATA_URL}${testInfo.videos}?t=${TIMESTAMP}`;
            const videoResponse = await fetch(videoUrl);
            if (videoResponse.ok) {
                const videoTxt = await videoResponse.text();
                testData.videos = parseVideoFeedback(videoTxt);
            }
        } // else: no hay videos, testData.videos queda como {}

        CACHED_TEST_DATA[testId] = testData;
        showLoading(false);
        return testData;

    } catch (error) {
        console.error(`Error cargando datos para ${testId}:`, error);
        showLoading(false);
        showModalAlert(`Error al cargar los datos del informe: ${error.message}`);
        showDashboard(); // Volver al dashboard
        return null;
    }
}

/**
 * Parsea el formato TXT de la base de datos de videos
 * @param {string} txtData - El contenido del archivo bd_retro_...txt
 * @returns {Object} - Un objeto estructurado con los videos
 */
function parseVideoFeedback(txtData) {
    const feedback = {};
    const lines = txtData.split('\n');
    let currentMateria = '';
    let currentNivel = '';

    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('***')) {
            // Es una materia (ej. ***MATEMATICAS***)
            currentMateria = line.replace(/\*/g, '').trim().toUpperCase();
            feedback[currentMateria] = {};
        } else if (line.startsWith('**')) {
            // Es un nivel (ej. **BAJO** o **BÁSICO 10-40**)
            // Extraer el nombre del nivel (ej. BAJO)
            currentNivel = line.match(/\*\*(.*?)(?:\s|$)/)[1].trim().toUpperCase();
            feedback[currentMateria][currentNivel] = [];
        } else if (line.startsWith('*')) {
            // Es un video (ej. *[VIDEO 1] | [TÍTULO] | [URL] | [MINIATURA])
            const parts = line.substring(1).split('|').map(s => s.trim());
            if (parts.length >= 4) {
                feedback[currentMateria][currentNivel].push({
                    id: parts[0],
                    title: parts[1],
                    url: parts[2],
                    thumbnail: parts[3]
                });
            }
        }
    });
    return feedback;
}

/**
 * Muestra el informe individual para una prueba
 * @param {string} testId - El ID de la prueba (ej. "sg11_07")
 */
async function showIndividualReport(testId) {
    const testData = await loadTestSpecificData(testId);
    if (!testData) return; // Error al cargar

    const report = CURRENT_STUDENT_REPORTS.find(r => r.test_id === testId);
    if (!report) {
        showModalAlert('No se encontró el puntaje para este informe.');
        showDashboard();
        return;
    }
    
    const testInfo = TEST_INDEX[testId];
    elements.reportContentBody.innerHTML = ''; // Limpiar contenido anterior
    showSection('report-content-section');

    // 1. Crear HTML del Encabezado del Informe (Puntajes)
    const headerHTML = createReportHeader(report, testInfo);
    elements.reportContentBody.innerHTML += headerHTML;

    // 2. Crear HTML de las Pestañas (si es simulacro) o Contenedor Único
    let tabsHTML = '';
    let contentHTML = '';
    
    if (testInfo.type === 'simulacro') {
        tabsHTML = `
            <div class="mb-4 border-b border-gray-200">
                <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                    <button class="tab-btn active" data-tab="sesion1">Sesión 1</button>
                    <button class="tab-btn" data-tab="sesion2">Sesión 2</button>
                    <button class="tab-btn" data-tab="feedback">Retroalimentación</button>
                </nav>
            </div>
        `;
        contentHTML = `
            <div id="tab-content-sesion1" class="tab-content"></div>
            <div id="tab-content-sesion2" class="tab-content hidden"></div>
            <div id="tab-content-feedback" class="tab-content hidden"></div>
        `;
    } else {
        // Minisimulacro (sin pestañas)
        tabsHTML = `
            <div class="mb-4 border-b border-gray-200">
                <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                    <button class="tab-btn active" data-tab="sesion1">Respuestas</button>
                    <button class="tab-btn" data-tab="feedback">Retroalimentación</button>
                </nav>
            </div>
        `;
        contentHTML = `
            <div id="tab-content-sesion1" class="tab-content"></div>
            <div id="tab-content-feedback" class="tab-content hidden"></div>
        `;
    }

    elements.reportContentBody.innerHTML += tabsHTML + contentHTML;
    
    // 3. Renderizar contenido de preguntas
    const { keys, answers } = testData;
    const questionsContainerS1 = document.getElementById('tab-content-sesion1');
    const questionsContainerS2 = document.getElementById('tab-content-sesion2');

    let questionGroups = {}; // { "MATEMÁTICAS": "...", "LECTURA CRÍTICA": "..." }

    for (const questionHeader in keys) {
        // Solo procesar si es un header de pregunta (contiene "[")
        if (!questionHeader.includes('[')) continue; 

        const studentAnswer = answers[questionHeader]?.trim().toUpperCase() || 'OMISION';
        const correctAnswer = keys[questionHeader]?.trim().toUpperCase();
        
        // Extraer materia (ej. "Matemáticas S1")
        const materiaMatch = questionHeader.match(/^(.*?)(?: S[12])? \[/);
        let materia = materiaMatch ? materiaMatch[1].trim().toUpperCase() : 'INDEFINIDA';
        
        // Agrupar "Sociales y Ciudadanas"
        if (materia.includes('SOCIALES') || materia.includes('CIUDADANAS')) {
            materia = 'SOCIALES Y CIUDADANAS';
        }
        
        if (!questionGroups[materia]) {
            questionGroups[materia] = { html: '', isS2: questionHeader.includes('S2') };
        }
        
        questionGroups[materia].html += createQuestionHTML(questionHeader, studentAnswer, correctAnswer);
    }
    
    // Insertar grupos en los contenedores correctos
    for(const materia in questionGroups) {
        const group = questionGroups[materia];
        const groupHTML = `
            <div class="mb-6">
                <h3 class="text-xl font-bold text-brand-header mb-4">${materia}</h3>
                <div class="space-y-3">
                    ${group.html}
                </div>
            </div>
        `;
        
        if (testInfo.type === 'simulacro' && group.isS2 && questionsContainerS2) {
            questionsContainerS2.innerHTML += groupHTML;
        } else {
            questionsContainerS1.innerHTML += groupHTML;
        }
    }

    // 4. Renderizar contenido de Feedback (Videos)
    const feedbackContainer = document.getElementById('tab-content-feedback');
    if (feedbackContainer) {
        feedbackContainer.innerHTML = createFeedbackHTML(report, testData.videos);
    }

    // 5. Añadir listeners a las pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            // Ocultar todos los contenidos
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            // Desactivar todos los botones
            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
            });
            // Mostrar contenido y activar botón
            const contentEl = document.getElementById(`tab-content-${tabId}`);
            if (contentEl) contentEl.style.display = 'block';
            btn.classList.add('active');
        });
    });

    // ======================================================
    // INICIO: MEJORA 2 - Renderizar Gráfico de Radar
    // ======================================================
    const radarCtx = document.getElementById('radarChart')?.getContext('2d');
    if (radarCtx && report) {
        // Destruir gráfico anterior si existe
        if (window.myRadarChart instanceof Chart) {
            window.myRadarChart.destroy();
        }
        
        // Crear el nuevo gráfico de radar
        window.myRadarChart = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Matemáticas', 'Lectura Crítica', 'Sociales', 'Ciencias', 'Inglés'],
                datasets: [{
                    label: `Puntajes (0-100) - ${testInfo.name}`,
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
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
                        grid: { color: 'rgba(0, 0, 0, 0.1)' },
                        pointLabels: {
                            font: { size: 13, weight: 'bold' }
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
                        position: 'top',
                    }
                }
            }
        });
    }
    // ======================================================
    // FIN: MEJORA 2 - Renderizar Gráfico de Radar
    // ======================================================
}

// --- Funciones de Creación de HTML (Helpers) ---

function createReportHeader(report, testInfo) {
    // Aquí puedes añadir lógica de niveles de desempeño, etc.
    return `
        <div class="bg-brand-surface p-6 rounded-xl shadow-sm mb-6">
            <h2 class="text-3xl font-bold text-brand-header mb-2">${testInfo.name}</h2>
            <p class="text-lg text-gray-600 mb-6">Fecha: ${new Date(report.test_date).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-6 gap-6">
                <!-- Puntaje Global -->
                <div class="md:col-span-2 bg-gray-50 p-6 rounded-lg flex flex-col items-center justify-center">
                    <span class="text-sm font-medium text-gray-500 mb-1">PUNTAJE GLOBAL</span>
                    <span class="text-7xl font-extrabold text-brand-secondary">${report.global_score}</span>
                    <span class="font-medium text-gray-600">sobre 500</span>
                </div>
                
                <!-- Puntajes por Área -->
                <div class="md:col-span-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    ${createScoreCard('Matemáticas', report.mat_score, 'matematicas')}
                    ${createScoreCard('Lectura Crítica', report.lec_score, 'lectura')}
                    ${createScoreCard('Sociales y C.', report.soc_score, 'sociales')}
                    ${createScoreCard('Ciencias Nat.', report.cie_score, 'ciencias')}
                    ${createScoreCard('Inglés', report.ing_score, 'ingles')}
                </div>
            </div>
        </div>
    `;
}

function createScoreCard(materia, puntaje, cssClass) {
    // Lógica de Nivel (ejemplo)
    let nivel = 'Bajo';
    let nivelColor = 'text-brand-red';
    if (puntaje >= 41) { nivel = 'Básico'; nivelColor = 'text-yellow-600'; }
    if (puntaje >= 61) { nivel = 'Satisfactorio'; nivelColor = 'text-brand-green'; }
    if (puntaje >= 81) { nivel = 'Avanzado'; nivelColor = 'text-brand-secondary'; }

    return `
        <div class="bg-gray-50 p-4 rounded-lg text-center border-l-4 border-${cssClass}">
            <h5 class="text-sm font-bold text-${cssClass} truncate">${materia}</h5>
            <p class="text-4xl font-bold text-brand-header my-1">${puntaje}</p>
            <p class="text-sm font-medium ${nivelColor}">${nivel}</p>
        </div>
    `;
}

function createQuestionHTML(header, studentAnswer, correctAnswer) {
    const isCorrect = studentAnswer === correctAnswer;
    const isOmitted = studentAnswer === 'OMISION';
    
    let bgColor = isCorrect ? 'bg-green-50' : (isOmitted ? 'bg-yellow-50' : 'bg-red-50');
    let borderColor = isCorrect ? 'border-green-200' : (isOmitted ? 'border-yellow-200' : 'border-red-200');
    let icon = isCorrect 
        ? `<span class="text-brand-green font-bold">&#10003;</span>` // Check
        : (isOmitted 
            ? `<span class="text-yellow-600 font-bold">!</span>` // Exclamación
            : `<span class="text-brand-red font-bold">&#10005;</span>`); // X

    return `
        <div class="p-3 rounded-lg border ${borderColor} ${bgColor} flex items-center justify-between space-x-4">
            <div class="flex items-center space-x-3">
                ${icon}
                <span class="text-sm font-medium text-brand-header">${header.split('[')[1].replace(']', '')}</span>
            </div>
            <div class="flex items-center space-x-4">
                <span class="text-sm ${isCorrect ? 'text-gray-500' : (isOmitted ? 'text-yellow-600' : 'text-brand-red')}">
                    Tu Rpta: <span class="font-bold">${studentAnswer}</span>
                </span>
                ${!isCorrect ? `
                <span class="text-sm text-brand-green">
                    Correcta: <span class="font-bold">${correctAnswer}</span>
                </span>` : ''}
            </div>
        </div>
    `;
}

function createFeedbackHTML(report, videoDB) {
    let html = '<div class="space-y-8">';
    const materias = [
        { key: 'MATEMATICAS', score: report.mat_score, name: 'Matemáticas' },
        { key: 'LECTURA CRITICA', score: report.lec_score, name: 'Lectura Crítica' },
        { key: 'SOCIALES Y CIUDADANAS', score: report.soc_score, name: 'Sociales y Ciudadanas' },
        { key: 'CIENCIAS NATURALES', score: report.cie_score, name: 'Ciencias Naturales' },
        { key: 'INGLES', score: report.ing_score, name: 'Inglés' }
    ];

    materias.forEach(materia => {
        // Determinar nivel basado en puntaje
        let nivel = 'BAJO'; // Por defecto
        if (materia.score >= 41) nivel = 'BASICO';
        if (materia.score >= 61) nivel = 'SATISFACTORIO';
        if (materia.score >= 81) nivel = 'AVANZADO';
        
        // Buscar videos para esa materia y ese nivel
        const videos = videoDB[materia.key]?.[nivel] || [];
        
        html += `
            <div>
                <h3 class="text-2xl font-bold text-brand-header mb-4 border-b pb-2">
                    Retroalimentación de ${materia.name} (Nivel ${nivel})
                </h3>
        `;
        
        if (videos.length > 0) {
            html += '<div class="video-grid">';
            videos.forEach(video => {
                html += `
                    <a href="${video.url}" target="_blank" class="video-card block">
                        <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail" onerror="this.src='https://placehold.co/480x270/e5e7eb/374151?text=Video';">
                        <div class="p-4">
                            <p class="font-semibold text-brand-header hover:text-brand-secondary">${video.title}</p>
                            <p class="text-sm text-gray-500">${video.id}</p>
                        </div>
                    </a>
                `;
            });
            html += '</div>';
        } else {
            html += `<p class="text-gray-600">No hay videos de retroalimentación asignados para tu nivel de desempeño en esta materia.</p>`;
        }
        
        html += `</div>`;
    });

    html += '</div>';
    return html;
}

// --- Funciones de Modal ---

function openModal(modalBackdrop) {
    modalBackdrop.style.display = 'flex';
    setTimeout(() => {
        modalBackdrop.style.opacity = 1;
        modalBackdrop.querySelector('.modal-container').style.transform = 'scale(1)';
    }, 10);
}

function closeModal(modalBackdrop) {
    modalBackdrop.style.opacity = 0;
    modalBackdrop.querySelector('.modal-container').style.transform = 'scale(0.95)';
    setTimeout(() => {
        modalBackdrop.style.display = 'none';
    }, 300);
}

// (NUEVO) Modal de Alerta simple
function showModalAlert(message) {
    // (Esta es una implementación simple, idealmente crearías un modal de alerta dedicado)
    alert(message);
}

// (NUEVO) Funciones de Modal de Token (Mejora 3)
function showTokenModal(title, message) {
    // Limpiar estado anterior
    elements.tokenModalStatus.textContent = '';
    elements.tokenModalStatus.style.display = 'none';
    elements.githubTokenInput.value = ''; // No guardar el token
    
    // (Opcional) Personalizar textos
    // document.getElementById('token-modal-title').textContent = title;
    // document.getElementById('token-modal-message').textContent = message;

    openModal(elements.tokenModal);
}


// ======================================================
// INICIO: MEJORA 1 - Funciones de Análisis Estadístico
// ======================================================

/**
 * Realiza el análisis estadístico de una prueba.
 * Carga respuestas, claves, y procesa los datos.
 * @param {string} testId - El ID de la prueba (ej. "sg11_07" o "mini_1")
 * @returns {Promise<Object>} - Un objeto con los resultados del análisis
 */
async function analyzeTestItems(testId) {
    const testInfo = TEST_INDEX[testId];
    if (!testInfo) {
        throw new Error(`No se encontró información para la prueba ${testId}`);
    }

    const stats = {};

    // --- 1. Cargar Claves y Respuestas ---
    const loadAndParse = async (url) => {
        if (!url) return null;
        const fullUrl = `${BASE_DATA_URL}${url}?t=${TIMESTAMP}`;
        return await fetchAndParseCSV(fullUrl);
    };

    let keysData = [];
    let answersData = [];

    if (testInfo.type === 'simulacro') {
        const [keysS1, keysS2, answersS1, answersS2] = await Promise.all([
            loadAndParse(testInfo.keys_s1),
            loadAndParse(testInfo.keys_s2),
            loadAndParse(testInfo.answers_s1),
            loadAndParse(testInfo.answers_s2)
        ]);
        keysData = [...(keysS1 || []), ...(keysS2 || [])];
        answersData = [...(answersS1 || []), ...(answersS2 || [])];
    } else {
        const [keys, answers] = await Promise.all([
            loadAndParse(testInfo.keys),
            loadAndParse(testInfo.answers)
        ]);
        keysData = keys || [];
        answersData = answers || [];
    }

    if (keysData.length === 0) throw new Error("No se pudieron cargar los archivos de claves.");
    if (answersData.length === 0) throw new Error("No se pudieron cargar los archivos de respuestas.");

    // Mapear claves (asumiendo que es la primera fila)
    // Combinar todas las claves en un solo objeto (para S1 y S2)
    const keysMap = keysData.reduce((acc, obj) => ({...acc, ...obj}), {});
    for (const header in keysMap) {
        if (header.includes('[')) { // Solo procesar headers de preguntas
            stats[header] = {
                pregunta: header,
                correcta: keysMap[header]?.trim().toUpperCase(),
                A: 0, B: 0, C: 0, D: 0, Omision: 0,
                total: 0,
                correctas: 0
            };
        }
    }

    // --- 2. Procesar Respuestas de TODOS los estudiantes ---
    for (const studentRow of answersData) {
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
 * Renderiza los resultados del análisis en la tabla HTML.
 * @param {Object} stats - El objeto de resultados de analyzeTestItems
 */
function renderStatsTable(stats) {
    elements.statsResultsTableBody.innerHTML = ''; // Limpiar tabla
    
    // Convertir a array para poder ordenar
    const statsArray = Object.values(stats);
    // Ordenar por % de acierto (más difícil primero)
    statsArray.sort((a, b) => {
        const pctA = a.total > 0 ? (a.correctas / a.total) : 0;
        const pctB = b.total > 0 ? (b.correctas / b.total) : 0;
        return pctA - pctB; // Ascendente
    });

    for (const item of statsArray) {
        if (item.total === 0) continue; // No mostrar preguntas sin respuestas

        // Calcular porcentajes
        const pctAcierto = ((item.correctas / item.total) * 100).toFixed(0);
        const pctOmision = ((item.Omision / item.total) * 100).toFixed(0);
        const pctA = ((item.A / item.total) * 100).toFixed(0);
        const pctB = ((item.B / item.total) * 100).toFixed(0);
        const pctC = ((item.C / item.total) * 100).toFixed(0);
        const pctD = ((item.D / item.total) * 100).toFixed(0);

        // Determinar dificultad (para el color)
        let dificultadClase = 'text-yellow-600'; // Medio
        let dificultadTexto = 'Medio';
        if (pctAcierto >= 75) {
            dificultadClase = 'text-green-700'; // Fácil
            dificultadTexto = 'Fácil';
        } else if (pctAcierto <= 35) {
            dificultadClase = 'text-red-700'; // Difícil
            dificultadTexto = 'Difícil';
        }
        
        // Resaltar la respuesta correcta
        const distA = item.correcta === 'A' ? 'font-bold text-green-700' : '';
        const distB = item.correcta === 'B' ? 'font-bold text-green-700' : '';
        const distC = item.correcta === 'C' ? 'font-bold text-green-700' : '';
        const distD = item.correcta === 'D' ? 'font-bold text-green-700' : '';

        const rowHTML = `
            <tr>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.pregunta}</td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-brand-green">${item.correcta}</td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-center">
                    <span class="font-semibold ${dificultadClase}">${pctAcierto}%</span> (${dificultadTexto})
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-center">${pctOmision}%</td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 leading-tight">
                    <div class="${distA}">A: ${pctA}%</div>
                    <div class="${distB}">B: ${pctB}%</div>
                    <div class="${distC}">C: ${pctC}%</div>
                    <div class="${distD}">D: ${pctD}%</div>
                </td>
            </tr>
        `;
        elements.statsResultsTableBody.innerHTML += rowHTML;
    }
}
// ======================================================
// FIN: MEJORA 1 - Funciones de Análisis Estadístico
// ======================================================


// ======================================================
// INICIO: MEJORA 3 - Funciones de GitHub API (Actualizadas)
// (Estas reemplazan las versiones antiguas. Ahora aceptan 'token')
// ======================================================

/**
 * Obtiene el contenido y 'sha' de un archivo de GitHub.
 * @param {string} apiUrl - URL de la API de GitHub para el archivo
 * @param {string} token - Token de acceso personal
 * @returns {Promise<Object>} - Promesa que resuelve a { content, sha }
 */
async function getGitHubFile(apiUrl, token) {
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache', // Forzar obtener la última versión
            'Pragma': 'no-cache'
        }
    });
    if (!response.ok) {
        throw new Error(`Error al leer archivo de GitHub (${response.status}): ${response.statusText}`);
    }
    return await response.json(); // Devuelve { content: '...', sha: '...' }
}

/**
 * Actualiza (hace commit) de un archivo en GitHub.
 * @param {string} apiUrl - URL de la API de GitHub para el archivo
 *_stack_trace_placeholder_
 * @param {string} token - Token de acceso personal
 * @param {string} commitMessage - Mensaje del commit
 * @param {string} contentBase64 - Nuevo contenido en formato Base64
 * @param {string} sha - El 'sha' del archivo que se está actualizando
 * @returns {Promise<Object>} - Promesa que resuelve con la respuesta de la API
 */
async function updateGitHubFile(apiUrl, token, commitMessage, contentBase64, sha) {
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
            branch: REPO_BRANCH
        })
    });
    if (!response.ok) {
         const errorData = await response.json();
        throw new Error(`Error al escribir archivo en GitHub (${response.status}): ${errorData.message}`);
    }
    return await response.json();
}
// ======================================================
// FIN: MEJORA 3 - Funciones de GitHub API
// ======================================================
