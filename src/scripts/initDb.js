const mongoose = require("mongoose");
require("dotenv").config();

async function initializeDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conexão com MongoDB estabelecida");

    // Criar coleções básicas sem índices complexos
    const collections = ["campaigns", "metrics", "alerts"];
    for (const collection of collections) {
      if (!mongoose.connection.collections[collection]) {
        await mongoose.connection.createCollection(collection);
        console.log(`Coleção ${collection} criada`);
      }
    }

    console.log("Banco de dados inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

initializeDb();
