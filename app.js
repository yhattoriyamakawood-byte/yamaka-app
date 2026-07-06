// ===== ヤマカ木材 育成アプリ ロジック =====

var selectedCategoryKey = 'product';
var selectedCategoryName = '自社商品';

var CATEGORY_NAMES = {
  product: '自社商品',
  architecture: '建築',
  land: '土地',
  money: 'お金',
  manner: 'ビジネスマナー',
  mind: 'マインド'
};

// 現在の出題セッション状態
var quizSession = {
  catKey: null,
  questions: [],
  index: 0,
  correctCount: 0,
  lastMode: null,
  lastSetIndex: null,
  sourceLabel: null
};

// 現在選択中の出題データソース
var currentDataSource = null;
var currentSourceLabel = '一問一答';
var currentSelectionType = 'genre';

var SET_SIZE = 10;

// ===== 画面遷移 =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  document.getElementById('screen-' + id).classList.add('active');
  var fab = document.querySelector('.fab');
  if (fab) { fab.style.display = (id === 'qa-list') ? 'flex' : 'none'; }
  window.scrollTo(0, 0);
}

function doLogin() {
  document.getElementById('app').classList.add('logged-in');
  navigate('home', document.querySelector('.nav-item[data-nav="home"]'));
}

function navigate(id, btnEl) {
  showScreen(id);
  if (btnEl) {
    document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.remove('active'); });
    btnEl.classList.add('active');
  }
}

function goHome() { navigate('home', document.querySelector('.nav-item[data-nav="home"]')); }
function goMypage() { navigate('mypage', document.querySelector('.nav-item[data-nav="mypage"]')); }
function goCategoryHub() { navigate('category', document.querySelector('.nav-item[data-nav="quiz"]')); }

function goFormat(catKey) {
  selectedCategoryKey = catKey;
  selectedCategoryName = CATEGORY_NAMES[catKey] || catKey;
  document.getElementById('format-cat-name').textContent = selectedCategoryName;
  navigate('format', document.querySelector('.nav-item[data-nav="quiz"]'));
}

