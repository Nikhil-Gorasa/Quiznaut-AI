/*
  Create Quiz page logic
  - Basic quiz config (name, mode, count, marks)
  - Manual editor for MCQs (4 options default, can add more)
  - Optional AI generation that pre-fills questions, but stays fully editable
  - Persists to Supabase and provides share URL
*/

import { supabaseClient } from './supabaseClient.js';
import { GeminiQuizGenerator } from './geminiApi.js';

const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10);

const createEmptyQuestion = () => ({
  id: generateId(),
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  marks: 1,
});

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function renderQuestionEditor(model) {
  const container = qs('#questionsEditor');
  const card = document.createElement('div');
  card.className = 'card question-card';
  card.dataset.id = model.id;
  card.innerHTML = `
    <div class="question-actions">
      <button type="button" class="btn btn-ghost" data-action="q-settings">Settings</button>
    </div>
    <div class="question-grid">
      <div class="field">
        <label>Question<span class="req">*</span></label>
        <input class="q-text" type="text" placeholder="Type question text" value="${model.text || ''}" />
      </div>
      <div class="options-grid">
        ${model.options.map((opt, i) => `
          <div class="field">
            <label>Option ${i + 1}</label>
            <input class="q-option" type="text" placeholder="Enter option" value="${opt || ''}" />
          </div>
        `).join('')}
      </div>
      <div class="grid-2">
        <div class="field">
          <label>Correct Option Index</label>
          <input class="q-answer" type="number" min="0" max="${Math.max(0, model.options.length - 1)}" value="${model.correctIndex}" />
          <small class="help">0-based index (0 is first option).</small>
        </div>
        <div class="field">
          <label>Marks</label>
          <input class="q-marks" type="number" min="1" value="${model.marks || 1}" />
        </div>
      </div>
      <div class="inline-actions">
        <button type="button" class="btn btn-secondary" data-action="add-option">Add option</button>
        <button type="button" class="btn btn-ghost" data-action="remove">Remove question</button>
      </div>
    </div>
  `;

  card.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (action === 'q-settings') {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.outline = '2px solid rgba(245,158,11,.5)';
      setTimeout(() => (card.style.outline = ''), 600);
      return;
    }
    if (action === 'remove') {
      card.remove();
      return;
    }
    if (action === 'add-option') {
      const optionsGrid = qs('.options-grid', card);
      const count = qsa('.q-option', card).length;
      const field = document.createElement('div');
      field.className = 'field';
      field.innerHTML = `
        <label>Option ${count + 1}</label>
        <input class="q-option" type="text" placeholder="Enter option" />
      `;
      optionsGrid.appendChild(field);
      const answerInput = qs('.q-answer', card);
      answerInput.max = String(count);
    }
  });

  container.appendChild(card);
}

function clearEditors() {
  qs('#questionsEditor').innerHTML = '';
}

function seedEditors(count) {
  clearEditors();
  const n = clamp(Number(count) || 0, 0, 15);
  for (let i = 0; i < n; i++) renderQuestionEditor(createEmptyQuestion());
}

function getQuizFromForm() {
  const title = qs('#quizName').value.trim();
  
  // Get global settings values (works with both manual and AI forms)
  const defaultMarks = clamp(Number(qs('#defaultMarks')?.value) || 1, 1, 1000);
  const scoringMode = qs('input[name="scoringMode"]:checked')?.value || 'positive';
  const penalty = clamp(Number(qs('#penalty')?.value) || 0.25, 0, 1000);
  const requireAnswer = !!qs('#requireAnswer')?.checked;
  
  // Handle both manual and AI form layouts
  const marksPerQuestion = clamp(Number(qs('#marksPerQuestion')?.value) || defaultMarks, 1, 1000);
  const enableNegative = scoringMode === 'negative';
  const shuffleQuestions = !!qs('#shuffleQuestions')?.checked;
  
  const questions = qsa('.question-card').map((card) => {
    const text = qs('.q-text', card).value.trim();
    const options = qsa('.q-option', card).map((i) => i.value.trim());
    const correctIndex = clamp(Number(qs('.q-answer', card).value) || 0, 0, Math.max(0, options.length - 1));
    const marks = clamp(Number(qs('.q-marks', card).value) || defaultMarks, 1, 1000);
    return { text, options, correctIndex, marks };
  }).filter(q => q.text && q.options.filter(Boolean).length >= 2);

  return {
    title,
    topic: qs('#aiTopic')?.value.trim() || null,
    difficulty: qs('#difficulty')?.value || 'Medium',
    questions,
    settings: { 
      marksPerQuestion, 
      enableNegative, 
      penalty, 
      requireAnswer, 
      shuffleQuestions 
    },
  };
}

