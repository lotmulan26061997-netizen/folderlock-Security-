const dropzone = document.getElementById('dropzone');
const dial = document.getElementById('dial');
const chooseBtn = document.getElementById('chooseBtn');
const vaultList = document.getElementById('vaultList');
const emptyState = document.getElementById('emptyState');
const countBadge = document.getElementById('count');
const toast = document.getElementById('toast');
const sysTimeDisplay = document.getElementById('sysTimeDisplay');

let pendingFolderPath = null;
let pendingUnlockId = null;
let currentUnlockedPath = null;

// ---- Live System Clock ----
function updateSysTime() {
  if (sysTimeDisplay) {
    const now = new Date();
    sysTimeDisplay.textContent = now.toTimeString().split(' ')[0] + '.' + Math.floor(now.getMilliseconds() / 100);
  }
}
setInterval(updateSysTime, 100);
updateSysTime();

// ---- Toast Notification ----
function showToast(msg) {
  toast.textContent = `[ SYSTEM MSG ] // ${msg}`;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ---- Cinematic Decrypting Text Animation ----
const CYBER_CHARSET = '010101010101010101010101ABCDEF#%&$<>[]{}@*!=?/';
function scrambleText(element, finalText, duration = 800) {
  const originalText = finalText;
  const length = originalText.length;
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    const revealedLength = Math.floor(progress * length);

    let result = '';
    for (let i = 0; i < length; i++) {
      if (i < revealedLength) {
        result += originalText[i];
      } else {
        result += CYBER_CHARSET[Math.floor(Math.random() * CYBER_CHARSET.length)];
      }
    }
    element.textContent = result;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

function folderIconSvg() {
  return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" stroke="currentColor" stroke-width="1.8"/>
    <rect x="8" y="11" width="8" height="6" rx="1" stroke="currentColor" stroke-width="1.5"/>
    <path d="M10 11V9.5a2 2 0 1 1 4 0V11" stroke="currentColor" stroke-width="1.5"/>
  </svg>`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---- Render Locked Folder Boxes with Cinematic Decrypt Effect ----
async function refreshList() {
  const items = await window.vault.list();
  vaultList.innerHTML = '';
  countBadge.textContent = items.length;
  emptyState.style.display = items.length === 0 ? 'block' : 'none';

  items
    .sort((a, b) => new Date(b.lockedAt) - new Date(a.lockedAt))
    .forEach((item) => {
      const li = document.createElement('li');
      li.className = 'vault-item hud-box';
      li.innerHTML = `
        <div class="corner-tick tl"></div><div class="corner-tick tr"></div>
        <div class="corner-tick bl"></div><div class="corner-tick br"></div>
        <span class="vault-item-icon">${folderIconSvg()}</span>
        <span class="vault-item-body">
          <div class="vault-item-label" id="label-${item.id}">...</div>
          <div class="vault-item-date">
            LOCKED: ${formatDate(item.lockedAt)}
            <span class="vault-item-badge">AES-256</span>
          </div>
        </span>
        <button class="btn btn-primary unlock-btn">[ UNLOCK ]</button>
      `;
      
      vaultList.appendChild(li);

      // Trigger cinematic decrypt scrambling animation for folder name
      const labelEl = li.querySelector(`#label-${item.id}`);
      scrambleText(labelEl, item.label || 'CONTAINMENT_OBJECT');

      li.querySelector('.unlock-btn').addEventListener('click', () => openUnlockModal(item));
    });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Web Audio Sound Synthesizer ----
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, dur, type, vol, delay) {
  try {
    const ac = getAudio();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, ac.currentTime + (delay || 0));
    g.gain.setValueAtTime(vol || 0.18, ac.currentTime + (delay || 0));
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (delay || 0) + dur);
    o.start(ac.currentTime + (delay || 0));
    o.stop(ac.currentTime + (delay || 0) + dur + 0.05);
  } catch (e) {}
}

function sndKey() { playTone(1200 + Math.random() * 300, 0.03, 'square', 0.04); }
function sndFieldIn() { playTone(600, 0.08, 'sine', 0.1); playTone(900, 0.1, 'sine', 0.08, 0.06); }
function sndSuccess() { [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => playTone(f, 0.15, 'triangle', 0.15, i * 0.07)); }
function sndDenied() { playTone(180, 0.18, 'sawtooth', 0.22); playTone(140, 0.25, 'sawtooth', 0.22, 0.12); }

document.addEventListener('keydown', (e) => {
  const inCyber = (!lockScreen.classList.contains('hidden')) || 
                 (!unlockScreen.classList.contains('hidden')) || 
                 (!terminalScreen.classList.contains('hidden'));
  if (inCyber && e.key.length === 1) sndKey();
  if (e.key === 'Escape' && !terminalScreen.classList.contains('hidden')) closeTerminalModal();
});

function shakeInput(el) {
  el.classList.add('shake');
  el.style.borderColor = 'var(--danger)';
  el.style.boxShadow = '0 0 20px var(--danger-glow)';
  setTimeout(() => {
    el.classList.remove('shake');
    el.style.borderColor = '';
    el.style.boxShadow = '';
  }, 700);
}

