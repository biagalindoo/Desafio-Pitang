import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const defaultPassword = "123456";

const users = [
  {
    nome: "Admin",
    email: "admin@email.com",
    perfil: "ADMIN"
  },
  {
    nome: "Colaborador",
    email: "colaborador@email.com",
    perfil: "COLABORADOR"
  },
  {
    nome: "Gestor",
    email: "gestor@email.com",
    perfil: "GESTOR"
  },
  {
    nome: "Financeiro",
    email: "financeiro@email.com",
    perfil: "FINANCEIRO"
  }
];

const categories = [
  "Alimentacao",
  "Transporte",
  "Hospedagem",
  "Material de trabalho"
];

async function main() {
  const passwordHash = await hash(defaultPassword, 8);

  for (const user of users) {
    await prisma.user.upsert({
      where: {
        email: user.email
      },
      update: {
        nome: user.nome,
        perfil: user.perfil
      },
      create: {
        ...user,
        senha: passwordHash
      }
    });
  }

  for (const categoryName of categories) {
    await prisma.category.upsert({
      where: {
        nome: categoryName
      },
      update: {
        ativo: true
      },
      create: {
        nome: categoryName,
        ativo: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seeds executados com sucesso.");
  })
  .catch(async (error) => {
    console.error("Erro ao executar seeds:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
