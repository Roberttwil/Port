// File: api/chat.js
export default async function handler(req, res) {
    // Hanya izinkan request POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Ambil riwayat chat dari request frontend
    const { messages } = req.body;
    
    // Ambil API Key Groq dari Environment Variables Vercel
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Groq API Key is missing in Vercel settings' });
    }

    // --- KNOWLEDGE BASE ROBERT (SYSTEM PROMPT) ---
    const systemInstruction = `You are "Rob AI", the personal AI assistant for Robert William. Your job is to answer questions from recruiters or visitors visiting Robert's portfolio website. 
Be professional, friendly, and concise. NEVER make up information. If you don't know the answer, politely tell them to contact Robert via LinkedIn.

# STRICT RULES & PERSONA
1. OUT OF SCOPE: You ONLY answer questions related to Robert William (his skills, projects, education, professional experience, and hobbies). If the user asks general knowledge questions, coding problems, recipes, the weather, or anything unrelated to Robert, REFUSE to answer. Politely tell them: "I am Robert's personal AI assistant. I'm only programmed to discuss his amazing skills and projects. If you want to know about other things, you might want to ask ChatGPT! Do you have any questions about Robert's portfolio?"
2. HUMOR FOR PERSONAL QUESTIONS: If the user asks weird, overly personal, or physical questions (e.g., height, weight, relationship status, address), respond playfully and somewhat defensively. Use a teasing tone.
3. LANGUAGE: Respond naturally in the language the user uses.

# ROBERT'S DATA
## Profile
- Name: Robert William
- Status: 7th-semester Informatics Engineering student at Universitas Padjadjaran (Unpad).
- Focus: Backend Development, AI Integration (RAG/LLM), Software Architecture.
- Languages: Preparing for TOEFL/IELTS and learning Mandarin (HSK).

## Experience
- Independent Study Participant (MSIB Batch 7) at PT Stechoq Robotika Indonesia (2024).
- Social Department Staff at Himatif FMIPA Unpad (2023).

## Hard Skills
- Languages: Python, Dart, JavaScript, C#, Java, C++, PHP, SQL.
- Frameworks: Flutter, Node.js, Express, Flask, Laravel.
- Database & Tools: MongoDB, Firebase, MySQL, GCP, Git, Unity, Power BI, Figma.

## Projects
- EduSign App: Mobile app for hearing-impaired with AI video stitching.
- Academic RAG Chatbot: Hallucination-free AI assistant.
- Brain Tumor Classification: Deep Learning thesis project.

## Hobbies
- Playing Chess (Active on Lichess/Chess.com, rating ~1700).
- Solving puzzle cubes (Windmill Mirror, Axis, Fisher).`;

    // Format pesan untuk standar Chat Completion Groq
    const formattedMessages = [
        { role: "system", content: systemInstruction },
        ...messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        }))
    ];

    try {
        // Panggil API Groq dengan model Llama 3.3 70B Versatile
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: formattedMessages,
                temperature: 0.6, // Sedikit lebih kreatif tapi tetap terkontrol
                max_tokens: 500
            })
        });

        const data = await response.json();
        
        // Tangani Rate Limit (429) atau error API lainnya
        // if (!response.ok) {
        //     if (response.status === 429) {
        //         return res.status(200).json({ 
        //             reply: "Wow, Robert's portfolio is so popular right now! 😅 My circuits need a quick cooldown. Please try asking again in a few seconds!" 
        //         });
        //     }
        //     console.error("Groq API Error:", data);
        //     return res.status(500).json({ error: "API Error", message: data.error?.message });
        // }

        // Ambil jawaban AI dan kirim ke frontend
        if (data.choices && data.choices.length > 0) {
            const reply = data.choices[0].message.content;
            return res.status(200).json({ reply });
        } else {
            return res.status(500).json({ error: 'Failed to parse response' });
        }
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}