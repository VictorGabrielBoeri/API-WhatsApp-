const Bottleneck = require("bottleneck");
const logger = require("../utils/logger");

class RateLimiterService {
  constructor() {
    // Limiter para mensagens individuais
    this.messageLimiter = new Bottleneck({
      minTime: 1000, // 1 segundo entre mensagens
      maxConcurrent: 1, // Enviar uma mensagem por vez
    });

    // Limiter para sessões diárias
    this.dailyLimiter = new Bottleneck({
      reservoir: 1000, // Limite diário de mensagens
      reservoirRefreshAmount: 1000,
      reservoirRefreshInterval: 24 * 60 * 60 * 1000, // 24 horas
    });

    // Limiter para cada número
    this.phoneNumberLimiters = new Map();

    this.setupEvents();
  }

  setupEvents() {
    this.messageLimiter.on("failed", async (error, jobInfo) => {
      logger.warn("Rate limit atingido", {
        error: error.message,
        jobInfo,
      });
    });

    this.messageLimiter.on("retry", (error, jobInfo) => {
      logger.info("Tentando novamente após rate limit", {
        attempt: jobInfo.retryCount,
      });
    });
  }

  getPhoneNumberLimiter(phoneNumber) {
    if (!this.phoneNumberLimiters.has(phoneNumber)) {
      // Limite de 10 mensagens por número em 24 horas
      const limiter = new Bottleneck({
        reservoir: 10,
        reservoirRefreshAmount: 10,
        reservoirRefreshInterval: 24 * 60 * 60 * 1000,
        minTime: 3000, // 3 segundos entre mensagens para o mesmo número
      });

      this.phoneNumberLimiters.set(phoneNumber, limiter);
    }

    return this.phoneNumberLimiters.get(phoneNumber);
  }

  async scheduleMessage(phoneNumber, callback) {
    try {
      // Verifica o limite diário primeiro
      await this.dailyLimiter.schedule(async () => {
        // Então verifica o limite por número
        const phoneLimiter = this.getPhoneNumberLimiter(phoneNumber);
        await phoneLimiter.schedule(async () => {
          // Por fim, aplica o limite geral de mensagens
          await this.messageLimiter.schedule(callback);
        });
      });
    } catch (error) {
      logger.error("Erro no rate limiting", {
        phoneNumber,
        error: error.message,
      });
      throw error;
    }
  }

  async getRateLimitStatus(phoneNumber) {
    const phoneLimiter = this.getPhoneNumberLimiter(phoneNumber);

    return {
      dailyRemaining: await this.dailyLimiter.currentReservoir(),
      phoneRemaining: await phoneLimiter.currentReservoir(),
      isThrottled:
        this.messageLimiter.running >= this.messageLimiter.maxConcurrent,
    };
  }
}

module.exports = new RateLimiterService();
