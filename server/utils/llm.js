// utils/llm.js
// Utility to call Ollama for chatbot responses

const axios = require('axios');

/**
 * Check if Ollama is running
 * @returns {Promise<boolean>} - True if Ollama is available
 */
async function checkOllamaStatus() {
  const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  try {
    await axios.get(`${ollamaUrl}/api/tags`, { timeout: 3000 });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Query Ollama for LLM responses
 * NOTE: Ollama automatically manages model loading/unloading.
 * When switching models, Ollama will unload the previous model from memory
 * and load the new one, ensuring only one model is active at a time.
 * 
 * @param {string} prompt - The user message or prompt
 * @param {object} [options] - Optional generation parameters
 * @returns {Promise<string>} - The generated response
 */
async function queryLLM(prompt, options = {}) {
  const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  const defaultModel = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  const model = options.model || defaultModel;
  
  console.log(`[LLM] Switching to model: ${model}`);
  
  try {
    const response = await axios.post(
      `${ollamaUrl}/api/generate`,
      {
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 256,
        }
      },
      { timeout: 30000 }
    );
    
    console.log('[LLM] Response received from Ollama');
    
    if (response.data && response.data.response) {
      return response.data.response;
    }
    
    console.error('[LLM] Invalid response structure:', response.data);
    throw new Error('Invalid response from Ollama');
  } catch (err) {
    console.error('[LLM] Error querying Ollama:', err.message);
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      throw new Error('OLLAMA_OFFLINE');
    }
    throw new Error('OLLAMA_OFFLINE');
  }
}

module.exports = { queryLLM, checkOllamaStatus };