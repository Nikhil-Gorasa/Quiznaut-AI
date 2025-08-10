/*
  Gemini API integration for quiz question generation (static hosting)
  Directly calls Google API using exposed API key from config.js
*/

import { APP_CONFIG, GEMINI_API_KEY } from './config.js';

class GeminiQuizGenerator {
  constructor(apiKey = GEMINI_API_KEY) {
    this.apiKey = apiKey;
  }

  async generateQuestions(config) {
    const {
      topic,
      count = APP_CONFIG.defaultQuestionCount,
      difficulty = APP_CONFIG.defaultDifficulty,
      marksPerQuestion = APP_CONFIG.defaultMarksPerQuestion
    } = config;

    const prompt = this.buildPrompt(topic, count, difficulty);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.apiTimeout);
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!generatedText) {
        throw new Error('No content generated from Gemini API');
      }

      return this.parseGeneratedQuestions(generatedText, marksPerQuestion);
    } catch (error) {
      console.error('Gemini API request failed:', error);
      throw error;
    }
  }

  buildPrompt(topic, count, difficulty) {
    return `Generate ${count} multiple choice questions about "${topic}" at ${difficulty} difficulty level.

Requirements:
- Each question should have exactly 4 options (A, B, C, D)
- One option must be clearly correct
- Options should be plausible but distinct
- Questions should test understanding, not just memorization
- Difficulty should match: ${difficulty} level

Format each question exactly like this:
Q1. [Question text here]
A) [Option A]
B) [Option B] 
C) [Option C]
D) [Option D]
Correct: [A/B/C/D]

Q2. [Question text here]
A) [Option A]
B) [Option B]
C) [Option C] 
D) [Option D]
Correct: [A/B/C/D]

Continue for all ${count} questions. Make sure each question is well-written and tests genuine understanding of ${topic}.`;
  }

  parseGeneratedQuestions(text, marksPerQuestion) {
    const questions = [];
    const questionBlocks = text.split(/(?=Q\d+\.)/).filter(block => block.trim());
    
    for (const block of questionBlocks) {
      try {
        const question = this.parseQuestionBlock(block, marksPerQuestion);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        console.warn('Failed to parse question block:', block, error);
      }
    }

    return questions;
  }

  parseQuestionBlock(block, marksPerQuestion) {
    const lines = block.trim().split('\n').filter(line => line.trim());
    
    // Extract question text
    const questionMatch = lines[0].match(/Q\d+\.\s*(.+)/);
    if (!questionMatch) return null;
    
    const questionText = questionMatch[1].trim();
    
    // Extract options
    const options = [];
    let correctIndex = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for options (A), (B), (C), (D)
      const optionMatch = line.match(/^([A-D])\)\s*(.+)/);
      if (optionMatch) {
        const optionLetter = optionMatch[1];
        const optionText = optionMatch[2].trim();
        options.push(optionText);
        
        // Check if this is the correct answer
        const correctMatch = lines.find(l => l.includes('Correct:') && l.includes(optionLetter));
        if (correctMatch) {
          correctIndex = options.length - 1;
        }
      }
    }
    
    // Validate we have exactly 4 options
    if (options.length !== 4) {
      console.warn('Question does not have exactly 4 options:', block);
      return null;
    }
    
    return {
      text: questionText,
      options: options,
      correctIndex: correctIndex,
      marks: marksPerQuestion
    };
  }

  // Fallback method for when API is not available
  generateFallbackQuestions(config) {
    const { topic, count, difficulty, marksPerQuestion } = config;
    
    const fallbackQuestions = [
      {
        text: `What is the primary purpose of ${topic}?`,
        options: [
          'To improve performance',
          'To enhance security', 
          'To simplify development',
          'To reduce costs'
        ],
        correctIndex: 2,
        marks: marksPerQuestion
      },
      {
        text: `Which of the following best describes ${topic}?`,
        options: [
          'A programming language',
          'A development framework',
          'A design pattern',
          'A software tool'
        ],
        correctIndex: 1,
        marks: marksPerQuestion
      },
      {
        text: `When working with ${topic}, what should you consider first?`,
        options: [
          'Performance optimization',
          'Security requirements',
          'User requirements',
          'Technical constraints'
        ],
        correctIndex: 2,
        marks: marksPerQuestion
      }
    ];

    // Return requested number of questions (repeat if needed)
    return Array.from({ length: count }, (_, i) => ({
      ...fallbackQuestions[i % fallbackQuestions.length],
      text: fallbackQuestions[i % fallbackQuestions.length].text.replace(topic, topic || 'this topic')
    }));
  }
}

// Export for use in other modules
export { GeminiQuizGenerator };
