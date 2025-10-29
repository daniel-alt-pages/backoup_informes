// --- Variables Globales ---
const SUPER_USER_CREDENTIALS = { username: "admin", password: "20/7/2023" };
const BASE_CSV_URL = `https://raw.githubusercontent.com/daniel-alt-pages/informes_sgm_01/main/`;
const TIMESTAMP = Date.now();

const URLS = {
    mainData: `${BASE_CSV_URL}base%20de%20datos%20-%20Hoja%201.csv?t=${TIMESTAMP}`,
    session1Answers: `${BASE_CSV_URL}Sesion1.csv?t=${TIMESTAMP}`,
    session2Answers: `${BASE_CSV_URL}Sesion2.csv?t=${TIMESTAMP}`,
    session1Keys: `${BASE_CSV_URL}Claves_S1.csv?t=${TIMESTAMP}`,
    session2Keys: `${BASE_CSV_URL}Claves_S2.csv?t=${TIMESTAMP}`
};

// --- (Placeholder) Videos de Retroalimentación ---
// *** MEJORADO: Añadido 'thumbnail_url' para las vistas previas ***
const FEEDBACK_VIDEOS = {
    matematicas: [
        { title: "Repaso Ecuaciones Lineales", video_link: "#", description: "Álgebra (Competencia 2)", question_range: "1-5", thumbnail_url: "https://placehold.co/320x180/dc2626/ffffff?text=Video+1" },
        { title: "Conceptos de Geometría Básica", video_link: "#", description: "Geometría (Competencia 1)", question_range: "6-10", thumbnail_url: "https://placehold.co/320x180/dc2626/ffffff?text=Video+2" },
        { title: "Introducción a Estadística", video_link: "#", description: "Estadística (Competencia 3)", question_range: "11-15", thumbnail_url: "https://placehold.co/320x180/dc2626/ffffff?text=Video+3" },
        { title: "Repaso General Matemáticas", video_link: "#", description: "General", question_range: "Todos", thumbnail_url: "https://placehold.co/320x180/dc2626/ffffff?text=Video+4" }
    ],
    lectura: [
        { title: "Identificando Ideas Principales", video_link: "#", description: "Competencia 1", question_range: "1-8", thumbnail_url: "https://placehold.co/320x180/0284c7/ffffff?text=Video+1" },
        { title: "Análisis de Textos Argumentativos", video_link: "#", description: "Competencia 3", question_range: "9-15", thumbnail_url: "https://placehold.co/320x180/0284c7/ffffff?text=Video+2" }
    ],
    sociales: [
        { title: "Derechos Fundamentales", video_link: "#", description: "Competencia 3", question_range: "N/A", thumbnail_url: "https://placehold.co/320x180/ca8a04/ffffff?text=Video+1" }
    ],
    ciencias: [], // Sin videos para este ejemplo
    ingles: [
        { title: "Uso del Presente Simple", video_link: "#", description: "Nivel A1", question_range: "1-10", thumbnail_url: "https://placehold.co/320x180/9333ea/ffffff?text=Video+1" }
    ]
};

// --- Definiciones de Skills ---
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

// --- Variables de Estado ---
let STUDENT_DATA_INTERNAL = {};
let STUDENT_ANSWERS_S1 = {};
let STUDENT_ANSWERS_S2 = {};
let ANSWER_KEYS_S1 = {};
let ANSWER_KEYS_S2 = {};
let QUESTION_HEADERS_S1 = [];
let QUESTION_HEADERS_S2 = [];
let QUESTION_STATS = { s1: {}, s2: {} };

let ALL_STUDENTS_ARRAY = [];
let groupAverages = { lectura: 0, matematicas: 0, sociales: 0, ciencias: 0, ingles: 0 };

let currentAdminPage = 1;
const ADMIN_ROWS_PER_PAGE = 25;
let lastCalculatedTotalPages = 1;

let currentAdminSort = { key: 'rank', direction: 'asc' };
let currentAdminFilter = '';
let isAdminViewingReport = false;
let birthDatePicker;
let subjectAvgChartInstance = null;
let scoreDistChartInstance = null;
let elements;

// --- Constantes para sessionStorage ---
const SESSION_USER_TYPE_KEY = 'informeSaberUserType_v2';
const SESSION_USER_ID_KEY = 'informeSaberUserId_v2';

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

