/* Simple English -> Telugu learning app
   Data stored in localStorage:
   key = 'engTeluguData' (word dataset)
   key = 'engTeluguProgress' (known words and quiz history)
*/

// ---------- sample dataset ----------
const WORDS = [
  { id: 'w1', en: 'Hello', te: 'హలో', tr: 'halō' },
  { id: 'w2', en: 'Thank you', te: 'ధన్యవాదాలు', tr: 'dhanyavādālu' },
  { id: 'w3', en: 'Water', te: 'నీళ్లు', tr: 'nīḷḷu' },
  { id: 'w4', en: 'Food', te: 'ఆహారం', tr: 'āhāraṁ' },
  { id: 'w5', en: 'How are you?', te: 'మీరు ఎలా ఉన్నారు?', tr: 'mīru elā unnāru?' },
  { id: 'w6', en: 'Yes', te: 'అవును', tr: 'avunu' },
  { id: 'w7', en: 'No', te: 'లేదు', tr: 'lēdu' },
  { id: 'w8', en: 'Good morning', te: 'శుభోదయం', tr: 'śubhōdayaṁ' },
  { id: 'w9', en: 'Sorry', te: 'క్షమించండి', tr: 'kṣamin̄caṇḍi' },
  { id: 'w10', en: 'Please', te: 'దయచేసి', tr: 'dayacēsi' }
];

// ---------- persistence ----------
const PROG_KEY = 'engTeluguProgress';
function loadProgress(){
  try{ return JSON.parse(localStorage.getItem(PROG_KEY) || '{}'); }
  catch(e){ return {}; }
}
function saveProgress(p){ localStorage.setItem(PROG_KEY, JSON.stringify(p)); }

// initialize progress
let progress = loadProgress();
if(!progress.known) progress.known = []; // array of ids
if(!progress.quizzes) progress.quizzes = []; // {date, score, total}

// ---------- UI refs ----------
const tabFlash = document.getElementById('tabFlash');
const tabDaily = document.getElementById('tabDaily');
const tabQuiz = document.getElementById('tabQuiz');
const tabProgress = document.getElementById('tabProgress');

const flashSection = document.getElementById('flashSection');
const dailySection = document.getElementById('dailySection');
const quizSection = document.getElementById('quizSection');
const progressSection = document.getElementById('progressSection');

const cardInner = document.getElementById('cardInner');
const frontText = document.getElementById('frontText');
const backText = document.getElementById('backText');
const translit = document.getElementById('transliteration');

const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const flipBtn = document.getElementById('flipBtn');
const speakBtn = document.getElementById('speakBtn');
const markKnownBtn = document.getElementById('markKnown');

const dailyInner = document.getElementById('dailyInner');
const dailyFront = document.getElementById('dailyFront');
const dailyBack = document.getElementById('dailyBack');
const dailyFlip = document.getElementById('dailyFlip');
const dailySpeak = document.getElementById('dailySpeak');
const dailyMarkKnown = document.getElementById('dailyMarkKnown');

const startQuizBtn = document.getElementById('startQuiz');
const questionText = document.getElementById('questionText');
const choicesBox = document.getElementById('choices');
const nextQuestionBtn = document.getElementById('nextQuestion');
const quizResult = document.getElementById('quizResult');

const knownCount = document.getElementById('knownCount');
const totalCount = document.getElementById('totalCount');
const knownList = document.getElementById('knownList');
const quizHistory = document.getElementById('quizHistory');

let index = 0; // flashcard index
let quizState = null; // {ques:[], i, score}

// ---------- helpers ----------
function showPanel(panel){
  flashSection.classList.add('hidden');
  dailySection.classList.add('hidden');
  quizSection.classList.add('hidden');
  progressSection.classList.add('hidden');
  panel.classList.remove('hidden');
}
tabFlash.addEventListener('click', ()=> showPanel(flashSection));
tabDaily.addEventListener('click', ()=> showPanel(dailySection));
tabQuiz.addEventListener('click', ()=> showPanel(quizSection));
tabProgress.addEventListener('click', ()=> showPanel(progressSection));

// flashcards
function renderCard(i){
  const w = WORDS[i];
  frontText.textContent = w.en;
  backText.textContent = w.te;
  translit.textContent = w.tr;
  cardInner.classList.remove('flipped');
  markKnownBtn.textContent = progress.known.includes(w.id) ? 'Known ✅' : 'Mark Known ✅';
}
prevBtn.addEventListener('click', ()=>{
  index = (index - 1 + WORDS.length) % WORDS.length;
  renderCard(index);
});
nextBtn.addEventListener('click', ()=>{
  index = (index + 1) % WORDS.length;
  renderCard(index);
});
flipBtn.addEventListener('click', ()=> cardInner.classList.toggle('flipped'));

