const customerNames = [
  'Ava Thompson', 'Lucas Nguyen', 'Mila Patel', 'Ethan Brooks', 'Sofia Martinez',
  'Noah Kim', 'Chloe Foster', 'Liam Alvarez', 'Zoe Reed', 'Mason Johnson',
  'Amelia Scott', 'Oliver Clark', 'Harper Lewis', 'James Walker', 'Ella Young',
  'Benjamin Hall', 'Scarlett Allen', 'Henry Wright', 'Grace Baker', 'Daniel Hill',
  'Layla Mitchell', 'Samuel Roberts', 'Naomi Carter', 'Leo Phillips', 'Ruby Turner',
  'Wyatt Diaz', 'Diana Price', 'Jack Foster', 'Penelope Brooks', 'Isaac Nelson',
  'Lily Stewart', 'Elijah Sanders', 'Aria Murphy', 'Mateo Rivera', 'Aubrey Coleman',
  'Gabriel Perry', 'Hannah Ross', 'Julian Powell', 'Stella Jenkins', 'Julian Hughes',
  'Maya Barnes', 'Hudson Flores', 'Paisley Evans', 'Nathan Ward', 'Aurora Cox', 'Owen Gray',
  'Nora Richardson', 'Adrian Torres', 'Samantha Peterson', 'Levi Ramirez', 'Violet Cooper'
];

const reasons = [
  'Expired card',
  'Insufficient funds',
  'Card verification failed',
  'Bank declined transaction',
  'Network timeout during authorization',
  'Address mismatch',
  'Processor error',
  'AVS mismatch',
  'Region blocked by issuer',
  'Fraud screening flag'
];

const sectors = [
  'SaaS', 'E-commerce', 'Healthcare', 'Education', 'Travel', 'Retail', 'Logistics', 'Finance'
];

const countryCodes = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'IN', 'BR'];

const failedPaymentScenarios = Array.from({ length: 100 }, (_, index) => {
  const customer = customerNames[index % customerNames.length];
  const reason = reasons[index % reasons.length];
  const sector = sectors[index % sectors.length];
  const country = countryCodes[index % countryCodes.length];
  const amount = Number((49 + ((index * 37.5) % 1425)).toFixed(2));
  const attempts = (index % 4) + 1;

  return {
    id: index + 1,
    customer,
    email: `${customer.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    amount,
    currency: 'USD',
    reason,
    status: 'failed',
    sector,
    country,
    attempts,
    retryRecommendation: index % 3 === 0 ? 'retry_after' : 'retry_now',
    riskBand: ['low', 'medium', 'high'][index % 3],
    invoice: `INV-${String(index + 1).padStart(5, '0')}`
  };
});

export { failedPaymentScenarios };
export default failedPaymentScenarios;
