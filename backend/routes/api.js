import express from 'express';
import { analyzeFailedPayment } from '../agent.js';
import { getToolCatalog, executeToolAction } from '../tools.js';
import { failedPaymentScenarios } from '../data/scenarios.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-revenue-recovery-backend' });
});

router.get('/scenarios', (req, res) => {
  res.json({
    total: failedPaymentScenarios.length,
    data: failedPaymentScenarios.slice(0, 25)
  });
});

router.get('/scenarios/:id', (req, res) => {
  const scenario = failedPaymentScenarios.find((item) => item.id === Number(req.params.id));

  if (!scenario) {
    return res.status(404).json({ message: 'Scenario not found' });
  }

  return res.json({ data: scenario });
});

router.get('/tools', (req, res) => {
  res.json({ tools: getToolCatalog() });
});

router.post('/analyze', async (req, res) => {
  try {
    const scenario = req.body?.scenario || null;

    if (!scenario) {
      return res.status(400).json({ message: 'A scenario payload is required.' });
    }

    const recommendation = await analyzeFailedPayment(scenario, getToolCatalog());
    return res.json({ recommendation });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to analyze the scenario.' });
  }
});

router.post('/tool-action', (req, res) => {
  try {
    const { toolName, params } = req.body || {};

    if (!toolName) {
      return res.status(400).json({ message: 'toolName is required.' });
    }

    const result = executeToolAction(toolName, params || {});
    return res.json({ result });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Tool execution failed.' });
  }
});

export default router;
