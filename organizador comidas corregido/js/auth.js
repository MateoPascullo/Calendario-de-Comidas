<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
  import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } 
    from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
  import { getFirestore, doc, setDoc, getDoc } 
    from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

  // 🔹 Configuración de Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyBgyXUiZPdYlWQBclhhH70mfRuIXIuw2EE",
    authDomain: "plato-resuelto.firebaseapp.com",
    projectId: "plato-resuelto",
    storageBucket: "plato-resuelto.firebasestorage.app",
    messagingSenderId: "11080746612",
    appId: "1:11080746612:web:22f488078f01def94ff321",
    measurementId: "G-16RQJ5KB0H"
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  const db = getFirestore(app);

  // 🔹 Elementos del DOM
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const status = document.getElementById("status");
  const contenido = document.getElementById("contenido");
  const calendarioBody = document.getElementById("calendario-body");

  // ---------- FUNCIONES FIRESTORE ----------
  async function guardarCalendario(user) {
    const calendario = calendarioBody.innerHTML; // Guardamos la tabla como HTML
    await setDoc(doc(db, "calendarios", user.uid), {
      calendario: calendario
    });
    console.log("Calendario guardado en Firestore ✅");
  }

  async function cargarCalendario(user) {
    const docSnap = await getDoc(doc(db, "calendarios", user.uid));
    if (docSnap.exists()) {
      calendarioBody.innerHTML = docSnap.data().calendario;
      console.log("Calendario cargado de Firestore ✅");
    } else {
      console.log("No había calendario guardado todavía.");
    }
  }

  // ---------- LOGIN / LOGOUT ----------
  loginBtn.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Usuario logueado:", result.user.email);
    } catch (error) {
      console.error("Error en login:", error);
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
  });

  // ---------- DETECTAR SESIÓN ----------
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      status.textContent = `Hola, ${user.displayName}`;
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
      contenido.style.display = "block";

      // 🔹 Cargar calendario del usuario
      await cargarCalendario(user);

      // 🔹 Guardar cada vez que cambie
      document.addEventListener("change", () => guardarCalendario(user));
      document.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") {
          guardarCalendario(user);
        }
      });

    } else {
      status.textContent = "No logueado";
      loginBtn.style.display = "inline-block";
      logoutBtn.style.display = "none";
      contenido.style.display = "none";
    }
  });
</script>


