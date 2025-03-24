const logger = require("../utils/logger");

class AlertService {
  constructor() {
    this.handlers = new Map();
    this.setupDefaultHandlers();
  }

  setupDefaultHandlers() {
    this.registerHandler("high_failure_rate", async (alert) => {
      logger.error("Alta taxa de falhas detectada", {
        instanceId: alert.instanceId,
        failureRate: alert.data.current,
        threshold: alert.data.threshold,
      });
      // Aqui você pode adicionar integração com sistemas externos
      // como Slack, Email, SMS, etc.
    });

    this.registerHandler("queue_overflow", async (alert) => {
      logger.error("Fila de mensagens muito grande", {
        instanceId: alert.instanceId,
        queueSize: alert.data.current,
        threshold: alert.data.threshold,
      });
    });

    this.registerHandler("instance:disconnected", async (data) => {
      logger.error("Instância desconectada", {
        instanceId: data.instanceId,
      });
    });
  }

  registerHandler(alertType, handler) {
    this.handlers.set(alertType, handler);
  }

  async handleAlert(alert) {
    const handler = this.handlers.get(alert.type);
    if (handler) {
      try {
        await handler(alert);
      } catch (error) {
        logger.error("Erro ao processar alerta", {
          alertType: alert.type,
          error: error.message,
        });
      }
    }
  }
}

module.exports = new AlertService();
