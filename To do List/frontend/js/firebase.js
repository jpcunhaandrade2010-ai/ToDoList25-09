
// Importa as funções necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

// Configurações do nosso projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCoS3AlDfiCKUmlKjcFwli4Mw-sBgmOe_4",
  authDomain: "to-do-list-d1c92.firebaseapp.com",
  projectId: "to-do-list-d1c92",
  storageBucket: "to-do-list-d1c92.firebasestorage.app",
  messagingSenderId: "1087820598664",
  appId: "1:1087820598664:web:fbd6b70021f07445ab7e3d"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços
const auth = getAuth(app);
const db = getFirestore(app);

// Disponibiliza os serviços para outros arquivos
export { app, auth, db };
