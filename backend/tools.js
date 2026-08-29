const toolCatalog = [
  {
    name: 'retry_now',
    description: 'Retry the failed payment immediately using the last payment method.',
    inputSchema: {
      type: 'object',
      properties: {
        payment_id: { type: 'string' },
        amount: { type: 'number' },
        retry_count: { type: 'number' }
      },
      required: ['payment_id', 'amount']
    }
  },
  {
    name: 'retry_after',
    description: 'Schedule a retry for the payment after a brief waiting period.',
    inputSchema: {
      type: 'object',
      properties: {
        payment_id: { type: 'string' },
        delay_hours: { type: 'number' },
        reason: { type: 'string' }
      },
      required: ['payment_id', 'delay_hours']
    }
  },
  {
    name: 'send_email',
    description: 'Send a customer-friendly email explaining the failed charge and next step.',
    inputSchema: {
      type: 'object',
      properties: {
        customer_email: { type: 'string' },
        subject: { type: 'string' },
        summary: { type: 'string' }
      },
      required: ['customer_email', 'subject', 'summary']
    }
  },
  {
    name: 'offer_discount',
    description: 'Offer a small incentive to encourage a successful retry for repeat failures.',
    inputSchema: {
      type: 'object',
      properties: {
        customer_email: { type: 'string' },
        discount_percent: { type: 'number' },
        eligible: { type: 'boolean' }
      },
      required: ['customer_email', 'discount_percent', 'eligible']
    }
  },
  {
    name: 'escalate_to_support',
    description: 'Escalate the failed payment to the support team for manual review.',
    inputSchema: {
      type: 'object',
      properties: {
        payment_id: { type: 'string' },
        escalation_reason: { type: 'string' }
      },
      required: ['payment_id', 'escalation_reason']
    }
  }
];

export function getToolCatalog() {
  return toolCatalog;
}

export function executeToolAction(toolName, params = {}) {
  switch (toolName) {
    case 'retry_now':
      return {
        status: 'queued',
        tool: 'retry_now',
        message: `Retry queued for payment ${params.payment_id ?? 'unknown'}.`,
        params
      };
    case 'retry_after':
      return {
        status: 'scheduled',
        tool: 'retry_after',
        message: `Manual retry scheduled for ${params.delay_hours ?? 2} hours later.`,
        params
      };
    case 'send_email':
      return {
        status: 'sent',
        tool: 'send_email',
        message: `Email sent to ${params.customer_email ?? 'customer'}.`,
        params
      };
    case 'offer_discount':
      return {
        status: 'created',
        tool: 'offer_discount',
        message: `Discount offer prepared for ${params.customer_email ?? 'customer'}.`,
        params
      };
    case 'escalate_to_support':
      return {
        status: 'escalated',
        tool: 'escalate_to_support',
        message: `Escalated to support for payment ${params.payment_id ?? 'unknown'}.`,
        params
      };
    default:
      throw new Error(`Tool not recognized: ${toolName}`);
  }
}