// ---- Drop Zone Drag & Drop ----
dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (!file) return;
  const p = window.vault.pathForFile(file);
  if (p) openLockModal(p);
});

dropzone.addEventListener('click', async () => {
  const p = await window.vault.chooseFolder();
  if (p) openLockModal(p);
});
chooseBtn.addEventListener('click', async (e) => {
  e.stopPropagation();
  const p = await window.vault.chooseFolder();
  if (p) openLockModal(p);
});

// ---- Lock Sequence Modal ----
const lockScreen = document.getElementById('lockScreen');
const lkFieldLabel = document.getElementById('lkFieldLabel');
const lkFieldPass = document.getElementById('lkFieldPass');
const lkFieldConfirm = document.getElementById('lkFieldConfirm');
const lkLabelInput = document.getElementById('lkLabelInput');
const lkPassInput = document.getElementById('lkPassInput');
const lkConfirmInput = document.getElementById('lkConfirmInput');
const lockTargetPath = document.getElementById('lockTargetPath');
const lockScreenError = document.getElementById('lockScreenError');

function showLockError(msg) {
  lockScreenError.textContent = `[ SECURITY WARNING ] // ${msg}`;
  lockScreenError.classList.remove('hidden');
}
function hideLockError() {
  lockScreenError.classList.add('hidden');
}

function openLockModal(folderPath) {
  pendingFolderPath = folderPath;
  const name = folderPath.split('/').filter(Boolean).pop();
  lockTargetPath.textContent = `TARGET PATH: ${folderPath}`;
  lkLabelInput.value = name || '';
  lkPassInput.value = '';
  lkConfirmInput.value = '';
  hideLockError();

  lkFieldPass.style.display = 'none';
  lkFieldConfirm.style.display = 'none';
  lkFieldLabel.classList.remove('show');
  lkFieldPass.classList.remove('show');
  lkFieldConfirm.classList.remove('show');

  lockScreen.classList.remove('hidden');
  lockScreen.style.opacity = '1';

  setTimeout(() => {
    lkFieldLabel.classList.add('show');
    sndFieldIn();
    setTimeout(() => lkLabelInput.focus(), 350);
  }, 30);
}

function closeLockModal() {
  lockScreen.style.transition = 'opacity 0.4s ease';
  lockScreen.style.opacity = '0';
  setTimeout(() => {
    lockScreen.classList.add('hidden');
    lockScreen.style.opacity = '';
    lockScreen.style.transition = '';
  }, 400);
  pendingFolderPath = null;
}

function lkGoToPass() {
  hideLockError();
  lkFieldPass.style.display = 'block';
  sndFieldIn();
  setTimeout(() => lkFieldPass.classList.add('show'), 30);
  setTimeout(() => lkPassInput.focus(), 350);
}

function lkGoToConfirm() {
  const password = lkPassInput.value;
  if (!password || password.length < 4) {
    showLockError('Passphrase must be at least 4 characters.');
    shakeInput(lkPassInput);
    return;
  }
  hideLockError();
  lkFieldConfirm.style.display = 'block';
  sndFieldIn();
  setTimeout(() => lkFieldConfirm.classList.add('show'), 30);
  setTimeout(() => lkConfirmInput.focus(), 350);
}

async function lkSubmit() {
  const password = lkPassInput.value;
  const confirm = lkConfirmInput.value;

  if (password !== confirm) {
    sndDenied();
    showLockError("Passphrases do not match.");
    shakeInput(lkConfirmInput);
    lkConfirmInput.value = '';
    lkConfirmInput.focus();
    return;
  }

  hideLockError();
  lkConfirmInput.disabled = true;
  const result = await window.vault.lock({
    folderPath: pendingFolderPath,
    label: lkLabelInput.value,
    password,
  });
  lkConfirmInput.disabled = false;

  if (!result.ok) {
    sndDenied();
    showLockError(result.error || 'Containment sequence failed.');
    shakeInput(lkConfirmInput);
    return;
  }

  sndSuccess();
  closeLockModal();
  dial.classList.add('spin');
  setTimeout(() => dial.classList.remove('spin'), 650);
  showToast('FOLDER ENCRYPTED & VAULTED SECURELY');
  refreshList();
}

lkLabelInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') lkGoToPass();
  if (e.key === 'Escape') closeLockModal();
});
lkPassInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') lkGoToConfirm();
  if (e.key === 'Escape') closeLockModal();
});
lkConfirmInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') lkSubmit();
  if (e.key === 'Escape') closeLockModal();
});

// ---- Unlock Sequence Modal ----
const unlockScreen = document.getElementById('unlockScreen');
const ulLabel = document.getElementById('ulLabel');
const ulPassInput = document.getElementById('ulPassInput');
const unlockScreenError = document.getElementById('unlockScreenError');
const ulHeaderTitle = document.getElementById('ulHeaderTitle');

