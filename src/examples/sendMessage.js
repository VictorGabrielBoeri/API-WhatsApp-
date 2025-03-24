const WhatsAppInstance = require("../whatsapp/WhatsAppInstance");
const qrcode = require("qrcode-terminal");
const logger = require("../utils/logger");

async function sendLinkMessage() {
  try {
    logger.info("Iniciando WhatsApp...");

    const whatsapp = new WhatsAppInstance("instance-1");

    whatsapp.client.on("ready", async () => {
      logger.info("WhatsApp conectado! Enviando mensagem com link...");

      try {
        const phoneNumber = "5511966151192";

        // Criar mensagem com link
        const message = `
🔗 *Teste de Link*

Acesse o Google através deste link:
https://www.google.com

_Enviado via API_`;

        // Enviar mensagem
        await whatsapp.client.sendMessage(`${phoneNumber}@c.us`, message);
        logger.info("Mensagem com link enviada!");

        // Aguardar 5 segundos e encerrar
        setTimeout(() => {
          logger.info("Processo finalizado");
          process.exit(0);
        }, 5000);
      } catch (error) {
        logger.error("Erro ao enviar mensagem:", error);
        process.exit(1);
      }
    });

    // Mostrar QR Code se necessário
    whatsapp.client.on("qr", (qr) => {
      logger.info("Escaneie o QR Code:");
      qrcode.generate(qr, { small: true });
    });

    await whatsapp.initialize();
  } catch (error) {
    logger.error("Erro na inicialização:", error);
    process.exit(1);
  }
}

sendLinkMessage();
