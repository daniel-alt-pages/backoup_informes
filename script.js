// --- Variables Globales y Configuración ---
const SUPER_USER_CREDENTIALS = { username: "admin", password: "20/7/2023" };
const BASE_DATA_URL = `https://raw.githubusercontent.com/daniel-alt-pages/backoup_informes/main/`; // (NUEVO) URL Base del Repo
const TIMESTAMP = Date.now(); // Cache-busting

// (NUEVO) Rutas a los archivos de la nueva arquitectura
const URLS = {
    studentDatabase: `${BASE_DATA_URL}database/student_database.csv?t=${TIMESTAMP}`,
    scoresDatabase: `${BASE_DATA_URL}database/scores_database.csv?t=${TIMESTAMP}`,
    testIndex: `${BASE_DATA_URL}database/test_index.json?t=${TIMESTAMP}`
};

// (NUEVO) Almacenes de datos
let STUDENT_DB = {};           // Almacena datos de login (1 fila por estudiante)
let SCORES_DB = [];            // Almacena TODOS los puntajes (múltiples filas por estudiante)
let TEST_INDEX = {};           // Almacena el "mapa" de pruebas desde test_index.json
let ALL_STUDENTS_ARRAY = [];   // (Admin) Lista única de estudiantes de STUDENT_DB
let CURRENT_STUDENT_REPORTS = []; // (Estudiante) Informes del estudiante que inició sesión
let CURRENT_STUDENT_DATA = null; // (Estudiante) Datos de login del estudiante

// (NUEVO) Almacenes para datos de pruebas cacheados
let CACHED_TEST_DATA = {
    // "sg11_07": { answers_s1: {...}, keys_s1: {...}, stats_s1: {...}, ... }
};

// --- Definiciones de Skills (sin cambios) ---
const skillsData = {
    lectura: {
        color: 'var(--color-lectura)',
        levels: [
            { label: 'Bajo', min: 0, range: '0-35', color: '#ef4444', desc: 'No alcanza el desempeño mínimo esperado.' },
            { label: 'Medio', min: 36, range: '36-50', color: '#f97316', desc: 'Identifica información explícita en textos sencillos.' },
            { label: 'Alto', min: 51, range: '51-70', color: '#eab308', desc: 'Comprende textos de mediana complejidad y articula partes para darle un sentido global.' },
            { label: 'Sobresaliente', min: 71, range: '71-100', color: '#22c55e', desc: 'Analiza críticamente textos complejos y evalúa sus contenidos y estrategias discursivas.' }
        ],
        competencies: [
            { name: 'Identificar y entender los contenidos locales', skills: [
                { name: 'Habilidad 1.1', desc: 'Recupera información explícita de un texto.', level: 2 },
                { name: 'Habilidad 1.2', desc: 'Identifica el significado de palabras en su contexto.', level: 2 },
                { name: 'Habilidad 1.3', desc: 'Reconoce la función de conectores y signos de puntuación.', level: 3 }
            ]},
            { name: 'Comprender cómo se articulan las partes de un texto', skills: [
                    { name: 'Habilidad 2.1', desc: 'Identifica la idea principal y las ideas secundarias.', level: 2 },
                    { name: 'Habilidad 2.2', desc: 'Comprende la relación entre diferentes partes del texto (inicio, nudo, desenlace).', level: 3 },
                    { name: 'Habilidad 2.3', desc: 'Analiza la estructura argumentativa de un texto.', level: 4 }
            ]},
            { name: 'Reflexionar a partir de un texto y evaluar su contenido', skills: [
                { name: 'Habilidad 3.1', desc: 'Establece relaciones entre el texto y su contexto.', level: 3 },
                { name: 'Habilidad 3.2', desc: 'Evalúa la validez de los argumentos presentados.', level: 4 },
                { name: 'Habilidad 3.3', desc: 'Adopta una postura crítica frente al texto.', level: 4 }
            ]}
        ]
    },
    matematicas: {
         color: 'var(--color-matematicas)',
         levels: [
            { label: 'Bajo', min: 0, range: '0-35', color: '#ef4444', desc: 'No alcanza el desempeño mínimo esperado.' },
            { label: 'Medio', min: 36, range: '36-50', color: '#f97316', desc: 'Resuelve problemas simples que requieren operaciones básicas.' },
            { label: 'Alto', min: 51, range: '51-70', color: '#eab308', desc: 'Resuelve problemas de mediana complejidad, aplicando conceptos y representaciones.' },
            { label: 'Sobresaliente', min: 71, range: '71-100', color: '#22c55e', desc: 'Analiza situaciones, argumenta y modela problemas complejos.' }
        ],
        competencies: [
            { name: 'Interpretación y representación', skills: [
                    { name: 'Habilidad 1.1', desc: 'Extrae información de tablas, gráficos y esquemas.', level: 2 },
                    { name: 'Habilidad 1.2', desc: 'Traduce entre diferentes representaciones (verbal, gráfica, simbólica).', level: 3 },
                    { name: 'Habilidad 1.3', desc: 'Comprende y utiliza propiedades de figuras geométricas.', level: 3 }
            ]},
            { name: 'Formulación y ejecución', skills: [
                    { name: 'Habilidad 2.1', desc: 'Realiza operaciones básicas (suma, resta, multiplicación, división).', level: 2 },
                    { name: 'Habilidad 2.2', desc: 'Resuelve ecuaciones lineales y sistemas de ecuaciones.', level: 3 },
                    { name: 'Habilidad 2.3', desc: 'Aplica conceptos de proporcionalidad, porcentaje y estadística.', level: 3 },
                    { name: 'Habilidad 2.4', desc: 'Modela situaciones problema usando funciones.', level: 4 }
            ]},
            { name: 'Argumentación', skills: [
                    { name: 'Habilidad 3.1', desc: 'Justifica procedimientos y respuestas en problemas simples.', level: 3 },
                    { name: 'Habilidad 3.2', desc: 'Valida la coherencia de los resultados obtenidos.', level: 4 },
                    { name: 'Habilidad 3.3', desc: 'Plantea y evalúa conjeturas matemáticas.', level: 4 }
            ]}
        ]
    },
    sociales: {
         color: 'var(--color-sociales)',
         levels: [
            { label: 'Bajo', min: 0, range: '0-35', color: '#ef4444', desc: 'No alcanza el desempeño mínimo esperado.' },
            { label: 'Medio', min: 36, range: '36-50', color: '#f97316', desc: 'Identifica conceptos sociales básicos y reconoce derechos fundamentales.' },
            { label: 'Alto', min: 51, range: '51-70', color: '#eab308', desc: 'Comprende el funcionamiento del estado y analiza problemas sociales.' },
            { label: 'Sobresaliente', min: 71, range: '71-100', color: '#22c55e', desc: 'Analiza críticamente fenómenos sociales y evalúa diferentes perspectivas.' }
        ],
        competencies: [
            { name: 'Pensamiento Social', skills: [
                    { name: 'Habilidad 1.1', desc: 'Identifica actores y eventos en procesos históricos.', level: 2 },
                    { name: 'Habilidad 1.2', desc: 'Comprende el funcionamiento de la economía básica.', level: 3 },
                    { name: 'Habilidad 1.3', desc: 'Analiza relaciones espaciales y su impacto en la sociedad.', level: 3 }
            ]},
            { name: 'Interpretación y Análisis de Perspectivas', skills: [
                    { name: 'Habilidad 2.1', desc: 'Reconoce diferentes puntos de vista en un conflicto social.', level: 3 },
                    { name: 'Habilidad 2.2', desc: 'Analiza fuentes primarias y secundarias.', level: 4 },
                    { name: 'Habilidad 2.3', desc: 'Compara perspectivas de diferentes actores sociales.', level: 4 }
            ]},
            { name: 'Pensamiento Reflexivo y Sistémico', skills: [
                    { name: 'Habilidad 3.1', desc: 'Comprende los derechos y deberes constitucionales.', level: 2 },
                    { name: 'Habilidad 3.2', desc: 'Evalúa el impacto de decisiones políticas y económicas.', level: 4 },
                    { name: 'Habilidad 3.3', desc: 'Propone soluciones éticas a problemas sociales.', level: 4 }
            ]}
        ]
    },
    ciencias: {
         color: 'var(--color-ciencias)',
         levels: [
            { label: 'Bajo', min: 0, range: '0-35', color: '#ef4444', desc: 'No alcanza el desempeño mínimo esperado.' },
            { label: 'Medio', min: 36, range: '36-50', color: '#f97316', desc: 'Identifica conceptos básicos de biología, química y física.' },
            { label: 'Alto', min: 51, range: '51-70', color: '#eab308', desc: 'Explica fenómenos naturales de mediana complejidad y analiza datos.' },
            { label: 'Sobresaliente', min: 71, range: '71-100', color: '#22c55e', desc: 'Analiza problemas científicos, usa modelos y plantea hipótesis.' }
        ],
        competencies: [
            { name: 'Uso comprensivo del conocimiento científico', skills: [
                    { name: 'Habilidad 1.1', desc: 'Identifica conceptos básicos de biología (célula, ecosistema).', level: 2 },
                    { name: 'Habilidad 1.2', desc: 'Reconoce conceptos básicos de química (materia, energía).', level: 2 },
                    { name: 'Habilidad 1.3', desc: 'Explica fenómenos físicos (movimiento, ondas).', level: 3 },
                    { name: 'Habilidad 1.4', desc: 'Relaciona conceptos de diferentes áreas de las ciencias.', level: 4 }
            ]},
            { name: 'Explicación de fenómenos', skills: [
                    { name: 'Habilidad 2.1', desc: 'Describe fenómenos naturales cotidianos.', level: 2 },
                    { name: 'Habilidad 2.2', desc: 'Construye explicaciones para fenómenos de mediana complejidad.', level: 3 },
                    { name: 'Habilidad 2.3', desc: 'Utiliza modelos científicos para predecir resultados.', level: 4 }
            ]},
            { name: 'Indagación', skills: [
                    { name: 'Habilidad 3.1', desc: 'Interpreta datos presentados en tablas y gráficas.', level: 2 },
                    { name: 'Habilidad 3.2', desc: 'Identifica variables en un experimento simple.', level: 3 },
                    { name: 'Habilidad 3.3', desc: 'Plantea hipótesis y diseña experimentos para validarlas.', level: 4 }
            ]}
        ]
    },
    ingles: {
        color: 'var(--color-ingles)',
        levels: [
            { label: 'A-', min: 0, range: '0-35', color: '#ef4444', desc: 'No alcanza el nivel A1. No supera preguntas de conocimiento mínimo.' },
            { label: 'A1', min: 36, range: '36-50', color: '#f97316', desc: 'Comprende y utiliza expresiones cotidianas y frases básicas.' },
            { label: 'A2', min: 51, range: '51-70', color: '#eab308', desc: 'Comprende frases y vocabulario sobre áreas de experiencia relevante.' },
            { label: 'B1', min: 71, range: '71-100', color: '#22c55e', desc: 'Comprende textos sobre temas familiares y puede describir experiencias.' }
        ],
        competencies: [
             { name: 'Competencia Lingüística', skills: [
                    { name: 'Habilidad 1.1', desc: 'Reconoce vocabulario básico (familia, colores, números).', level: 1 },
                    { name: 'Habilidad 1.2', desc: 'Comprende avisos y letreros sencillos.', level: 1 },
                    { name: 'Habilidad 1.3', desc: 'Entiende descripciones cortas de personas y lugares.', level: 2 },
                    { name: 'Habilidad 1.4', desc: 'Maneja el presente simple y continuo.', level: 2 }
             ]},
             { name: 'Competencia Pragmática', skills: [
                    { name: 'Habilidad 2.1', desc: 'Identifica la intención comunicativa en mensajes cortos.', level: 2 },
                    { name: 'Habilidad 2.2', desc: 'Comprende la idea principal en textos sobre temas familiares.', level: 3 },
                    { name: 'Habilidad 2.3', desc: 'Relaciona partes de un texto para entender su coherencia.', level: 3 }
             ]},
             { name: 'Competencia Sociolingüística', skills: [
                    { name: 'Habilidad 3.1', desc: 'Reconoce fórmulas de cortesía y saludos.', level: 1 },
                    { name: 'Habilidad 3.2', desc: 'Adapta el lenguaje a situaciones formales e informales simples.', level: 2 }
             ]}
        ]
    }
};

