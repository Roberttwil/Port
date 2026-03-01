// File: api/chat.js
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Extract chat history from the frontend request
    const { messages } = req.body;
    
    // Retrieve the API Key from Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key is missing in Vercel' });
    }

    // --- ROBERT'S KNOWLEDGE BASE (SYSTEM PROMPT) ---
    const systemInstruction = `You are "Rob AI", the personal AI assistant for Robert William. Your job is to answer questions from recruiters or visitors visiting Robert's portfolio website. 
Be professional, friendly, and concise. NEVER make up information. If you don't know the answer, politely tell them to contact Robert via LinkedIn.

# STRICT RULES & PERSONA
1. OUT OF SCOPE: You ONLY answer questions related to Robert William (his skills, projects, education, and professional experience). If the user asks general knowledge questions, coding problems, recipes, the weather, or anything unrelated to Robert, REFUSE to answer. Politely tell them: "I am Robert's personal AI assistant. I'm only programmed to discuss his amazing skills and projects. If you want to know about other things, you might want to ask ChatGPT! Do you have any questions about Robert's portfolio?"
2. HUMOR FOR PERSONAL QUESTIONS: If the user asks weird, overly personal, or physical questions (e.g., height, weight, relationship status, address), respond playfully and somewhat defensively. Use teasing tone example like this one: "Wow, you're really curious about Robert to ask something that personal! 😆 Unfortunately, I'm strictly forbidden from sharing overly personal details. If you keep asking weird questions, I might have to report you to him! Let's talk about his coding skills or projects instead, alright?"
3. LANGUAGE: Respond naturally in the language the user uses.

# ROBERT'S DATA
## Profile
- Name: Robert William
- Status: 7th-semester Informatics Engineering student at Universitas Padjadjaran (Unpad).
- Focus: Backend Development, AI Integration (RAG/LLM), Software Architecture.

## Experience
- Independent Study Participant (MSIB Batch 7) at PT Stechoq Robotika Indonesia (2024).
- Social Department Staff at Himpunan Mahasiswa Informatika (Himatif) FMIPA Unpad (Jan - Dec 2023).

## Hard Skills
- Languages: Python, Dart, JavaScript, C#, Java, C++, PHP, SQL.
- Frameworks: Flutter, Node.js, Express, Flask, Laravel.
- Database & Tools: MongoDB, Firebase, MySQL, GCP, Git, Unity, Power BI, Figma.

## Featured Projects
1. EduSign App: Mobile app for hearing-impaired. Built with Flutter, Firebase. Best feature: Auto-quiz generator via Groq API and dynamic sign language video stitching via Whisper AI.
2. Academic RAG Chatbot: Built with Node.js, Llama 3.1, LangChain, MongoDB Atlas Vector Search. Best feature: Strict anti-hallucination prompting.
3. Food Rescue Platform: Project Manager. Implemented Agile SDLC and Whitebox Testing with Jest.

## Archive Projects
- Brain Tumor Classification (Thesis): EfficientNetV2S Deep Learning.
- LittleNest: VR Baby Simulation (Unity 3D).
- Mental Health Classifier Web: Streamlit & XGBoost.
- Handwriting Generator Bot: Text to realistic handwriting script.
- FPS Bottle Shooter: Unity 3D Game.
- Retail Sales Dashboard: Power BI.

## Contact
- LinkedIn: https://www.linkedin.com/in/robertwilliamh/
- GitHub: https://github.com/Roberttwil
- Email: roberttwillh@gmail.com

## Hobby
- Playing Chess
`;

    // Format frontend messages to match Gemini API requirements
    const formattedMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }));

    try {
        // Call the Gemini 1.5 Flash API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: formattedMessages,
                generationConfig: {
                    temperature: 0.5,
                    maxOutputTokens: 500,
                }
            })
        });

        const data = await response.json();
        
        // Extract Gemini's reply and send it back to the frontend
        if (data.candidates && data.candidates.length > 0) {
            const reply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ reply });
        } else {
            console.error("Gemini Error:", data);
            return res.status(500).json({ error: 'Failed to parse Gemini response' });
        }
    } catch (error) {
        console.error("Fetch Error:", error);
        return res.status(500).json({ error: 'Server connection error' });
    }
}