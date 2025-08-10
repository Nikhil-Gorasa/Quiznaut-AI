// Home page quiz fetching and display functionality
import { supabaseClient } from './supabaseClient.js';

// DOM elements
const quizzesContainer = document.getElementById('quizzesContainer');

// Initialize the quizzes section
async function initQuizzes() {
  if (!quizzesContainer) return;
  
  try {
    await loadQuizzes();
  } catch (error) {
    console.error('Failed to initialize quizzes:', error);
    showErrorState('Failed to load quizzes. Please try again later.');
  }
}

// Load quizzes from Supabase
async function loadQuizzes() {
  showLoadingState();
  
  if (!supabaseClient) {
    console.error('Supabase client not initialized');
    console.error('Debug info:', {
      windowSupabase: !!window.supabase,
      windowSupabaseUrl: !!window.SUPABASE_URL,
      windowSupabaseKey: !!window.SUPABASE_ANON_KEY,
      supabaseClient: supabaseClient
    });
    showErrorState('Database connection failed. Please check your configuration.');
    return;
  }
  
  try {
    const { data: quizzes, error } = await supabaseClient
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    if (!quizzes || quizzes.length === 0) {
      showEmptyState();
      return;
    }
    
    displayQuizzes(quizzes);
  } catch (error) {
    console.error('Error loading quizzes:', error);
    showErrorState('Failed to load quizzes. Please try again later.');
  }
}

// Display quizzes in the grid
function displayQuizzes(quizzes) {
  const quizCards = quizzes.map(quiz => createQuizCard(quiz)).join('');
  quizzesContainer.innerHTML = quizCards;
  
  // Add event listeners to the new cards
  addQuizCardListeners();
}

// Create a quiz card element
function createQuizCard(quiz) {
  const difficultyClass = getDifficultyClass(quiz.difficulty || 'medium');
  const difficultyText = (quiz.difficulty || 'medium').toUpperCase();
  const questionCount = quiz.questions?.length || 0;
  const createdDate = new Date(quiz.created_at).toLocaleDateString();
  
  return `
    <div class="quiz-card" data-quiz-id="${quiz.id}">
      <div class="quiz-header">
        <div>
          <h3 class="quiz-title">${escapeHtml(quiz.title || 'Untitled Quiz')}</h3>
          <p class="quiz-topic">${escapeHtml(quiz.topic || 'General Knowledge')}</p>
        </div>
        <span class="quiz-difficulty ${difficultyClass}">${difficultyText}</span>
      </div>
      
      <div class="quiz-meta">
        <div class="quiz-meta-item">
          <span class="quiz-meta-icon">📝</span>
          <span>${questionCount} questions</span>
        </div>
        <div class="quiz-meta-item">
          <span class="quiz-meta-icon">📅</span>
          <span>${createdDate}</span>
        </div>
      </div>
      
      <div class="quiz-actions">
        <a href="/quiz-start.html?id=${quiz.id}" class="quiz-btn quiz-btn-primary">
          <span>🎯</span>
          <span>Take Quiz</span>
        </a>
        <button class="quiz-btn quiz-btn-secondary share-quiz-btn" data-quiz-id="${quiz.id}">
          <span>🔗</span>
          <span>Share</span>
        </button>
      </div>
    </div>
  `;
}

// Get difficulty class for styling
function getDifficultyClass(difficulty) {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'easy';
    case 'hard': return 'hard';
    default: return 'medium';
  }
}

// Add event listeners to quiz cards
function addQuizCardListeners() {
  // Share button listeners
  const shareButtons = document.querySelectorAll('.share-quiz-btn');
  shareButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const quizId = button.getAttribute('data-quiz-id');
      shareQuiz(quizId);
    });
  });
}

// Share quiz functionality
async function shareQuiz(quizId) {
  const shareUrl = `${window.location.origin}/html/quiz-start.html?id=${quizId}`;
  
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'Take this quiz!',
        text: 'Check out this awesome quiz I found!',
        url: shareUrl
      });
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      showShareSuccess();
    }
  } catch (error) {
    console.error('Error sharing quiz:', error);
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      showShareSuccess();
    } catch (clipboardError) {
      console.error('Clipboard fallback failed:', clipboardError);
      showShareError();
    }
  }
}

// Show share success message
function showShareSuccess() {
  const toast = document.createElement('div');
  toast.className = 'toast success';
  toast.textContent = 'Quiz link copied to clipboard!';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #22c55e;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Show share error message
function showShareError() {
  const toast = document.createElement('div');
  toast.className = 'toast error';
  toast.textContent = 'Failed to share quiz. Please try again.';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Show loading state
function showLoadingState() {
  quizzesContainer.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading available quizzes...</p>
    </div>
  `;
}

// Show empty state
function showEmptyState() {
  quizzesContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📚</div>
      <h3>No quizzes available yet</h3>
      <p>Be the first to create an amazing quiz!</p>
      <a href="./create.html" class="btn btn-primary" style="margin-top: 1rem;">Create Quiz</a>
    </div>
  `;
}

// Show error state
function showErrorState(message) {
  quizzesContainer.innerHTML = `
    <div class="error-state">
      <div class="error-state-icon">⚠️</div>
      <h3>Oops! Something went wrong</h3>
      <p>${message}</p>
      <button class="retry-btn" onclick="location.reload()">Try Again</button>
    </div>
  `;
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add CSS animations for toasts
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initQuizzes);
