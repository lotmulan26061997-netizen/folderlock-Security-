const dropzone = document.getElementById('dropzone');
const dial = document.getElementById('dial');
const chooseBtn = document.getElementById('chooseBtn');
const vaultList = document.getElementById('vaultList');
const emptyState = document.getElementById('emptyState');
const countBadge = document.getElementById('count');
const toast = document.getElementById('toast');

const lockModal = document.getElementById('lockModal');
const lockFolderName = document.getElementById('lockFolderName');
const labelInput = document.getElementById('labelInput');
const passInput = document.getElementById('passInput');
const passConfirm = document.getElementById('passConfirm');
const lockError = document.getElementById('lockError');
const lockCancel = document.getElementById('lockCancel');
const lockConfirm = document.getElementById('lockConfirm');

const unlockModal = document.getElementById('unlockModal');
const unlockItemName = document.getElementById('unlockItemName');
const unlockPassInput = document.getElementById('unlockPassInput');
const unlockError = document.getElementById('unlockError');
const unlockCancel = document.getElementById('unlockCancel');
const unlockConfirm = document.getElementById('unlockConfirm');

let pendingFolderPath = null;
let pendingUnlockId = null;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.add('hidden'), 2600);
}

function folderIconSvg() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z" stroke="currentColor" stroke-width="1.6"/>
    <path d="M9 15.5v-3l2 1.5 2-1.5v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

async function refreshList() {
  const items = await window.vault.list();
  vaultList.innerHTML = '';
  countBadge.textContent = items.length;
  emptyState.style.display = items.length === 0 ? 'block' : 'none';

  items
    .sort((a, b) => new Date(b.lockedAt) - new Date(a.lockedAt))
    .forEach((item) => {
      const li = document.createElement('li');
      li.className = 'vault-item';
      li.innerHTML = `
        <span class="vault-item-icon">${folderIconSvg()}</span>
        <span class="vault-item-body">
          <div class="vault-item-label">${escapeHtml(item.label)}</div>
          <div class="vault-item-date">Locked ${formatDate(item.lockedAt)}</div>
        </span>
        <button class="btn btn-primary unlock-btn">Unlock</button>
      `;
      li.querySelector('.unlock-btn').addEventListener('click', () => openUnlockModal(item));
      vaultList.appendChild(li);
    });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---- Drop zone ----

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

// ---- Lock modal ----

function openLockModal(folderPath) {
  pendingFolderPath = folderPath;
  const name = folderPath.split('/').filter(Boolean).pop();
  lockFolderName.textContent = folderPath;
  labelInput.value = name || '';
  passInput.value = '';
  passConfirm.value = '';
  lockError.classList.add('hidden');
  lockModal.classList.remove('hidden');
  passInput.focus();
}

function closeLockModal() {
  lockModal.classList.add('hidden');
  pendingFolderPath = null;
}

lockCancel.addEventListener('click', closeLockModal);

lockConfirm.addEventListener('click', async () => {
  const password = passInput.value;
  const confirm = passConfirm.value;

  if (!password || password.length < 4) {
    lockError.textContent = 'Password must be at least 4 characters.';
    lockError.classList.remove('hidden');
    return;
  }
  if (password !== confirm) {
    lockError.textContent = "Passwords don't match.";
    lockError.classList.remove('hidden');
    return;
  }

  lockConfirm.disabled = true;
  const result = await window.vault.lock({
    folderPath: pendingFolderPath,
    label: labelInput.value,
    password,
  });
  lockConfirm.disabled = false;

  if (!result.ok) {
    lockError.textContent = result.error || 'Something went wrong.';
    lockError.classList.remove('hidden');
    return;
  }

  closeLockModal();
  dial.classList.add('spin');
  setTimeout(() => dial.classList.remove('spin'), 550);
  showToast('Folder locked.');
  refreshList();
});

// ---- Unlock modal ----

function openUnlockModal(item) {
  pendingUnlockId = item.id;
  unlockItemName.textContent = item.label;
  unlockPassInput.value = '';
  unlockError.classList.add('hidden');
  unlockModal.classList.remove('hidden');
  unlockPassInput.focus();
}

function closeUnlockModal() {
  unlockModal.classList.add('hidden');
  pendingUnlockId = null;
}

unlockCancel.addEventListener('click', closeUnlockModal);

unlockConfirm.addEventListener('click', async () => {
  const password = unlockPassInput.value;
  if (!password) return;

  unlockConfirm.disabled = true;
  const result = await window.vault.unlock({ id: pendingUnlockId, password });
  unlockConfirm.disabled = false;

  if (!result.ok) {
    unlockError.textContent = result.error || 'Something went wrong.';
    unlockError.classList.remove('hidden');
    return;
  }

  closeUnlockModal();
  showToast(`Restored to ${result.destination}`);
  refreshList();
});

[passInput, passConfirm].forEach((el) =>
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') lockConfirm.click(); })
);
unlockPassInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') unlockConfirm.click(); });

refreshList();