// speech (try Telugu)
function speak(text, lang='te-IN'){
  try{
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    // some browsers require selecting a voice; we try to pick a Telugu voice if available
    const voices = speechSynthesis.getVoices();
    const tel = voices.find(v=>v.lang && v.lang.startsWith('te'));
    if(tel) u.voice = tel;
    speechSynthesis.speak(u);
  }catch(e){ console.warn('speech error', e); }
}
speakBtn.addEventListener('click', ()=> speak(backText.textContent, 'te-IN'));
dailySpeak.addEventListener('click', ()=> speak(dailyBack.textContent, 'te-IN'));

// mark known
markKnownBtn.addEventListener('click', ()=>{
  const id = WORDS[index].id;
  if(!progress.known.includes(id)) progress.known.push(id);
  saveProgress(progress);
  renderProgress();
  renderCard(index);
});
dailyMarkKnown.addEventListener('click', ()=>{
  const id = getDailyWord().id;
  if(!progress.known.includes(id)) progress.known.push(id);
  saveProgress(progress);
  renderProgress();
});

// daily lesson logic (one-per-day cycle)
function getDailyWord(){
  const start = new Date('2025-01-01'); // fixed anchor
  const today = new Date();
  const days = Math.floor((today - start)/ (24*3600*1000));
  const idx = days % WORDS.length;
  return WORDS[idx];
}
function renderDaily(){
  const w = getDailyWord();
  dailyFront.textContent = w.en;
  dailyBack.textContent = w.te;
  dailyInner.classList.remove('flipped');
}
dailyFlip.addEventListener('click', ()=> dailyInner.classList.toggle('flipped'));

// PROGRESS
function renderProgress(){
  knownCount.textContent = progress.known.length;
  totalCount.textContent = WORDS.length;
  knownList.innerHTML = '';
  progress.known.forEach(id=>{
    const w = WORDS.find(x=>x.id===id);
    if(w){ const span = document.createElement('span'); span.className='tag'; span.textContent = w.en + ' — ' + w.te; knownList.appendChild(span); }
  });
  quizHistory.innerHTML = '';
  progress.quizzes.slice().reverse().forEach(q=>{
    const li = document.createElement('li');
    li.textContent = `${q.date} — ${q.score}/${q.total}`;
    quizHistory.appendChild(li);
  });
}

// QUIZ: simple 5 questions (EN->choose correct Telugu)
function startQuiz(){
  // generate question indices
  const pool = [...WORDS];
  shuffle(pool);
  const questions = pool.slice(0, Math.min(5, pool.length));
  quizState = { ques: questions, i: 0, score: 0 };
  startQuizBtn.classList.add('hidden');
  nextQuestionBtn.classList.remove('hidden');
  quizResult.classList.add('hidden');
  renderQuizQuestion();
}
function renderQuizQuestion(){
  const q = quizState.ques[quizState.i];
  questionText.textContent = `Translate: "${q.en}"`;
  // prepare choices
  const choices = [q].concat(randomChoices(q.id,3));
  shuffle(choices);
  choicesBox.innerHTML = '';
  choices.forEach(ch=>{
    const btn = document.createElement('button');
    btn.className='choiceBtn';
    btn.textContent = ch.te;
    btn.onclick = ()=>{
      if(ch.id === q.id){
        btn.classList.add('correct'); quizState.score++;
      } else {
        btn.classList.add('wrong');
        // highlight correct
        const correctBtn = Array.from(choicesBox.children).find(b=> b.textContent === q.te);
        if(correctBtn) correctBtn.classList.add('correct');
      }
      // disable others
      Array.from(choicesBox.children).forEach(b=>b.disabled=true);
    };
    choicesBox.appendChild(btn);
  });
}
nextQuestionBtn.addEventListener('click', ()=>{
  if(quizState.i < quizState.ques.length - 1){
    quizState.i++;
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
});
function finishQuiz(){
  const date = new Date().toLocaleDateString();
  progress.quizzes.push({date, score: quizState.score, total: quizState.ques.length});
  saveProgress(progress);
  quizResult.classList.remove('hidden');
  quizResult.textContent = `Quiz done — Score: ${quizState.score}/${quizState.ques.length}`;
  startQuizBtn.classList.remove('hidden');
  nextQuestionBtn.classList.add('hidden');
  renderProgress();
}

// utils
function randomChoices(excludeId, count){
  const pool = WORDS.filter(w=>w.id !== excludeId);
  shuffle(pool);
  return pool.slice(0, count);
}
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; } }

// start / init
function init(){
  renderCard(index);
  renderDaily();
  renderProgress();
  // hooks
  startQuizBtn.addEventListener('click', startQuiz);
}
init();
