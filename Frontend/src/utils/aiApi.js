// Frontend/src/utils/aiApi.js
import { authFetch } from './authFetch';

export const fetchAgentSuggestions = async (prompt) => {
    return authFetch('/api/ai/agent-search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt }),
    });
};