const subjectDescriptions = {
    lectura: "Evalúa la capacidad de comprender y tomar posturas críticas frente a textos.",
    matematicas: "Mide la habilidad para formular y resolver problemas usando conceptos matemáticos.",
    sociales: "Valora la comprensión de eventos históricos y sociales, y el pensamiento crítico.",
    ciencias: "Examina la capacidad de analizar fenómenos naturales y proponer explicaciones.",
    ingles: "Determina el nivel de competencia en la comprensión y uso del idioma inglés."
};
const filterOptions = [
     { id: 'matematicas', name: 'Matemáticas', color: 'var(--color-matematicas)' },
     { id: 'lectura', name: 'Lectura Crítica', color: 'var(--color-lectura)' },
     { id: 'sociales', name: 'Sociales y Ciudadanas', color: 'var(--color-sociales)' },
     { id: 'ciencias', name: 'Ciencias Naturales', color: 'var(--color-ciencias)' },
     { id: 'ingles', name: 'Inglés', color: 'var(--color-ingles)' },
];
const subjects = ['lectura', 'matematicas', 'sociales', 'ciencias', 'ingles'];

// --- Variables de Estado (Admin) ---
let currentAdminPage = 1;
const ADMIN_ROWS_PER_PAGE = 25;
let lastCalculatedTotalPages = 1;
let currentAdminSort = { key: 'full_name', direction: 'asc' };
let currentAdminFilter = '';

// --- Variables de Estado (General) ---
let isAdminViewingReport = false;
let birthDatePicker;
let elements;

// --- Instancias de Gráficos ---
let subjectAvgChartInstance = null;
let scoreDistChartInstance = null;
let growthChartSimulacroInstance = null;
let growthChartMinisimulacroInstance = null;

// --- Constantes para sessionStorage ---
const SESSION_USER_TYPE_KEY = 'informeSaberUserType_v3';
const SESSION_USER_ID_KEY = 'informeSaberUserId_v3';

// --- Funciones Helper ---
function parseCSVLine(line) {
    const values = [];
    let inQuote = false;
    let value = '';
    if (!line) return [];
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') { inQuote = !inQuote; }
        else if (char === ',' && !inQuote) { values.push(value.trim()); value = ''; }
        else { value += char; }
    }
    values.push(value.trim());
    return values;
 }
function normalizeHeader(str) {
    return (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}
function getSubjectFromHeader(header) {
    const lowerHeader = header.toLowerCase();
    if (lowerHeader.includes('matemáticas') || lowerHeader.includes('matematicas')) return 'matematicas';
    if (lowerHeader.includes('lectura')) return 'lectura';
    if (lowerHeader.includes('sociales')) return 'sociales';
    if (lowerHeader.includes('ciencias')) return 'ciencias';
    if (lowerHeader.includes('ingles') || lowerHeader.includes('inglés')) return 'ingles';
    return null;
}
function formatTestDate(dateString) {
    try {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return dateString; // Devuelve la original si falla
    }
}

// --- (NUEVO) Carga y Parseo de Datos (Arquitectura v3) ---
async function loadAllData() {
    try {
        console.log("Iniciando carga de datos v3...");
        const [studentRes, scoresRes, testIndexRes] = await Promise.all([
            fetch(URLS.studentDatabase, { cache: "no-store" }),
            fetch(URLS.scoresDatabase, { cache: "no-store" }),
            fetch(URLS.testIndex, { cache: "no-store" })
        ]);

        if (!studentRes.ok) throw new Error(`Error al cargar ${URLS.studentDatabase}`);
        if (!scoresRes.ok) throw new Error(`Error al cargar ${URLS.scoresDatabase}`);
        if (!testIndexRes.ok) throw new Error(`Error al cargar ${URLS.testIndex}`);

        const [studentCsv, scoresCsv, testIndexJson] = await Promise.all([
            studentRes.text(),
            scoresRes.text(),
            testIndexRes.json()
        ]);

        TEST_INDEX = testIndexJson; // Guardar el mapa de pruebas

        parseStudentDatabase(studentCsv); // Parsear datos de login
        parseScoresDatabase(scoresCsv); // Parsear todos los puntajes

        console.log("Datos v3 parseados correctamente.");
        console.log(`Estudiantes: ${Object.keys(STUDENT_DB).length}, Puntajes: ${SCORES_DB.length}, Pruebas: ${Object.keys(TEST_INDEX).length}`);
        
        // (NUEVO) Pre-procesar datos para admin
        ALL_STUDENTS_ARRAY = Object.values(STUDENT_DB);
        ALL_STUDENTS_ARRAY.forEach(student => {
            student.report_count = SCORES_DB.filter(score => score.doc_number === student.doc_number).length;
        });

    } catch (error) {
        console.error("Error crítico durante la carga o parseo de datos v3:", error);
        if (elements && elements.loginError) {
            elements.loginError.textContent = 'Error al cargar datos base. Intente recargar.';
            elements.loginError.classList.remove('hidden');
        }
    }
}

function parseStudentDatabase(csvText) {
    STUDENT_DB = {};
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    const headers = parseCSVLine(lines[0]).map(normalizeHeader);

    const docNumberIndex = headers.indexOf('doc_number');
    const docTypeIndex = headers.indexOf('doc_type');
    const nameIndex = headers.indexOf('full_name');
    const birthDateIndex = headers.indexOf('birth_date');
    const emailIndex = headers.indexOf('email');

    if ([docNumberIndex, docTypeIndex, nameIndex, birthDateIndex].some(index => index === -1)) {
        console.warn("Faltan encabezados principales en student_database.csv");
    }

    const parseBirthDate = (dateString) => {
        if (!dateString) return '';
        const m = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        return m ? `${parseInt(m[1])}/${parseInt(m[2])}/${m[3]}` : dateString.trim();
    };

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;
        const docNumber = values[docNumberIndex]?.trim();
        if (!docNumber) continue;

        STUDENT_DB[docNumber] = {
            doc_number: docNumber,
            doc_type: values[docTypeIndex] || '-',
            full_name: values[nameIndex] || 'N/A',
            birth_date: parseBirthDate(values[birthDateIndex]),
            email: values[emailIndex] || '-',
        };
    }
}

