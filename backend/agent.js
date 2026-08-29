import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export function buildSystemPrompt() {
  return `You are an AI revenue recovery assistant for a payments team.

Your job is to evaluate failed payment scenarios and decide the best next step.
Focus on maximizing recovery while minimizing customer friction.

Use the available tools when appropriate:
- retry_now for immediate retry when the customer is likely to succeed.
- retry_after for temporary issuer or network issues.
- send_email for customer outreach and clarity.
- offer_discount for repeat failures or low-risk churn risk.
- escalate_to_support for fraud, manual review, or exceptional cases.

Return a compact JSON object with:
{
  status: 'recommended' | 'manual_review',
  summary: string,
  recommendedAction: 'retry_now' | 'retry_after' | 'send_email' | 'offer_discount' | 'escalate_to_support',
  confidence: number,
  rationale: string,
  nextStep: string
}

Do not make up a payment ID if the scenario does not include one.`;
}

export async function analyzeFailedPayment(scenario, tools = []) {
  if (!anthropic) {
    return {
      status: 'manual_review',
      summary: 'Anthropic API is not configured. The system is running in fallback mode.',
      recommendedAction: 'send_email',
      confidence: 0.72,
      rationale: 'The scenario needs a human review since the AI model key is not configured yet.',
      nextStep: 'Add the Anthropic API key to backend/.env and rerun the analysis.'
    };
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 700,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ scenario, availableTools: tools }, null, 2)
        }
      ],
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema
      }))
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const toolUse = response.content.find((block) => block.type === 'tool_use');

    if (toolUse) {
      return {
        status: 'recommended',
        summary: 'The agent selected a tool-driven recovery flow.',
        recommendedAction: toolUse.name,
        confidence: 0.9,
        rationale: 'The agent selected a structured tool action based on the failure details.',
        nextStep: `Execute ${toolUse.name} with the scenario context.`,
        toolCall: toolUse.input
      };
    }

    if (textBlock && textBlock.text) {
      const parsed = JSON.parse(textBlock.text);
      return parsed;
    }

    throw new Error('Anthropic returned no usable content.');
  } catch (error) {
    return {
      status: 'manual_review',
      summary: 'The AI recommendation failed, so the scenario was passed to manual review.',
      recommendedAction: 'escalate_to_support',
      confidence: 0.6,
      rationale: error.message || 'Unknown AI model error.',
      nextStep: 'Check the Anthropic API key, model access, and the failure payload.'
    };
  }
}