// --- Carga y Parseo de Datos ---
async function loadAllData() {
    try {
        console.log("Iniciando carga de todos los archivos CSV...");
        const responses = await Promise.all([
            fetch(URLS.mainData, { cache: "no-store" }),
            fetch(URLS.session1Answers, { cache: "no-store" }),
            fetch(URLS.session2Answers, { cache: "no-store" }),
            fetch(URLS.session1Keys, { cache: "no-store" }),
            fetch(URLS.session2Keys, { cache: "no-store" })
        ]);

        for (const response of responses) {
            if (!response.ok) {
                throw new Error(`Error al cargar ${response.url}: ${response.statusText}`);
            }
        }

        const [mainCsv, s1AnsCsv, s2AnsCsv, s1KeyCsv, s2KeyCsv] = await Promise.all(responses.map(res => res.text()));

        console.log("Archivos descargados, iniciando parseo...");

        parseMainData(mainCsv);
        parseAnswerKeys(s1KeyCsv, ANSWER_KEYS_S1);
        parseAnswerKeys(s2KeyCsv, ANSWER_KEYS_S2);
        
        QUESTION_HEADERS_S1 = parseCSVLine(s1KeyCsv.trim().split(/\r?\n/)[0]);
        QUESTION_HEADERS_S2 = parseCSVLine(s2KeyCsv.trim().split(/\r?\n/)[0]);

        parseStudentAnswers(s1AnsCsv, STUDENT_ANSWERS_S1);
        parseStudentAnswers(s2AnsCsv, STUDENT_ANSWERS_S2);

        console.log("Datos parseados correctamente.");
        
        calculateGroupAverages();
        calculateQuestionStatistics();

    } catch (error) {
        console.error("Error crítico durante la carga o parseo de datos:", error);
        if (elements && elements.loginError) {
            elements.loginError.textContent = 'Error al cargar datos base. Intente recargar.';
            elements.loginError.classList.remove('hidden');
        }
    }
}

function parseMainData(csvText) {
     STUDENT_DATA_INTERNAL = {};
     if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.substring(1);
     const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
     if (lines.length < 2) return;
     const headers = parseCSVLine(lines[0]).map(normalizeHeader);
     
     const nameIndex = headers.indexOf('nombre completo del estudiante');
     const emailIndex = headers.indexOf('email');
     const docTypeIndex = headers.indexOf('tipo de documento');
     const docNumberIndex = headers.indexOf('numero de documento');
     const birthDateIndex = headers.indexOf('fecha de nacimiento');
     const colegioIndex = headers.indexOf('colegio/institucion');
     const municipioIndex = headers.indexOf('departamento');
     const matIndex = headers.indexOf('matematicas');
     const lecIndex = headers.indexOf('lectura critica');
     const sodexIndex = headers.indexOf('sociales');
     const cienIndex = headers.indexOf('ciencias naturales');
     const ingIndex = headers.indexOf('ingles');
     const globalIndex = headers.indexOf('puntaje global');

     if ([nameIndex, docNumberIndex, matIndex, lecIndex, globalIndex, docTypeIndex, birthDateIndex].some(index => index === -1)) {
         console.warn("Faltan encabezados principales en base de datos - Hoja 1.csv");
     }

     const parseGlobalScore = (scoreString) => parseInt((scoreString || '0/').split('/')[0], 10) || 0;
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

         STUDENT_DATA_INTERNAL[docNumber] = {
             nombre: values[nameIndex] || 'N/A',
             email: values[emailIndex] || '-',
             docType: values[docTypeIndex] || '-',
             docNumber: docNumber,
             birthDate: parseBirthDate(values[birthDateIndex]),
             departamento: "",
             colegio: values[colegioIndex] || 'seamosgenios',
             puntajes: {
                 matematicas: parseInt(values[matIndex], 10) || 0,
                 lectura: parseInt(values[lecIndex], 10) || 0,
                 sociales: parseInt(values[sodexIndex], 10) || 0,
                 ciencias: parseInt(values[cienIndex], 10) || 0,
                 ingles: parseInt(values[ingIndex], 10) || 0,
             },
             puntajeGlobal: parseGlobalScore(values[globalIndex]),
             municipio: municipioIndex !== -1 ? (values[municipioIndex] || 'Desconocido') : 'Desconocido'
         };
     }
     
     ALL_STUDENTS_ARRAY = Object.values(STUDENT_DATA_INTERNAL);
     ALL_STUDENTS_ARRAY.sort((a, b) => (b.puntajeGlobal ?? 0) - (a.puntajeGlobal ?? 0));
     ALL_STUDENTS_ARRAY.forEach((student, index) => student.rank = index + 1);
}

function parseAnswerKeys(csvText, targetObject) {
   if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.substring(1);
   const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
   if (lines.length < 2) {
       console.error("Archivo de claves inválido o vacío.");
       return;
   }
   const headers = parseCSVLine(lines[0]);
   const keys = parseCSVLine(lines[1]);

   if (headers.length !== keys.length) {
       console.error("Discrepancia entre encabezados y claves.");
       return;
   }

   headers.forEach((header, index) => {
       if (header && keys[index]) {
           targetObject[header] = keys[index];
       }
   });
}

function parseStudentAnswers(csvText, targetObject) {
   if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.substring(1);
   const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
   if (lines.length < 2) return;

   const headers = parseCSVLine(lines[0]);
   const docNumberIndex = headers.findIndex(h => normalizeHeader(h) === 'id');

   if (docNumberIndex === -1) {
       console.error("No se encontró la columna 'ID' en el archivo de respuestas.");
       return;
   }

   for (let i = 1; i < lines.length; i++) {
       const values = parseCSVLine(lines[i]);
       if (values.length < headers.length) continue;

       const docNumber = values[docNumberIndex]?.trim();
       if (!docNumber) continue;

       const answers = {};
       headers.forEach((header, index) => {
           if (index > 2 && header) {
            answers[header] = values[index] || '';
           }
       });
       targetObject[docNumber] = answers;
   }
 }