// ===== ユーティリティ =====
function shuffleArray(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// ===== セット選択（ケーススタディ用：10問単位） =====
function goSetSelection(dataSource, sourceLabel) {
  currentDataSource = dataSource;
  currentSourceLabel = sourceLabel;
  currentSelectionType = 'set';

  var bank = dataSource[selectedCategoryKey] || [];
  document.getElementById('quiz-sets-cat-name').textContent = selectedCategoryName + '・' + sourceLabel;
  var listEl = document.getElementById('quiz-sets-list');
  listEl.innerHTML = '';

  if (bank.length === 0) {
    var emptyCard = document.createElement('div');
    emptyCard.className = 'format-card';
    emptyCard.innerHTML =
      '<div class="ic" style="background:var(--surface); color:var(--grey);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 8l9-5 9 5M12 12v9" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<div><div class="t">準備中</div><div class="s">このカテゴリの問題は近日公開予定です</div></div>';
    listEl.appendChild(emptyCard);
    navigate('quiz-sets', document.querySelector('.nav-item[data-nav="quiz"]'));
    return;
  }

  var totalSets = Math.ceil(bank.length / SET_SIZE);
  var setIconPaths = [
    '<circle cx="12" cy="12" r="3.2"/>',
    '<rect x="7" y="7" width="10" height="10" rx="2"/>',
    '<path d="M12 4l8 8-8 8-8-8z"/>',
    '<path d="M12 3v18M3 12h18" stroke-linecap="round"/>'
  ];
  var colors = [
    { bg: 'var(--accent-wash)', fg: 'var(--accent-deep)' },
    { bg: 'var(--blue-wash)', fg: '#3E6FE0' },
    { bg: 'var(--green-wash)', fg: '#16803D' },
    { bg: 'var(--purple-wash)', fg: '#7C3AED' }
  ];

  for (var s = 0; s < totalSets; s++) {
    var start = s * SET_SIZE + 1;
    var end = Math.min((s + 1) * SET_SIZE, bank.length);
    var count = end - start + 1;
    var color = colors[s % colors.length];
    var iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + setIconPaths[s % setIconPaths.length] + '</svg>';

    var card = document.createElement('div');
    card.className = 'format-card tap';
    card.onclick = (function(setIndex) { return function() { startQuiz('set', setIndex); }; })(s);
    card.innerHTML =
      '<div class="ic" style="background:' + color.bg + '; color:' + color.fg + ';">' + iconSvg + '</div>' +
      '<div><div class="t">セット' + (s + 1) + '（' + start + '〜' + end + '問目）</div><div class="s">全' + count + '問・約' + count + '分</div></div>' +
      '<div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
    listEl.appendChild(card);
  }

  if (bank.length > SET_SIZE) {
    var randomCard = document.createElement('div');
    randomCard.className = 'format-card tap';
    randomCard.onclick = function() { startQuiz('random'); };
    randomCard.innerHTML =
      '<div class="ic" style="background:var(--surface); color:var(--ink);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<div><div class="t">ランダム10問</div><div class="s">全' + bank.length + '問からおまかせで出題</div></div>' +
      '<div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
    listEl.appendChild(randomCard);
  }

  navigate('quiz-sets', document.querySelector('.nav-item[data-nav="quiz"]'));
}

// ===== ジャンル選択（一問一答用） =====
var GENRE_ICON_PATHS = [
  '<circle cx="12" cy="12" r="3.2"/>',
  '<rect x="7" y="7" width="10" height="10" rx="2"/>',
  '<path d="M12 4l8 8-8 8-8-8z"/>',
  '<path d="M12 3v18M3 12h18" stroke-linecap="round"/>',
  '<path d="M4 12h16M12 4v16" stroke-linecap="round"/>',
  '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/>',
  '<path d="M5 12l5 5L19 7" stroke-linecap="round" stroke-linejoin="round"/>',
  '<path d="M12 2l3.5 7.5L22 11l-5.5 4.8L18 22l-6-3.8L6 22l1.5-6.2L2 11l6.5-1.5z" stroke-linejoin="round"/>'
];
var GENRE_COLORS = [
  { bg: 'var(--accent-wash)', fg: 'var(--accent-deep)' },
  { bg: 'var(--blue-wash)', fg: '#3E6FE0' },
  { bg: 'var(--green-wash)', fg: '#16803D' },
  { bg: 'var(--purple-wash)', fg: '#7C3AED' }
];

function goQuizGenres() {
  currentDataSource = null;
  currentSourceLabel = '一問一答';
  currentSelectionType = 'genre';

  var genreMap = GENRE_QUIZ_DATA[selectedCategoryKey] || {};
  var genreNames = Object.keys(genreMap);
  document.getElementById('quiz-sets-cat-name').textContent = selectedCategoryName + '・一問一答';
  var listEl = document.getElementById('quiz-sets-list');
  listEl.innerHTML = '';

  if (genreNames.length === 0) {
    var emptyCard = document.createElement('div');
    emptyCard.className = 'format-card';
    emptyCard.innerHTML =
      '<div class="ic" style="background:var(--surface); color:var(--grey);"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 8l9-5 9 5M12 12v9" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<div><div class="t">準備中</div><div class="s">このカテゴリの問題は近日公開予定です</div></div>';
    listEl.appendChild(emptyCard);
    navigate('quiz-sets', document.querySelector('.nav-item[data-nav="quiz"]'));
    return;
  }

  genreNames.forEach(function(genreName, i) {
    var questions = genreMap[genreName] || [];
    var count = questions.length;
    if (count === 0) return; // 空ジャンルはスキップ
    var color = GENRE_COLORS[i % GENRE_COLORS.length];
    var iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + GENRE_ICON_PATHS[i % GENRE_ICON_PATHS.length] + '</svg>';

    var card = document.createElement('div');
    card.className = 'format-card tap';
    card.onclick = (function(gName) { return function() { startQuiz('genre', gName); }; })(genreName);
    card.innerHTML =
      '<div class="ic" style="background:' + color.bg + '; color:' + color.fg + ';">' + iconSvg + '</div>' +
      '<div><div class="t">' + genreName + '</div><div class="s">全' + count + '問</div></div>' +
      '<div class="chev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
    listEl.appendChild(card);
  });

  navigate('quiz-sets', document.querySelector('.nav-item[data-nav="quiz"]'));
}

function goBackToSetSelection() {
  if (currentSelectionType === 'genre') {
    goQuizGenres();
  } else {
    goSetSelection(currentDataSource || CASE_STUDY_DATA, currentSourceLabel);
  }
}

function goQuizSets() { goQuizGenres(); }
function goCaseStudySets() { goSetSelection(CASE_STUDY_DATA, 'ケーススタディ'); }

// ===== クイズ開始 =====
function startQuiz(mode, identifier) {
  var bank;

  if (mode === 'genre') {
    var genreMap = GENRE_QUIZ_DATA[selectedCategoryKey] || {};
    bank = genreMap[identifier] || [];
  } else if (mode === 'random-all') {
    var allGenres = GENRE_QUIZ_DATA[selectedCategoryKey] || {};
    bank = [];
    Object.keys(allGenres).forEach(function(g) { bank = bank.concat(allGenres[g]); });
  } else {
    var dataSource = currentDataSource || CASE_STUDY_DATA;
    bank = dataSource[selectedCategoryKey] || [];
  }

  var questions;

  if (!bank || bank.length === 0) {
    questions = [{
      tag: selectedCategoryName,
      q: 'このカテゴリの問題は近日公開予定です。他のカテゴリ（建築・土地・お金・マナー・マインド）をお試しください。',
      choices: ['了解しました', 'わかりました', 'OK', '次へ'],
      correct: 0,
      exp: '自社商品カテゴリの問題は準備中です。公開までお待ちください。'
    }];
  } else if (mode === 'genre') {
    questions = shuffleArray(bank);
  } else if (mode === 'random-all') {
    questions = shuffleArray(bank).slice(0, SET_SIZE);
  } else if (mode === 'set' && typeof identifier === 'number') {
    var start = identifier * SET_SIZE;
    var end = Math.min(start + SET_SIZE, bank.length);
    questions = shuffleArray(bank.slice(start, end));
  } else {
    questions = shuffleArray(bank).slice(0, SET_SIZE);
  }

  quizSession.catKey = selectedCategoryKey;
  quizSession.questions = questions;
  quizSession.index = 0;
  quizSession.correctCount = 0;
  quizSession.lastMode = mode;
  quizSession.lastSetIndex = identifier;
  quizSession.sourceLabel = currentSourceLabel;

  navigate('quiz', document.querySelector('.nav-item[data-nav="quiz"]'));
  renderQuestion();
}

function quickStartQuiz(catKey) {
  goFormat(catKey);
  currentDataSource = null;
  currentSourceLabel = '一問一答';
  startQuiz('random-all');
}

function retryQuiz() { startQuiz(quizSession.lastMode, quizSession.lastSetIndex); }
function exitQuiz() { navigate('quiz-sets', document.querySelector('.nav-item[data-nav="quiz"]')); }

// ===== 問題描画 =====
function renderQuestion() {
  var total = quizSession.questions.length;
  var current = quizSession.questions[quizSession.index];

  document.getElementById('quiz-tag').textContent = current.tag || selectedCategoryName;
  document.getElementById('quiz-question').textContent = current.q;
  document.getElementById('quiz-counter').textContent = (quizSession.index + 1) + ' / ' + total;
  document.getElementById('quiz-progress').style.width = Math.round((quizSession.index / total) * 100) + '%';

  var listEl = document.getElementById('choice-list');
  listEl.innerHTML = '';
  var marks = ['A', 'B', 'C', 'D'];
  current.choices.forEach(function(choiceText, i) {
    var div = document.createElement('div');
    div.className = 'choice tap';
    div.setAttribute('data-correct', (i === current.correct) ? 'true' : 'false');
    div.onclick = function() { selectChoice(div); };
    div.innerHTML = '<div class="mark">' + marks[i] + '</div><div>' + choiceText + '</div>';
    listEl.appendChild(div);
  });

  document.getElementById('explain-body').textContent = current.exp;
  document.getElementById('explain-box').classList.remove('show');
  document.getElementById('btn-next').classList.remove('enabled');
  document.getElementById('btn-next').textContent = (quizSession.index + 1 < total) ? '次の問題へ' : '結果を見る';
}

function selectChoice(el) {
  var already = document.querySelector('#choice-list .choice.disabled');
  if (already) return;
  document.querySelectorAll('#choice-list .choice').forEach(function(c) { c.classList.add('disabled'); });
  var isCorrect = el.getAttribute('data-correct') === 'true';
  if (isCorrect) {
    el.classList.add('correct');
    quizSession.correctCount++;
  } else {
    el.classList.add('wrong');
    var correctEl = document.querySelector('#choice-list .choice[data-correct="true"]');
    if (correctEl) correctEl.classList.add('correct');
  }
  document.getElementById('explain-box').classList.add('show');
  document.getElementById('btn-next').classList.add('enabled');
}

function nextQuestion() {
  var total = quizSession.questions.length;
  if (quizSession.index + 1 < total) {
    quizSession.index++;
    renderQuestion();
  } else {
    document.getElementById('quiz-progress').style.width = '100%';
    finishQuiz();
  }
}

function finishQuiz() {
  var total = quizSession.questions.length;
  var correct = quizSession.correctCount;
  var rate = Math.round((correct / total) * 100);
  var exp = correct * 10;

  document.getElementById('quiz-done-score').innerHTML = correct + '<span>/' + total + '</span>';
  document.getElementById('quiz-done-rate').textContent = rate + '%';
  document.getElementById('quiz-done-exp').textContent = '+' + exp;
  document.getElementById('quiz-done-cat').textContent = selectedCategoryName + '・' + (quizSession.sourceLabel || 'クイズ');
  document.getElementById('quiz-done-sub').textContent =
    (rate >= 80) ? '🎉 素晴らしい結果です！' :
    (rate >= 50 ? '👍 もう少しで満点です！' : '💪 解説を読んで復習しましょう');

  navigate('quiz-done', document.querySelector('.nav-item[data-nav="quiz"]'));
}

// ===== テスト =====
function goTestIntro(title, desc) {
  document.getElementById('test-intro-title').textContent = title;
  document.getElementById('test-intro-desc').textContent = 'これまでの学習内容の理解度を確認します。' + desc + '。合格点に達するとEXPが付与されます。';
  navigate('test-intro', document.querySelector('.nav-item[data-nav="quiz"]'));
}

// ===== 質問箱 =====
function submitQuestion() { navigate('qa-list', null); }

// ===== ランキング =====
function switchRankTab(btn) {
  document.querySelectorAll('.tab-row .tab-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
}

// ===== 初期化（DOMContentLoaded） =====
document.addEventListener('DOMContentLoaded', function() {
  // QA カテゴリチップ
  document.querySelectorAll('.qa-select-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.qa-select-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
    });
  });

  // ランキングコホートチップ
  document.querySelectorAll('.cohort-row .cohort-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.cohort-row .cohort-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
    });
  });
});
