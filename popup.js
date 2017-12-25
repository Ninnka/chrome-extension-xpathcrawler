// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
'use strict';

window.onload = state_;

let tabId = 0;

// 发送消息的type
const typeList = {
  previewAndSubmit: 'previewAndSubmit',
  cancelAll: 'cancelAll',
  toggleBar: 'toggleBar'
}

// 监听是否开启或关闭状态
chrome.runtime.onMessage.addListener(switchEventHandle);

// 加载完页面后立刻加载的方法
function state_() {
  let className = localStorage.getItem("status_className");
  let text = localStorage.getItem("status_text");
  if (className && text) {
    document.getElementById('status_text').innerHTML = text;
    document.getElementById('status_icon').className = className;
  }
}

// 点击提交打开提交框
function messageBox () {
  if (tabId === 0) {
    sendMessage_(typeList.previewAndSubmit);
    return;
  }
  chrome.tabs.sendMessage(tabId, {type: typeList.previewAndSubmit});
}

// 点击全部取消
function cancel () {
  if (tabId === 0) {
    sendMessage_(typeList.cancelAll);
    return;
  }
  chrome.tabs.sendMessage(tabId, {type: typeList.cancelAll});
}

// 发送事件
function sendMessage_(type) {
  chrome.tabs.query({active: true, currentWindow: true}, (tab) => {
    tabId = tab[0].id;
    chrome.tabs.sendMessage(tab[0].id, {type});
  });
}

// 修改点击开启关闭的ui状态
function switchEventHandle(mess) {
  let icon = document.getElementById('status_icon');
  let text = document.getElementById('status_text');
  if (mess.type === 'open') {
    icon.className = 'status open';
    text.innerHTML = '开启';
    localStorage.setItem('status_text', '开启')
    localStorage.setItem('status_className', 'status open')
  }
  if (mess.type === 'close'){
    icon.className = 'status close';
    text.innerHTML = '关闭'
    localStorage.removeItem("status_text");
    localStorage.removeItem("status_className");
  }
}

// 点击开启或关闭按钮
function changeStatus() {
  sendMessage_(typeList.toggleBar)
}

// 为按钮添加点击事件
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit').addEventListener('click', messageBox);
  document.getElementById('cancel').addEventListener('click', cancel);
  document.getElementById('status').addEventListener('click', changeStatus);
});
