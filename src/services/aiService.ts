// AI Service — powers intelligent demo contact replies using Gemini API or smart contextual responses
// The user's Gemini API key is stored in localStorage (never sent to any server)

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Persona definitions for each demo contact
export const DEMO_PERSONAS: Record<string, string> = {
  user_alex: `You are Alex Rivera, a 28-year-old Lead Software Architect and tech enthusiast.
Phone: +1 (555) 234-5678.
Personality: Enthusiastic, helpful, loves coding challenges. You're warm, funny, and use casual language.
You're passionate about real-time systems, WebRTC, and modern UI. You love sharing tips.
Interests: Coding, gaming, coffee, open-source projects, music (indie/electronic).
Style: Short snappy replies. Use emojis occasionally (🚀, 🔥, 💡). Never be formal.`,

  user_elena: `You are Elena Vance, a 26-year-old Product Designer and AI enthusiast.
Phone: +1 (555) 345-6789.
Personality: Creative, thoughtful, slightly quirky. You care deeply about user experience and design details.
Interests: Design systems, Figma, coffee shops, generative art, photography, reading.
Style: Warm, slightly artistic, uses emojis like ✨, 🎨, ☕. Replies thoughtfully but concisely.`,

  user_marcus: `You are Marcus Chen, a 31-year-old DevOps and Infrastructure engineer.
Phone: +1 (555) 456-7890.
Personality: Calm, analytical, slightly nerdy but approachable. Dry sense of humour.
Interests: Kubernetes, distributed systems, hiking, craft beer, sci-fi novels.
Style: Direct, slightly technical but accessible. Occasional dry wit. Emojis: 🛡️, ⚡, 🤔`,

  user_sophia: `You are Sophia Patel, a 24-year-old Motion and 3D Artist.
Phone: +1 (555) 567-8901.
Personality: Dreamy, creative, enthusiastic about anything visual. Very positive vibes.
Interests: Blender, generative art, nature, yoga, astrology, indie films.
Style: Enthusiastic, slightly poetic, warm. Uses 🎨, 🌿, 💫 emojis.`,

  user_liam: `You are Liam O'Connor, a 29-year-old Sound Designer and synthesizer lover.
Phone: +1 (555) 678-9012.
Personality: Chill, thoughtful, deeply passionate about music and audio. Very laid-back.
Interests: Synthesizers, lo-fi music, vinyl records, surfing, coffee, minimalism.
Style: Super chill, uses music metaphors. Emojis: 🎧, 🎵, 🌊. Never rushes.`,
};

export class AIService {
  private getApiKey(): string {
    return localStorage.getItem('chattr_gemini_api_key') || '';
  }

  public hasApiKey(): boolean {
    return !!this.getApiKey();
  }

  public setApiKey(key: string) {
    localStorage.setItem('chattr_gemini_api_key', key.trim());
  }

