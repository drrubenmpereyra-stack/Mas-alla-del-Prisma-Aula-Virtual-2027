// Importar los módulos necesarios de Firebase desde los CDN oficiales
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración de Firebase proporcionada
const firebaseConfig = {
    apiKey: "AIzaSyDLSIGdkd2y1l7zhMjoVd_bmCj8jjXpX4I",
    authDomain: "aula-virtual-mas-alla-del-pris.firebaseapp.com",
    projectId: "aula-virtual-mas-alla-del-pris",
    storageBucket: "aula-virtual-mas-alla-del-pris.firebasestorage.app",
    messagingSenderId: "711745866832",
    appId: "1:711745866832:web:945e046cb0b61ac320d555"
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enlace raw oficial del video intro en GitHub
const VIDEO_INTRO_URL = "https://github.com/drrubenmpereyra-stack/video-intro-Ms-alla-del-prisma/raw/refs/heads/main/Intro_masalladelprisma.mp4";

// Foto del Administrador en GitHub con el nombre exacto: foto_adm.jpg
const ADMIN_GITHUB_PHOTO = "https://raw.githubusercontent.com/drrubenmpereyra-stack/video-intro-Ms-alla-del-prisma/main/foto_adm.jpg";

// Función para inicializar usuarios base (Administrador y Estudiante de prueba por defecto)
async function inicializarUsuariosBase() {
    try {
        const adminRef = doc(db, "usuarios", "DRPEREYRA");
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
            await setDoc(adminRef, {
                user: "DRPEREYRA",
                pass: "235689",
                role: "admin",
                name: "Dr. Rubén M. Pereyra (Admin)"
            });
        }

        const studentRef = doc(db, "usuarios", "E");
        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
            await setDoc(studentRef, {
                user: "E",
                pass: "1",
                role: "student",
                name: "Estudiante de Prueba"
            });
        }
    } catch (error) {
        console.error("Error al inicializar datos en Firestore:", error);
    }
}

// Ejecutar inicialización al cargar
inicializarUsuariosBase();

// Manejo del formulario de Login (Permite Admin y Estudiantes por Apellido + Código de Matrícula)
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const uInput = document.getElementById("usuario").value.trim();
    const pInput = document.getElementById("contrasena").value.trim();
    const errorMsg = document.getElementById("errorMsg");

    try {
        // 1. Verificar si es Administrador u otro usuario directo en la colección "usuarios"
        const userDocRef = doc(db, "usuarios", uInput);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            if (userData.pass === pInput) {
                iniciarSecuenciaAcceso(userData);
                return;
            }
        }

        // 2. Si no está directo, buscar en la colección "participantes" por Apellido y Código de Matrícula
        const participantesRef = collection(db, "participantes");
        const querySnapshot = await getDocs(participantesRef);
        let estudianteEncontrado = null;

        querySnapshot.forEach((docSnap) => {
            const p = docSnap.data();
            if (p.apellido && p.apellido.trim().toLowerCase() === uInput.toLowerCase() && p.codigoMatricula === pInput) {
                estudianteEncontrado = {
                    user: p.codigoMatricula,
                    role: "student",
                    name: `${p.apellido}, ${p.nombres}`,
                    fotoDrive: p.fotoDrive || "" // Usando exactamente el campo fotoDrive de tu esquema
                };
            }
        });

        if (estudianteEncontrado) {
            iniciarSecuenciaAcceso(estudianteEncontrado);
        } else {
            errorMsg.style.display = "block";
        }

    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        errorMsg.innerText = "Error de conexión con la base de datos.";
        errorMsg.style.display = "block";
    }
});

// Secuencia de Acceso: Muestra la intro de video antes de cargar el dashboard
function iniciarSecuenciaAcceso(userObj) {
    sessionStorage.setItem("current_session", JSON.stringify(userObj));
    document.getElementById("login-container").style.display = "none";

    let introContainer = document.getElementById("intro-video-container");
    if (!introContainer) {
        introContainer = document.createElement("div");
        introContainer.id = "intro-video-container";
        introContainer.style.cssText = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:#000;z-index:9999;display:flex;flex-direction:column;justify-content:center;align-items:center;";
        
        introContainer.innerHTML = `
            <video id="introVideo" src="${VIDEO_INTRO_URL}" autoplay playsinline style="max-width:100%; max-height:85vh; outline:none;"></video>
            <button id="skipIntroBtn" style="margin-top:15px; background:#880e4f; color:#fff; border:2px solid #fff; padding:8px 20px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.95rem;">Saltar Introducción ⏭</button>
        `;
        document.body.appendChild(introContainer);
    } else {
        introContainer.style.display = "flex";
    }

    const videoElement = document.getElementById("introVideo");
    videoElement.currentTime = 0;
    videoElement.play().catch(e => console.log("Interacción requerida para reproducción automática:", e));

    const finalizarIntro = () => {
        introContainer.style.display = "none";
        loadDashboard(userObj);
    };

    videoElement.onended = finalizarIntro;
    document.getElementById("skipIntroBtn").onclick = finalizarIntro;
}

