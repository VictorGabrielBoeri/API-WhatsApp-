const cron = require("node-cron");
const EventEmitter = require("events");
const logger = require("../utils/logger");

class MonitoringService extends EventEmitter {
  constructor() {
    super();
    this.instances = new Map();
    this.metrics = new Map();
    this.healthChecks = new Map();
    this.alertThresholds = {
      messageFailureRate: 0.2, // 20% de falha
      responseTime: 5000, // 5 segundos
      queueSize: 100, // mensagens na fila
    };
  }

  registerInstance(instance) {
    this.instances.set(instance.instanceId, {
      instance,
      status: "registered",
      lastCheck: Date.now(),
      metrics: {
        messagesSent: 0,
        messagesFailed: 0,
        avgResponseTime: 0,
        queueSize: 0,
        uptime: 0,
        lastReconnect: null,
      },
    });

    // Monitorar eventos da instância
    instance.client.on("disconnected", () => {
      this.updateInstanceStatus(instance.instanceId, "disconnected");
    });

    instance.client.on("ready", () => {
      this.updateInstanceStatus(instance.instanceId, "connected");
    });

    // Agendar verificações de saúde
    this.healthChecks.set(
      instance.instanceId,
      cron.schedule("*/1 * * * *", () => {
        this.checkInstanceHealth(instance.instanceId);
      })
    );

    logger.info(`Instância registrada para monitoramento`, {
      instanceId: instance.instanceId,
    });
  }

  updateInstanceStatus(instanceId, status) {
    const instanceData = this.instances.get(instanceId);
    if (instanceData) {
      instanceData.status = status;
      instanceData.lastCheck = Date.now();

      logger.info(`Status da instância atualizado`, {
        instanceId,
        status,
      });

      this.emit("status_change", {
        instanceId,
        status,
        timestamp: Date.now(),
      });
    }
  }

  async checkInstanceHealth(instanceId) {
    const instanceData = this.instances.get(instanceId);
    if (!instanceData) return;

    const metrics = this.metrics.get(instanceId) || {
      messagesSent: 0,
      messagesFailed: 0,
      startTime: Date.now(),
    };

    const health = {
      status: instanceData.instance.isReady ? "healthy" : "unhealthy",
      uptime: Date.now() - metrics.startTime,
      queueSize: instanceData.instance.messageQueue.length,
      failureRate:
        metrics.messagesSent > 0
          ? metrics.messagesFailed / metrics.messagesSent
          : 0,
    };

    // Verificar limites e emitir alertas
    this.checkThresholds(instanceId, health);

    // Atualizar métricas
    this.metrics.set(instanceId, {
      ...metrics,
      lastCheck: Date.now(),
      health,
    });

    logger.info("Status de saúde da instância", {
      instanceId,
      health,
    });

    return health;
  }

  checkThresholds(instanceId, health) {
    if (health.failureRate > this.alertThresholds.messageFailureRate) {
      this.emitAlert(instanceId, "high_failure_rate", {
        current: health.failureRate,
        threshold: this.alertThresholds.messageFailureRate,
      });
    }

    if (health.queueSize > this.alertThresholds.queueSize) {
      this.emitAlert(instanceId, "queue_overflow", {
        current: health.queueSize,
        threshold: this.alertThresholds.queueSize,
      });
    }
  }

  emitAlert(instanceId, type, data) {
    const alert = {
      instanceId,
      type,
      data,
      timestamp: Date.now(),
    };

    this.emit("alert", alert);
    logger.warn("Alerta de monitoramento", alert);
  }

  updateMetrics(instanceId, metrics) {
    const instanceData = this.instances.get(instanceId);
    if (instanceData) {
      Object.assign(instanceData.metrics, metrics);
      this.emit("metrics", instanceId, instanceData.metrics);
    }
  }

  getInstanceStatus(instanceId) {
    return this.instances.get(instanceId)?.status || "unknown";
  }

  getAllInstances() {
    const instances = {};
    for (const [id, data] of this.instances) {
      instances[id] = {
        status: data.status,
        metrics: data.metrics,
        lastCheck: data.lastCheck,
      };
    }
    return instances;
  }

  async generateReport() {
    const report = {
      timestamp: Date.now(),
      instances: {},
      overall: {
        totalInstances: this.instances.size,
        activeInstances: 0,
        totalMessagesSent: 0,
        totalMessagesFailed: 0,
      },
    };

    for (const [instanceId, instanceData] of this.instances) {
      const metrics = this.metrics.get(instanceId);
      const health = await this.checkInstanceHealth(instanceId);

      report.instances[instanceId] = {
        status: instanceData.status,
        health,
        metrics,
      };

      if (instanceData.status === "connected") {
        report.overall.activeInstances++;
      }
      report.overall.totalMessagesSent += metrics?.messagesSent || 0;
      report.overall.totalMessagesFailed += metrics?.messagesFailed || 0;
    }

    logger.info("Relatório de monitoramento gerado", report);
    return report;
  }

  stop() {
    for (const healthCheck of this.healthChecks.values()) {
      healthCheck.stop();
    }
    this.healthChecks.clear();
    this.removeAllListeners();
  }
}

module.exports = new MonitoringService();