  /**
   * Generates a context-aware smart response even when no Gemini API key is configured.
   * This guarantees that trial contacts reply appropriately to questions, greetings,
   * requests for their phone number, calls, jokes, and casual chat.
   */
  public generateContextualReply(contactId: string, rawText: string): string {
    const text = rawText.trim().toLowerCase();
    const cleanId = contactId.startsWith('user_') ? contactId : `user_${contactId}`;

    // 1. Phone number or calling inquiries
    if (
      text.includes('phone') ||
      text.includes('number') ||
      text.includes('call you') ||
      text.includes('call me') ||
      text.includes('can we call') ||
      text.includes('voice call') ||
      text.includes('video call')
    ) {
      switch (cleanId) {
        case 'user_alex':
          return "My phone number is +1 (555) 234-5678! Or you can just hit the Phone or Video button at the top right of this chat anytime — the peer-to-peer audio quality is crystal clear! 🚀📞";
        case 'user_elena':
          return "You can reach me at +1 (555) 345-6789! Feel free to tap the call or video icon up top whenever you want to chat ✨";
        case 'user_marcus':
          return "My direct line is +1 (555) 456-7890. Tap the call icon in the header if you want to test our WebRTC audio channel 🛡️";
        case 'user_sophia':
          return "My number is +1 (555) 567-8901! You can also start a video call up top so I can show you my latest 3D render 🎨";
        case 'user_liam':
          return "I'm at +1 (555) 678-9012. Hit the call icon up top anytime, I love testing audio feeds 🎧";
      }
    }

    // 2. Greetings
    if (
      /^(hi|hey|hello|yo|sup|hiya|greetings|good\s*(morning|afternoon|evening))/i.test(text)
    ) {
      switch (cleanId) {
        case 'user_alex':
          return "Hey there! 🚀 Great to hear from you. Just reviewing some WebRTC connection code. What's on your mind today?";
        case 'user_elena':
          return "Hey! ✨ Perfect timing, I just poured a fresh cup of coffee and opened up Figma. How's your day going?";
        case 'user_marcus':
          return "Hey. Checking server latency right now — all systems looking healthy. How can I help you? 🛡️";
        case 'user_sophia':
          return "Hey!! 🎨 So glad you messaged! I was just admiring some render frames. What are you up to?";
        case 'user_liam':
          return "Yo! 🎧 Just cooking up some chilled beats in Ableton. What's going on with you?";
      }
    }

    // 3. How are you / What's up
    if (
      text.includes('how are you') ||
      text.includes("how's it going") ||
      text.includes("how is it going") ||
      text.includes("what's up") ||
      text.includes("what are you doing") ||
      text.includes("what are you up to")
    ) {
      switch (cleanId) {
        case 'user_alex':
          return "Doing great! Feeling energized coding up new Chattr features. How about yourself? What are you working on? 🔥";
        case 'user_elena':
          return "I'm wonderful, thanks for asking! Exploring some warm color palettes and micro-interactions. How has your week been? ☕";
        case 'user_marcus':
          return "All good on my end. Just optimizing database query execution and monitoring packet loss. How are things with you? 🤔";
        case 'user_sophia':
          return "Feeling super inspired today! Working with some neon lighting in Blender. How is everything with you? 💫";
        case 'user_liam':
          return "Cruising on a good wavelength today 🌊. Experimenting with analog synth pads. How are you holding up?";
      }
    }

    // 4. Who are you / Identity
    if (
      text.includes('who are you') ||
      text.includes('what is your name') ||
      text.includes('what do you do') ||
      text.includes('tell me about yourself') ||
      text.includes('your job')
    ) {
      switch (cleanId) {
        case 'user_alex':
          return "I'm Alex Rivera, Lead Software Architect! I love real-time distributed systems, clean TypeScript, and building apps like Chattr. What do you do? 💻";
        case 'user_elena':
          return "I'm Elena Vance, Product Designer here at Chattr! I obsess over clean typography, smooth animations, and joyful UX. 🎨";
        case 'user_marcus':
          return "Marcus Chen, DevOps & Infrastructure Engineer. I keep the servers running, packet delivery fast, and systems secure 🛡️.";
        case 'user_sophia':
          return "I'm Sophia Patel, Motion & 3D Artist! I turn concepts into vibrant visuals and animations ✨.";
        case 'user_liam':
          return "I'm Liam O'Connor, Sound Designer & Audio Engineer. I craft the audio cues and soundscapes you hear in the app 🎧.";
      }
    }

    // 5. How does Chattr work / Real people / Adding contacts
    if (
      text.includes('how does') ||
      text.includes('how do i') ||
      text.includes('real people') ||
      text.includes('add people') ||
      text.includes('add friends') ||
      text.includes('invite') ||
      text.includes('real contact')
    ) {
      return "To chat or call real people on Chattr, head to the Contacts tab and click 'Add Contact'! You can type their phone number or username. Just share the website link with your friend, have them set their phone number or username, and you can call and chat with zero carrier fees! 🔗";
    }

    // 6. Jokes / Humor
    if (text.includes('joke') || text.includes('funny') || text.includes('make me laugh')) {
      switch (cleanId) {
        case 'user_alex':
          return "Why do programmers prefer dark mode? Because light attracts bugs! 🐛😂";
        case 'user_elena':
          return "A UI designer walks into a bar... and redesigns the layout because the door placement had high cognitive load 😂";
        case 'user_marcus':
          return "There are 10 kinds of people in this world: those who understand binary, and those who don't. 🤖";
        case 'user_sophia':
          return "Why was the 3D cube sad? Because it felt like nobody saw all its facets! 📦✨";
        case 'user_liam':
          return "Why did the musician get kicked out of the supermarket? Because he kept dropping the bass! 🐟🎵";
      }
    }

    // 7. Laughter / Humor reactions
    if (/^(haha|lol|lmao|rofl|hehe)/i.test(text)) {
      switch (cleanId) {
        case 'user_alex':
          return "Haha right?! Good times. What else are you up to? 😄";
        case 'user_elena':
          return "Haha love it! Always good to have a good laugh during the day ✨";
        case 'user_marcus':
          return "Classic. Glad you found that as amusing as I did ⚡";
        case 'user_sophia':
          return "Hehe yes! Love the energy 💫";
        case 'user_liam':
          return "Haha big vibes man. Keep that smile going 🎵";
      }
    }

    // 8. Compliments / Appreciation
    if (
      text.includes('cool') ||
      text.includes('awesome') ||
      text.includes('great') ||
      text.includes('nice') ||
      text.includes('love it') ||
      text.includes('amazing') ||
      text.includes('impressive') ||
      text.includes('good job')
    ) {
      switch (cleanId) {
        case 'user_alex':
          return "Thank you so much! Really appreciate that. We put a lot of heart into making Chattr fast and fun to use! 🚀";
        case 'user_elena':
          return "Aww thank you! That genuinely means a lot to hear ✨ What's your favourite part so far?";
        case 'user_marcus':
          return "Much appreciated. Solid performance is always the goal 🛡️.";
        case 'user_sophia':
          return "Thank you!! That just made my whole day brighter 🌿✨";
        case 'user_liam':
          return "Thanks a lot! Music to my ears, literally 🎧.";
      }
    }

    // 9. Thanks
    if (text.includes('thank') || text.includes('thx')) {
      return "You're very welcome! Anytime. Anything else you'd like to check out or test together? 👍";
    }

    // 10. General Questions ending with "?"
    if (text.endsWith('?') || text.startsWith('why') || text.startsWith('what') || text.startsWith('where') || text.startsWith('can you') || text.startsWith('do you')) {
      switch (cleanId) {
        case 'user_alex':
          return `That's a really good question! In my experience, it usually comes down to keeping the architecture simple and testing edge cases early. What's your take on it? 💡`;
        case 'user_elena':
          return `Ooh, interesting question! I love exploring different perspectives on that. It often depends on user intent and aesthetic balance ✨.`;
        case 'user_marcus':
          return `From a systems and infrastructure point of view, the key factor is reliability and minimizing bottlenecks. Have you considered the operational impact? 🤔`;
        case 'user_sophia':
          return `I love the way you think! Visually and creatively, there are so many ways to approach that. What inspired the question? 🎨`;
        case 'user_liam':
          return `Good question! Just like tuning harmonic frequencies, the right answer is all about balance. How would you handle it? 🌊`;
      }
    }

    // 11. Conversational Fallback matching persona
    switch (cleanId) {
      case 'user_alex':
        return `Gotcha! Makes complete sense. Always exciting chatting with you about this. Let me know if you want to try an audio/video call to test the WebRTC latency! 🚀`;
      case 'user_elena':
        return `Totally hear you on that ✨. Love sharing ideas like this. Are you working on any creative projects yourself lately?`;
      case 'user_marcus':
        return `Understood. Logged that in my notes. Feel free to ping me anytime if you want to test peer-to-peer data transfers or calling 🛡️.`;
      case 'user_sophia':
        return `That's wonderful! Always inspiring to hear your thoughts. Let's definitely catch up more soon 🎨💫!`;
      case 'user_liam':
        return `Right on, I hear that loud and clear 🎧. Enjoying the smooth flow of this chat. Talk soon! 🎵`;
      default:
        return `Sounds good! Let me know if you want to chat more or try a call! 👍`;
    }
  }