// Cargar panel correspondiente según el rol
function loadDashboard(userObj) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").style.display = "flex";
    
    renderizarPerfilYBienvenida(userObj);
    buildMenu(userObj.role);
}

// Renderizar foto real y animación vectorial de bienvenida
function renderizarPerfilYBienvenida(userObj) {
    let userDisplay = document.getElementById("userDisplay");
    if (!userDisplay) return;

    let fotoUrl = "";
    if (userObj.role === "admin") {
        fotoUrl = ADMIN_GITHUB_PHOTO;
    } else if (userObj.fotoDrive && userObj.fotoDrive.trim() !== "") {
        fotoUrl = userObj.fotoDrive.trim();
        // Procesar enlace de Google Drive si viene en formato compartido
        if (fotoUrl.includes("drive.google.com") && fotoUrl.includes("id=")) {
            const fileId = fotoUrl.split("id=")[1].split("&")[0];
            fotoUrl = `https://lh3.googleusercontent.com/d/` + fileId;
        } else if (fotoUrl.includes("drive.google.com/file/d/")) {
            const fileId = fotoUrl.split("/file/d/")[1].split("/")[0];
            fotoUrl = `https://lh3.googleusercontent.com/d/` + fileId;
        }
    }

    userDisplay.style.display = "flex";
    userDisplay.style.alignItems = "center";
    userDisplay.style.gap = "12px";

    let htmlContent = "";
    // Solo si la URL de la foto existe y no está vacía se incluye la etiqueta img
    if (fotoUrl) {
        htmlContent = `
            <img src="${fotoUrl}" alt="Perfil" style="width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid #b7950b; background:#ffffff; flex-shrink:0;" onerror="this.style.display='none'">
        `;
    }

    htmlContent += `
        <div style="display:flex; flex-direction:column; text-align:left; line-height: 1.2;">
            <span style="font-size:0.68rem; color:#880e4f; font-weight:700; text-transform:uppercase; letter-spacing:1px;">Bienvenido/a</span>
            <div class="vector-typing-text" style="font-size:1.05rem; font-weight:800; color:#1a252f; font-family:'Georgia', serif; overflow:hidden; white-space:nowrap; border-right:2px solid #880e4f; animation: typing 2.5s steps(35, end), blink-caret 0.75s step-end infinite;">
                ${userObj.name}
            </div>
        </div>
    `;

    userDisplay.innerHTML = htmlContent;

    if (!document.getElementById("vectorAnimStyles")) {
        const styleTag = document.createElement("style");
        styleTag.id = "vectorAnimStyles";
        styleTag.innerHTML = `
            @keyframes typing {
                from { width: 0 }
                to { width: 100% }
            }
            @keyframes blink-caret {
                from, to { border-color: transparent }
                50% { border-color: #880e4f; }
            }
        `;
        document.head.appendChild(styleTag);
    }
}

