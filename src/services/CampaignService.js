const Campaign = require("../models/Campaign");
const logger = require("../utils/logger");

class CampaignService {
  async createCampaign(name, messageTemplate, contacts) {
    try {
      const messages = contacts.map((contact) => ({
        phone: contact.phone,
        variables: contact.variables,
        status: "pending",
      }));

      const campaign = new Campaign({
        name,
        messageTemplate,
        messages,
        status: "draft",
        statistics: {
          totalMessages: contacts.length,
          successfulMessages: 0,
          failedMessages: 0,
          successRate: 0,
        },
      });

      await campaign.save();
      logger.info("Campanha criada com sucesso", { campaignId: campaign._id });
      return campaign;
    } catch (error) {
      logger.error("Erro ao criar campanha", { error });
      throw error;
    }
  }

  async updateMessageStatus(campaignId, phone, status, error = null) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error("Campanha não encontrada");
      }

      const message = campaign.messages.find((m) => m.phone === phone);
      if (message) {
        message.status = status;
        message.error = error;
        message.attempts += 1;
        if (status === "sent") {
          message.sentAt = new Date();
        }

        await this.updateCampaignStatistics(campaign);
        await campaign.save();
      }
    } catch (error) {
      logger.error("Erro ao atualizar status da mensagem", {
        campaignId,
        phone,
        error,
      });
      throw error;
    }
  }

  async updateCampaignStatistics(campaign) {
    const totalMessages = campaign.messages.length;
    const successfulMessages = campaign.messages.filter(
      (m) => m.status === "sent"
    ).length;
    const failedMessages = campaign.messages.filter(
      (m) => m.status === "failed"
    ).length;
    const successRate = (successfulMessages / totalMessages) * 100;

    campaign.statistics = {
      totalMessages,
      successfulMessages,
      failedMessages,
      successRate,
    };

    if (successfulMessages + failedMessages === totalMessages) {
      campaign.status = "completed";
      campaign.completedAt = new Date();
    }
  }

  async getCampaignStatus(campaignId) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error("Campanha não encontrada");
      }
      return {
        status: campaign.status,
        statistics: campaign.statistics,
      };
    } catch (error) {
      logger.error("Erro ao buscar status da campanha", { campaignId, error });
      throw error;
    }
  }

  async getPendingMessages(campaignId) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error("Campanha não encontrada");
      }
      return campaign.messages.filter((m) => m.status === "pending");
    } catch (error) {
      logger.error("Erro ao buscar mensagens pendentes", { campaignId, error });
      throw error;
    }
  }
}

module.exports = new CampaignService();
