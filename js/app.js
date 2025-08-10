/*
  Landing + Quiz Creator logic (vanilla JS)
  - Manages UI interactions for create form
  - Persists quiz to Supabase
  - Generates shareable URL
*/

import { supabaseClient } from './supabaseClient.js';

// ----- Utilities -----
const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

/** Generate a client-side unique ID (fallback). Supabase can also return row id. */
const generateId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10);

/** Create an empty question model */
const createQuestionModel = () => ({
  id: generateId(),
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
});

/** Serialize form into quiz object */
const serializeQuiz = () => {
  const title = qs('#title').value.trim();
  const topic = qs('#topic').value.trim();
  const difficulty = qs('#difficulty').value;
  const questionCards = qsa('.question-card');

  const questions = questionCards.map((card) => {
    const text = qs('.q-text', card).value.trim();
    const optionInputs = qsa('.q-option', card).map((i) => i.value.trim());
    const correctIndex = Number(qs('.q-answer', card).value);
    return { text, options: optionInputs, correctIndex };
  }).filter(q => q.text && q.options.some(Boolean));

  return { title, topic, difficulty, questions };
};

/** Basic form validation */
const validateQuiz = (quiz) => {
  if (!quiz.title) return 'Title is required.';
  if (!quiz.questions.length) return 'Add at least one question.';
  for (const [idx, q] of quiz.questions.entries()) {
    if (q.options.length < 2 || q.options.filter(Boolean).length < 2) {
      return `Question ${idx + 1}: provide at least two options.`;
    }
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length || !q.options[q.correctIndex]) {
      return `Question ${idx + 1}: select a valid correct option.`;
    }
  }
  return null;
};

/** Render a question editor card */
const renderQuestionCard = (model) => {
  const container = qs('#questionsContainer');
  const card = document.createElement('div');
  card.className = 'card question-card';
  card.dataset.id = model.id;
  card.innerHTML = `
    <div class="question-grid">
      <div class="field">
        <label>Question<span class="req">*</span></label>
        <input class="q-text" type="text" placeholder="e.g., What does DOM stand for?" />
      </div>
      <div class="options-grid">
        ${model.options.map((_, i) => `
          <div class="field">
            <label>Option ${i + 1}</label>
            <input class="q-option" type="text" placeholder="Enter option" />
          </div>
        `).join('')}
      </div>
      <div class="field">
        <label>Correct Option Index (0-${model.options.length - 1})</label>
        <input class="q-answer" type="number" min="0" max="${model.options.length - 1}" value="0" />
      </div>
      <div class="inline-actions">
        <button type="button" class="btn btn-secondary" data-action="add-option">Add option</button>
        <button type="button" class="btn btn-ghost" data-action="remove">Remove question</button>
      </div>
    </div>
  `;

  // Wire up actions
  card.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    if (action === 'remove') {
      card.remove();
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
      answerInput.max = String(count); // update max index
    }
  });

  container.appendChild(card);
};

// ----- Event bindings -----
const init = () => {
  // Jump to create form from header and hero
  qs('#jumpCreate')?.addEventListener('click', () => {
    document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' });
  });
  qs('#createQuizBtn')?.addEventListener('click', () => {
    document.getElementById('create')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Add first question by default
  renderQuestionCard(createQuestionModel());

  qs('#addQuestionBtn')?.addEventListener('click', () => {
    renderQuestionCard(createQuestionModel());
  });

  qs('#quizForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = qs('#formStatus');
    status.textContent = 'Saving…';

    const quiz = serializeQuiz();
    const invalid = validateQuiz(quiz);
    if (invalid) {
      status.textContent = invalid;
      return;
    }

    try {
      const id = generateId();
      const row = {
        id,
        title: quiz.title,
        topic: quiz.topic || null,
        difficulty: quiz.difficulty,
        questions: quiz.questions,
        created_at: new Date().toISOString(),
      };

      if (!supabaseClient) throw new Error('Supabase not initialized');
      const { error } = await supabaseClient.from('quizzes').insert(row);
      if (error) throw error;

      const shareUrl = new URL('/html/quiz-start.html', window.location.origin);
      shareUrl.searchParams.set('id', id);

      const shareBlock = qs('#shareBlock');
      const shareEl = qs('#shareUrl');
      const openLink = qs('#openQuizLink');
      shareEl.textContent = shareUrl.toString();
      openLink.href = shareUrl.toString();
      shareBlock.hidden = false;
      status.textContent = 'Saved! Share your link below.';

      qs('#copyUrlBtn')?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(shareUrl.toString());
          status.textContent = 'Copied to clipboard!';
        } catch (_) {
          status.textContent = 'Could not copy. Select and copy manually.';
        }
      }, { once: true });

    } catch (err) {
      console.error(err);
      qs('#formStatus').textContent = 'Error saving quiz. Check console and Supabase setup.';
    }
  });
};

document.addEventListener('DOMContentLoaded', init);


