// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
'use strict';

// 发送消息的type
const typeList = {
  previewAndSubmit: 'previewAndSubmit',
  cancelAll: 'cancelAll',
  toggleBar: 'toggleBar',
  getStatus: 'getStatus',
  openTableDialog: 'openTableDialog',
  openModifyDataDialog: 'openModifyDataDialog'
}

// 监听是否开启或关闭状态
chrome.runtime.onMessage.addListener(switchEventHandle);

runtimeSendMsg(typeList.getStatus);

// 点击提交打开提交框
function messageBox () {
  sendMessage_(typeList.previewAndSubmit);
}

// 点击全部取消
function cancel () {
  sendMessage_(typeList.cancelAll);
}

// 发送事件
function sendMessage_(type) {
  chrome.tabs.query({active: true, currentWindow: true}, (tab) => {
    chrome.tabs.sendMessage(tab[0].id, {type});
  });
}

// 发送runtime事件
function runtimeSendMsg(type) {
  let message = {
    type
  };
  chrome.tabs.query({active: true, currentWindow: true}, (tab) => {
    if (type === typeList.getStatus) {
      message.tabId = tab[0].id;
      message.windowId = tab[0].windowId;
    }
    chrome.runtime.sendMessage(message);
  });
}

// 监听事件
function switchEventHandle(mess) {
  console.log(mess.type);
  switch (mess.type) {
    case 'reponseStatus':
      changeStatus(mess.status);
      break;
  }
}

// 修改点击开启关闭的ui状态
function changeStatus(status) {
  let icon = document.getElementById('status_icon');
  let text = document.getElementById('status_text');
  icon.className = status ? 'status open' : 'status close';
  text.innerHTML = status ? '开启' : '关闭';
}

// 点击开启或关闭按钮
function switchStatus() {
  sendMessage_(typeList.toggleBar);
}

// * 打开选择规则的对话框
function openTableDialog () {
  sendMessage_(typeList.openTableDialog);
}

// *打开修改数据的对话框
function openModifyDataDialog() {
  sendMessage_(typeList.openModifyDataDialog);
}

// 为按钮添加点击事件
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit').addEventListener('click', messageBox);
  document.getElementById('cancel').addEventListener('click', cancel);
  document.getElementById('status').addEventListener('click', switchStatus);
  document.querySelector('#selectRule').addEventListener('click', openTableDialog);
  document.querySelector('#modifyData').addEventListener('click', openModifyDataDialog);
});