function validateQuiz(quiz) {
  if (!quiz.title) return 'Quiz name is required.';
  if (!quiz.questions.length) return 'Add at least one question.';
  if (quiz.questions.length > 15) return 'Maximum is 15 questions.';
  for (const [idx, q] of quiz.questions.entries()) {
    if (q.options.filter(Boolean).length < 2) return `Question ${idx + 1}: provide at least two options.`;
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length || !q.options[q.correctIndex]) {
      return `Question ${idx + 1}: select a valid correct option.`;
    }
  }
  return null;
}

async function saveQuiz(quiz) {
  const id = generateId();
  const row = {
    id,
    title: quiz.title,
    topic: quiz.topic,
    difficulty: quiz.difficulty,
    questions: quiz.questions.map(q => ({ text: q.text, options: q.options, correctIndex: q.correctIndex, marks: q.marks })),
    created_at: new Date().toISOString(),
  };
  if (!supabaseClient) throw new Error('Supabase not initialized');
  const { error } = await supabaseClient.from('quizzes').insert(row);
  if (error) throw error;
  return id;
}

async function maybeGenerateWithAI() {
  const topic = qs('#aiTopic')?.value.trim() || '';
  const count = clamp(Number(qs('#numQuestions')?.value) || 1, 1, 15);
  const difficulty = qs('#difficulty')?.value || 'Medium';
  const marksPerQuestion = Number(qs('#marksPerQuestion').value) || 1;
  const status = qs('#aiStatus');
  
  if (!topic) {
    throw new Error('Please enter a topic for AI generation.');
  }

  // Debug: Ensure backend is reachable (no keys on client)
  console.log('Calling AI generator via Netlify Function proxy...');

  status.textContent = 'Connecting to Gemini AI...';
  
  try {
    const geminiGenerator = new GeminiQuizGenerator();
    
    status.textContent = 'Generating questions with AI...';
    
    const generated = await geminiGenerator.generateQuestions({
      topic,
      count,
      difficulty,
      marksPerQuestion
    });

    if (!generated || generated.length === 0) {
      throw new Error('No questions were generated. Please try again.');
    }

    clearEditors();
    generated.forEach(renderQuestionEditor);
    status.textContent = `Generated ${generated.length} questions successfully! You can edit anything.`;
    
  } catch (error) {
    console.error('AI generation failed:', error);
    
    // Show user-friendly error message
    status.textContent = 'AI generation failed. Using fallback questions...';
    status.className = 'status error';
    
    // Always use fallback questions when API fails
    const geminiGenerator = new GeminiQuizGenerator();
    const fallbackQuestions = geminiGenerator.generateFallbackQuestions({
      topic,
      count,
      difficulty,
      marksPerQuestion
    });
    
    clearEditors();
    fallbackQuestions.forEach(renderQuestionEditor);
    status.textContent = 'Generated fallback questions. Check console for API details.';
    status.className = 'status info';
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const status = qs('#formStatus');
  status.textContent = 'Saving…';
  status.className = 'status info';

  const quiz = getQuizFromForm();
  const invalid = validateQuiz(quiz);
  if (invalid) {
    status.textContent = invalid;
    status.className = 'status error';
    return;
  }

  try {
    const id = await saveQuiz(quiz);
    const shareUrl = new URL('/html/quiz-start.html', window.location.origin);
    shareUrl.searchParams.set('id', id);
    const shareBlock = qs('#shareBlock');
    const shareEl = qs('#shareUrl');
    const openLink = qs('#openQuizLink');
    shareEl.textContent = shareUrl.toString();
    openLink.href = shareUrl.toString();
    shareBlock.hidden = false;
    status.textContent = 'Saved! Share your link below.';
    status.className = 'status success';

    qs('#copyUrlBtn')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrl.toString());
        status.textContent = 'Copied to clipboard!';
        status.className = 'status success';
      } catch (_) {
        status.textContent = 'Could not copy. Select and copy manually.';
        status.className = 'status error';
      }
    }, { once: true });
  } catch (err) {
    console.error('Save error:', err);
    
    // Provide specific error messages based on the error type
    if (err.message && err.message.includes('quizzes')) {
      status.textContent = 'Database table not found. Please run the Supabase setup SQL.';
      status.className = 'status error';
    } else if (err.message && err.message.includes('network')) {
      status.textContent = 'Network error. Check your internet connection.';
      status.className = 'status error';
    } else if (err.message && err.message.includes('permission')) {
      status.textContent = 'Permission denied. Check Supabase RLS policies.';
      status.className = 'status error';
    } else {
      status.textContent = `Error saving quiz: ${err.message}`;
      status.className = 'status error';
    }
  }
}

