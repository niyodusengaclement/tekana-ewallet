import { Currency, PrismaClient, TransactionType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const feesRate = [
    {
      transactionType: TransactionType.send,
      currency: Currency.USD,
      percentageRate: 1,
    },
    {
      transactionType: TransactionType.withdraw,
      currency: Currency.USD,
      percentageRate: 0,
    },
    {
      transactionType: TransactionType.topup,
      currency: Currency.USD,
      percentageRate: 0,
    },
  ];

  await Promise.all([
    prisma.fee.createMany({
      data: feesRate,
    }),
  ]);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
  });