function openUnlockModal(item) {
  pendingUnlockId = item.id;
  ulHeaderTitle.textContent = `DECRYPT: ${item.label}`;
  ulLabel.textContent = `// CIPHER PASSPHRASE FOR [ ${item.label} ]`;
  ulPassInput.value = '';
  unlockScreenError.classList.add('hidden');

  document.getElementById('ulFieldPass').classList.remove('show');
  unlockScreen.classList.remove('hidden');
  unlockScreen.style.opacity = '1';

  setTimeout(() => {
    document.getElementById('ulFieldPass').classList.add('show');
    sndFieldIn();
    setTimeout(() => ulPassInput.focus(), 350);
  }, 30);
}

function closeUnlockModal() {
  unlockScreen.style.transition = 'opacity 0.4s ease';
  unlockScreen.style.opacity = '0';
  setTimeout(() => {
    unlockScreen.classList.add('hidden');
    unlockScreen.style.opacity = '';
    unlockScreen.style.transition = '';
  }, 400);
  pendingUnlockId = null;
}

async function ulSubmit() {
  const password = ulPassInput.value;
  if (!password) return;

  ulPassInput.disabled = true;
  const result = await window.vault.unlock({ id: pendingUnlockId, password });
  ulPassInput.disabled = false;

  if (!result.ok) {
    sndDenied();
    unlockScreenError.textContent = `[ ACCESS DENIED ] // ${result.error || 'Invalid Cipher Passphrase'}`;
    unlockScreenError.classList.remove('hidden');
    shakeInput(ulPassInput);
    ulPassInput.value = '';
    ulPassInput.focus();
    return;
  }

  sndSuccess();
  closeUnlockModal();
  showToast(`DECRYPTED & RESTORED TO ${result.destination}`);
  refreshList();

  // Display Linux style directory listing modal terminal
  setTimeout(() => {
    openTerminalModal(result.destination, result.label, result.files || []);
  }, 450);
}

ulPassInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') ulSubmit();
  if (e.key === 'Escape') closeUnlockModal();
});

// ---- Linux Terminal Directory Listing Modal ----
const terminalScreen = document.getElementById('terminalScreen');
const termTitle = document.getElementById('termTitle');
const termCmdPath = document.getElementById('termCmdPath');
const termOutput = document.getElementById('termOutput');
const termSummary = document.getElementById('termSummary');
const openFolderBtn = document.getElementById('openFolderBtn');
const closeTermBtn = document.getElementById('closeTermBtn');
const closeTermDot = document.getElementById('closeTermDot');

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function openTerminalModal(destination, label, files) {
  currentUnlockedPath = destination;
  termTitle.textContent = `root@cyber-vault:~# ls -la "${label}"`;
  termCmdPath.textContent = destination;
  termOutput.innerHTML = '';
  termSummary.innerHTML = '';

  terminalScreen.classList.remove('hidden');
  terminalScreen.style.opacity = '1';

  let totalSize = 0;
  let fileCount = 0;
  let dirCount = 0;

  files.forEach((file, index) => {
    totalSize += file.size || 0;
    if (file.isDir) dirCount++;
    else fileCount++;

    const line = document.createElement('div');
    line.className = 'ls-line';

    let nameClass = 'ls-name';
    if (file.name.startsWith('.')) nameClass += ' is-dot';
    else if (file.isDir) nameClass += ' is-dir';
    else if (file.isExec) nameClass += ' is-exec';

    const displayName = file.isDir && file.name !== '.' && file.name !== '..' ? `${file.name}/` : file.name;

    line.innerHTML = `
      <span class="ls-perms">${file.permissions}</span>
      <span class="ls-links">${file.links}</span>
      <span class="ls-owner">${file.user}</span>
      <span class="ls-group">${file.group}</span>
      <span class="ls-size">${file.size}</span>
      <span class="ls-date">${file.date}</span>
      <span class="${nameClass}">${escapeHtml(displayName)}</span>
    `;

    line.style.opacity = '0';
    line.style.transform = 'translateY(4px)';
    line.style.transition = 'all 0.12s ease';
    termOutput.appendChild(line);

    setTimeout(() => {
      line.style.opacity = '1';
      line.style.transform = 'none';
      sndKey();
    }, index * 30);
  });

  setTimeout(() => {
    termSummary.innerHTML = `
      [ TERMINAL SUMMARY ] // ${fileCount} files, ${dirCount} directories (${formatBytes(totalSize)})
      <br/><span style="color:var(--text-muted)">Restored Location: ${escapeHtml(destination)}</span>
    `;
  }, files.length * 30 + 100);
}

function closeTerminalModal() {
  terminalScreen.style.transition = 'opacity 0.3s ease';
  terminalScreen.style.opacity = '0';
  setTimeout(() => {
    terminalScreen.classList.add('hidden');
    terminalScreen.style.opacity = '';
    terminalScreen.style.transition = '';
  }, 300);
}

openFolderBtn.addEventListener('click', () => {
  if (currentUnlockedPath) {
    window.vault.openPath(currentUnlockedPath);
    showToast(`OPENING FINDER: ${currentUnlockedPath}`);
  }
});
closeTermBtn.addEventListener('click', closeTerminalModal);
closeTermDot.addEventListener('click', closeTerminalModal);

refreshList();
