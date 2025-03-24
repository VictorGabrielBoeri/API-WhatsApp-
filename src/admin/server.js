const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const WhatsAppInstance = require("../whatsapp/WhatsAppInstance");
const logger = require("../utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações do Express
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração da sessão
app.use(
  session({
    secret: "whatsapp-api-secret",
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  if (req.session.authenticated) {
    next();
  } else {
    res.redirect("/login");
  }
};

// Rotas
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  if (req.body.username === "admin" && req.body.password === "admin") {
    req.session.authenticated = true;
    res.redirect("/dashboard");
  } else {
    res.render("login", { error: "Credenciais inválidas" });
  }
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard", {
    whatsappStatus: global.whatsappInstance?.isReady
      ? "Conectado"
      : "Desconectado",
  });
});

// Rota para enviar mensagem
app.post("/send-message", async (req, res) => {
  try {
    logger.info("Recebendo requisição para enviar mensagem:", req.body);

    if (!global.whatsappInstance?.isReady) {
      throw new Error("WhatsApp não está conectado");
    }

    const { number, message } = req.body;
    const chat = `${number}@c.us`;

    // Enviar mensagem de texto
    await global.whatsappInstance.client.sendMessage(chat, message);

    logger.info("Mensagem enviada com sucesso para:", chat);
    res.json({ success: true });
  } catch (error) {
    logger.error("Erro ao enviar mensagem:", error);
    res.json({ success: false, error: error.message });
  }
});

// Inicializar WhatsApp
async function initializeWhatsApp() {
  try {
    global.whatsappInstance = new WhatsAppInstance("admin-panel");
    await global.whatsappInstance.initialize();
  } catch (error) {
    logger.error("Erro ao inicializar WhatsApp:", error);
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
  initializeWhatsApp();
});
