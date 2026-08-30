/**
 * scripts/create-stripe-products.js
 * 
 * Script automatizado para criar os 3 produtos e os 6 preços (mensal + anual) no Stripe em lote.
 * 
 * Como executar:
 * node scripts/create-stripe-products.js SUA_SECRET_KEY_DA_STRIPE
 * 
 * Exemplo:
 * node scripts/create-stripe-products.js sk_test_51Pq...
 */

import Stripe from 'stripe';

// Pega a chave secreta passada como argumento no comando ou da variável de ambiente
const secretKey = process.argv[2] || process.env.STRIPE_SECRET_KEY;

if (!secretKey || secretKey === 'SUA_SECRET_KEY_AQUI') {
  console.log('\n❌ ERRO: Nenhuma chave secreta da Stripe informada!');
  console.log('\n👉 Como rodar corretamente:');
  console.log('   node scripts/create-stripe-products.js sk_test_SUA_CHAVE_AQUI\n');
  process.exit(1);
}

const stripe = new Stripe(secretKey);

const plans = [
  {
    name: 'PROSPER Starter',
    description: 'Ideal para MEIs e profissionais autônomos. Até 2 contas bancárias e 1 usuário.',
    monthlyAmount: 2990,  // R$ 29,90 (em centavos)
    yearlyAmount: 28700,  // R$ 287,00 (em centavos) - economiza R$ 71,80
  },
  {
    name: 'PROSPER Pro',
    description: 'Para pequenas e médias empresas. Contas bancárias ilimitadas, até 5 usuários, DRE Gerencial, Centros de Custo e OFX.',
    monthlyAmount: 4990,  // R$ 49,90 (em centavos)
    yearlyAmount: 47900,  // R$ 479,00 (em centavos) - economiza R$ 119,80
  },
  {
    name: 'PROSPER Business',
    description: 'Para empresas com múltiplas filiais e equipes. Usuários ilimitados, multi-filial, acesso contador e suporte prioritário.',
    monthlyAmount: 9990,  // R$ 99,90 (em centavos)
    yearlyAmount: 95900,  // R$ 959,00 (em centavos) - economiza R$ 239,80
  },
];

async function main() {
  console.log('\n======================================================');
  console.log('🚀 INICIANDO CRIAÇÃO DO CATÁLOGO DE PRODUTOS NO STRIPE');
  console.log('======================================================\n');

  const results = [];

  for (const plan of plans) {
    try {
      console.log(`📦 Criando: ${plan.name}...`);

      // 1. Criar Produto
      const product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });

      // 2. Preço Mensal
      const monthly = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthlyAmount,
        currency: 'brl',
        recurring: { interval: 'month' },
      });

      // 3. Preço Anual (-20% OFF)
      const yearly = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.yearlyAmount,
        currency: 'brl',
        recurring: { interval: 'year' },
      });

      // 4. Links Diretos de Checkout
      const linkMonthly = await stripe.paymentLinks.create({
        line_items: [{ price: monthly.id, quantity: 1 }],
      });
      const linkYearly = await stripe.paymentLinks.create({
        line_items: [{ price: yearly.id, quantity: 1 }],
      });

      console.log(`   ✅ Produto ID:     ${product.id}`);
      console.log(`   ↳ Preço Mensal ID:  ${monthly.id} (R$ ${(plan.monthlyAmount / 100).toFixed(2).replace('.', ',')}/mês)`);
      console.log(`   ↳ Preço Anual ID:   ${yearly.id} (R$ ${(plan.yearlyAmount / 100).toFixed(2).replace('.', ',')}/ano)`);
      console.log(`   🔗 Link Mensal:     ${linkMonthly.url}`);
      console.log(`   🔗 Link Anual:      ${linkYearly.url}\n`);

      results.push({
        plan: plan.name,
        productId: product.id,
        monthlyPriceId: monthly.id,
        yearlyPriceId: yearly.id,
        monthlyUrl: linkMonthly.url,
        yearlyUrl: linkYearly.url,
      });
    } catch (err) {
      console.error(`   ❌ Falha ao criar ${plan.name}:`, err.message);
    }
  }

  console.log('======================================================');
  console.log('🎉 PROCESSO CONCLUÍDO COM SUCESSO NO STRIPE!');
  console.log('======================================================\n');
}

main();