function parseScoresDatabase(csvText) {
    SCORES_DB = [];
    const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    const headers = parseCSVLine(lines[0]).map(normalizeHeader);

    const docNumberIndex = headers.indexOf('doc_number');
    const testIdIndex = headers.indexOf('test_id');
    const testDateIndex = headers.indexOf('test_date');
    const globalIndex = headers.indexOf('global_score');
    const matIndex = headers.indexOf('mat_score');
    const lecIndex = headers.indexOf('lec_score');
    const socIndex = headers.indexOf('soc_score');
    const cienIndex = headers.indexOf('cien_score');
    const ingIndex = headers.indexOf('ing_score');

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;
        const docNumber = values[docNumberIndex]?.trim();
        if (!docNumber) continue;

        SCORES_DB.push({
            doc_number: docNumber,
            test_id: values[testIdIndex] || 'unknown',
            test_date: values[testDateIndex] || '1970-01-01',
            puntajes: {
                matematicas: parseInt(values[matIndex], 10) || 0,
                lectura: parseInt(values[lecIndex], 10) || 0,
                sociales: parseInt(values[socIndex], 10) || 0,
                ciencias: parseInt(values[cienIndex], 10) || 0,
                ingles: parseInt(values[ingIndex], 10) || 0,
            },
            puntajeGlobal: parseInt(values[globalIndex], 10) || 0,
        });
    }
}

// --- (NUEVO) Carga de datos de una prueba específica (Bajo Demanda) ---

// Esta función carga las claves, respuestas y videos de UNA prueba
async function loadTestData(testId) {
    if (CACHED_TEST_DATA[testId]) {
        return CACHED_TEST_DATA[testId]; // Devuelve desde caché si ya existe
    }

    const testInfo = TEST_INDEX[testId];
    if (!testInfo) {
        console.error(`No se encontró la prueba con ID: ${testId} en test_index.json`);
        return null;
    }

    try {
        // 1. Crear un objeto para esta prueba
        const testData = {
            test_id: testId,
            name: testInfo.name,
            type: testInfo.type || 'simulacro',
            answers: {}, // Para minisimulacros
            keys: {},    // Para minisimulacros
            answers_s1: {},
            keys_s1: {},
            headers_s1: [],
            stats_s1: {},
            answers_s2: {},
            keys_s2: {},
            headers_s2: [],
            stats_s2: {},
            videos: {}
        };

        // 2. Cargar los archivos CSV de respuestas y claves
        const fetchPromises = [];
        
        // Simulacro General (2 sesiones)
        if (testInfo.type === 'simulacro') {
            fetchPromises.push(fetch(BASE_DATA_URL + testInfo.answers_s1, { cache: "no-store" }).then(res => res.text()));
            fetchPromises.push(fetch(BASE_DATA_URL + testInfo.keys_s1, { cache: "no-store" }).then(res => res.text()));
            fetchPromises.push(fetch(BASE_DATA_URL + testInfo.answers_s2, { cache: "no-store" }).then(res => res.text()));
            fetchPromises.push(fetch(BASE_DATA_URL + testInfo.keys_s2, { cache: "no-store" }).then(res => res.text()));
        } 
        // Minisimulacro (1 sesión)
        else {
            fetchPromises.push(fetch(BASE_DATA_URL + testInfo.answers, { cache: "no-store" }).then(res => res.text()));
            fetchPromises.push(fetch(BASE_DATA_URL + testInfo.keys, { cache: "no-store" }).then(res => res.text()));
        }

        // Cargar videos (siempre)
        if (testInfo.videos) {
            fetchPromises.push(fetch(BASE_DATA_URL + testInfo.videos, { cache: "no-store" }).then(res => res.json()));
        }

        const results = await Promise.all(fetchPromises);

        // 3. Parsear los resultados
        let videoData = {};
        if (testInfo.type === 'simulacro') {
            const [s1AnsCsv, s1KeyCsv, s2AnsCsv, s2KeyCsv] = results;
            testData.headers_s1 = parseAnswerKeys(s1KeyCsv, testData.keys_s1);
            testData.headers_s2 = parseAnswerKeys(s2KeyCsv, testData.keys_s2);
            parseStudentAnswers(s1AnsCsv, testData.answers_s1);
            parseStudentAnswers(s2AnsCsv, testData.answers_s2);
            if (testInfo.videos) videoData = results[4];
        } else {
            const [ansCsv, keyCsv] = results;
            testData.headers_s1 = parseAnswerKeys(keyCsv, testData.keys_s1); // Usamos s1 por conveniencia
            parseStudentAnswers(ansCsv, testData.answers_s1);
            if (testInfo.videos) videoData = results[2];
        }

        testData.videos = videoData;

        // 4. Calcular estadísticas para esta prueba
        calculateQuestionStatistics(testData);

        // 5. Guardar en caché y devolver
        CACHED_TEST_DATA[testId] = testData;
        return testData;

    } catch (error) {
        console.error(`Error cargando datos para la prueba ${testId}:`, error);
        return null;
    }
}

// --- (MODIFICADO) Cálculo de Estadísticas ---

// (MODIFICADO) Ahora calcula promedios globales para *ambos* tipos de prueba
function calculateGlobalAverages() {
    const averages = {
        simulacro: { ...subjects.reduce((acc, s) => ({...acc, [s]: 0}), {}), global: 0, count: 0 },
        minisimulacro: { ...subjects.reduce((acc, s) => ({...acc, [s]: 0}), {}), global: 0, count: 0 }
    };

    SCORES_DB.forEach(score => {
        const testType = TEST_INDEX[score.test_id]?.type || 'simulacro';
        const target = averages[testType];
        
        subjects.forEach(subject => {
            target[subject] += score.puntajes[subject] || 0;
        });
        target.global += score.puntajeGlobal || 0;
        target.count++;
    });

    // Calcular promedios
    ['simulacro', 'minisimulacro'].forEach(type => {
        const target = averages[type];
        if (target.count > 0) {
            subjects.forEach(subject => {
                target[subject] = Math.round(target[subject] / target.count);
            });
            target.global = Math.round(target.global / target.count);
        }
    });
    
    return averages;
}

// (MODIFICADO) Ahora calcula estadísticas para UNA prueba específica
function calculateQuestionStatistics(testData) {
    console.log(`Calculando estadísticas para ${testData.test_id}...`);
    const studentDocNumbers = Object.keys(STUDENT_DB); // Lista de todos los estudiantes
    const totalStudents = studentDocNumbers.length;
    if (totalStudents === 0) return;

    // Procesar Sesión 1 (o única sesión)
    if (testData.headers_s1) {
        testData.headers_s1.forEach(header => {
            const correctAnswer = testData.keys_s1[header];
            if (!correctAnswer) return; 

            let correctCount = 0;
            studentDocNumbers.forEach(docNumber => {
                const studentAnswers = testData.answers_s1[docNumber] || {};
                const studentAnswer = studentAnswers[header];
                if (studentAnswer && studentAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
                    correctCount++;
                }
            });
            testData.stats_s1[header] = {
                correct: correctCount,
                total: totalStudents,
                percent: (correctCount / totalStudents) * 100
            };
        });
    }

    // Procesar Sesión 2 (si existe)
    if (testData.headers_s2) {
        testData.headers_s2.forEach(header => {
            const correctAnswer = testData.keys_s2[header];
            if (!correctAnswer) return;

            let correctCount = 0;
            studentDocNumbers.forEach(docNumber => {
                const studentAnswers = testData.answers_s2[docNumber] || {};
                const studentAnswer = studentAnswers[header];
                if (studentAnswer && studentAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
                    correctCount++;
                }
            });
            testData.stats_s2[header] = {
                correct: correctCount,
                total: totalStudents,
                percent: (correctCount / totalStudents) * 100
            };
        });
    }
    console.log(`Estadísticas para ${testData.test_id} calculadas.`);
}


