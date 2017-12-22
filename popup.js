// This extension loads the saved background color for the current tab if one
// exists. The user can select a new background color from the dropdown for the
// current page, and it will be saved as part of the extension's isolated
// storage. The chrome.storage API is used for this purpose. This is different
// from the window.localStorage API, which is synchronous and stores data bound
// to a document's origin. Also, using chrome.storage.sync instead of
// chrome.storage.local allows the extension data to be synced across multiple
// user devices.
'use strict';

chrome.tabs.query({active: true, currentWindow: true}, (tab) => {
  chrome.tabs.sendMessage(tab[0].id, {type: 'toggleBar'});
});

function messageBox () {
  console.log('点击提交');
}

function cancel () {
  console.log('点击取消');
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('submit').addEventListener('click', messageBox);
  document.getElementById('cancel').addEventListener('click', cancel);
});
