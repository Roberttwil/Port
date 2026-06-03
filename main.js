const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    const sections = ['top','skills','experience','projects','archives','contact'];
    const navLinks = document.querySelectorAll('.nav-link');
    let current = 'top';
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 80) current = id;
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
});

function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('hidden');
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-in-up').forEach((el) => observer.observe(el));

function openModal(id) {
    const m = document.getElementById(id); m.classList.remove('hidden');
    setTimeout(() => { m.classList.remove('opacity-0'); m.children[0].classList.remove('scale-95'); m.children[0].classList.add('scale-100'); }, 10);
    document.body.style.overflow = 'hidden';
}
function closeModal(id) {
    const m = document.getElementById(id); m.classList.add('opacity-0'); m.children[0].classList.remove('scale-100'); m.children[0].classList.add('scale-95');
    setTimeout(() => m.classList.add('hidden'), 300); document.body.style.overflow = 'auto';
}

const chatWindow = document.getElementById('ai-chat-window');
const chatMessages = document.getElementById('ai-chat-messages');
const chatInput = document.getElementById('ai-chat-input');
const typingIndicator = document.getElementById('ai-typing-indicator');
let isWaiting = false;
let conversationHistory = [];

function toggleAIChat() { 
    if(chatWindow.classList.contains('hidden')) {
        chatWindow.classList.remove('hidden');
        setTimeout(() => { chatWindow.classList.remove('opacity-0', 'translate-y-4'); chatWindow.classList.add('opacity-100', 'translate-y-0'); }, 10);
    } else {
        chatWindow.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => chatWindow.classList.add('hidden'), 300);
    }
}
function fillAndSend(t) { chatInput.value = t; sendUserAIMessage(); }
function handleAIChatKey(e) { if (e.key === 'Enter') sendUserAIMessage(); }

async function fetchAIResponse(userMessage) {
    conversationHistory.push({ role: 'user', content: userMessage });
    try {
        const r = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory })
        });
        const d = await r.json();
        const reply = d.reply || "Sorry, I encountered an error. Please try again.";
        conversationHistory.push({ role: 'assistant', content: reply });
        return reply;
    } catch (e) {
        conversationHistory.pop();
        return "Fail to connect to server.";
    }
}

async function sendUserAIMessage() {
    if (isWaiting || !chatInput.value.trim()) return;
    const t = chatInput.value.trim(); isWaiting = true; appendMessage(t, 'user');
    chatInput.value = ''; typingIndicator.classList.remove('hidden');
    const res = await fetchAIResponse(t); typingIndicator.classList.add('hidden');
    appendMessage(res, 'bot'); isWaiting = false;
}

function parseMarkdown(text) {
    let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(https?:\/\/[^\s\)\"<]+)/g, '<a href="$1" target="_blank" class="text-blue-600 underline break-all hover:text-blue-800">$1</a>');
    const lines = html.split('\n');
    const result = [];
    let inOl = false, inUl = false;
    for (let line of lines) {
        const olMatch = line.match(/^(\d+)\.\s+(.+)/);
        const ulMatch = line.match(/^[*-]\s+(.+)/);
        if (olMatch) {
            if (!inOl) { result.push('<ol class="list-decimal list-outside ml-4 space-y-1 my-1">'); inOl = true; }
            if (inUl) { result.push('</ul>'); inUl = false; }
            result.push(`<li>${olMatch[2]}</li>`);
        } else if (ulMatch) {
            if (!inUl) { result.push('<ul class="list-disc list-outside ml-4 space-y-1 my-1">'); inUl = true; }
            if (inOl) { result.push('</ol>'); inOl = false; }
            result.push(`<li>${ulMatch[1]}</li>`);
        } else {
            if (inOl) { result.push('</ol>'); inOl = false; }
            if (inUl) { result.push('</ul>'); inUl = false; }
            result.push(line ? `<p>${line}</p>` : '');
        }
    }
    if (inOl) result.push('</ol>');
    if (inUl) result.push('</ul>');
    return result.join('');
}


async function submitContactForm() {
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    const btn = document.getElementById('contact-submit-btn');
    const btnText = document.getElementById('contact-btn-text');
    const btnIcon = document.getElementById('contact-btn-icon');

    if (!name || !email || !message) {
        alert('Please fill in all fields.');
        return;
    }

    // Loading state
    btn.disabled = true;
    btnText.textContent = 'Sending...';
    btnIcon.innerHTML = '<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25" fill="none"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>';

    try {
        const res = await fetch('https://formspree.io/f/xgolgrek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ name, email, message })
        });

        if (res.ok) {
            document.getElementById('contact-form-wrapper').classList.add('hidden');
            document.getElementById('contact-success').classList.remove('hidden');
        } else {
            throw new Error('Failed');
        }
    } catch (e) {
        btnText.textContent = 'Send Message';
        btnIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>';
        btn.disabled = false;
        alert('Something went wrong. Please try again or email me directly.');
    }
}

function appendMessage(t, s) {
    const d = document.createElement('div'); d.className = `flex items-start gap-3 ${s==='user'?'justify-end':''}`;
    const formatted = s === 'bot' ? parseMarkdown(t) : t;
    d.innerHTML = s === 'bot' ? `<img src="images/rob_ai.png" class="w-8 h-8 rounded-full border object-cover mt-1"><div class="bg-white p-3 rounded-xl rounded-bl-none shadow-sm border border-slate-100 text-sm max-w-[85%] leading-relaxed">${formatted}</div>` : `<div class="bg-blue-600 text-white p-3 rounded-xl rounded-br-none shadow-md text-sm max-w-[85%]">${t}</div>`;
    chatMessages.insertBefore(d, typingIndicator); chatMessages.scrollTop = chatMessages.scrollHeight;
}

document.addEventListener('DOMContentLoaded', function() {
    var swiper = new Swiper(".mySwiper", {
        effect: "coverflow",
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 1.2,
        breakpoints: {
            768: { slidesPerView: 1.8 }
        },
        loop: true,
        coverflowEffect: {
            rotate: 15,
            stretch: 0,
            depth: 250,
            modifier: 1,
            slideShadows: true,
        },
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
            dynamicBullets: true,
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
    });
});