// --- Cálculo de Promedios y Estadísticas ---
function calculateGroupAverages() {
     groupAverages = { lectura: 0, matematicas: 0, sociales: 0, ciencias: 0, ingles: 0 };
     const studentCount = ALL_STUDENTS_ARRAY.length;
     if (studentCount > 0) {
         ALL_STUDENTS_ARRAY.forEach(student => { subjects.forEach(subject => { groupAverages[subject] += student.puntajes?.[subject] || 0; }); });
         subjects.forEach(subject => { groupAverages[subject] = Math.round(groupAverages[subject] / studentCount); });
     }
}

function calculateQuestionStatistics() {
    console.log("Calculando estadísticas de preguntas...");
    QUESTION_STATS = { s1: {}, s2: {} };
    const totalStudents = ALL_STUDENTS_ARRAY.length;
    if (totalStudents === 0) return;

    // Procesar Sesión 1
    QUESTION_HEADERS_S1.forEach(header => {
        const correctAnswer = ANSWER_KEYS_S1[header];
        if (!correctAnswer) return;

        let correctCount = 0;
        ALL_STUDENTS_ARRAY.forEach(student => {
            const studentAnswers = STUDENT_ANSWERS_S1[student.docNumber] || {};
            const studentAnswer = studentAnswers[header];
            if (studentAnswer && studentAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
                correctCount++;
            }
        });
        QUESTION_STATS.s1[header] = {
            correct: correctCount,
            total: totalStudents,
            percent: (correctCount / totalStudents) * 100
        };
    });

    // Procesar Sesión 2
    QUESTION_HEADERS_S2.forEach(header => {
        const correctAnswer = ANSWER_KEYS_S2[header];
        if (!correctAnswer) return;

        let correctCount = 0;
        ALL_STUDENTS_ARRAY.forEach(student => {
            const studentAnswers = STUDENT_ANSWERS_S2[student.docNumber] || {};
            const studentAnswer = studentAnswers[header];
            if (studentAnswer && studentAnswer.toUpperCase() === correctAnswer.toUpperCase()) {
                correctCount++;
            }
        });
        QUESTION_STATS.s2[header] = {
            correct: correctCount,
            total: totalStudents,
            percent: (correctCount / totalStudents) * 100
        };
    });
    console.log("Estadísticas calculadas:", QUESTION_STATS);
}


