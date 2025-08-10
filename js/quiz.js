/*
  Quiz taker page logic
  - Reads ?id= from URL
  - Loads quiz from Supabase
  - Renders questions one-by-one and tracks score
*/

import { supabaseClient } from './supabaseClient.js';

const qs = (sel, el = document) => el.querySelector(sel);

const state = {
  quiz: null,
  currentIndex: 0,
  selectedIndex: null,
  correctCount: 0,
  score: 0,
};

const getIdFromUrl = () => new URLSearchParams(window.location.search).get('id');

const showError = (msg) => {
  qs('#loader').hidden = true;
  const box = qs('#error');
  box.textContent = msg;
  box.hidden = false;
};

const renderMeta = (quiz) => {
  qs('#quiz-title').textContent = quiz.title || 'Untitled Quiz';
  const meta = [];
  if (quiz.topic) meta.push(quiz.topic);
  if (quiz.difficulty) meta.push(quiz.difficulty);
  qs('#quizMeta').textContent = meta.join(' • ');
};

const renderQuestion = () => {
  const { quiz, currentIndex } = state;
  const total = quiz.questions.length;
  const question = quiz.questions[currentIndex];

  qs('#quizBody').hidden = false;
  qs('#result').hidden = true;
  qs('#loader').hidden = true;
  qs('#error').hidden = true;

  qs('#progressText').textContent = `Question ${currentIndex + 1} of ${total}`;
  const pct = Math.round(((currentIndex) / total) * 100);
  qs('#progressFill').style.width = `${pct}%`;

  qs('#questionText').textContent = question.text;

  const optionsForm = qs('#optionsForm');
  optionsForm.innerHTML = '';
  question.options.forEach((opt, idx) => {
    const row = document.createElement('label');
    row.className = 'option-row';
    row.innerHTML = `
      <input type="radio" name="option" value="${idx}" />
      <span>${opt}</span>
    `;
    optionsForm.appendChild(row);
  });

  state.selectedIndex = null;
  optionsForm.addEventListener('change', (e) => {
    const input = e.target;
    if (input && input.name === 'option') {
      state.selectedIndex = Number(input.value);
    }
  }, { once: true });

  const nextBtn = qs('#nextBtn');
  nextBtn.textContent = currentIndex === total - 1 ? 'Finish' : 'Next';
  nextBtn.onclick = handleNext;
};

const handleNext = () => {
  const { quiz, currentIndex, selectedIndex } = state;
  const mustAnswer = !!(quiz.settings && quiz.settings.requireAnswer);
  if (mustAnswer && selectedIndex == null) {
    showToast('Please select an option.');
    return;
  }
  const q = quiz.questions[currentIndex];
  const marks = Number(q.marks || 1);
  const enableNegative = !!(quiz.settings && quiz.settings.enableNegative);
  const penalty = Number((quiz.settings && quiz.settings.penalty) || 0);

  if (selectedIndex != null && selectedIndex === q.correctIndex) {
    state.correctCount += 1;
    state.score += marks;
  } else {
    state.score += enableNegative ? -penalty : 0;
  }

  if (currentIndex < quiz.questions.length - 1) {
    state.currentIndex += 1;
    renderQuestion();
  } else {
    renderResult();
  }
};

const renderResult = () => {
  qs('#quizBody').hidden = true;
  const result = qs('#result');
  result.hidden = false;
  const total = state.quiz.questions.length;
  const totalMarks = state.quiz.questions.reduce((sum, q) => sum + Number(q.marks || 1), 0);
  const scoreText = qs('#scoreText');
  const ratio = totalMarks ? (state.score / totalMarks) : (state.correctCount / total);
  scoreText.innerHTML = `You scored <strong class="${ratio >= 0.6 ? 'score-ok' : 'score-bad'}">${state.score} / ${totalMarks}</strong> (<span>${state.correctCount} correct of ${total}</span>)`;
  qs('#retakeBtn').onclick = () => {
    state.currentIndex = 0;
    state.correctCount = 0;
    state.score = 0;
    renderQuestion();
  };
};

const showToast = (msg) => {
  // Minimal inline toast via status text under Next button
  let toast = document.getElementById('inlineToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'inlineToast';
    toast.className = 'status';
    qs('.quiz-actions').appendChild(toast);
  }
  toast.textContent = msg;
  setTimeout(() => (toast.textContent = ''), 1500);
};

const init = async () => {
  const id = getIdFromUrl();
  if (!id) {
    showError('No quiz id provided. Use ?id=YOUR_ID');
    return;
  }
  if (!supabaseClient) {
    showError('Supabase not initialized.');
    return;
  }
  try {
    const { data, error } = await supabaseClient
      .from('quizzes')
      .select('id, title, topic, difficulty, questions')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      showError('Quiz not found.');
      return;
    }
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      showError('Quiz has no questions.');
      return;
    }
    state.quiz = data;
    renderMeta(data);
    renderQuestion();
  } catch (err) {
    console.error(err);
    showError('Error loading quiz. Check console and Supabase policies.');
  }
};

document.addEventListener('DOMContentLoaded', init);