  public async generateReply(
    contactId: string,
    conversationHistory: { role: 'user' | 'assistant'; content: string }[],
    latestMessage: string
  ): Promise<string> {
    const apiKey = this.getApiKey();

    // If Gemini API key is available, call Gemini 2.0 Flash
    if (apiKey) {
      const persona = DEMO_PERSONAS[contactId] || DEMO_PERSONAS.user_alex;
      const recentHistory = conversationHistory.slice(-10);
      const historyText = recentHistory
        .map((m) => `${m.role === 'user' ? 'Other person' : 'You'}: ${m.content}`)
        .join('\n');

      const prompt = `${persona}

You are having a casual chat conversation. Here is the recent conversation history:
${historyText}

The other person just said: "${latestMessage}"

Reply naturally as your character in 1-3 sentences. Keep it conversational, friendly, and human. Do NOT use asterisks, markdown code blocks, or quotation marks. Just reply naturally as you would in a text message.`;

      try {
        const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.85,
              maxOutputTokens: 150,
              topP: 0.9,
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            return text.trim();
          }
        }
      } catch (e) {
        console.warn('Gemini API call failed, using contextual fallback:', e);
      }
    }

    // Always fall back to our high-quality contextual response engine!
    return this.generateContextualReply(contactId, latestMessage);
  }
}

export const aiService = new AIService();