// --- Generación HTML del Reporte ---
function generateReportHtml(studentData) {
    if (!studentData) return '';
     const uniqueIdSuffix = studentData.docNumber || Math.random().toString(36).substring(7);

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
    
    // *** FUNCIÓN MODIFICADA: Ahora usa <details> y <summary> ***
    // Esto corrige el bug en móviles y tabletas.
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

             // Se reemplaza el <div> y <button> por <details> y <summary>
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
         const score = studentData.puntajes[subjectKey] || 0;
         const groupScore = groupAverages[subjectKey] || 0;
         const scoreDiff = score - groupScore;
         const levelData = getLevel(score, subjectData.levels);
         let comparisonHtml;
          if (scoreDiff > 5) { comparisonHtml = `<p class="text-xs sm:text-sm text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium inline-block mt-1"><strong>+${scoreDiff}</strong> vs Prom. (${groupScore})</p>`; }
          else if (scoreDiff < -5) { comparisonHtml = `<p class="text-xs sm:text-sm text-red-700 bg-red-100 px-2 py-0.5 rounded-full font-medium inline-block mt-1"><strong>${scoreDiff}</strong> vs Prom. (${groupScore})</p>`; }
          else { comparisonHtml = `<p class="text-xs sm:text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full font-medium inline-block mt-1"><strong>${scoreDiff >= 0 ? '+' : ''}${scoreDiff}</strong> vs Prom. (${groupScore})</p>`; }


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
                 
                 <!-- *** SECCIÓN DE VIDEO MEJORADA *** -->
                 ${renderFeedbackVideos(subjectKey)}
                 
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

// *** FUNCIÓN MODIFICADA: Renderiza vistas previas de video (miniaturas) ***
function renderFeedbackVideos(subjectKey) {
    const videos = FEEDBACK_VIDEOS[subjectKey];
    if (!videos || videos.length === 0) {
        return '';
    }

    // Generar el HTML para cada tarjeta de video
    const videoCardsHtml = videos.map(video => `
        <a href="${video.video_link || '#'}" target="_blank" rel="noopener noreferrer" class="video-card group">
            <img src="${video.thumbnail_url || 'https://placehold.co/320x180/e5e7eb/9ca3af?text=Video'}"
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
    `).join('');


    // Devolver el contenedor principal colapsable
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


// --- Generar HTML para Feedback Detallado (CON DATOS) ---
function generateDetailedFeedbackHtml(studentDocNumber) {
    const studentAnswersS1 = STUDENT_ANSWERS_S1[studentDocNumber] || {};
    const studentAnswersS2 = STUDENT_ANSWERS_S2[studentDocNumber] || {};

    const generateSessionFeedback = (session, questionHeaders, answerKeys, studentAnswers) => {
        if (!questionHeaders || questionHeaders.length === 0 || Object.keys(answerKeys).length === 0) {
             return `<p class="text-gray-500 italic px-6 py-4">No hay datos de preguntas o claves para la Sesión ${session}.</p>`;
        }

        const questionsBySubject = {};
        questionHeaders.forEach(header => {
            const subject = getSubjectFromHeader(header);
            if (subject) {
                if (!questionsBySubject[subject]) {
                    questionsBySubject[subject] = [];
                }
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

                const stats = QUESTION_STATS[session === 1 ? 's1' : 's2'][header];
                let statsHtml = '<p class="text-xs text-gray-600">Estadísticas no disponibles.</p>';
                if (stats && stats.total > 0) {
                    statsHtml = `<p class="text-xs text-gray-600"><strong>${stats.correct} de ${stats.total}</strong> estudiantes (${Math.round(stats.percent)}%) respondieron correctamente.</p>`;
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
                        <!-- Sección de Respuestas -->
                        <div>
                            <h5 class="text-sm font-semibold text-gray-700 mb-1">Respuestas</h5>
                            <p><span class="label">Tu Rta: </span> ${isCorrect
                                ? `<span class="correct-ans font-semibold">${studentAnswer || '-'}</span>`
                                : `<span class="incorrect-ans font-semibold">${studentAnswer || '-'}</span>`
                            }</p>
                            ${(!isCorrect && correctAnswer) ? `<p><span class="label">Correcta: </span><span class="correct-ans font-semibold">${correctAnswer}</span></p>` : ''}
                            ${!correctAnswer ? `<span class="text-xs text-gray-400">(Sin clave)</span>` : ''}
                        </div>
                        
                        <!-- Sección de Estadísticas -->
                        <div class="pt-3 border-t border-gray-200">
                            <h5 class="text-sm font-semibold text-gray-700 mb-1">Estadísticas Globales</h5>
                            ${statsHtml}
                        </div>

                        <!-- Sección de Explicación (Placeholder) -->
                        <div class="pt-3 border-t border-gray-200">
                            <h5 class="text-sm font-semibold text-gray-700 mb-1">Explicación (Ejemplo)</h5>
                            <p class="text-xs text-gray-600">La capital de Francia es París, reconocida como centro político y cultural.</p>
                        </div>

                        <!-- Sección de Análisis (Placeholder) -->
                        <div class="pt-3 border-t border-gray-200">
                            <h5 class="text-sm font-semibold text-gray-700 mb-1">Análisis de Competencia</h5>
                            <p class="text-xs text-gray-600 italic">
                                <strong>Próximamente:</strong> Aquí verás la habilidad específica evaluada (ej. "Habilidad 2.1").
                            </p>
                        </div>
                    </div>
                </details>
                `;
            });
            html += `</div></div>`;
        });

        return html || `<p class="text-gray-500 italic px-6 py-4">No se encontraron preguntas para esta sesión.</p>`;
    };

    const feedbackS1 = generateSessionFeedback(1, QUESTION_HEADERS_S1, ANSWER_KEYS_S1, studentAnswersS1);
    const feedbackS2 = generateSessionFeedback(2, QUESTION_HEADERS_S2, ANSWER_KEYS_S2, studentAnswersS2);

    return `
        <div class="feedback-section">
            <div class="feedback-header">
                <h3 class="text-lg sm:text-xl font-semibold text-brand-header">Retroalimentación Detallada por Pregunta</h3>
                <p class="text-sm text-gray-600 mt-1">Aquí puedes ver tus aciertos y errores en cada sesión.</p>
            </div>
            <div class="feedback-tabs">
                <button class="feedback-tab active" data-tab="s1">Sesión 1</button>
                <button class="feedback-tab" data-tab="s2">Sesión 2</button>
            </div>
            <div>
                <div id="feedback-s1" class="feedback-content active">
                    ${feedbackS1}
                </div>
                <div id="feedback-s2" class="feedback-content">
                    ${feedbackS2}
                </div>
            </div>
        </div>
    `;
}

// --- Función addToggleListeners ---
// *** MODIFICADA: Se eliminó el listener para '.toggle-skills-btn' ***
// Ya no es necesario porque usamos <details> nativo.
function addToggleListeners(containerSelector) {
     const container = document.querySelector(containerSelector);
     if (!container) return;

     container.addEventListener('click', (e) => {
         // Toggle para Tabs de Feedback
         const tabButton = e.target.closest('.feedback-tab');
         if (tabButton) {
             const targetTab = tabButton.dataset.tab;
             const section = tabButton.closest('.feedback-section');
             if (!section) return;

             section.querySelectorAll('.feedback-tab').forEach(tab => tab.classList.remove('active'));
             section.querySelectorAll('.feedback-content').forEach(content => content.classList.remove('active'));

             tabButton.classList.add('active');
             const targetContent = section.querySelector(`#feedback-${targetTab}`);
             if (targetContent) targetContent.classList.add('active');
         }
     });

     // (El resto de la lógica de toggle para .toggle-skills-btn se ha eliminado)
 }

// --- Función showIndividualReport ---
function showIndividualReport(studentData, fromSession = false) {
     if (!studentData) {
         console.error("Intentando mostrar informe sin datos de estudiante.");
         if (fromSession) handleLogout();
         return;
     }
     elements.studentNameHeader.textContent = studentData.nombre ?? 'Estudiante';
     elements.globalScoreNumber.textContent = studentData.puntajeGlobal ?? 0;

     elements.individualReportContent.innerHTML = '';
     const reportHtml = generateReportHtml(studentData);
     elements.individualReportContent.innerHTML = reportHtml;
     addToggleListeners('#individual-report-content'); // Sigue siendo necesario para las pestañas de feedback

     const feedbackContainer = document.getElementById('detailed-feedback-section');
     if (feedbackContainer) {
         feedbackContainer.innerHTML = '';
         const feedbackHtml = generateDetailedFeedbackHtml(studentData.docNumber);
         feedbackContainer.innerHTML = feedbackHtml;
         addToggleListeners('#detailed-feedback-section'); // Añadido para las pestañas
     } else {
         console.error("No se encontró el contenedor #detailed-feedback-section");
     }


     elements.loginScreen.classList.add('hidden');
     elements.adminScreen.classList.add('hidden');
     elements.reportScreen.classList.remove('hidden');
     elements.body.classList.remove('overflow-hidden');

     elements.logoutBtnReport.classList.toggle('hidden', isAdminViewingReport);
     elements.backToAdminBtn.classList.toggle('hidden', !isAdminViewingReport);

     if (!fromSession) window.scrollTo(0, 0);
   }

// --- Funciones Admin ---
function calculateAdminStats() {
     const studentCount = ALL_STUDENTS_ARRAY.length;
     elements.statTotalStudents.textContent = studentCount;
     if (studentCount === 0) {
         elements.statAvgScore.textContent = 0;
         elements.statMaxScore.textContent = 0;
         elements.statMinScore.textContent = 0;
         return { scoreDistribution: { '0-100': 0, '101-200': 0, '201-300': 0, '301-400': 0, '401-500': 0 } };
     }
     let totalScore = 0, maxScore = 0, minScore = 500;
     const scoreDistribution = { '0-100': 0, '101-200': 0, '201-300': 0, '301-400': 0, '401-500': 0 };
     ALL_STUDENTS_ARRAY.forEach(student => {
         const score = student.puntajeGlobal || 0;
         totalScore += score;
         if (score > maxScore) maxScore = score;
         if (score < minScore) minScore = score;
         if (score <= 100) scoreDistribution['0-100']++; else if (score <= 200) scoreDistribution['101-200']++; else if (score <= 300) scoreDistribution['201-300']++; else if (score <= 400) scoreDistribution['301-400']++; else scoreDistribution['401-500']++;
     });
     elements.statAvgScore.textContent = Math.round(totalScore / studentCount);
     elements.statMaxScore.textContent = maxScore;
     elements.statMinScore.textContent = minScore;
     return { scoreDistribution };
 }
function renderSubjectAvgChart() {
   if (subjectAvgChartInstance) subjectAvgChartInstance.destroy();
   const ctx = elements.subjectAvgChartCanvas?.getContext('2d');
   if (!ctx) return;
   subjectAvgChartInstance = new Chart(ctx, {
       type: 'bar',
       data: {
           labels: ['Lectura', 'Matemáticas', 'Sociales', 'Ciencias', 'Inglés'],
           datasets: [{
               label: 'Promedio Grupal',
               data: [groupAverages.lectura, groupAverages.matematicas, groupAverages.sociales, groupAverages.ciencias, groupAverages.ingles],
               backgroundColor: [
                   'rgba(2, 132, 199, 0.7)',
                   'rgba(220, 38, 38, 0.7)',
                   'rgba(202, 138, 4, 0.7)',
                   'rgba(22, 163, 74, 0.7)',
                   'rgba(147, 51, 234, 0.7)'
               ],
               borderColor: [
                   '#0284c7', '#dc2626', '#ca8a04', '#16a34a', '#9333ea'
               ],
               borderWidth: 1.5,
               borderRadius: 6,
               barPercentage: 0.7,
               categoryPercentage: 0.8
           }]
       },
       options: {
           responsive: true, maintainAspectRatio: false,
           scales: {
               y: { beginAtZero: true, max: 100, grid: { color: '#e5e7eb' }, ticks: { color: '#374151', font: { size: 10 } } },
               x: { grid: { display: false }, ticks: { color: '#374151', font: { weight: '500', size: 11 } } }
           },
           plugins: {
               legend: { display: false },
               tooltip: {
                   enabled: true, backgroundColor: '#1f2937', titleFont: { weight: 'bold' }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 4, displayColors: false
               }
           }
       }
   });
 }
function renderScoreDistChart(scoreDistribution) {
     if (scoreDistChartInstance) scoreDistChartInstance.destroy();
     const ctx = elements.scoreDistChartCanvas?.getContext('2d');
     if (!ctx) return;
     scoreDistChartInstance = new Chart(ctx, {
         type: 'doughnut',
         data: {
             labels: ['0-100', '101-200', '201-300', '301-400', '401-500'],
             datasets: [{
                 label: 'Nro. Estudiantes',
                 data: [scoreDistribution['0-100'], scoreDistribution['101-200'], scoreDistribution['201-300'], scoreDistribution['301-400'], scoreDistribution['401-500']],
                 backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'],
                 borderColor: '#ffffff', borderWidth: 2,
             }]
         },
         options: {
             responsive: true, maintainAspectRatio: false, cutout: '65%',
             plugins: {
                 legend: { position: 'bottom', labels: { color: '#374151', padding: 10, font: { weight: '500', size: 11 } } },
                 tooltip: {
                     enabled: true, backgroundColor: '#1f2937', titleFont: { weight: 'bold' }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 4, displayColors: true
                 }
             }
         }
     });
   }
function renderAdminDashboard() {
    const { scoreDistribution } = calculateAdminStats();
    renderSubjectAvgChart();
    renderScoreDistChart(scoreDistribution);
    currentAdminPage = 1;
    renderAdminTable();
   }
function showAdminView(fromSession = false) {
     renderAdminDashboard();
     elements.loginScreen.classList.add('hidden');
     elements.reportScreen.classList.add('hidden');
     elements.adminScreen.classList.remove('hidden');
     elements.body.classList.remove('overflow-hidden');
     if (!fromSession) window.scrollTo(0, 0);
   }
   
function renderAdminTable() {
     if (!elements.adminTableBody) return;

     const filterText = currentAdminFilter.toLowerCase().trim();
     const filteredStudents = ALL_STUDENTS_ARRAY.filter(student => {
         if (!filterText) return true;
         return ( (student.nombre || '').toLowerCase().includes(filterText) ||
                (student.email || '').toLowerCase().includes(filterText) ||
                (student.docNumber || '').toLowerCase().includes(filterText) ||
                (student.municipio || '').toLowerCase().includes(filterText) );
     });

     const key = currentAdminSort.key;
     const direction = currentAdminSort.direction === 'asc' ? 1 : -1;
     const getNestedProperty = (obj, path) => path.split('.').reduce((acc, part) => acc && acc[part], obj);
     
     const sortedStudents = [...filteredStudents].sort((a, b) => {
         let valA = getNestedProperty(a, key);
         let valB = getNestedProperty(b, key);
         
         if (key === 'birthDate') {
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

     const totalStudents = sortedStudents.length;
     const totalPages = Math.ceil(totalStudents / ADMIN_ROWS_PER_PAGE);
     lastCalculatedTotalPages = totalPages;
     currentAdminPage = Math.min(Math.max(1, currentAdminPage), totalPages || 1);

     const startIndex = (currentAdminPage - 1) * ADMIN_ROWS_PER_PAGE;
     const endIndex = startIndex + ADMIN_ROWS_PER_PAGE;
     const paginatedStudents = sortedStudents.slice(startIndex, endIndex);

     elements.adminTableBody.innerHTML = '';
     if (paginatedStudents.length === 0) {
         elements.adminNoResults.classList.remove('hidden');
     } else {
         elements.adminNoResults.classList.add('hidden');
         const rowsHtml = paginatedStudents.map((student) => `
             <tr class="hover:bg-gray-50">
                 <td class="px-4 py-3 text-center font-medium text-gray-500">${student.rank}</td>
                 <td class="px-4 py-3 font-medium text-gray-900">${student.nombre || 'N/A'}</td>
                 <td class="px-4 py-3 text-gray-600 truncate max-w-[150px]">${student.email || '-'}</td>
                 <td class="px-4 py-3 text-center text-gray-500">${student.docType || '-'}</td>
                 <td class="px-4 py-3 text-gray-600">${student.docNumber || '-'}</td>
                 <td class="px-4 py-3 text-gray-600">${student.birthDate || '-'}</td>
                 <td class="px-4 py-3 text-center font-bold text-base" style="color: var(--brand-primary);">${student.puntajeGlobal || 0}</td>
                 <td class="px-4 py-3 text-center font-semibold" style="color: var(--color-lectura);">${student.puntajes.lectura || 0}</td>
                 <td class="px-4 py-3 text-center font-semibold" style="color: var(--color-matematicas);">${student.puntajes.matematicas || 0}</td>
                 <td class="px-4 py-3 text-center font-semibold" style="color: var(--color-sociales);">${student.puntajes.sociales || 0}</td>
                 <td class="px-4 py-3 text-center font-semibold" style="color: var(--color-ciencias);">${student.puntajes.ciencias || 0}</td>
                 <td class="px-4 py-3 text-center font-semibold" style="color: var(--color-ingles);">${student.puntajes.ingles || 0}</td>
                 <td class="px-4 py-3 text-gray-600 truncate max-w-[120px]">${student.municipio || 'Desconocido'}</td>
                 <td class="px-4 py-3 text-center">
                      <button class="view-report-btn" data-student-id="${student.docNumber}">Ver</button>
                 </td>
             </tr>
         `).join('');
         elements.adminTableBody.innerHTML = rowsHtml;
     }
     
     const paginationInfo = document.getElementById('admin-pagination-info');
     const prevPageBtn = document.getElementById('admin-prev-page');
     const nextPageBtn = document.getElementById('admin-next-page');

     if (totalStudents > 0) {
         paginationInfo.textContent = `Mostrando ${startIndex + 1}-${Math.min(endIndex, totalStudents)} de ${totalStudents}`;
     } else {
         paginationInfo.textContent = `Mostrando 0-0 de 0`;
     }

     if (prevPageBtn) prevPageBtn.disabled = (currentAdminPage === 1);
     if (nextPageBtn) nextPageBtn.disabled = (currentAdminPage === totalPages);

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

// --- Manejar Login ---
function handleLogin(e) {
    e.preventDefault();
    const docType = elements.docTypeInput.value;
    const docNumber = elements.docNumberInput.value.trim();
    const birthDateInput = elements.birthDateInput.value.trim();
    const m = birthDateInput.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    const birthDate = m ? `${parseInt(m[1])}/${parseInt(m[2])}/${m[3]}` : birthDateInput;

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
    const studentData = STUDENT_DATA_INTERNAL[docNumber];

    const studentDocTypeNormalized = studentData?.docType === 'O' ? 'Otro' : studentData?.docType;
    const inputDocTypeNormalized = docType === 'O' ? 'Otro' : docType;


    console.log("Intento Login:", { inputDocType: inputDocTypeNormalized, inputDocNumber: docNumber, inputBirthDate: birthDate, foundDocType: studentDocTypeNormalized, foundBirthDate: studentData?.birthDate });

    if (studentData && studentDocTypeNormalized === inputDocTypeNormalized && studentData.birthDate === birthDate) {
        sessionStorage.setItem(SESSION_USER_TYPE_KEY, 'student');
        sessionStorage.setItem(SESSION_USER_ID_KEY, docNumber);
        elements.loginError.classList.add('hidden');
        isAdminViewingReport = false;
        showIndividualReport(studentData);
    } else {
        elements.loginError.textContent = 'Datos incorrectos o no encontrados. Verifique.';
        elements.loginError.classList.remove('hidden');
    }
}

// --- Navegación y Modales ---
function handleLogout() {
     sessionStorage.removeItem(SESSION_USER_TYPE_KEY);
     sessionStorage.removeItem(SESSION_USER_ID_KEY);
     elements.docTypeInput.value = '';
     elements.docNumberInput.value = '';
     elements.birthDateInput.value = '';
     if (birthDatePicker) birthDatePicker.clear();
     elements.loginError.classList.add('hidden');
     elements.reportScreen.classList.add('hidden');
     elements.adminScreen.classList.add('hidden');
     elements.individualReportContent.innerHTML = '';
     const feedbackContainer = document.getElementById('detailed-feedback-section');
     if(feedbackContainer) feedbackContainer.innerHTML = '';
     if (elements.adminTableBody) elements.adminTableBody.innerHTML = '';
     isAdminViewingReport = false;
     elements.loginScreen.classList.remove('hidden');
     elements.body.classList.remove('overflow-hidden');
     window.scrollTo(0, 0);
     handleCloseModal();
   }
function handleBackToAdmin() {
     elements.reportScreen.classList.add('hidden');
     elements.individualReportContent.innerHTML = '';
     const feedbackContainer = document.getElementById('detailed-feedback-section');
     if(feedbackContainer) feedbackContainer.innerHTML = '';
     isAdminViewingReport = false;
     elements.adminScreen.classList.remove('hidden');
     elements.body.classList.remove('overflow-hidden');
     window.scrollTo(0, 0);
   }
function handleCloseModal() {
     if (!elements || !elements.adminModalBackdrop) return;
     elements.adminModalBackdrop.classList.remove('shown');
     setTimeout(() => {
         if (elements.adminModalBackdrop) elements.adminModalBackdrop.style.display = 'none';
         if (elements.adminModalBody) elements.adminModalBody.innerHTML = '';
         if (elements.body) elements.body.classList.remove('overflow-hidden');
     }, 250);
 }


// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Cargado. Inicializando...");
    
    elements = {
         loginScreen: document.getElementById('login-screen'), reportScreen: document.getElementById('report-screen'), adminScreen: document.getElementById('admin-screen'),
         loginForm: document.getElementById('login-form'), docTypeInput: document.getElementById('doc-type'), docNumberInput: document.getElementById('document-number'), birthDateInput: document.getElementById('birth-date'), loginError: document.getElementById('login-error'),
         studentNameHeader: document.getElementById('student-name-header'), individualReportContent: document.getElementById('individual-report-content'),
         logoutBtnReport: document.getElementById('logout-btn-report'), backToAdminBtn: document.getElementById('back-to-admin-btn'), logoutBtnAdmin: document.getElementById('logout-btn-admin'),
         body: document.body, globalScoreNumber: document.getElementById('global-score-number'),
         adminTableBody: document.getElementById('admin-table-body'), adminSearchInput: document.getElementById('admin-search'), adminTable: document.getElementById('admin-table'), adminNoResults: document.getElementById('admin-no-results'),
         adminModalBackdrop: document.getElementById('admin-modal-backdrop'), adminModalContainer: document.getElementById('admin-modal-container'), adminModalHeader: document.getElementById('admin-modal-header'), adminModalBody: document.getElementById('admin-modal-body'), adminModalCloseBtn: document.getElementById('admin-modal-close-btn'),
         statTotalStudents: document.getElementById('stat-total-students'), statAvgScore: document.getElementById('stat-avg-score'), statMaxScore: document.getElementById('stat-max-score'), statMinScore: document.getElementById('stat-min-score'),
         subjectAvgChartCanvas: document.getElementById('subject-avg-chart'), scoreDistChartCanvas: document.getElementById('score-dist-chart'),
     };

     birthDatePicker = flatpickr(elements.birthDateInput, { locale: "es", dateFormat: "d/m/Y", allowInput: true, disableMobile: "true" });
     elements.birthDateInput.addEventListener('input', (e) => {
         let value = e.target.value.replace(/\D/g, '');
         if (value.length > 2) { value = value.substring(0, 2) + '/' + value.substring(2); }
         if (value.length > 5) { value = value.substring(0, 5) + '/' + value.substring(5, 9); }
         e.target.value = value;
     });

     await loadAllData();

     const savedUserType = sessionStorage.getItem(SESSION_USER_TYPE_KEY);
     const savedUserId = sessionStorage.getItem(SESSION_USER_ID_KEY);
     let restoredSession = false;
     if (savedUserType && savedUserId) {
         if (savedUserType === 'admin' && savedUserId === 'admin') {
             isAdminViewingReport = false; showAdminView(true); restoredSession = true;
         } else if (savedUserType === 'student') {
             const studentData = STUDENT_DATA_INTERNAL[savedUserId];
             if (studentData) { isAdminViewingReport = false; showIndividualReport(studentData, true); restoredSession = true; }
             else { console.warn("Estudiante en sesión no encontrado."); handleLogout(); }
         }
     }

     // Listeners Principales
     elements.loginForm?.addEventListener('submit', handleLogin);
     elements.logoutBtnReport?.addEventListener('click', handleLogout);
     elements.logoutBtnAdmin?.addEventListener('click', handleLogout);
     elements.backToAdminBtn?.addEventListener('click', handleBackToAdmin);
     elements.adminModalCloseBtn?.addEventListener('click', handleCloseModal);
     elements.adminModalBackdrop?.addEventListener('click', (e) => { if (e.target === elements.adminModalBackdrop) handleCloseModal(); });
     
     // Listeners Paginación y Filtro
     elements.adminSearchInput?.addEventListener('input', (e) => {
         currentAdminFilter = e.target.value;
         currentAdminPage = 1;
         renderAdminTable();
     });

     document.getElementById('admin-prev-page')?.addEventListener('click', () => {
         if (currentAdminPage > 1) {
             currentAdminPage--;
             renderAdminTable();
         }
     });

     document.getElementById('admin-next-page')?.addEventListener('click', () => {
         if (currentAdminPage < lastCalculatedTotalPages) {
             currentAdminPage++;
             renderAdminTable();
         }
     });


     const thead = elements.adminTable?.querySelector('thead');
     if (thead) { thead.addEventListener('click', (e) => {
         const header = e.target.closest('.sortable-header'); if (!header) return; const key = header.dataset.sortKey; if (!key) return;
         if (currentAdminSort.key === key) {
             currentAdminSort.direction = currentAdminSort.direction === 'asc' ? 'desc' : 'asc';
         } else {
             currentAdminSort.key = key;
             currentAdminSort.direction = ['nombre', 'email', 'docType', 'docNumber', 'municipio', 'birthDate'].includes(key) ? 'asc' : 'desc';
         }
         currentAdminPage = 1;
         renderAdminTable();
     }); }
     
     if (elements.adminTableBody) { elements.adminTableBody.addEventListener('click', (e) => {
         const viewButton = e.target.closest('.view-report-btn');
         if (viewButton) {
             const studentId = viewButton.dataset.studentId; const studentData = STUDENT_DATA_INTERNAL[studentId];
             if (studentData) {
                 elements.adminModalBody.innerHTML = '<p class="text-center text-gray-500 p-4">Cargando informe...</p>';
                 elements.adminModalHeader.textContent = `Informe: ${studentData.nombre}`;
                 elements.adminModalBackdrop.style.display = 'flex';
                 setTimeout(() => { elements.adminModalBackdrop.classList.add('shown'); }, 10);
                 elements.body.classList.add('overflow-hidden');

                 setTimeout(() => {
                     const reportHtml = generateReportHtml(studentData);
                     const feedbackHtml = generateDetailedFeedbackHtml(studentData.docNumber);
                     elements.adminModalBody.innerHTML = `
                         <div class="global-score-container" style="margin-bottom: 1.5rem;">
                             <p class="text-xs font-semibold uppercase opacity-80 mb-1">Puntaje Global</p>
                             <p class="text-4xl font-extrabold">${studentData.puntajeGlobal || 0}<span class="text-2xl font-medium opacity-70">/500</span></p>
                         </div>
                         ${reportHtml}
                         ${feedbackHtml}
                     `;
                     addToggleListeners('#admin-modal-body');
                 }, 100);
             }
         }
     }); }
     
     if (!restoredSession) {
         elements.loginScreen.classList.remove('hidden');
     }

});

