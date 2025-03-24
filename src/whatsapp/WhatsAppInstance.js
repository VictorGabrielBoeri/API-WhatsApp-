const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const logger = require("../utils/logger");
const MonitoringService = require("../services/MonitoringService");

class WhatsAppInstance {
  constructor(instanceId) {
    this.instanceId = instanceId;
    this.isReady = false;
    this.messageQueue = [];

    this.client = new Client({
      authStrategy: new LocalAuth({ clientId: instanceId }),
      puppeteer: {
        args: ["--no-sandbox"],
      },
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on("qr", (qr) => {
      logger.info("QR Code recebido, escaneie para conectar");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("ready", () => {
      this.isReady = true;
      logger.info("Cliente WhatsApp está pronto!", {
        instanceId: this.instanceId,
      });
    });

    this.client.on("disconnected", () => {
      this.isReady = false;
      logger.warn("Cliente WhatsApp desconectado", {
        instanceId: this.instanceId,
      });
    });
  }

  async initialize() {
    try {
      logger.info("Inicializando cliente WhatsApp", {
        instanceId: this.instanceId,
      });
      await this.client.initialize();
    } catch (error) {
      logger.error("Erro ao inicializar cliente WhatsApp", {
        instanceId: this.instanceId,
        error: error.message,
      });
      throw error;
    }
  }

  async sendMessage(to, message) {
    try {
      if (!this.isReady) {
        throw new Error("Cliente WhatsApp não está pronto");
      }

      await this.client.sendMessage(to, message);
      logger.info("Mensagem enviada com sucesso", {
        instanceId: this.instanceId,
        to,
      });
    } catch (error) {
      logger.error("Erro ao enviar mensagem", {
        instanceId: this.instanceId,
        to,
        error: error.message,
      });
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.client.destroy();
      logger.info("Cliente WhatsApp desconectado com sucesso", {
        instanceId: this.instanceId,
      });
    } catch (error) {
      logger.error("Erro ao desconectar cliente WhatsApp", {
        instanceId: this.instanceId,
        error: error.message,
      });
    }
  }
}

module.exports = WhatsAppInstance;
