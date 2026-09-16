// Manejo del formulario de Login conectado a Firestore (Actualizado para Apellido y Código de Matrícula)
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();
    const uInput = document.getElementById("usuario").value.trim();
    const pInput = document.getElementById("contrasena").value.trim();
    const errorMsg = document.getElementById("errorMsg");

    try {
        // 1. Verificación directa en la colección "usuarios" (ej: Admin o códigos directos)
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

        // 2. Si no está directo, buscamos en la colección "participantes" por Apellido y Código de Matrícula
        const participantesRef = collection(db, "participantes");
        const querySnapshot = await getDocs(participantesRef);
        let estudianteEncontrado = null;

        querySnapshot.forEach((docSnap) => {
            const p = docSnap.data();
            // Comparamos el input del usuario con el Apellido (ignorando mayúsculas/minúsculas para mayor comodidad)
            // y la contraseña con el Código de Matrícula
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
