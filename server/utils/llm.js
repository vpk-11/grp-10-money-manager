// utils/llm.js
// Utility to call a local HuggingFace or Llama model for chatbot responses

const axios = require('axios');

/**
 * Query a local LLM server (HuggingFace or Llama.cpp API)
 * @param {string} prompt - The user message or prompt
 * @param {object} [options] - Optional generation parameters
 * @returns {Promise<string>} - The generated response
 */
async function queryLLM(prompt, options = {}) {
  // Example: local Llama.cpp server (http://localhost:8000/completion)
  // Or HuggingFace Text Generation Inference (TGI) server
  const endpoint = process.env.LLM_API_URL || 'http://localhost:8000/completion';
  try {
    const response = await axios.post(endpoint, {
      prompt,
      ...options
    });
    // Llama.cpp: { content: '...', ... }
    // HuggingFace TGI: { generated_text: '...' }
    if (response.data.content) return response.data.content;
    if (response.data.generated_text) return response.data.generated_text;
    // Fallback: return whole response as string
    return JSON.stringify(response.data);
  } catch (err) {
    console.error('[LLM] Error querying local model:', err.message);
    throw new Error('Failed to get response from LLM');
  }
}

module.exports = { queryLLM };