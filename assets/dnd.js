/* dnd.js · v3 DMS 拖拽模块（localStorage + BroadcastChannel 持久化）
 * 用法：
 *   dnd.bind('.project-card', '.cell', (card, cell) => {
 *     patchProject(card.dataset.code, { stage_v3: cell.dataset.stage, iss: cell.dataset.iss });
 *     location.reload();
 *   });
 * 持久化：localStorage key = dnd_v3_overrides 形如 {"xingheng":{stage_v3:"在推重点",iss:"未上市"}}
 * 多 tab 同步：BroadcastChannel('dnd_v3') 广播 'patch' 事件
 */
(function (global) {
  'use strict';
  const STORE_KEY = 'dnd_v3_overrides';
  const CH_NAME = 'dnd_v3';
  const bc = ('BroadcastChannel' in global) ? new BroadcastChannel(CH_NAME) : null;

  function loadOverrides() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function saveOverrides(o) {
    localStorage.setItem(STORE_KEY, JSON.stringify(o));
  }
  function applyOverrides(projects) {
    const ov = loadOverrides();
    projects.forEach(p => {
      if (ov[p.code]) Object.assign(p, ov[p.code]);
    });
    return projects;
  }
  function patchProject(code, delta) {
    const ov = loadOverrides();
    ov[code] = Object.assign({}, ov[code] || {}, delta);
    saveOverrides(ov);
    if (bc) bc.postMessage({ type: 'patch', code, delta });
  }
  function clearOverride(code) {
    const ov = loadOverrides();
    delete ov[code];
    saveOverrides(ov);
    if (bc) bc.postMessage({ type: 'clear', code });
  }
  function clearAll() {
    localStorage.removeItem(STORE_KEY);
    if (bc) bc.postMessage({ type: 'clearAll' });
  }

  function bind(cardSel, cellSel, onDrop) {
    let dragCode = null;
    document.querySelectorAll(cardSel).forEach(card => {
      card.setAttribute('draggable', 'true');
      card.addEventListener('dragstart', e => {
        dragCode = card.dataset.code;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragCode);
        card.classList.add('dnd-dragging');
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dnd-dragging');
        dragCode = null;
      });
    });
    document.querySelectorAll(cellSel).forEach(cell => {
      cell.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        cell.classList.add('dnd-droppable');
      });
      cell.addEventListener('dragleave', () => {
        cell.classList.remove('dnd-droppable');
      });
      cell.addEventListener('drop', e => {
        e.preventDefault();
        cell.classList.remove('dnd-droppable');
        const code = e.dataTransfer.getData('text/plain') || dragCode;
        if (!code) return;
        if (onDrop) onDrop({ code }, cell);
      });
    });
  }

  if (bc) {
    bc.addEventListener('message', e => {
      if (e.data && e.data.type === 'patch') {
        // 通知同源 tab 刷新
        document.dispatchEvent(new CustomEvent('dnd:patch', { detail: e.data }));
      }
    });
  }

  global.dnd = { bind, applyOverrides, patchProject, clearOverride, clearAll, loadOverrides };
})(window);
