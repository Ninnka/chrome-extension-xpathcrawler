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
      chrome.browserAction.setBadgeText({
        text: "ON"
      });
      if (openTabCol['windowId' + currentTabObj.windowId]) {
        openTabCol['windowId' + currentTabObj.windowId].push(currentTabObj.tabId);
      } else {
        openTabCol['windowId' + currentTabObj.windowId] = [];
        openTabCol['windowId' + currentTabObj.windowId].push(currentTabObj.tabId);
      }
      break;
    case 'close':
      chrome.browserAction.setBadgeText({
        text: "OFF"
      });
      if (openTabCol['windowId' + currentTabObj.windowId]) {
        let i = openTabCol['windowId' + currentTabObj.windowId].indexOf(currentTabObj.tabId);
        if (i === -1) {
          break;
        }
        openTabCol['windowId' + currentTabObj.windowId].splice(i, 1);
      }
      break;
  }
}
chrome.runtime.onMessage.addListener(handleRequest);

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.sendMessage(tab.id, {type: 'toggleBar'});
});

// * 监听chrome的tab切换
function handleTabActivated (request, sender, id) {
  // console.log('request', request); // * tabId; windowId
  currentTabObj = request;
  // console.log('currentTabObj', currentTabObj);
  // console.log('openTabCol', openTabCol);
  if (!openTabCol['windowId' + currentTabObj.windowId]
  || (openTabCol['windowId' + currentTabObj.windowId].indexOf(currentTabObj.tabId) === -1)) {
    initBrowserActionBadgeText();
  } else if (openTabCol['windowId' + currentTabObj.windowId] && (openTabCol['windowId' + currentTabObj.windowId].indexOf(currentTabObj.tabId) !== -1)) {
    signedBrowserActionBadgeText();
  }
}

chrome.tabs.onActivated.addListener(handleTabActivated);

// * 初始化标签
function initBrowserActionBadgeText () {
  chrome.browserAction.setBadgeText({
    text: "OFF"
  });
}

// * 标记已开启
function signedBrowserActionBadgeText () {
  chrome.browserAction.setBadgeText({
    text: "ON"
  });
}
