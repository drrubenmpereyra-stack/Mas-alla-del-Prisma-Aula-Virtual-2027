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
                sessionStorage.setItem("current_session", JSON.stringify(userData));
                loadDashboard(userData);
                return;
            }
        }

        // 2. Si no está directo, buscar en la colección "participantes" por Apellido y Código de Matrícula
        const participantesRef = collection(db, "participantes");
        const querySnapshot = await getDocs(participantesRef);
        let estudianteEncontrado = null;

        querySnapshot.forEach((docSnap) => {
            const p = docSnap.data();
            // Compara el apellido (sin distinguir mayúsculas) y la contraseña con el código de matrícula
            if (p.apellido && p.apellido.trim().toLowerCase() === uInput.toLowerCase() && p.codigoMatricula === pInput) {
                estudianteEncontrado = {
                    user: p.codigoMatricula,
                    role: "student",
                    name: `${p.apellido}, ${p.nombres}`
                };
            }
        });

        if (estudianteEncontrado) {
            sessionStorage.setItem("current_session", JSON.stringify(estudianteEncontrado));
            loadDashboard(estudianteEncontrado);
        } else {
            errorMsg.style.display = "block";
        }

    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        errorMsg.innerText = "Error de conexión con la base de datos.";
        errorMsg.style.display = "block";
    }
});

// Cargar panel correspondiente según el rol
function loadDashboard(userObj) {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("app-container").style.display = "flex";
    document.getElementById("userDisplay").innerText = userObj.name;

    buildMenu(userObj.role);
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

        // Control por clic directo (toggle persistente) para evitar que desaparezca
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

// Mantener sesión activa al recargar
window.onload = function() {
    const activeSession = sessionStorage.getItem("current_session");
    if (activeSession) {
        loadDashboard(JSON.parse(activeSession));
    }
};