// Construir menús según la jerarquía solicitada
function buildMenu(role) {
    const navMenu = document.getElementById("navMenu");
    navMenu.innerHTML = "";

    if (role === "admin") {
        const adminButtons = [
            { text: "1 Encuentros", class: "btn-pastel-1", action: () => loadModule("encuentros.html") },
            { text: "2 Talleres", class: "btn-pastel-2", action: () => loadModule("talleres.html") },
            { text: "3 Biblioteca de medios", class: "btn-pastel-3", action: () => loadModule("biblioteca.html") },
            { text: "4 Participantes", class: "btn-pastel-4", action: () => loadModule("participantes.html") },
            { text: "5 Pagos", class: "btn-pastel-5", action: () => loadModule("pagos.html") },
            { text: "6 Asistencia", class: "btn-pastel-6", action: () => loadModule("asistencia.html") },
            { text: "7 Calificaciones", class: "btn-pastel-7", action: () => loadModule("calificaciones.html") },
            { 
                isDropdown: true, text: "8 Analíticos", class: "btn-pastel-8", 
                subItems: [
                    { text: "8.1 Formularios analíticos", action: () => loadModule("analiticos_formularios.html") },
                    { text: "8.2 Visado analíticos", action: () => loadModule("analiticos_visado.html") }
                ]
            },
            { 
                isDropdown: true, text: "9 Diplomas", class: "btn-pastel-9", 
                subItems: [
                    { text: "9.1 Emitir Diploma", action: () => loadModule("diplomas_emitir.html") },
                    { text: "9.2 Central de Diplomas", action: () => loadModule("diplomas_central.html") }
                ]
            },
            { 
                isDropdown: true, text: "10 Auditorias Evaluaciones", class: "btn-pastel-10", 
                subItems: [
                    { text: "10.1 Auditoria Test", action: () => loadModule("auditoria_test.html") },
                    { text: "10.2 Auditoria Taller", action: () => loadModule("auditoria_taller.html") }
                ]
            },
            { text: "11 Ejercicios y aplicaciones", class: "btn-pastel-11", action: () => loadModule("ejercicios.html") }
        ];

        adminButtons.forEach(btn => createButtonElement(btn, navMenu));

    } else if (role === "student") {
        const studentButtons = [
            { text: "1 Encuentros", class: "btn-pastel-1", action: () => loadModule("estudiante_encuentros.html") },
            { text: "2 Talleres", class: "btn-pastel-2", action: () => loadModule("estudiante_talleres.html") },
            { text: "3 Biblioteca de Medios", class: "btn-pastel-3", action: () => loadModule("estudiante_biblioteca.html") },
            { 
                isDropdown: true, text: "4 Mis evaluaciones", class: "btn-pastel-4", 
                subItems: [
                    { text: "4.1 Mis test", action: () => loadModule("mis_test.html") },
                    { text: "4.2 Mis Talleres", action: () => loadModule("mis_talleres.html") }
                ]
            },
            { text: "5 Mi asistencia", class: "btn-pastel-5", action: () => loadModule("estudiante_asistencia.html") },
            { text: "6 Mis pagos", class: "btn-pastel-6", action: () => loadModule("estudiante_pagos.html") },
            { text: "7 Mi analítico", class: "btn-pastel-7", action: () => loadModule("estudiante_analitico.html") },
            { text: "8 Mi diploma", class: "btn-pastel-8", action: () => loadModule("estudiante_diploma.html") },
            { text: "9 Mis calificaciones", class: "btn-pastel-9", action: () => loadModule("estudiante_calificaciones.html") },
            { text: "10 Mis ejercicios", class: "btn-pastel-10", action: () => loadModule("estudiante_ejercicios.html") }
        ];

        studentButtons.forEach(btn => createButtonElement(btn, navMenu));
    }

    // Botón Salir común
    const btnSalir = document.createElement("button");
    btnSalir.className = "nav-btn btn-exit";
    btnSalir.innerText = "Salir";
    btnSalir.onclick = logout;
    navMenu.appendChild(btnSalir);
}

// Renderizar botones o menús desplegables
function createButtonElement(data, parentContainer) {
    if (data.isDropdown) {
        const container = document.createElement("div");
        container.className = "dropdown-container";

        const mainBtn = document.createElement("button");
        mainBtn.className = `nav-btn ${data.class}`;
        mainBtn.innerText = data.text + " ▼";
        
        const dropdown = document.createElement("div");
        dropdown.className = "dropdown-content";

        mainBtn.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll(".dropdown-content.show").forEach(el => {
                if (el !== dropdown) el.classList.remove("show");
            });
            dropdown.classList.toggle("show");
        };

        data.subItems.forEach(sub => {
            const subBtn = document.createElement("button");
            subBtn.innerText = sub.text;
            subBtn.onclick = (e) => {
                e.stopPropagation();
                sub.action();
                dropdown.classList.remove("show");
            };
            dropdown.appendChild(subBtn);
        });

        window.addEventListener("click", () => {
            dropdown.classList.remove("show");
        });

        container.appendChild(mainBtn);
        container.appendChild(dropdown);
        parentContainer.appendChild(container);
    } else {
        const btn = document.createElement("button");
        btn.className = `nav-btn ${data.class}`;
        btn.innerText = data.text;
        btn.onclick = data.action;
        parentContainer.appendChild(btn);
    }
}

// Cargar submódulos en el iframe
function loadModule(pageUrl) {
    const iframe = document.getElementById("contentFrame");
    iframe.src = pageUrl;
}

// Cerrar sesión
function logout() {
    sessionStorage.removeItem("current_session");
    location.reload();
}

// Mantener sesión activa al recargar (si ya pasó la intro previamente en la sesión)
window.onload = function() {
    const activeSession = sessionStorage.getItem("current_session");
    if (activeSession) {
        loadDashboard(JSON.parse(activeSession));
    }
};