// --- (NUEVO) Generación HTML (Dinámica) ---
function generateReportHtml(studentReportData, testData, groupAverages) {
    if (!studentReportData || !testData) return '';
     const uniqueIdSuffix = studentReportData.doc_number;

     const getLevel = (score, levels) => {
         for (let i = levels.length - 1; i >= 0; i--) { if (score >= levels[i].min) return { ...levels[i], index: i }; }
         return { ...levels[0], index: 0 };
     };
     const renderLevelSteps = (score, levels) => {
         const currentLevel = getLevel(score, levels);
         return levels.map((level, index) => {
             let status = 'future';
             if (index < currentLevel.index) status = 'passed';
             if (index === currentLevel.index) status = 'active';
             const labelClass = status === 'active' ? 'text-white' : (status === 'passed' ? 'text-gray-400' : 'text-gray-500');
             const rangeClass = status === 'active' ? 'text-white/90' : (status === 'passed' ? 'text-gray-400/90' : 'text-gray-500/90');
             return `
                 <div class="level-step-item ${status}" style="${status === 'active' ? `background-color: ${level.color}; border-color: ${level.color};` : ''}">
                     <span class="level-label ${labelClass}">${level.label}</span>
                     <span class="level-range ${rangeClass}">${level.range}</span>
                 </div>
             `;
         }).join('');
     };
    
     const renderCompetencies = (subjectKey, score, competencies, uniqueId) => {
         const currentLevel = getLevel(score, skillsData[subjectKey].levels);
         let levelOffset = (subjectKey === 'ingles') ? 1 : 2;

         return competencies.map((comp, compIndex) => {
             const skillsHtml = (comp.skills || []).map((skill, skillIndex) => {
                 let isAchieved;
                 if (subjectKey === 'ingles') { isAchieved = currentLevel.index >= skill.level; }
                 else { isAchieved = currentLevel.index >= (skill.level - 1); }

                 const icon = isAchieved
                     ? `<svg class="h-5 w-5 text-green-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`
                     : `<svg class="h-5 w-5 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 101.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>`;

                 return `
                     <div class="skill-item ${isAchieved ? 'font-medium text-gray-800' : 'text-gray-600'}">
                         ${icon}
                         <div>
                             <strong class="text-sm block text-gray-900 leading-tight">${skill.name || 'Habilidad sin nombre'}</strong>
                             <span class="text-xs text-gray-600">${skill.desc || 'Descripción no disponible'}</span>
                         </div>
                     </div>
                 `;
             }).join('');

             return `
                 <details class="competency-card">
                     <summary>
                         <h4 class="text-base font-semibold text-brand-header pr-2">${comp.name || 'Competencia sin nombre'}</h4>
                         <svg class="summary-chevron h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                     </summary>
                     <div class="competency-content space-y-3">
                         ${skillsHtml || '<p class="text-xs text-gray-500 italic">No hay habilidades detalladas para esta competencia.</p>'}
                     </div>
                 </details>
             `;
         }).join('');
     };

     const subjectCardsHtml = filterOptions.map(subjectInfo => {
         const subjectKey = subjectInfo.id;
         const subjectData = skillsData[subjectKey];
         if (!subjectData) return '';
         const score = studentReportData.puntajes[subjectKey] || 0;
         
         // (NUEVO) Compara con el promedio del tipo de prueba correcto
         const avgData = groupAverages[testData.type] || groupAverages['simulacro'];
         const groupScore = avgData[subjectKey] || 0;
         const scoreDiff = score - groupScore;

         let comparisonHtml = '';
         // (NUEVO) No muestra comparativa si el promedio es 0 (ej. no hay datos de minisimulacros)
         if (groupScore > 0) {
            if (scoreDiff > 5) { comparisonHtml = `<p class="text-xs sm:text-sm text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium inline-block mt-1"><strong>+${scoreDiff}</strong> vs Prom. (${groupScore})</p>`; }
            else if (scoreDiff < -5) { comparisonHtml = `<p class="text-xs sm:text-sm text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-medium inline-block mt-1"><strong>${scoreDiff}</strong> vs Prom. (${groupScore})</p>`; }
            else { comparisonHtml = `<p class="text-xs sm:text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full font-medium inline-block mt-1"><strong>${scoreDiff >= 0 ? '+' : ''}${scoreDiff}</strong> vs Prom. (${groupScore})</p>`; }
         } else {
            comparisonHtml = `<p class="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium inline-block mt-1">Prom. no disponible</p>`;
         }

         return `
             <div class="card p-4 sm:p-6 mb-6 border-t-4 sm:border-t-8" style="border-top-color: ${subjectData.color};">
                 <div class="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-4">
                     <div>
                         <h2 class="text-xl sm:text-2xl font-bold" style="color: ${subjectData.color};">${subjectInfo.name}</h2>
                         <p class="text-gray-600 mt-1 text-sm sm:text-base">${subjectDescriptions[subjectKey] || ''}</p>
                     </div>
                     <div class="flex-shrink-0 text-left sm:text-right">
                         <p class="text-3xl sm:text-4xl font-extrabold text-gray-800">${score}<span class="text-xl sm:text-2xl font-medium text-gray-500">/100</span></p>
                         ${comparisonHtml}
                     </div>
                 </div>
                 
                 ${renderFeedbackVideos(subjectKey, testData)}
                 
                 <div class="mb-5 sm:mb-6">
                     <h3 class="text-base sm:text-lg font-semibold text-brand-header mb-1 sm:mb-2 flex items-center gap-2">
                         Nivel: <span class="px-2 py-0.5 rounded text-sm font-bold text-white" style="background-color: ${levelData.color};">${levelData.label}</span>
                         <span class="tooltip text-gray-400 cursor-help">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>
                             <span class="tooltiptext">${levelData.desc}</span>
                         </span>
                     </h3>
                     <div class="level-steps-container">
                         ${renderLevelSteps(score, subjectData.levels)}
                     </div>
                 </div>
                 <div>
                     <h3 class="text-base sm:text-lg font-semibold text-brand-header mb-3">Competencias y Habilidades</h3>
                     <div class="space-y-3 sm:space-y-4">
                         ${subjectData.competencies ? renderCompetencies(subjectKey, score, subjectData.competencies, uniqueIdSuffix) : '<p class="text-sm text-gray-500 italic">Detalle de competencias no disponible.</p>'}
                     </div>
                 </div>
             </div>
         `;
     }).join('');

     return subjectCardsHtml;
}

// (NUEVO) Carga videos desde el archivo JSON de la prueba
function renderFeedbackVideos(subjectKey, testData) {
    const videos = testData.videos[subjectKey];
    if (!videos || videos.length === 0) {
        return ''; // No renderiza nada si no hay videos
    }

    const videoCardsHtml = videos.map(video => {
        // (NUEVO) Genera un thumbnail de placeholder si no se provee uno
        const thumbnailUrl = video.thumbnail_url || `https://placehold.co/320x180/${skillsData[subjectKey]?.color.substring(1) || 'cccccc'}/ffffff?text=${encodeURIComponent(video.title)}`;

        return `
        <a href="${video.video_link || '#'}" target="_blank" rel="noopener noreferrer" class="video-card group">
            <img src="${thumbnailUrl}"
                 alt="Miniatura de ${video.title}"
                 class="video-thumbnail"
                 onerror="this.src='https://placehold.co/320x180/e5e7eb/9ca3af?text=Error'"
            />
            <div class="video-info">
                <span class="video-link group-hover:text-brand-blue-dark group-hover:underline">
                    ${video.title || 'Video de Repaso'}
                </span>
                <span class="video-details">
                    ${video.description || 'General'}
                </span>
            </div>
        </a>
    `}).join('');

    return `
        <details class="feedback-videos-container" open>
            <summary class="feedback-videos-summary group">
                <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-brand-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.067v3.866a1 1 0 001.555.832l3.197-1.933a1 1 0 000-1.664l-3.197-1.933z" clip-rule="evenodd" />
                    </svg>
                    <h4 class="text-base font-semibold text-brand-header">Clases de Retroalimentación (${videos.length})</h4>
                </div>
                <svg class="summary-chevron h-5 w-5 text-gray-500 transition-transform duration-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </summary>
            <div class="feedback-videos-content">
                <div class="video-grid">
                    ${videoCardsHtml}
                </div>
            </div>
        </details>
    `;
}

