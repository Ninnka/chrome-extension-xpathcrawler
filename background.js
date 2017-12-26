/**
 * Copyright 2011 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @author opensource@google.com
 * @license Apache License, Version 2.0.
 */

'use strict';

let openTabCol = {}; // * 记录已经打开功能的tab页面
let currentTabObj = {}; // * 当前的tab页面对象

// * 监听contentjs发出的事件
function handleRequest(request, sender, cb) {
  // Simply relay the request. This lets content.js talk to bar.js.
  chrome.tabs.sendMessage(sender.tab.id, request, cb);
  let { type } = request;
  switch (type) {
    case 'open':
      signedBrowserActionBadgeText();
      if (openTabCol['windowId' + currentTabObj.windowId]) {
        openTabCol['windowId' + currentTabObj.windowId].push(currentTabObj.tabId);
      } else {
        openTabCol['windowId' + currentTabObj.windowId] = [];
        openTabCol['windowId' + currentTabObj.windowId].push(currentTabObj.tabId);
      }
      sendStatusMsg();
      break;
    case 'close':
      initBrowserActionBadgeText();
      if (openTabCol['windowId' + currentTabObj.windowId]) {
        let i = openTabCol['windowId' + currentTabObj.windowId].indexOf(currentTabObj.tabId);
        if (i !== -1) {
          openTabCol['windowId' + currentTabObj.windowId].splice(i, 1);
        }
      }
      sendStatusMsg();
      break;
    case 'getStatus':
      // sendStatusMsg({
      //   windowId: request.windowId,
      //   tabId: request.tabId
      // });
      sendStatusMsg();
      break;
  }
}
chrome.runtime.onMessage.addListener(handleRequest);

// chrome.browserAction.onClicked.addListener(function(tab) {
//   chrome.tabs.sendMessage(tab.id, {type: 'toggleBar'});
// });

// * 监听chrome的tab更新并更新记录
function handleTabUpdate (tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    // console.log('tab', tab);
    initBrowserActionBadgeText();
    if (openTabCol['windowId' + tab.windowId]) {
      let i = openTabCol['windowId' + tab.windowId].indexOf(tabId);
      if (i !== -1) {
        openTabCol['windowId' + tab.windowId].splice(i, 1);
      }
    }
  }
}

chrome.tabs.onUpdated.addListener(handleTabUpdate);

// * 监听chrome的tab切换并更新记录
function handleTabActivated (request, sender, id) {
  // console.log('request', request); // * tabId; windowId
  currentTabObj = request;
  // console.log('currentTabObj', currentTabObj);
  // console.log('openTabCol', openTabCol);
  if (
    !openTabCol['windowId' + currentTabObj.windowId]
    || (openTabCol['windowId' + currentTabObj.windowId].indexOf(currentTabObj.tabId) === -1)
  ) {
    initBrowserActionBadgeText();
  } else if (
    openTabCol['windowId' + currentTabObj.windowId]
    && (openTabCol['windowId' + currentTabObj.windowId].indexOf(currentTabObj.tabId) !== -1)
  ) {
    signedBrowserActionBadgeText();
  }
}

chrome.tabs.onActivated.addListener(handleTabActivated);


// * 初始化功能状态文本
function initBrowserActionBadgeText () {
  chrome.browserAction.setBadgeText({
    text: "OFF"
  });
}

// * 标记已开启状态文本
function signedBrowserActionBadgeText () {
  chrome.browserAction.setBadgeText({
    text: "ON"
  });
}

function sendStatusMsg (param) {
  // let { windowId, tabId } = param;
  let status = openTabCol['windowId' + currentTabObj.windowId] && (openTabCol['windowId' + currentTabObj.windowId].indexOf(currentTabObj.tabId) !== -1);
  chrome.runtime.sendMessage({
    type: 'reponseStatus',
    status
  });
}
