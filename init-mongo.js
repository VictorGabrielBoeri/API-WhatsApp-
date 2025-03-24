// Este script inicializa o banco de dados MongoDB para a aplicação WhatsApp API
db = db.getSiblingDB("whatsapp_api");

// Criação de usuário com senha (substitua com credenciais do seu arquivo .env)
db.createUser({
  user: process.env.MONGODB_USER || "whatsapp_user",
  pwd: process.env.MONGODB_PASSWORD || "whatsapp_password",
  roles: [
    {
      role: "readWrite",
      db: "whatsapp_api",
    },
  ],
});

// Criação das coleções iniciais
db.createCollection("instances");
db.createCollection("sessions");
db.createCollection("messages");
db.createCollection("contacts");
db.createCollection("groups");
db.createCollection("campaigns");
db.createCollection("alerts");

// Índices para melhor performance
db.messages.createIndex({ instanceId: 1 });
db.messages.createIndex({ timestamp: 1 });
db.contacts.createIndex({ instanceId: 1, number: 1 }, { unique: true });
db.campaigns.createIndex({ status: 1 });