async function handleGenerate() {
  const status = qs('#aiStatus');
  const generateBtn = qs('#generateBtn');
  
  status.textContent = 'Generating questions with AI...';
  status.className = 'status loading';
  generateBtn.disabled = true;
  
  try {
    await maybeGenerateWithAI();
    status.textContent = 'Questions generated successfully!';
    status.className = 'status success';
    updateSaveButton();
  } catch (err) {
    console.error(err);
    status.textContent = 'Please enter a topic for AI generation or add questions manually.';
    status.className = 'status error';
  } finally {
    generateBtn.disabled = false;
  }
}

function updateSaveButton() {
  const saveBtn = qs('#saveQuizBtn');
  const questions = qsa('.question-card');
  const hasQuestions = questions.length > 0;
  
  if (saveBtn) {
    saveBtn.disabled = !hasQuestions;
  }
}

function init() {
  // Global settings panel toggle
  const globalSettingsToggle = qs('#globalSettingsToggle');
  const globalSettingsBody = qs('#globalSettingsBody');
  
  if (globalSettingsToggle && globalSettingsBody) {
    globalSettingsToggle.addEventListener('click', () => {
      const isExpanded = globalSettingsToggle.getAttribute('aria-expanded') === 'true';
      globalSettingsToggle.setAttribute('aria-expanded', !isExpanded);
      globalSettingsBody.hidden = isExpanded;
      globalSettingsToggle.textContent = isExpanded ? 'Show' : 'Hide';
    });
  }

  // Settings panel toggle
  const settingsToggle = qs('#settingsToggle');
  const settingsContent = qs('#settingsContent');
  
  if (settingsToggle && settingsContent) {
    settingsToggle.addEventListener('click', () => {
      const isExpanded = settingsToggle.getAttribute('aria-expanded') === 'true';
      settingsToggle.setAttribute('aria-expanded', !isExpanded);
      settingsContent.hidden = isExpanded;
    });
  }

  // Advanced settings toggle
  const advancedToggle = qs('#advancedToggle');
  const advancedSettings = qs('#advancedSettings');
  
  if (advancedToggle && advancedSettings) {
    advancedToggle.addEventListener('click', () => {
      const isExpanded = advancedToggle.getAttribute('aria-expanded') === 'true';
      advancedToggle.setAttribute('aria-expanded', !isExpanded);
      advancedSettings.hidden = isExpanded;
    });
  }

  // Penalty row toggle based on negative marks checkbox
  const negativeMarksCheckbox = qs('input[name="scoringMode"][value="negative"]');
  const penaltyRow = qs('#penaltyRow');
  
  if (negativeMarksCheckbox && penaltyRow) {
    negativeMarksCheckbox.addEventListener('change', () => {
      penaltyRow.hidden = !negativeMarksCheckbox.checked;
    });
    
    // Also handle the AI form's negativeMarks checkbox if it exists
    const aiNegativeMarks = qs('#negativeMarks');
    if (aiNegativeMarks) {
      aiNegativeMarks.addEventListener('change', () => {
        penaltyRow.hidden = !aiNegativeMarks.checked;
        // Sync the radio buttons
        if (aiNegativeMarks.checked) {
          qs('input[name="scoringMode"][value="negative"]').checked = true;
        } else {
          qs('input[name="scoringMode"][value="positive"]').checked = true;
        }
      });
    }
  }

  // Form submission
  const form = qs('#createForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  // Generate button
  const generateBtn = qs('#generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerate);
  }

  // Add question button
  const addQuestionBtn = qs('#addQuestionBtn');
  if (addQuestionBtn) {
    addQuestionBtn.addEventListener('click', () => {
      const question = createEmptyQuestion();
      renderQuestionEditor(question);
      updateSaveButton();
    });
  }

  // Save button
  const saveBtn = qs('#saveQuizBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSubmit);
  }

  // Initialize form state
  updateSaveButton();
}

document.addEventListener('DOMContentLoaded', init);


