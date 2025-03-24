const logger = require("../utils/logger");
const CampaignService = require("../services/CampaignService");
const RateLimiterService = require("../services/RateLimiterService");

class CampaignManager {
  constructor(whatsappInstance) {
    this.activeInstance = whatsappInstance;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 segundos
  }

  async switchInstance() {
    logger.info("Tentando trocar de instância");
    // Por enquanto temos apenas uma instância
    throw new Error("Nenhuma instância disponível");
  }

  async validateContact(contact) {
    // Validação básica do número de telefone
    if (!contact.phone.match(/^\d+$/)) {
      throw new Error(`Número de telefone inválido: ${contact.phone}`);
    }
    return true;
  }

  async sendCampaign(campaign) {
    logger.info("Iniciando envio de campanha", {
      campaignId: campaign.id,
      totalMessages: campaign.messages.length,
    });

    for (const message of campaign.messages) {
      let attempts = 0;
      let success = false;

      while (attempts < this.retryAttempts && !success) {
        try {
          await this.validateContact(message);
          await this.activeInstance.sendMessage(message.phone, message.text);
          success = true;
          logger.info("Mensagem enviada com sucesso", {
            phone: message.phone,
          });
        } catch (error) {
          attempts++;
          logger.warn("Falha no envio de mensagem", {
            phone: message.phone,
            attempt: attempts,
            error: error.message,
          });

          if (attempts >= this.retryAttempts) {
            logger.error("Todas as tentativas falharam", {
              phone: message.phone,
            });
          } else {
            await new Promise((resolve) =>
              setTimeout(resolve, this.retryDelay)
            );
          }
        }
      }
    }
  }

  async createAndStartCampaign(name, messageTemplate, contacts) {
    try {
      const campaign = await CampaignService.createCampaign(
        name,
        messageTemplate,
        contacts
      );

      logger.info("Iniciando campanha", { campaignId: campaign._id });

      return this.sendCampaign(campaign);
    } catch (error) {
      logger.error("Erro ao criar e iniciar campanha", { error });
      throw error;
    }
  }
}

module.exports = CampaignManager;
