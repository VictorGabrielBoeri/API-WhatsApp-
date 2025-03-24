require("dotenv").config();
const WhatsAppInstance = require("./whatsapp/WhatsAppInstance");
const CampaignManager = require("./campaign/CampaignManager");
const logger = require("./utils/logger");

async function main() {
  try {
    logger.info("Iniciando aplicação WhatsApp API");

    // Criar instância do WhatsApp
    const whatsappInstance = new WhatsAppInstance("instance-1");

    // Criar gerenciador de campanhas
    const campaignManager = new CampaignManager(whatsappInstance);

    // Inicializar WhatsApp
    await whatsappInstance.initialize();

    logger.info("Aplicação iniciada com sucesso");

    // Manter a aplicação rodando
    process.on("SIGINT", async () => {
      logger.info("Encerrando aplicação...");
      await whatsappInstance.disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Erro fatal na aplicação:", error);
    process.exit(1);
  }
}

main();