// (NUEVO) Genera el feedback detallado (se adapta a 1 o 2 sesiones)
function generateDetailedFeedbackHtml(studentDocNumber, testData) {
    const studentAnswersS1 = testData.answers_s1[studentDocNumber] || {};
    const studentAnswersS2 = testData.answers_s2[studentDocNumber] || {};

    const generateSessionFeedback = (sessionLabel, questionHeaders, answerKeys, studentAnswers, stats) => {
        if (!questionHeaders || questionHeaders.length === 0 || Object.keys(answerKeys).length === 0) {
             return `<p class="text-gray-500 italic px-6 py-4">No hay datos de preguntas o claves para ${sessionLabel}.</p>`;
        }

        const questionsBySubject = {};
        questionHeaders.forEach(header => {
            const subject = getSubjectFromHeader(header);
            if (subject) {
                if (!questionsBySubject[subject]) questionsBySubject[subject] = [];
                questionsBySubject[subject].push(header);
            }
        });

        const orderedSubjects = filterOptions.map(opt => opt.id).filter(id => questionsBySubject[id]);

        let html = '';
        orderedSubjects.forEach(subjectKey => {
            const subjectInfo = filterOptions.find(opt => opt.id === subjectKey);
            html += `<div class="feedback-subject-group">
                         <h4 class="feedback-subject-title" style="border-color: ${subjectInfo?.color || '#ccc'}; color: ${subjectInfo?.color || 'inherit'};">${subjectInfo?.name || subjectKey}</h4>
                         <div class="feedback-card-list">`;

            questionsBySubject[subjectKey].forEach(header => {
                const correctAnswer = answerKeys[header];
                const studentAnswer = studentAnswers[header];
                const isCorrect = correctAnswer && studentAnswer && correctAnswer.toUpperCase() === studentAnswer.toUpperCase();
                const questionNumberMatch = header.match(/\[(\d+)\.*\]/);
                const questionLabel = questionNumberMatch ? `Pregunta ${questionNumberMatch[1]}` : header;

                const stat = stats[header];
                let statsHtml = '<p class="text-xs text-gray-600">Estadísticas no disponibles.</p>';
                if (stat && stat.total > 0) {
                    statsHtml = `<p class="text-xs text-gray-600"><strong>${stat.correct} de ${stat.total}</strong> estudiantes (${Math.round(stat.percent)}%) respondieron correctamente.</p>`;
                }

                html += `
                <details class="feedback-card ${isCorrect ? 'correct' : (correctAnswer ? 'incorrect' : '')}">
                    <summary>
                        <div class="flex items-center gap-2">
                            <strong class="font-semibold text-brand-header">${questionLabel}</strong>
                            ${isCorrect
                                ? `<span class="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Correcta</span>`
                                : (correctAnswer ? `<span class="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">Incorrecta</span>` : '')
                            }
                        </div>
                        <svg class="indicator h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>
                    </summary>
                    <div class="feedback-card-content space-y-3">
                        <div>
                            <h5 class="text-sm font-semibold text-gray-700 mb-1">Respuestas</h5>
                            <p><span class="label">Tu Rta: </span> ${isCorrect
                                ? `<span class="correct-ans font-semibold">${studentAnswer || '-'}</span>`
                                : `<span class="incorrect-ans font-semibold">${studentAnswer || '-'}</span>`
                            }</p>
                            ${(!isCorrect && correctAnswer) ? `<p><span class="label">Correcta: </span><span class="correct-ans font-semibold">${correctAnswer}</span></p>` : ''}
                            ${!correctAnswer ? `<span class="text-xs text-gray-400">(Sin clave)</span>` : ''}
                        </div>
                        <div class="pt-3 border-t border-gray-200">
                            <h5 class="text-sm font-semibold text-gray-700 mb-1">Estadísticas Globales</h5>
                            ${statsHtml}
                        </div>
                        <!-- (Placeholder) Próximamente: Explicación y Habilidad -->
                    </div>
                </details>
                `;
            });
            html += `</div></div>`;
        });

        return html || `<p class="text-gray-500 italic px-6 py-4">No se encontraron preguntas para ${sessionLabel}.</p>`;
    };

    // (NUEVO) Lógica para adaptar la vista
    const isMini = testData.type === 'minisimulacro';
    const feedbackS1 = generateSessionFeedback(
        isMini ? "Resultados" : "Sesión 1",
        testData.headers_s1, 
        testData.keys_s1, 
        studentAnswersS1, 
        testData.stats_s1
    );

    let feedbackS2 = '';
    if (!isMini) {
        feedbackS2 = generateSessionFeedback("Sesión 2", testData.headers_s2, testData.keys_s2, studentAnswersS2, testData.stats_s2);
    }

    return `
        <div class="feedback-section">
            <div class="feedback-header">
                <h3 class="text-lg sm:text-xl font-semibold text-brand-header">Retroalimentación Detallada por Pregunta</h3>
                <p class="text-sm text-gray-600 mt-1">Aquí puedes ver tus aciertos y errores en cada sesión.</p>
            </div>
            ${!isMini ? `
            <div class="feedback-tabs">
                <button class="feedback-tab active" data-tab="s1">Sesión 1</button>
                <button class="feedback-tab" data-tab="s2">Sesión 2</button>
            </div>
            ` : ''}
            <div>
                <div id="feedback-s1" class="feedback-content active">
                    ${feedbackS1}
                </div>
                ${!isMini ? `
                <div id="feedback-s2" class="feedback-content">
                    ${feedbackS2}
                </div>
                ` : ''}
            </div>
        </div>
    `;
}


// --- (NUEVO) Lógica de Navegación y Vistas ---

// (NUEVO) Muestra la pantalla de selección de informes
function showSelectionScreen(studentData, studentReports) {
    if (!studentData || !studentReports) {
        handleLogout();
        return;
    }

    CURRENT_STUDENT_DATA = studentData;
    CURRENT_STUDENT_REPORTS = studentReports;

    elements.studentNameHeaderSelection.textContent = studentData.full_name;

    const simulacroList = document.getElementById('report-list-simulacro');
    const minisimulacroList = document.getElementById('report-list-minisimulacro');
    
    simulacroList.innerHTML = '';
    minisimulacroList.innerHTML = '';

    let simulacroCount = 0;
    let miniCount = 0;

    // Ordenar por fecha, más reciente primero
    studentReports.sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    studentReports.forEach(report => {
        const testInfo = TEST_INDEX[report.test_id] || {};
        const isMini = testInfo.type === 'minisimulacro';
        
        const cardHtml = `
            <div class="report-card" data-testid="${report.test_id}">
                <div class="report-card-info">
                    <span class="report-card-title">${testInfo.name || report.test_id}</span>
                    <span class="report-card-date">${formatTestDate(report.test_date)}</span>
                </div>
                <div class="report-card-score">
                    <span class="report-card-global">${report.puntajeGlobal}</span>
                    <span class="report-card-label">GLOBAL</span>
                </div>
            </div>
        `;

        if (isMini) {
            minisimulacroList.innerHTML += cardHtml;
            miniCount++;
        } else {
            simulacroList.innerHTML += cardHtml;
            simulacroCount++;
        }
    });

    if (simulacroCount === 0) {
        simulacroList.innerHTML = '<p class="text-gray-500 text-sm">No hay informes de este tipo.</p>';
    }
    if (miniCount === 0) {
        minisimulacroList.innerHTML = '<p class="text-gray-500 text-sm">No hay informes de este tipo.</p>';
    }

    // Ocultar botón de gráficas si no hay suficientes datos
    elements.viewGrowthChartBtn.style.display = studentReports.length > 1 ? 'inline-flex' : 'none';

    elements.loginScreen.classList.add('hidden');
    elements.adminScreen.classList.add('hidden');
    elements.reportScreen.classList.add('hidden');
    elements.selectionScreen.classList.remove('hidden');
    window.scrollTo(0, 0);
}

// (NUEVO) Muestra el informe individual
async function showIndividualReport(testId, fromSession = false) {
    // 1. Obtener los datos del estudiante y el puntaje de este informe
    const studentData = CURRENT_STUDENT_DATA;
    const studentReportData = CURRENT_STUDENT_REPORTS.find(r => r.test_id === testId);
    
    if (!studentData || !studentReportData) {
        console.error("Faltan datos para mostrar el informe.");
        showSelectionScreen(CURRENT_STUDENT_DATA, CURRENT_STUDENT_REPORTS); // Volver a la selección
        return;
    }

    // 2. Poner placeholders mientras carga
    elements.studentNameHeader.textContent = studentData.full_name;
    elements.globalScoreNumber.textContent = studentReportData.puntajeGlobal;
    elements.reportTitleHeader.textContent = TEST_INDEX[testId]?.name || testId;
    elements.individualReportContent.innerHTML = '<p class="text-center text-gray-500 py-10">Cargando datos del informe...</p>';
    elements.detailedFeedbackSection.innerHTML = '';

    // 3. Mostrar la pantalla
    elements.loginScreen.classList.add('hidden');
    elements.adminScreen.classList.add('hidden');
    elements.selectionScreen.classList.add('hidden');
    elements.reportScreen.classList.remove('hidden');

    elements.logoutBtnReport.classList.toggle('hidden', isAdminViewingReport);
    elements.backToAdminBtn.classList.toggle('hidden', !isAdminViewingReport);
    elements.backToSelectionBtn.classList.toggle('hidden', isAdminViewingReport); // (NUEVO) Oculta "Mis Informes" si es admin

    if (!fromSession) window.scrollTo(0, 0);

    // 4. Cargar los datos específicos de la prueba (claves, respuestas, videos, etc.)
    const testData = await loadTestData(testId);
    if (!testData) {
        elements.individualReportContent.innerHTML = '<p class="text-center text-red-500 py-10">Error al cargar los datos de esta prueba.</p>';
        return;
    }
    
    // 5. Calcular promedios grupales (solo si no están ya)
    const globalAverages = calculateGlobalAverages();
    
    // 6. Generar y mostrar el HTML completo
    const reportHtml = generateReportHtml(studentReportData, testData, globalAverages);
    elements.individualReportContent.innerHTML = reportHtml;
    
    const feedbackHtml = generateDetailedFeedbackHtml(studentData.doc_number, testData);
    elements.detailedFeedbackSection.innerHTML = feedbackHtml;
    
    // 7. Añadir listeners para las pestañas de feedback
    addToggleListeners('#report-screen'); 
}

// (NUEVO) Muestra la vista de Admin
function showAdminView(fromSession = false) {
    renderAdminDashboard();
    elements.loginScreen.classList.add('hidden');
    elements.reportScreen.classList.add('hidden');
    elements.selectionScreen.classList.add('hidden');
    elements.adminScreen.classList.remove('hidden');
    elements.body.classList.remove('overflow-hidden');
    if (!fromSession) window.scrollTo(0, 0);
}

// (NUEVO) Vuelve a la pantalla de selección
function handleBackToSelection() {
    elements.reportScreen.classList.add('hidden');
    elements.individualReportContent.innerHTML = '';
    elements.detailedFeedbackSection.innerHTML = '';
    showSelectionScreen(CURRENT_STUDENT_DATA, CURRENT_STUDENT_REPORTS);
}

// --- (MODIFICADO) Lógica de Admin ---
function renderAdminDashboard() {
    const globalAverages = calculateGlobalAverages();
    
    // (NUEVO) Actualizar todos los stats
    elements.statTotalStudents.textContent = ALL_STUDENTS_ARRAY.length;
    elements.statTotalTests.textContent = SCORES_DB.length;
    elements.statAvgScore.textContent = globalAverages.simulacro.global;
    elements.statAvgScoreMini.textContent = globalAverages.minisimulacro.global;

    renderSubjectAvgChart(globalAverages.simulacro);
    renderScoreDistChart(SCORES_DB.filter(s => (TEST_INDEX[s.test_id]?.type || 'simulacro') === 'simulacro'));
    
    currentAdminPage = 1;
    renderAdminTable();
}

// (MODIFICADO) Renderiza la tabla de admin con datos de STUDENT_DB
function renderAdminTable() {
    if (!elements.adminTableBody) return;

    // 1. Filtrar
    const filterText = currentAdminFilter.toLowerCase().trim();
    const filteredStudents = ALL_STUDENTS_ARRAY.filter(student => {
        if (!filterText) return true;
        return ( (student.full_name || '').toLowerCase().includes(filterText) ||
               (student.email || '').toLowerCase().includes(filterText) ||
               (student.doc_number || '').toLowerCase().includes(filterText) );
    });

    // 2. Ordenar
    const key = currentAdminSort.key;
    const direction = currentAdminSort.direction === 'asc' ? 1 : -1;
    
    const sortedStudents = [...filteredStudents].sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        
        if (key === 'birth_date') {
            const parseDate = (dateStr) => {
                if (!dateStr) return 0;
                const parts = dateStr.split('/');
                if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
                return 0;
            };
            valA = parseDate(valA);
            valB = parseDate(valB);
        }

        valA = valA ?? (typeof valA === 'number' ? -Infinity : '');
        valB = valB ?? (typeof valB === 'number' ? -Infinity : '');
        
        if (typeof valA === 'string') { return valA.localeCompare(valB, 'es', { sensitivity: 'base' }) * direction; }
        else if (typeof valA === 'number') { return (valA - valB) * direction; }
        return 0;
    });

    // 3. Paginar
    const totalStudents = sortedStudents.length;
    const totalPages = Math.ceil(totalStudents / ADMIN_ROWS_PER_PAGE);
    lastCalculatedTotalPages = totalPages;
    currentAdminPage = Math.min(Math.max(1, currentAdminPage), totalPages || 1);

    const startIndex = (currentAdminPage - 1) * ADMIN_ROWS_PER_PAGE;
    const endIndex = startIndex + ADMIN_ROWS_PER_PAGE;
    const paginatedStudents = sortedStudents.slice(startIndex, endIndex);

    // 4. Renderizar
    elements.adminTableBody.innerHTML = '';
    if (paginatedStudents.length === 0) {
        elements.adminNoResults.classList.remove('hidden');
    } else {
        elements.adminNoResults.classList.add('hidden');
        const rowsHtml = paginatedStudents.map((student) => `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-900">${student.full_name || 'N/A'}</td>
                <td class="px-4 py-3 text-gray-600 truncate max-w-[150px]">${student.email || '-'}</td>
                <td class="px-4 py-3 text-center text-gray-500">${student.doc_type || '-'}</td>
                <td class="px-4 py-3 text-gray-600">${student.doc_number || '-'}</td>
                <td class="px-4 py-3 text-gray-600">${student.birth_date || '-'}</td>
                <td class="px-4 py-3 text-center font-medium text-brand-secondary">${student.report_count || 0}</td>
                <td class="px-4 py-3 text-center">
                     <button class="view-report-btn" data-student-id="${student.doc_number}">Ver</button>
                </td>
            </tr>
        `).join('');
        elements.adminTableBody.innerHTML = rowsHtml;
    }
    
    // 5. Actualizar Controles de Paginación
    elements.adminPaginationInfo.textContent = totalStudents > 0 ? `Mostrando ${startIndex + 1}-${Math.min(endIndex, totalStudents)} de ${totalStudents}` : `Mostrando 0-0 de 0`;
    elements.adminPrevPageBtn.disabled = (currentAdminPage === 1);
    elements.adminNextPageBtn.disabled = (currentAdminPage === totalPages);

    updateAdminSortIcons();
}
   
function updateAdminSortIcons() {
 document.querySelectorAll('#admin-screen .sortable-header').forEach(header => {
     const key = header.dataset.sortKey; const icon = header.querySelector('.sort-icon'); if (icon) icon.remove();
     let iconSvg = '';
     if (currentAdminSort.key === key) { iconSvg = currentAdminSort.direction === 'asc' ? '<svg class="sort-icon h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>' : '<svg class="sort-icon h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>'; }
     else { iconSvg = '<svg class="sort-icon h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" style="opacity: 0.3;"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>'; }
     header.insertAdjacentHTML('beforeend', iconSvg);
 });
}

// (MODIFICADO) Gráficos Admin
function renderSubjectAvgChart(averageData) {
   if (subjectAvgChartInstance) subjectAvgChartInstance.destroy();
   const ctx = elements.subjectAvgChartCanvas?.getContext('2d');
   if (!ctx) return;
   subjectAvgChartInstance = new Chart(ctx, {
       type: 'bar',
       data: {
           labels: ['Lectura', 'Matemáticas', 'Sociales', 'Ciencias', 'Inglés'],
           datasets: [{
               label: 'Promedio Grupal (Generales)',
               data: [averageData.lectura, averageData.matematicas, averageData.sociales, averageData.ciencias, averageData.ingles],
               backgroundColor: [
                   'rgba(2, 132, 199, 0.7)', 'rgba(220, 38, 38, 0.7)', 'rgba(202, 138, 4, 0.7)',
                   'rgba(22, 163, 74, 0.7)', 'rgba(147, 51, 234, 0.7)'
               ],
               borderColor: ['#0284c7', '#dc2626', '#ca8a04', '#16a34a', '#9333ea'],
               borderWidth: 1.5, borderRadius: 6, barPercentage: 0.7, categoryPercentage: 0.8
           }]
       },
       options: { /* Opciones de Chart.js (sin cambios) */ }
   });
 }
function renderScoreDistChart(scoresData) {
     if (scoreDistChartInstance) scoreDistChartInstance.destroy();
     const ctx = elements.scoreDistChartCanvas?.getContext('2d');
     if (!ctx) return;

     const scoreDistribution = { '0-100': 0, '101-200': 0, '201-300': 0, '301-400': 0, '401-500': 0 };
     scoresData.forEach(score => {
        const s = score.puntajeGlobal || 0;
        if (s <= 100) scoreDistribution['0-100']++;
        else if (s <= 200) scoreDistribution['101-200']++;
        else if (s <= 300) scoreDistribution['201-300']++;
        else if (s <= 400) scoreDistribution['301-400']++;
        else scoreDistribution['401-500']++;
     });

     scoreDistChartInstance = new Chart(ctx, {
         type: 'doughnut',
         data: {
             labels: ['0-100', '101-200', '201-300', '301-400', '401-500'],
             datasets: [{
                 label: 'Nro. Estudiantes',
                 data: [
                    scoreDistribution['0-100'], scoreDistribution['101-200'], scoreDistribution['201-300'],
                    scoreDistribution['301-400'], scoreDistribution['401-500']
                 ],
                 backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'],
                 borderColor: '#ffffff', borderWidth: 2,
             }]
         },
         options: { /* Opciones de Chart.js (sin cambios) */ }
     });
}

// --- (MODIFICADO) Lógica de Login/Logout ---
function handleLogin(e) {
    e.preventDefault();
    const docType = elements.docTypeInput.value;
    const docNumber = elements.docNumberInput.value.trim();
    const birthDateInput = elements.birthDateInput.value.trim();
    const m = birthDateInput.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const birthDate = m ? `${parseInt(m[1])}/${parseInt(m[2])}/${m[3]}` : birthDateInput;

    // 1. Check Admin
    if (docType === "CC" && docNumber === SUPER_USER_CREDENTIALS.username && birthDate === SUPER_USER_CREDENTIALS.password) {
        sessionStorage.setItem(SESSION_USER_TYPE_KEY, 'admin');
        sessionStorage.setItem(SESSION_USER_ID_KEY, 'admin');
        elements.loginError.classList.add('hidden');
        isAdminViewingReport = false;
        showAdminView();
        return;
    }

    if (!docType || !docNumber || !birthDate) {
        elements.loginError.textContent = 'Por favor, complete todos los campos.';
        elements.loginError.classList.remove('hidden');
        return;
    }
    
    // 2. Check Student
    const studentData = STUDENT_DB[docNumber];
    const studentDocTypeNormalized = studentData?.doc_type === 'O' ? 'Otro' : studentData?.doc_type;
    const inputDocTypeNormalized = docType === 'O' ? 'Otro' : docType;

    console.log("Intento Login:", { inputDocType: inputDocTypeNormalized, inputDocNumber: docNumber, inputBirthDate: birthDate, foundDocType: studentDocTypeNormalized, foundBirthDate: studentData?.birth_date });

    if (studentData && studentDocTypeNormalized === inputDocTypeNormalized && studentData.birth_date === birthDate) {
        // 3. (NUEVO) Encontrar todos los reportes de este estudiante
        const studentReports = SCORES_DB.filter(score => score.doc_number === docNumber);
        
        if (studentReports.length === 0) {
             elements.loginError.textContent = 'Usuario encontrado, pero no tiene informes disponibles.';
             elements.loginError.classList.remove('hidden');
             return;
        }

        sessionStorage.setItem(SESSION_USER_TYPE_KEY, 'student');
        sessionStorage.setItem(SESSION_USER_ID_KEY, docNumber);
        elements.loginError.classList.add('hidden');
        isAdminViewingReport = false;
        
        // (NUEVO) Mostrar pantalla de selección en lugar de informe directo
        showSelectionScreen(studentData, studentReports);

    } else {
        elements.loginError.textContent = 'Datos incorrectos o no encontrados. Verifique.';
        elements.loginError.classList.remove('hidden');
    }
}

function handleLogout() {
     sessionStorage.removeItem(SESSION_USER_TYPE_KEY);
     sessionStorage.removeItem(SESSION_USER_ID_KEY);
     
     // Limpiar variables de estado
     CURRENT_STUDENT_DATA = null;
     CURRENT_STUDENT_REPORTS = [];
     
     elements.docTypeInput.value = '';
     elements.docNumberInput.value = '';
     elements.birthDateInput.value = '';
     if (birthDatePicker) birthDatePicker.clear();
     
     elements.loginError.classList.add('hidden');
     elements.reportScreen.classList.add('hidden');
     elements.adminScreen.classList.add('hidden');
     elements.selectionScreen.classList.add('hidden'); // (NUEVO) Ocultar selección
     
     elements.individualReportContent.innerHTML = '';
     elements.detailedFeedbackSection.innerHTML = '';
     if (elements.adminTableBody) elements.adminTableBody.innerHTML = '';
     
     isAdminViewingReport = false;
     elements.loginScreen.classList.remove('hidden');
     elements.body.classList.remove('overflow-hidden');
     window.scrollTo(0, 0);
     
     // (NUEVO) Cerrar todos los modales
     closeModal(elements.adminModalBackdrop);
     closeModal(elements.growthChartModalBackdrop);
}

// --- (NUEVO) Lógica de Modales Genérica ---
function openModal(modalBackdrop) {
    if (!modalBackdrop) return;
    modalBackdrop.style.display = 'flex';
    setTimeout(() => {
        modalBackdrop.classList.add('shown');
        elements.body.classList.add('overflow-hidden');
    }, 10);
}

function closeModal(modalBackdrop) {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('shown');
    setTimeout(() => {
        modalBackdrop.style.display = 'none';
        elements.body.classList.remove('overflow-hidden');
        // Limpiar contenido de modales al cerrar
        const modalBody = modalBackdrop.querySelector('.modal-body');
        if (modalBody) modalBody.innerHTML = '';
    }, 250);
}

// (NUEVO) Lógica para Gráfica de Crecimiento
function showGrowthChart() {
    openModal(elements.growthChartModalBackdrop);
    
    // Filtrar por tipo
    const simulacroReports = [];
    const minisimulacroReports = [];

    CURRENT_STUDENT_REPORTS.forEach(report => {
        const type = TEST_INDEX[report.test_id]?.type || 'simulacro';
        const dataPoint = {
            x: new Date(report.test_date).getTime(), // Usar timestamp para el eje X
            y: report.puntajeGlobal
        };
        if (type === 'minisimulacro') {
            minisimulacroReports.push(dataPoint);
        } else {
            simulacroReports.push(dataPoint);
        }
    });

    // Ordenar por fecha (eje x)
    simulacroReports.sort((a, b) => a.x - b.x);
    minisimulacroReports.sort((a, b) => a.x - b.x);

    // Renderizar Gráfica 1 (Simulacros)
    const ctxSimulacro = document.getElementById('growth-chart-simulacro')?.getContext('2d');
    if (ctxSimulacro) {
        if (growthChartSimulacroInstance) growthChartSimulacroInstance.destroy();
        growthChartSimulacroInstance = new Chart(ctxSimulacro, createChartConfig(simulacroReports));
    }
    
    // Renderizar Gráfica 2 (Minisimulacros)
    const ctxMini = document.getElementById('growth-chart-minisimulacro')?.getContext('2d');
    if (ctxMini) {
        if (growthChartMinisimulacroInstance) growthChartMinisimulacroInstance.destroy();
        growthChartMinisimulacroInstance = new Chart(ctxMini, createChartConfig(minisimulacroReports));
    }
}

function createChartConfig(data) {
    return {
        type: 'line',
        data: {
            datasets: [{
                label: 'Puntaje Global',
                data: data,
                borderColor: 'var(--brand-primary)',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                fill: true,
                tension: 0.1, // Línea ligeramente curvada
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: 'var(--brand-primary)',
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
                        tooltipFormat: 'dd MMM yyyy', // Formato de tooltip
                        displayFormats: {
                            month: 'MMM yyyy' // Formato en el eje X
                        }
                    },
                    grid: { display: false },
                    title: { display: true, text: 'Fecha de Prueba' }
                },
                y: {
                    beginAtZero: false,
                    max: 500,
                    min: Math.min(150, ...data.map(d => d.y)) - 20, // Ajustar mínimo
                    grid: { color: '#e5e7eb' },
                    title: { display: true, text: 'Puntaje Global' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleFont: { weight: 'bold' },
                    bodyFont: { size: 12 },
                    padding: 10,
                    cornerRadius: 4,
                    displayColors: false,
                    callbacks: {
                        title: (tooltipItems) => {
                            // Formatear la fecha en el tooltip
                            return formatTestDate(tooltipItems[0].parsed.x);
                        }
                    }
                }
            }
        }
    };
}


// --- (NUEVO) Lógica para Admin Modal
async function showAdminStudentHistory(studentId) {
    const studentData = STUDENT_DB[studentId];
    if (!studentData) return;

    const studentReports = SCORES_DB.filter(score => score.doc_number === studentId)
                                    .sort((a, b) => new Date(b.test_date) - new Date(a.test_date));

    elements.adminModalHeader.textContent = `Historial: ${studentData.full_name}`;
    openModal(elements.adminModalBackdrop);
    elements.adminModalBody.innerHTML = '<p class="text-center text-gray-500 p-4">Cargando historial...</p>';

    if (studentReports.length === 0) {
        elements.adminModalBody.innerHTML = '<p class="text-center text-gray-500 p-4">Este estudiante no tiene informes registrados.</p>';
        return;
    }

    const reportCardsHtml = studentReports.map(report => {
        const testInfo = TEST_INDEX[report.test_id] || {};
        return `
            <div class="report-card admin-report-card" data-testid="${report.test_id}" data-doc-number="${studentId}">
                <div class="report-card-info">
                    <span class="report-card-title">${testInfo.name || report.test_id}</span>
                    <span class="report-card-date">${formatTestDate(report.test_date)}</span>
                </div>
                <div class="report-card-score">
                    <span class="report-card-global">${report.puntajeGlobal}</span>
                    <span class="report-card-label">GLOBAL</span>
                </div>
            </div>
        `;
    }).join('<div class="my-3"></div>'); // Separador

    elements.adminModalBody.innerHTML = reportCardsHtml;
}


// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Cargado. Inicializando v3...");
    
    // (NUEVO) Referencias a todos los elementos
    elements = {
        loginScreen: document.getElementById('login-screen'),
        selectionScreen: document.getElementById('selection-screen'),
        reportScreen: document.getElementById('report-screen'),
        adminScreen: document.getElementById('admin-screen'),
        
        loginForm: document.getElementById('login-form'),
        docTypeInput: document.getElementById('doc-type'),
        docNumberInput: document.getElementById('document-number'),
        birthDateInput: document.getElementById('birth-date'),
        loginError: document.getElementById('login-error'),
        
        studentNameHeaderSelection: document.getElementById('student-name-header-selection'),
        logoutBtnSelection: document.getElementById('logout-btn-selection'),
        viewGrowthChartBtn: document.getElementById('view-growth-chart-btn'),
        reportListContainer: document.getElementById('report-list-container'),

        studentNameHeader: document.getElementById('student-name-header'),
        reportTitleHeader: document.getElementById('report-title-header'),
        individualReportContent: document.getElementById('individual-report-content'),
        detailedFeedbackSection: document.getElementById('detailed-feedback-section'),
        globalScoreNumber: document.getElementById('global-score-number'),
        
        logoutBtnReport: document.getElementById('logout-btn-report'),
        backToAdminBtn: document.getElementById('back-to-admin-btn'),
        backToSelectionBtn: document.getElementById('back-to-selection-btn'),
        logoutBtnAdmin: document.getElementById('logout-btn-admin'),
        
        body: document.body,
        
        adminTableBody: document.getElementById('admin-table-body'),
        adminSearchInput: document.getElementById('admin-search'),
        adminTable: document.getElementById('admin-table'),
        adminNoResults: document.getElementById('admin-no-results'),
        adminPaginationInfo: document.getElementById('admin-pagination-info'),
        adminPrevPageBtn: document.getElementById('admin-prev-page'),
        adminNextPageBtn: document.getElementById('admin-next-page'),
        
        adminModalBackdrop: document.getElementById('admin-modal-backdrop'),
        adminModalHeader: document.getElementById('admin-modal-header'),
        adminModalBody: document.getElementById('admin-modal-body'),
        adminModalCloseBtn: document.getElementById('admin-modal-close-btn'),
        
        growthChartModalBackdrop: document.getElementById('growth-chart-modal-backdrop'),
        growthChartModalCloseBtn: document.getElementById('growth-chart-modal-close-btn'),

        statTotalStudents: document.getElementById('stat-total-students'),
        statAvgScore: document.getElementById('stat-avg-score'),
        statAvgScoreMini: document.getElementById('stat-avg-score-mini'),
        statTotalTests: document.getElementById('stat-total-tests'),
        
        subjectAvgChartCanvas: document.getElementById('subject-avg-chart'),
        scoreDistChartCanvas: document.getElementById('score-dist-chart'),
     };

     // Inicializar Flatpickr
     birthDatePicker = flatpickr(elements.birthDateInput, { locale: "es", dateFormat: "d/m/Y", allowInput: true, disableMobile: "true" });
     elements.birthDateInput.addEventListener('input', (e) => {
         let value = e.target.value.replace(/\D/g, '');
         if (value.length > 2) { value = value.substring(0, 2) + '/' + value.substring(2); }
         if (value.length > 5) { value = value.substring(0, 5) + '/' + value.substring(5, 9); }
         e.target.value = value;
     });

     // Cargar TODOS los datos maestros primero
     await loadAllData();

     // (NUEVO) Revisar sesión
     const savedUserType = sessionStorage.getItem(SESSION_USER_TYPE_KEY);
     const savedUserId = sessionStorage.getItem(SESSION_USER_ID_KEY);
     
     if (savedUserType === 'admin' && savedUserId === 'admin') {
         isAdminViewingReport = false;
         showAdminView(true);
     } else if (savedUserType === 'student') {
         const studentData = STUDENT_DB[savedUserId];
         const studentReports = SCORES_DB.filter(score => score.doc_number === savedUserId);
         if (studentData && studentReports.length > 0) {
            isAdminViewingReport = false;
            // (NUEVO) Restaurar a la pantalla de selección
            showSelectionScreen(studentData, studentReports);
         } else {
            console.warn("Estudiante en sesión no encontrado o sin informes.");
            handleLogout();
         }
     } else {
         elements.loginScreen.classList.remove('hidden');
     }

     // --- Listeners Principales ---
     elements.loginForm?.addEventListener('submit', handleLogin);
     elements.logoutBtnSelection?.addEventListener('click', handleLogout);
     elements.logoutBtnReport?.addEventListener('click', handleLogout);
     elements.logoutBtnAdmin?.addEventListener('click', handleLogout);
     
     elements.backToSelectionBtn?.addEventListener('click', handleBackToSelection);
     elements.backToAdminBtn?.addEventListener('click', () => { /* (Lógica Admin Modal) */ }); // Se maneja en el modal
     
     // --- Listeners de Modales ---
     elements.adminModalCloseBtn?.addEventListener('click', () => closeModal(elements.adminModalBackdrop));
     elements.adminModalBackdrop?.addEventListener('click', (e) => { if (e.target === elements.adminModalBackdrop) closeModal(elements.adminModalBackdrop); });
     
     elements.growthChartModalCloseBtn?.addEventListener('click', () => closeModal(elements.growthChartModalBackdrop));
     elements.growthChartModalBackdrop?.addEventListener('click', (e) => { if (e.target === elements.growthChartModalBackdrop) closeModal(elements.growthChartModalBackdrop); });

     // --- Listeners Específicos de Pantalla ---

     // (NUEVO) Click en un informe de la lista
     elements.reportListContainer?.addEventListener('click', (e) => {
         const card = e.target.closest('.report-card');
         if (card && card.dataset.testid) {
             showIndividualReport(card.dataset.testid);
         }
     });

     // (NUEVO) Click en "Ver Línea de Crecimiento"
     elements.viewGrowthChartBtn?.addEventListener('click', showGrowthChart);
     
     // --- Listeners de Admin ---
     elements.adminSearchInput?.addEventListener('input', (e) => {
         currentAdminFilter = e.target.value;
         currentAdminPage = 1;
         renderAdminTable();
     });

     elements.adminPrevPageBtn?.addEventListener('click', () => {
         if (currentAdminPage > 1) {
             currentAdminPage--;
             renderAdminTable();
         }
     });

     elements.adminNextPageBtn?.addEventListener('click', () => {
         if (currentAdminPage < lastCalculatedTotalPages) {
             currentAdminPage++;
             renderAdminTable();
         }
     });

     // Click en Headers de tabla Admin
     elements.adminTable?.querySelector('thead')?.addEventListener('click', (e) => {
         const header = e.target.closest('.sortable-header'); if (!header) return; const key = header.dataset.sortKey; if (!key) return;
         if (currentAdminSort.key === key) {
             currentAdminSort.direction = currentAdminSort.direction === 'asc' ? 'desc' : 'asc';
         } else {
             currentAdminSort.key = key;
             currentAdminSort.direction = 'asc'; // Siempre asc por defecto
         }
         currentAdminPage = 1;
         renderAdminTable();
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
});

