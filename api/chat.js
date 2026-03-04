export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { messages } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Groq API Key is missing in Vercel settings' });
    }

    const systemInstruction = process.env.SYSTEM_PROMPT;

    if (!systemInstruction) {
        return res.status(500).json({ error: 'System prompt is missing in Vercel settings' });
    }

    const formattedMessages = [
        { role: "system", content: systemInstruction },
        ...messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }))
    ];

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: formattedMessages,
                temperature: 0.6,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            if (response.status === 429) {
                return res.status(200).json({
                    reply: "Wow, Robert's portfolio is so popular right now! 😅 My circuits need a quick cooldown. Please try again in a few seconds!"
                });
            }
            console.error("Groq API Error:", data);
            return res.status(500).json({ error: "API Error", message: data.error?.message });
        }

        if (data.choices && data.choices.length > 0) {
            return res.status(200).json({ reply: data.choices[0].message.content });
        } else {
            return res.status(500).json({ error: 'Failed to parse response' });
        }
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}