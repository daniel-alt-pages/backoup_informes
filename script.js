/* ========================================================================
   PLATAFORMA DE INFORMES v7.0 (Refactor Modular)
   ------------------------------------------------------------------------
   Autor: Daniel Altamar (con Asistente de Programación)
   Fecha: 2025-11-11
   Descripción: (v7.0) Refactorización a una arquitectura modular y 
                basada en estado para mejorar la mantenibilidad. Se ha
                movido toda la lógica global a un objeto 'App'.
   ======================================================================== */

// Usar 'strict mode' para buenas prácticas
"use strict";

/**
 * Objeto principal de la aplicación.
 * Encapsula todo el estado, la lógica y las referencias del DOM
 * para evitar la contaminación del scope global.
 */
const App = {

    // --- 1. CONFIGURACIÓN Y ESTADO ---

    /**
     * Configuración estática de la aplicación.
     */
    config: {
        SUPER_USER_CREDENTIALS: { username: "admin", password: "admin2024" },
        BASE_DATA_URL: `https://raw.githubusercontent.com/daniel-alt-pages/backoup_informes/main/`,
        TIMESTAMP: Date.now() // Cache-busting
    },

    /**
     * Estado centralizado de la aplicación.
     * TODA la información dinámica vive aquí.
     */
    state: {
        studentDB: {},            // Objeto para login rápido: { "docNumber": { ...datos } }
        scoresDB: [],             // Array de TODOS los puntajes
        testIndex: {},            // Objeto con la info de test_index.json
        allStudentsArray: [],     // Array para la tabla de admin
        currentUserRole: null,      // 'student' o 'admin'
        currentStudentData: null,   // Datos del usuario que inició sesión
        currentStudentReports: [],  // Reportes (de SCORES_DB) del usuario actual
        cachedTestData: {},       // Caché para datos de pruebas (CSV de respuestas/claves)
        pendingChanges: {         // Cambios del CRUD de Admin
            student_database: []
        },
        // Estado de la UI
        ui: {
            admin: {
                currentPage: 1,
                rowsPerPage: 10,
                filter: "",
                sort: { column: 'Nombre Completo del Estudiante', direction: 'asc' },
                filteredStudents: []
            },
            currentSection: 'login' // 'login', 'student-dashboard', 'admin-dashboard', etc.
        }
    },

    /**
     * Referencias a todos los elementos clave del DOM.
     * Se poblará en `App.DOM.queryAll()`.
     */
    elements: {},

    /**
     * Almacén para las instancias de Chart.js para poder destruirlas.
     */
    charts: {
        growth: null,
        radar: null,
        adminAvgSubjects: null,
        adminGlobalScoreDist: null
    },

    // --- 2. INICIALIZACIÓN ---

    /**
     * Punto de entrada principal de la aplicación.
     * Se llama cuando el DOM está listo.
     */
    init() {
        console.log("App.init() v7.0 - Modular");
        this.elements = this.DOM.queryAll();
        this.DOM.setupEventListeners();
        this.API.loadAllData();
        this.CRUD.loadPendingChanges(); // Cargar cambios pendientes de localStorage
    },

    // --- 3. MÓDULO API (Manejo de Datos) ---

    API: {
        /**
         * Carga todos los datos base (JSON y CSVs principales) al iniciar la app.
         */
        async loadAllData() {
            const urls = {
                studentDatabase: `${App.config.BASE_DATA_URL}database/student_database.csv?t=${App.config.TIMESTAMP}`,
                scoresDatabase: `${App.config.BASE_DATA_URL}database/scores_database.csv?t=${App.config.TIMESTAMP}`,
                testIndex: `${App.config.BASE_DATA_URL}database/test_index.json?t=${App.config.TIMESTAMP}`
            };
            
            try {
                const [testIndexData, scoresData, studentData] = await Promise.all([
                    this.fetchJSON(urls.testIndex),
                    this.fetchAndParseCSV(urls.scoresDatabase),
                    this.fetchAndParseCSV(urls.studentDatabase)
                ]);

                // Procesar Test Index
                App.state.testIndex = testIndexData;
                console.log("Índice de Pruebas cargado:", App.state.testIndex);

                // Procesar Scores DB
                App.state.scoresDB = scoresData.map(score => ({
                    ...score,
                    global_score: parseInt(score.global_score, 10) || 0,
                    mat_score: parseInt(score.mat_score, 10) || 0,
                    lec_score: parseInt(score.lec_score, 10) || 0,
                    soc_score: parseInt(score.soc_score, 10) || 0,
                    cie_score: parseInt(score.cie_score, 10) || 0,
                    ing_score: parseInt(score.ing_score, 10) || 0
                }));
                console.log("Base de datos de Puntajes cargada:", App.state.scoresDB.length, "registros");

                // Procesar Student DB
                App.state.allStudentsArray = [];
                App.state.studentDB = {};
                studentData.forEach(student => {
                    const docNumber = student["Número de Documento"]?.trim();
                    if (docNumber) {
                        const cleanedStudent = {
                            "Nombre Completo del Estudiante": student["Nombre Completo del Estudiante"]?.trim(),
                            "Email": student["Email"]?.trim(),
                            "Tipo de Documento": student["Tipo de Documento"]?.trim(),
                            "Número de Documento": docNumber,
                            "Fecha de Nacimiento": student["Fecha de Nacimiento"]?.trim(), // Contraseña
                            "Departamento": student["Departamento"]?.trim(),
                            "Colegio/institución": student["Colegio/institución"]?.trim()
                        };
                        
                        App.state.studentDB[docNumber] = cleanedStudent;
                        App.state.allStudentsArray.push(cleanedStudent);
                    }
                });
                console.log("Base de datos de Estudiantes cargada:", App.state.allStudentsArray.length, "usuarios");
                App.state.ui.admin.filteredStudents = [...App.state.allStudentsArray];

                // Éxito: Ocultar loader y mostrar login
                App.elements.globalLoader?.classList.add('opacity-0', 'invisible');
                App.UI.showSection('login');

            } catch (error) {
                console.error("Error fatal durante la carga de datos:", error);
                App.elements.loadingError?.classList.remove('hidden');
            }
        },

        /**
         * Función helper para cargar y parsear un archivo JSON.
         * @param {string} url - La URL del archivo JSON.
         * @returns {Promise<object>}
         */
        async fetchJSON(url) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error cargando JSON: ${url} (${response.statusText})`);
            return await response.json();
        },

        /**
         * Función helper para cargar y parsear un archivo CSV usando PapaParse.
         * @param {string} url - La URL del archivo CSV.
         * @returns {Promise<Array<object>>}
         */
        fetchAndParseCSV(url) {
            return new Promise((resolve, reject) => {
                Papa.parse(url, {
                    download: true,
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        if (results.errors.length) {
                            console.error("Errores de PapaParse:", results.errors);
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
        },

        /**
         * Carga los datos de una prueba específica (claves y respuestas) bajo demanda.
         * Utiliza el caché de `App.state.cachedTestData`.
         * @param {string} testId - El ID de la prueba (ej. "sg11_07").
         * @returns {Promise<object>} - Un objeto con los datos de la prueba.
         */
        async getTestAnswersAndKey(testId) {
            // 1. Revisar caché
            if (App.state.cachedTestData[testId]) {
                return App.state.cachedTestData[testId];
            }

            const testInfo = App.state.testIndex[testId];
            if (!testInfo) throw new Error(`No se encontró info para la prueba ${testId}`);

            const isSimulacro = testInfo.type === 'simulacro';
            const dataToLoad = {};
            const baseUrl = App.config.BASE_DATA_URL;
            const ts = App.config.TIMESTAMP;

            try {
                if (isSimulacro) {
                    const [ans1, ans2, key1, key2] = await Promise.all([
                        this.fetchAndParseCSV(`${baseUrl}${testInfo.answers_s1}?t=${ts}`),
                        this.fetchAndParseCSV(`${baseUrl}${testInfo.answers_s2}?t=${ts}`),
                        this.fetchAndParseCSV(`${baseUrl}${testInfo.keys_s1}?t=${ts}`),
                        this.fetchAndParseCSV(`${baseUrl}${testInfo.keys_s2}?t=${ts}`)
                    ]);
                    dataToLoad.answers_s1 = ans1;
                    dataToLoad.answers_s2 = ans2;
                    dataToLoad.key_s1 = key1[0]; // Las claves son solo la primera fila
                    dataToLoad.key_s2 = key2[0];
                } else {
                    const [ans, key] = await Promise.all([
                        this.fetchAndParseCSV(`${baseUrl}${testInfo.answers}?t=${ts}`),
                        this.fetchAndParseCSV(`${baseUrl}${testInfo.keys}?t=${ts}`)
                    ]);
                    dataToLoad.answers = ans;
                    dataToLoad.key = key[0];
                }
                
                if (testInfo.videos) {
                    const videoResponse = await fetch(`${baseUrl}${testInfo.videos}?t=${ts}`);
                    if (videoResponse.ok) {
                        dataToLoad.videos = await videoResponse.text();
                    }
                }

                // 2. Guardar en caché
                App.state.cachedTestData[testId] = dataToLoad;
                return dataToLoad;

            } catch (error) {
                console.error(`Error cargando datos para la prueba ${testId}:`, error);
                throw error;
            }
        },

        /**
         * Helper: Obtiene el contenido y 'sha' de un archivo de GitHub.
         */
        async getGitHubFile(apiUrl, token) {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            if (!response.ok) {
                throw new Error(`Error al leer archivo de GitHub: ${response.statusText}`);
            }
            return await response.json();
        },

        /**
         * Helper: Actualiza (hace commit) de un archivo en GitHub.
         */
        async updateGitHubFile(apiUrl, token, commitMessage, contentBase64, sha, branch) {
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
                throw new Error(`Error al escribir archivo en GitHub: ${response.statusText}`);
            }
            return await response.json();
        }
    },

    // --- 4. MÓDULO AUTH (Autenticación) ---

    Auth: {
        /**
         * Maneja el envío del formulario de login.
         */
        handleLogin(e) {
            e.preventDefault();
            App.elements.loginError?.classList.add('hidden');

            const docType = App.elements.docType?.value;
            const docNumber = App.elements.docNumber?.value.trim();
            const password = App.elements.password?.value.trim();

            // 1. Validar Admin
            const { username, password: adminPassword } = App.config.SUPER_USER_CREDENTIALS;
            if (docNumber === username && password === adminPassword) {
                this.initializeAppSession('admin', { "Nombre Completo del Estudiante": "Administrador" });
                return;
            }

            // 2. Validar Estudiante
            const studentData = App.state.studentDB[docNumber];
            if (studentData && studentData["Tipo de Documento"] === docType && studentData["Fecha de Nacimiento"] === password) {
                this.initializeAppSession('student', studentData);
                return;
            }

            // 3. Fallo de Login
            App.elements.loginError?.classList.remove('hidden');
            App.elements.loginForm?.classList.add('animate-shake');
            setTimeout(() => App.elements.loginForm?.classList.remove('animate-shake'), 500);
        },

        /**
         * Configura el estado de la aplicación después de un login exitoso.
         * @param {string} role - 'student' o 'admin'.
         * @param {object} userData - Datos del usuario.
         */
        initializeAppSession(role, userData) {
            console.log(`Iniciando sesión como: ${role}`);
            
            App.state.currentUserRole = role;
            App.state.currentStudentData = userData;

            // Configurar Header
            const name = userData["Nombre Completo del Estudiante"];
            App.elements.userNameHeader.textContent = name;
            App.elements.userAvatarHeader.textContent = name.substring(0, 1).toUpperCase();
            
            // Configurar Sidebar y mostrar la app
            if (role === 'admin') {
                App.state.currentStudentReports = []; // Admin no tiene reportes
                App.elements.userRoleHeader.textContent = "Administrador";
                App.elements.navSections.admin.forEach(el => el.style.display = 'block');
                App.elements.navSections.student.forEach(el => el.style.display = 'none');
                App.UI.handleNavigation(null, 'nav-admin-dashboard'); // Ir a dashboard admin
            } else {
                // Filtrar solo los reportes de este estudiante
                App.state.currentStudentReports = App.state.scoresDB.filter(score => score.doc_number === userData["Número de Documento"]);
                App.elements.userRoleHeader.textContent = "Estudiante";
                App.elements.navSections.admin.forEach(el => el.style.display = 'none');
                App.elements.navSections.student.forEach(el => el.style.display = 'block');
                App.UI.handleNavigation(null, 'nav-student-dashboard'); // Ir a dashboard estudiante
            }

            // Ocultar login y mostrar app
            App.UI.showSection('app');
            lucide.createIcons(); // Recargar iconos
        },

        /**
         * Maneja el cierre de sesión.
         */
        handleLogout() {
            // Limpiar estado (parcialmente, mantenemos DBs cargadas)
            App.state.currentUserRole = null;
            App.state.currentStudentData = null;
            App.state.currentStudentReports = [];
            App.state.cachedTestData = {};
            
            // Resetear UI
            App.elements.loginForm?.reset();
            App.elements.loginError?.classList.add('hidden');
            App.UI.showSection('login');
            
            // Ocultar links de nav
            App.elements.navSections.admin.forEach(el => el.style.display = 'none');
            App.elements.navSections.student.forEach(el => el.style.display = 'none');
            
            console.log("Sesión cerrada.");
        }
    },

    // --- 5. MÓDULO UI (Navegación y Vistas) ---

    UI: {
        /**
         * Controla qué vista principal se muestra.
         * @param {string} sectionId - 'login' o 'app'.
         */
        showSection(sectionId) {
            if (sectionId === 'login') {
                App.elements.loginScreen?.classList.remove('hidden');
                App.elements.appContainer?.classList.add('hidden');
                App.state.ui.currentSection = 'login';
            } else {
                App.elements.loginScreen?.classList.add('hidden');
                App.elements.appContainer?.classList.remove('hidden');
            }
        },

        /**
         * Maneja el clic en los enlaces de navegación del sidebar.
         * @param {Event} e - El evento de clic (puede ser null si se llama internamente).
         * @param {string} navId - El ID del link de navegación.
         */
        handleNavigation(e, navId) {
            if (e) e.preventDefault();
            
            // Resaltar link activo
            App.elements.navLinks.forEach(link => link.classList.remove('active'));
            document.getElementById(navId)?.classList.add('active');

            // Ocultar todas las secciones
            App.elements.appSections.forEach(section => section.classList.add('hidden'));

            // Mostrar la sección correspondiente
            let sectionToShow = null;
            let title = "";

            switch (navId) {
                // Estudiante
                case 'nav-student-dashboard':
                    sectionToShow = App.elements.studentDashboard;
                    title = "Mis Informes";
                    App.Render.StudentDashboard();
                    break;
                case 'nav-student-growth':
                    // Esto es un modal, no una sección
                    App.elements.navLinks.forEach(link => link.classList.remove('active'));
                    document.getElementById('nav-student-dashboard')?.classList.add('active'); // Re-activar dashboard
                    App.UI.showModal(App.elements.growthChartModal);
                    return; // No continuar
                // Admin
                case 'nav-admin-dashboard':
                    sectionToShow = App.elements.adminDashboard;
                    title = "Dashboard General";
                    App.Render.AdminDashboard();
                    break;
                case 'nav-admin-students':
                    sectionToShow = App.elements.adminStudents;
                    title = "Gestión de Estudiantes";
                    App.Render.AdminStudentsTable();
                    break;
                case 'nav-admin-stats':
                    sectionToShow = App.elements.adminStats;
                    title = "Análisis de Ítems";
                    App.Render.AdminStats();
                    break;
                case 'nav-admin-crud':
                    sectionToShow = App.elements.adminCrud;
                    title = "Gestión de Datos";
                    App.Render.AdminCRUD();
                    break;
                // Caso especial para informe individual (no es un link de nav)
                case 'show-student-report':
                    sectionToShow = App.elements.studentReport;
                    // El título lo pone la función de renderizado
                    break;
            }

            if (sectionToShow) {
                sectionToShow.classList.remove('hidden');
                if (title) App.elements.mainContentTitle.textContent = title;
                App.state.ui.currentSection = navId;
            }

            this.closeSidebar(); // Cerrar sidebar en móvil
        },

        /**
         * Muestra u oculta la contraseña en el formulario de login.
         */
        togglePasswordVisibility() {
            const isPassword = App.elements.password.type === 'password';
            App.elements.password.type = isPassword ? 'text' : 'password';
            App.elements.eyeIcon.classList.toggle('hidden', isPassword);
            App.elements.eyeOffIcon.classList.toggle('hidden', !isPassword);
        },

        openSidebar() {
            App.elements.sidebar.classList.remove('-translate-x-full');
            App.elements.sidebarOverlay.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        },
    
        closeSidebar() {
            App.elements.sidebar.classList.add('-translate-x-full');
            App.elements.sidebarOverlay.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        },

        showModal(modalElement) {
            if (!modalElement) return;
            modalElement.classList.add('shown');
            document.body.classList.add('overflow-hidden');

            if (modalElement.id === 'growth-chart-modal') {
                App.Charts.renderGrowthChart('all');
            }
        },
    
        closeModal(modalElement) {
            if (!modalElement) return;
            modalElement.classList.remove('shown');
            document.body.classList.remove('overflow-hidden');
    
            if (modalElement.id === 'github-token-modal') {
                App.elements.githubTokenInput.value = "";
                App.elements.githubTokenError.classList.add('hidden');
                App.elements.githubTokenConfirmBtn.disabled = false;
                App.elements.githubTokenConfirmBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4 mr-2"></i> Confirmar y Guardar`;
                lucide.createIcons();
            }
        }
    },
    
    // --- 6. MÓDULO DE RENDERIZADO (Componentes) ---

    Render: {
        /**
         * Muestra el Dashboard del Estudiante (lista de informes).
         */
        StudentDashboard() {
            const container = App.elements.studentReportsContainer;
            container.innerHTML = ""; // Limpiar
            
            const reports = App.state.currentStudentReports;

            if (reports.length === 0) {
                container.innerHTML = `<p class="text-brand-text/80 col-span-full">No tienes informes disponibles.</p>`;
                return;
            }

            const sortedReports = [...reports].sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

            sortedReports.forEach(report => {
                const testInfo = App.state.testIndex[report.test_id];
                if (!testInfo) return;

                const testTypeLabel = testInfo.type === 'simulacro' ? "Simulacro General" : "Minisimulacro";
                const testTypeColor = testInfo.type === 'simulacro' ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800";

                container.innerHTML += `
                    <div class="report-card cursor-pointer" data-testid="${report.test_id}">
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <p class="text-xs font-medium ${testTypeColor} inline-block px-2 py-0.5 rounded-full">${testTypeLabel}</p>
                                <h3 class="text-lg font-bold text-brand-header mt-2">${testInfo.name}</h3>
                                <p class="text-sm text-brand-text/80">Realizado el: ${App.Utils.formatDate(report.test_date)}</p>
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
        },

        /**
         * Muestra el informe individual detallado para un estudiante.
         * @param {string} testId - El ID de la prueba seleccionada.
         */
        async StudentReport(testId) {
            App.elements.mainContentTitle.textContent = "Cargando Informe...";
            App.elements.reportContentContainer.innerHTML = `<div class="text-center py-10"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-brand-secondary" role="status"></div><p class="mt-3 text-brand-text/80">Cargando datos del informe...</p></div>`;
            App.UI.handleNavigation(null, 'show-student-report');

            try {
                const testInfo = App.state.testIndex[testId];
                const report = App.state.currentStudentReports.find(r => r.test_id === testId);
                
                if (!testInfo || !report) throw new Error("No se encontraron datos del informe.");

                App.elements.mainContentTitle.textContent = testInfo.name;
                App.elements.reportTitle.textContent = testInfo.name;
                App.elements.reportDate.textContent = `Realizado el: ${App.Utils.formatDate(report.test_date)}`;

                const testData = await App.API.getTestAnswersAndKey(testId);
                const docNumber = App.state.currentStudentData["Número de Documento"];
                
                let studentAnswers = null;
                if (testInfo.type === 'simulacro') {
                    const ans1 = testData.answers_s1.find(r => r.ID === docNumber);
                    const ans2 = testData.answers_s2.find(r => r.ID === docNumber);
                    studentAnswers = { ...ans1, ...ans2 };
                } else {
                    studentAnswers = testData.answers.find(r => r.ID === docNumber);
                }

                if (!studentAnswers) throw new Error("No se encontraron las respuestas del estudiante para esta prueba.");

                const scoreCardsHtml = this.generateScoreCardsHtml(report);
                const radarChartHtml = `<div class="bg-brand-surface p-6 rounded-xl shadow-sm border border-brand-border"><h3 class="text-xl font-bold text-brand-header mb-4">Perfil de Desempeño (Radar)</h3><div class="h-80 max-w-lg mx-auto"><canvas id="radarChart"></canvas></div></div>`;
                const feedbackHtml = this.generateFeedbackHtml(testInfo, testData, studentAnswers);

                App.elements.reportContentContainer.innerHTML = `
                    ${scoreCardsHtml}
                    ${radarChartHtml}
                    ${feedbackHtml}
                `;

                App.Charts.renderRadarChart(report);
                lucide.createIcons();

            } catch (error) {
                console.error("Error al mostrar informe individual:", error);
                App.elements.reportContentContainer.innerHTML = `<p class="text-brand-red text-center py-10">Error al cargar el informe: ${error.message}</p>`;
            }
        },

        /**
         * Muestra el Dashboard del Administrador (KPIs y gráficos).
         */
        AdminDashboard() {
            // 1. Calcular KPIs
            App.elements.kpiTotalStudents.textContent = App.state.allStudentsArray.length;

            const allScores = App.state.scoresDB.map(s => s.global_score);
            const avgGlobal = allScores.length ? (allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(0) : 0;
            App.elements.kpiAvgGlobal.textContent = avgGlobal;

            const simulacroScores = App.state.scoresDB.filter(s => App.state.testIndex[s.test_id]?.type === 'simulacro').map(s => s.global_score);
            const avgSimulacros = simulacroScores.length ? (simulacroScores.reduce((a, b) => a + b, 0) / simulacroScores.length).toFixed(0) : 0;
            App.elements.kpiAvgSimulacros.textContent = avgSimulacros;

            const miniScores = App.state.scoresDB.filter(s => App.state.testIndex[s.test_id]?.type === 'minisimulacro').map(s => s.global_score);
            const avgMinis = miniScores.length ? (miniScores.reduce((a, b) => a + b, 0) / miniScores.length).toFixed(0) : 0;
            App.elements.kpiAvgMinis.textContent = avgMinis;

            // 2. Renderizar Gráficos
            App.Charts.renderAdminAvgSubjectsChart();
            App.Charts.renderAdminGlobalScoreDistChart();
            
            lucide.createIcons();
        },

        /**
         * Muestra la sección de Gestión de Estudiantes (Admin).
         */
        AdminStudentsTable() {
            const tableBody = App.elements.adminStudentTableBody;
            if (!tableBody) return;
        
            tableBody.innerHTML = "";
            const uiState = App.state.ui.admin;
        
            // 1. Aplicar Filtro
            const filterText = uiState.filter.toLowerCase();
            uiState.filteredStudents = App.state.allStudentsArray.filter(student => {
                return student["Nombre Completo del Estudiante"].toLowerCase().includes(filterText) ||
                       student["Número de Documento"].includes(filterText);
            });
        
            // 2. Aplicar Ordenamiento
            uiState.filteredStudents.sort((a, b) => {
                const valA = a[uiState.sort.column] || '';
                const valB = b[uiState.sort.column] || '';
                if (valA < valB) return uiState.sort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return uiState.sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        
            // 3. Aplicar Paginación
            const totalPages = Math.ceil(uiState.filteredStudents.length / uiState.rowsPerPage);
            const startIndex = (uiState.currentPage - 1) * uiState.rowsPerPage;
            const endIndex = startIndex + uiState.rowsPerPage;
            const paginatedStudents = uiState.filteredStudents.slice(startIndex, endIndex);
        
            // 4. Renderizar Filas
            if (paginatedStudents.length === 0) {
                App.elements.adminNoResults.classList.remove('hidden');
            } else {
                App.elements.adminNoResults.classList.add('hidden');
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
        
            this.renderAdminPagination(totalPages);
            lucide.createIcons();
        },

        /**
         * Renderiza los botones de paginación para la tabla de admin.
         */
        renderAdminPagination(totalPages) {
            const pagination = App.elements.adminPaginationControls;
            if (!pagination) return;
            
            pagination.innerHTML = "";
            if (totalPages <= 1) return;

            const currentPage = App.state.ui.admin.currentPage;
            
            pagination.innerHTML += `
                <button class="px-3 py-1 border border-brand-border rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-bg'}" 
                        data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
                    Ant.
                </button>
            `;
            pagination.innerHTML += `
                <span class="text-sm text-brand-text/80 px-2">
                    Página ${currentPage} de ${totalPages}
                </span>
            `;
            pagination.innerHTML += `
                <button class="px-3 py-1 border border-brand-border rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-bg'}" 
                        data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
                    Sig.
                </button>
            `;
        },

        /**
         * Muestra la sección de Análisis de Ítems (Admin).
         */
        AdminStats() {
            App.elements.statsTestSelect.innerHTML = '<option value="">Seleccione una prueba</option>';
            for (const testId in App.state.testIndex) {
                App.elements.statsTestSelect.innerHTML += `<option value="${testId}">${App.state.testIndex[testId].name}</option>`;
            }
            App.elements.statsResultsContainer.classList.add('hidden');
            App.elements.statsLoading.classList.add('hidden');
            lucide.createIcons();
        },

        /**
         * Muestra la sección de Gestión de Datos (CRUD Admin).
         */
        AdminCRUD() {
            this.renderPendingChanges();
            lucide.createIcons();
        },

        /**
         * Renderiza la lista de cambios pendientes en la UI.
         */
        renderPendingChanges() {
            const container = App.elements.pendingChangesContainer;
            container.innerHTML = ""; // Limpiar
            const students = App.state.pendingChanges.student_database;

            if (students.length === 0) {
                container.innerHTML = `<p id="no-pending-changes" class="text-brand-text/70 text-sm">No hay cambios pendientes para guardar.</p>`;
                App.elements.saveChangesBtn.disabled = true;
                App.elements.clearCacheBtn.disabled = true;
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
                App.elements.saveChangesBtn.disabled = false;
                App.elements.clearCacheBtn.disabled = false;
                lucide.createIcons();
            }
        },

        /**
         * Genera el HTML para las tarjetas de puntaje (Global y por materia).
         */
        generateScoreCardsHtml(report) {
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
                    <div class="md:col-span-1 bg-brand-surface p-6 rounded-xl shadow-sm border border-brand-border flex flex-col items-center justify-center text-center">
                        <p class="text-sm font-medium text-brand-text/80 uppercase tracking-wide">Puntaje Global</p>
                        <p class="text-7xl font-extrabold text-brand-header my-2">${report.global_score}</p>
                        <p class="text-2xl font-medium text-brand-text/50">/ 500</p>
                    </div>
                    <div class="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        ${subjectCardsHtml}
                    </div>
                </div>
            `;
        },

        /**
         * Genera el HTML para la tabla de retroalimentación (preguntas).
         */
        generateFeedbackHtml(testInfo, testData, studentAnswers) {
            let feedbackHtml = "";
            
            if (testInfo.type === 'simulacro') {
                const tableS1 = this.generateFeedbackTable(testData.key_s1, studentAnswers);
                const tableS2 = this.generateFeedbackTable(testData.key_s2, studentAnswers);
                feedbackHtml = `
                    <div class="bg-brand-surface p-6 rounded-xl shadow-sm border border-brand-border">
                        <h3 class="text-xl font-bold text-brand-header mb-4">Feedback Detallado por Pregunta</h3>
                        <div class="border-b border-brand-border">
                            <nav class="-mb-px flex gap-6" id="feedback-tabs">
                                <button class="tab-btn active" data-tab="s1">Sesión 1</button>
                                <button class="tab-btn" data-tab="s2">Sesión 2</button>
                            </nav>
                        </div>
                        <div id="tab-content-s1" class="tab-content py-4">${tableS1}</div>
                        <div id="tab-content-s2" class="tab-content py-4 hidden">${tableS2}</div>
                    </div>
                `;
            } else {
                const table = this.generateFeedbackTable(testData.key, studentAnswers);
                feedbackHtml = `
                    <div class="bg-brand-surface p-6 rounded-xl shadow-sm border border-brand-border">
                        <h3 class="text-xl font-bold text-brand-header mb-4">Feedback Detallado por Pregunta</h3>
                        <div class="py-4">${table}</div>
                    </div>
                `;
            }

            // Registrar listeners para las pestañas
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
        },

        /**
         * Helper que genera el HTML de la tabla de preguntas.
         */
        generateFeedbackTable(key, answers) {
            let rowsHtml = "";
            const headers = Object.keys(key);

            for (const header of headers) {
                if (!header) continue;
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
                        <tbody>${rowsHtml}</tbody>
                    </table>
                </div>
            `;
        },

        /**
         * Muestra el historial de informes de un estudiante en un modal (para Admin).
         */
        showAdminStudentHistory(docNumber) {
            const student = App.state.studentDB[docNumber];
            if (!student) return;

            App.elements.adminStudentModalTitle.textContent = `Historial de: ${student["Nombre Completo del Estudiante"]}`;
            const modalBody = App.elements.adminStudentModalBody;
            modalBody.innerHTML = ""; // Limpiar

            const studentReports = App.state.scoresDB.filter(score => score.doc_number === docNumber)
                                             .sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

            if (studentReports.length === 0) {
                modalBody.innerHTML = `<p class="text-brand-text/80 text-center py-4">Este estudiante no tiene informes.</p>`;
            } else {
                studentReports.forEach(report => {
                    const testInfo = App.state.testIndex[report.test_id];
                    if (!testInfo) return;
                    modalBody.innerHTML += `
                        <div class="report-card cursor-pointer" data-testid="${report.test_id}" data-docnumber="${docNumber}">
                            <div class="flex justify-between items-start mb-3">
                                <div>
                                    <h3 class="text-lg font-bold text-brand-header">${testInfo.name}</h3>
                                    <p class="text-sm text-brand-text/80">Realizado el: ${App.Utils.formatDate(report.test_date)}</p>
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
            App.UI.showModal(App.elements.adminStudentModal);
        },

        /**
         * Renderiza las tarjetas de estadísticas de ítems.
         * @param {object} stats - Resultados del análisis.
         * @param {string} [subjectFilter='all'] - Filtro de materia opcional.
         */
        renderStatsCards(stats, subjectFilter = 'all') {
            const container = App.elements.statsResultsCardsContainer;
            container.innerHTML = "";
            let itemsToShow = Object.values(stats);

            if (subjectFilter !== 'all') {
                itemsToShow = itemsToShow.filter(item => item.materia === subjectFilter);
            }

            itemsToShow.sort((a, b) => (a.correctas / a.total) - (b.correctas / b.total));

            if (itemsToShow.length === 0) {
                container.innerHTML = `<p class="text-brand-text/80 text-center py-4">No hay datos para esta selección.</p>`;
                return;
            }

            itemsToShow.forEach(item => {
                if (item.total === 0) return;
                const pctAcierto = (item.correctas / item.total) * 100;
                const pctOmision = (item.Omision / item.total) * 100;
                const pctA = (item.A / item.total) * 100;
                const pctB = (item.B / item.total) * 100;
                const pctC = (item.C / item.total) * 100;
                const pctD = (item.D / item.total) * 100;

                let d, dt;
                if (pctAcierto >= 75) { d = 'stats-pill-green'; dt = 'Fácil'; }
                else if (pctAcierto <= 35) { d = 'stats-pill-red'; dt = 'Difícil'; }
                else { d = 'stats-pill-yellow'; dt = 'Media'; }

                const c = 'font-bold text-brand-green';
                const distA = item.correcta === 'A' ? c : '';
                const distB = item.correcta === 'B' ? c : '';
                const distC = item.correcta === 'C' ? c : '';
                const distD = item.correcta === 'D' ? c : '';

                const cardHtml = `
                    <div class="stats-card">
                        <div class="stats-card-header">
                            <h4 class="stats-card-title">${item.pregunta}</h4>
                            <div class="stats-card-pills">
                                <span class="${d} stats-pill">${dt} (${pctAcierto.toFixed(0)}%)</span>
                                <span class="stats-pill-gray stats-pill">Omisión: ${pctOmision.toFixed(0)}%</span>
                            </div>
                        </div>
                        <div class="pt-4 space-y-2">
                            ${this.generateDistractorBar('A', pctA, distA)}
                            ${this.generateDistractorBar('B', pctB, distB)}
                            ${this.generateDistractorBar('C', pctC, distC)}
                            ${this.generateDistractorBar('D', pctD, distD)}
                        </div>
                    </div>
                `;
                container.innerHTML += cardHtml;
            });
        },

        /**
         * Helper para generar una barra de distractor visual.
         */
        generateDistractorBar(option, percentage, extraClass = '') {
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
    },
    
    // --- 7. MÓDULO DE GRÁFICOS (Charts) ---

    Charts: {
        /**
         * Renderiza el gráfico de progreso del estudiante.
         */
        renderGrowthChart(filterType = 'all') {
            const ctx = App.elements.growthChartCanvas?.getContext('2d');
            if (!ctx) return;

            const filteredReports = App.state.currentStudentReports
                .filter(report => {
                    const testType = App.state.testIndex[report.test_id]?.type;
                    if (filterType === 'all') return true;
                    return testType === filterType;
                })
                .sort((a, b) => new Date(a.test_date) - new Date(b.test_date));

            const chartData = filteredReports.map(report => ({
                x: new Date(report.test_date),
                y: report.global_score
            }));
            const labels = filteredReports.map(report => App.state.testIndex[report.test_id]?.name || 'Prueba');

            if (App.charts.growth) App.charts.growth.destroy();

            App.charts.growth = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
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
                            time: { unit: 'month', tooltipFormat: 'dd/MM/yyyy', displayFormats: { month: 'MMM yyyy' } },
                            title: { display: true, text: 'Fecha' },
                            ticks: { display: false }
                        },
                        y: {
                            beginAtZero: false,
                            min: chartData.length ? Math.max(0, Math.min(...chartData.map(d => d.y)) - 20) : 0,
                            max: chartData.length ? Math.min(500, Math.max(...chartData.map(d => d.y)) + 20) : 500,
                            title: { display: true, text: 'Puntaje Global (0-500)' }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                title: (items) => items[0].label,
                                label: (item) => `Puntaje: ${item.raw.y}`
                            }
                        }
                    }
                }
            });
        },

        /**
         * Renderiza el gráfico de Radar en el informe individual.
         */
        renderRadarChart(report) {
            const ctx = document.getElementById('radarChart')?.getContext('2d');
            if (!ctx) return;

            if (App.charts.radar) App.charts.radar.destroy();
            
            App.charts.radar = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Matemáticas', 'Lectura Crítica', 'Sociales', 'Ciencias', 'Inglés'],
                    datasets: [{
                        label: `Puntajes (0-100)`,
                        data: [report.mat_score, report.lec_score, report.soc_score, report.cie_score, report.ing_score],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(59, 130, 246, 1)',
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
                            ticks: { beginAtZero: true, min: 0, max: 100, stepSize: 20, backdropColor: 'rgba(255, 255, 255, 0.75)', backdropPadding: 4 }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        },

        /**
         * Renderiza el gráfico de barras de Promedio por Materia (Admin).
         */
        renderAdminAvgSubjectsChart() {
            const ctx = App.elements.adminAvgSubjectsChart?.getContext('2d');
            if (!ctx) return;

            const avgScores = { mat: [], lec: [], soc: [], cie: [], ing: [] };
            App.state.scoresDB.forEach(s => {
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

            if (App.charts.adminAvgSubjects) App.charts.adminAvgSubjects.destroy();

            App.charts.adminAvgSubjects = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Matemáticas', 'Lectura Crítica', 'Sociales', 'Ciencias', 'Inglés'],
                    datasets: [{
                        label: 'Promedio (0-100)',
                        data: data,
                        backgroundColor: ['var(--color-matematicas)', 'var(--color-lectura)', 'var(--color-sociales)', 'var(--color-ciencias)', 'var(--color-ingles)'],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, max: 100 } },
                    plugins: { legend: { display: false } }
                }
            });
        },

        /**
         * Renderiza el gráfico de distribución de puntajes (Admin).
         */
        renderAdminGlobalScoreDistChart() {
            const ctx = App.elements.adminGlobalScoreDistChart?.getContext('2d');
            if (!ctx) return;

            const scores = App.state.scoresDB.map(s => s.global_score);
            const bins = [0, 200, 250, 300, 350, 400, 450, 500];
            const distribution = Array(bins.length - 1).fill(0);

            scores.forEach(score => {
                for (let i = 0; i < bins.length - 1; i++) {
                    if (score >= bins[i] && score < bins[i+1]) {
                        distribution[i]++;
                        break;
                    }
                }
                if (score === 500) distribution[distribution.length - 1]++;
            });

            const labels = bins.slice(0, -1).map((bin, i) => `${bin}-${bins[i+1]}`);
            labels[labels.length - 1] = "450-500";

            if (App.charts.adminGlobalScoreDist) App.charts.adminGlobalScoreDist.destroy();

            App.charts.adminGlobalScoreDist = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Nº de Estudiantes',
                        data: distribution,
                        backgroundColor: 'rgba(249, 115, 22, 0.7)',
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
                    plugins: { legend: { display: false } }
                }
            });
        }
    },

    // --- 8. LÓGICA DE ANÁLISIS DE ÍTEMS (MEJORA 1) ---

    Stats: {
        /**
         * Maneja el clic en el botón "Analizar" del panel de admin.
         */
        async handleAnalyzeItems() {
            const testId = App.elements.statsTestSelect.value;
            if (!testId) {
                alert("Por favor, seleccione una prueba.");
                return;
            }

            App.elements.statsLoading.classList.remove('hidden');
            App.elements.statsResultsContainer.classList.add('hidden');
            App.elements.statsResultsCardsContainer.innerHTML = "";
            App.elements.statsSubjectFilter.innerHTML = '<option value="all">Todas las Materias</option>';
            App.elements.statsSubjectFilter.disabled = true;

            try {
                const testData = await App.API.getTestAnswersAndKey(testId);
                const analysis = this.analyzeTestItems(testId, testData);
                
                App.Render.renderStatsCards(analysis);
                
                const subjects = [...new Set(Object.values(analysis).map(item => item.materia))];
                subjects.sort().forEach(subject => {
                    App.elements.statsSubjectFilter.innerHTML += `<option value="${subject}">${subject}</option>`;
                });
                
                App.elements.statsSubjectFilter.disabled = false;
                
                App.elements.statsResultsTitle.textContent = `Análisis de ${Object.keys(analysis).length} ítems para: ${App.state.testIndex[testId].name}`;
                App.elements.statsResultsContainer.classList.remove('hidden');

            } catch (error) {
                console.error("Error en el análisis de ítems:", error);
                alert(`Error al analizar: ${error.message}`);
            } finally {
                App.elements.statsLoading.classList.add('hidden');
            }
        },

        /**
         * Lógica principal de análisis estadístico de ítems.
         */
        analyzeTestItems(testId, testData) {
            const testInfo = App.state.testIndex[testId];
            const isSimulacro = testInfo.type === 'simulacro';
            const stats = {};
            const keysMap = {};
            const answersData = [];

            if (isSimulacro) {
                Object.assign(keysMap, testData.key_s1, testData.key_s2);
                const answersMap = {};
                testData.answers_s1.forEach(r => answersMap[r.ID] = { ...r });
                testData.answers_s2.forEach(r => answersMap[r.ID] = { ...(answersMap[r.ID] || {}), ...r });
                answersData.push(...Object.values(answersMap));
            } else {
                Object.assign(keysMap, testData.key);
                answersData.push(...testData.answers);
            }

            for (const header in keysMap) {
                if (!header || !keysMap[header]) continue;
                stats[header] = {
                    pregunta: header,
                    materia: header.split(' ')[0],
                    correcta: keysMap[header].trim().toUpperCase(),
                    A: 0, B: 0, C: 0, D: 0, Omision: 0,
                    total: 0,
                    correctas: 0
                };
            }

            for (const studentRow of answersData) {
                for (const questionHeader in stats) {
                    if (studentRow.hasOwnProperty(questionHeader)) {
                        const studentAnswer = studentRow[questionHeader]?.trim().toUpperCase() || 'OMISION';
                        const statsEntry = stats[questionHeader];

                        statsEntry.total++;
                        if (['A', 'B', 'C', 'D'].includes(studentAnswer)) {
                            statsEntry[studentAnswer]++;
                        } else {
                            statsEntry.Omision++;
                        }
                        if (studentAnswer === statsEntry.correcta) {
                            statsEntry.correctas++;
                        }
                    }
                }
            }
            return stats;
        }
    },


    // --- 9. LÓGICA DE CRUD (MEJORA 3) ---

    CRUD: {
        /**
         * Maneja el envío del formulario "Añadir Estudiante".
         */
        handleAddStudentSubmit(e) {
            e.preventDefault();
            const newStudent = {
                "Nombre Completo del Estudiante": document.getElementById('student-name').value.trim(),
                "Email": document.getElementById('student-email').value.trim(),
                "Tipo de Documento": document.getElementById('student-doc-type').value,
                "Número de Documento": document.getElementById('student-doc-number').value.trim(),
                "Fecha de Nacimiento": document.getElementById('student-birthdate').value.trim(),
                "Departamento": document.getElementById('student-department').value.trim(),
                "Colegio/institución": document.getElementById('student-school').value.trim(),
            };

            if (!newStudent["Nombre Completo del Estudiante"] || !newStudent["Número de Documento"] || !newStudent["Fecha de Nacimiento"]) {
                alert("Nombre, Número de Documento y Fecha de Nacimiento son obligatorios.");
                return;
            }

            App.state.pendingChanges.student_database.push(newStudent);
            this.savePendingChanges();
            App.Render.renderPendingChanges();
            App.elements.addStudentForm.reset();
        },

        loadPendingChanges() {
            const cached = localStorage.getItem('pendingChanges');
            if (cached) {
                App.state.pendingChanges = JSON.parse(cached);
            }
        },

        savePendingChanges() {
            localStorage.setItem('pendingChanges', JSON.stringify(App.state.pendingChanges));
        },

        clearPendingChanges() {
            if (confirm("¿Estás seguro de que quieres descartar todos los cambios pendientes? Esta acción no se puede deshacer.")) {
                App.state.pendingChanges = { student_database: [] };
                this.savePendingChanges();
                App.Render.renderPendingChanges();
            }
        },

        /**
         * Maneja el guardado final de cambios en GitHub.
         */
        async handleSaveChanges() {
            const token = App.elements.githubTokenInput.value.trim();
            if (!token) {
                App.elements.githubTokenError.textContent = "El token es obligatorio.";
                App.elements.githubTokenError.classList.remove('hidden');
                return;
            }

            App.elements.githubTokenError.classList.add('hidden');
            App.elements.githubTokenConfirmBtn.disabled = true;
            App.elements.githubTokenConfirmBtn.innerHTML = `<div class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div> Guardando...`;

            try {
                const REPO_OWNER = "daniel-alt-pages";
                const REPO_NAME = "backoup_informes";
                const REPO_BRANCH = "main";
                const FILE_PATH = "database/student_database.csv";
                const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

                const fileData = await App.API.getGitHubFile(API_URL, token);
                const currentContent = atob(fileData.content);
                let newContent = currentContent;
                
                App.state.pendingChanges.student_database.forEach(student => {
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

                const newContentBase64 = btoa(unescape(encodeURIComponent(newContent))); // Manejar caracteres UTF-8
                const commitMessage = `Commit automático: Añadidos ${App.state.pendingChanges.student_database.length} nuevos estudiantes`;

                await App.API.updateGitHubFile(API_URL, token, commitMessage, newContentBase64, fileData.sha, REPO_BRANCH);

                alert("¡Cambios guardados con éxito en GitHub!");
                App.UI.closeModal(App.elements.githubTokenModal);
                App.state.pendingChanges = { student_database: [] };
                App.CRUD.savePendingChanges();
                App.Render.renderPendingChanges();
                
                // Recargar los datos de la app
                App.elements.globalLoader.classList.remove('opacity-0', 'invisible');
                await App.API.loadAllData();
                App.Render.AdminStudentsTable(); // Actualizar la tabla
                App.elements.globalLoader.classList.add('opacity-0', 'invisible');

            } catch (error) {
                console.error("Error al guardar cambios en GitHub:", error);
                App.elements.githubTokenError.textContent = `Error: ${error.message}`;
                App.elements.githubTokenError.classList.remove('hidden');
            } finally {
                App.elements.githubTokenConfirmBtn.disabled = false;
                App.elements.githubTokenConfirmBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4 mr-2"></i> Confirmar y Guardar`;
                lucide.createIcons();
            }
        }
    },

    // --- 10. MÓDULO DOM (Queries y Listeners) ---

    DOM: {
        /**
         * Obtiene y almacena referencias a todos los elementos clave del DOM.
         * @returns {object} - Un objeto con todas las referencias.
         */
        queryAll() {
            const elements = {};
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
            
            return elements;
        },

        /**
         * Configura todos los event listeners para la aplicación.
         */
        setupEventListeners() {
            const els = App.elements;

            // Login
            els.loginForm?.addEventListener('submit', App.Auth.handleLogin.bind(App.Auth));
            els.togglePassword?.addEventListener('click', App.UI.togglePasswordVisibility.bind(App.UI));

            // Navegación Principal
            els.sidebarOpenBtn?.addEventListener('click', App.UI.openSidebar.bind(App.UI));
            els.sidebarCloseBtn?.addEventListener('click', App.UI.closeSidebar.bind(App.UI));
            els.sidebarOverlay?.addEventListener('click', App.UI.closeSidebar.bind(App.UI));
            els.logoutBtn?.addEventListener('click', App.Auth.handleLogout.bind(App.Auth));

            // Navegación de Secciones
            els.navLinks?.forEach(link => {
                link.addEventListener('click', (e) => App.UI.handleNavigation(e, link.id));
            });

            // Dashboard Estudiante
            els.showGrowthChartBtn?.addEventListener('click', () => App.UI.showModal(els.growthChartModal));
            els.studentReportsContainer?.addEventListener('click', (e) => {
                const card = e.target.closest('.report-card');
                if (card && card.dataset.testid) {
                    App.Render.StudentReport(card.dataset.testid);
                }
            });

            // Informe Individual
            els.backToDashboardBtn?.addEventListener('click', () => App.UI.handleNavigation(null, 'nav-student-dashboard'));

            // Admin: Gestión Estudiantes
            els.adminStudentSearch?.addEventListener('input', (e) => {
                App.state.ui.admin.filter = e.target.value;
                App.state.ui.admin.currentPage = 1;
                App.Render.AdminStudentsTable();
            });
            els.adminPaginationControls?.addEventListener('click', (e) => {
                if (e.target.dataset.page) {
                    App.state.ui.admin.currentPage = parseInt(e.target.dataset.page, 10);
                    App.Render.AdminStudentsTable();
                }
            });
            els.adminTableHeaders?.forEach(header => {
                header.addEventListener('click', () => {
                    const column = header.dataset.sort;
                    const sortState = App.state.ui.admin.sort;
                    if (sortState.column === column) {
                        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
                    } else {
                        sortState.column = column;
                        sortState.direction = 'asc';
                    }
                    App.Render.AdminStudentsTable();
                });
            });
            els.adminStudentTableBody?.addEventListener('click', (e) => {
                const viewButton = e.target.closest('.view-student-history-btn');
                if (viewButton) {
                    App.Render.showAdminStudentHistory(viewButton.dataset.docNumber);
                }
            });

            // Admin: Análisis de Ítems
            els.statsAnalyzeBtn?.addEventListener('click', App.Stats.handleAnalyzeItems.bind(App.Stats));
            els.statsSubjectFilter?.addEventListener('change', () => {
                // El handler principal (handleAnalyzeItems) ya tiene los datos cacheados
                // Solo necesitamos re-renderizar las tarjetas con el filtro
                App.Render.renderStatsCards(
                    App.state.cachedTestData[els.statsTestSelect.value]?.analysis, // Usar data cacheada
                    els.statsSubjectFilter.value
                );
            });

            // Admin: CRUD
            els.addStudentForm?.addEventListener('submit', App.CRUD.handleAddStudentSubmit.bind(App.CRUD));
            els.saveChangesBtn?.addEventListener('click', () => App.UI.showModal(els.githubTokenModal));
            els.githubTokenConfirmBtn?.addEventListener('click', App.CRUD.handleSaveChanges.bind(App.CRUD));
            els.clearCacheBtn?.addEventListener('click', App.CRUD.clearPendingChanges.bind(App.CRUD));

            // Modals
            els.modalCloseBtns?.forEach(btn => {
                btn.addEventListener('click', () => App.UI.closeModal(btn.closest('.modal-backdrop')));
            });
            els.growthChartFilters?.addEventListener('click', (e) => {
                if (e.target.classList.contains('chart-filter-btn')) {
                    els.growthChartFilters.querySelectorAll('.chart-filter-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    App.Charts.renderGrowthChart(e.target.dataset.filter);
                }
            });
            els.adminStudentModalBody?.addEventListener('click', (e) => {
                const card = e.target.closest('.report-card');
                if (card && card.dataset.testid && card.dataset.docnumber) {
                    // Suplantación
                    App.state.currentStudentData = App.state.studentDB[card.dataset.docnumber];
                    App.state.currentStudentReports = App.state.scoresDB.filter(score => score.doc_number === card.dataset.docnumber);
                    App.UI.closeModal(els.adminStudentModal);
                    App.Render.StudentReport(card.dataset.testid);
                    // Resetear a admin después de un tiempo
                    setTimeout(() => {
                        App.state.currentStudentData = { "Nombre Completo del Estudiante": "Administrador" };
                        App.state.currentStudentReports = [];
                    }, 1000);
                }
            });
        }
    },

    // --- 11. MÓDULO DE UTILIDADES ---

    Utils: {
        /**
         * Formatea una fecha de "YYYY-MM-DD" a "DD de Mes de YYYY".
         * @param {string} dateString - Fecha en formato YYYY-MM-DD.
         * @returns {string} Fecha formateada.
         */
        formatDate(dateString) {
            try {
                // Manejar formatos DD/MM/YYYY y YYYY-MM-DD
                let date;
                if (dateString.includes('/')) {
                    const parts = dateString.split('/');
                    if (parts.length === 3) {
                         // Asumir DD/MM/YYYY
                        date = new Date(parts[2], parts[1] - 1, parts[0]);
                    }
                } else if (dateString.includes('-')) {
                    const parts = dateString.split('-');
                     if (parts.length === 3) {
                        // Asumir YYYY-MM-DD
                        date = new Date(parts[0], parts[1] - 1, parts[2]);
                    }
                }

                if (!date || isNaN(date.getTime())) {
                     // Si falla el parseo, devolver original
                    return dateString;
                }

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
    }
};

// --- PUNTO DE ENTRADA ---
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
