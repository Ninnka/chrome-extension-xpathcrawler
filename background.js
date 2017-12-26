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
let forceOpenTabCol = {};

// * 监听contentjs发出的事件
function handleRequest(request, sender, cb) {
  // Simply relay the request. This lets content.js talk to bar.js.
  // chrome.tabs.sendMessage(sender.tab.id, request, cb);
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
      sendStatusMsg({
        windowId: request.windowId,
        tabId: request.tabId
      });
      break;
    case 'createNewTab':
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, (queryTab) => {
        // console.log('createNewTab callback queryTab:', queryTab);
        // console.log('request.params.url', request.params.url);
        let querys = splitParamFromURL(request.params.url);
        console.log('createNewTab querys', querys);
        chrome.tabs.create({
          url: request.params.url,
          index: Math.round(queryTab[0].index + 1),
          active: true
        }, (createTab) => {
          console.log('createNewTab callback createTab:', createTab);
          if (querys.forceopen) {
            // * 设置需要强制开启的tab
            setForceOpenTab({
              windowId: createTab.windowId,
              tabId: createTab.id,
              force: true
            });
          }
        });
      });
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
    console.log('handleTabUpdate tab', tab);
    initBrowserActionBadgeText();
    if (openTabCol['windowId' + tab.windowId]) {
      let i = openTabCol['windowId' + tab.windowId].indexOf(tabId);
      if (i !== -1) {
        openTabCol['windowId' + tab.windowId].splice(i, 1);
      }
    }
  }
  // * 在更新面的最后强制打开
  forceOpenFunc({
    windowId: tab.windowId,
    tabId: tabId
  });
}

chrome.tabs.onUpdated.addListener(handleTabUpdate);

// * 监听chrome的tab切换并更新记录
function handleTabActivated (request, sender, id) {
  console.log('handleTabActivated request', request); // * tabId; windowId
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

// * 监听chrome的tab的关闭并移除功能的开启状态和强制开启
function handleTabRemove (tabId, removeInfo) {
  console.log('handleTabRemove tabId:', tabId);
  console.log('handleTabRemove removeInfo:', removeInfo);
  if (openTabCol['windowId' + removeInfo.windowId]) {
    let i = openTabCol['windowId' + removeInfo.windowId].indexOf(tabId);
    if (i !== -1) {
      openTabCol['windowId' + removeInfo.windowId].splice(i, 1);
    }
  }
  setForceOpenTab({
    force: false,
    windowId: removeInfo.windowId,
    tabId: tabId
  });
}

chrome.tabs.onRemoved.addListener(handleTabRemove);


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

// * 发送当前tab的功能状态
function sendStatusMsg (param) {
  // let { windowId, tabId } = param;
  param = param ? param : currentTabObj;
  let status = openTabCol['windowId' + param.windowId] && (openTabCol['windowId' + param.windowId].indexOf(param.tabId) !== -1);
  chrome.runtime.sendMessage({
    type: 'reponseStatus',
    status
  });
}

// * request.params.url
function splitParamFromURL (url) {
  let query = {};
  let separateParam = [];
  if (url.indexOf('?')) {
    separateParam = url.split('?');
  }
  if (separateParam.length > 1) {
    let paramArr = separateParam[1].split('&');
    // console.log('paramArr', paramArr);
    for (let item of paramArr) {
      let itemArr = item.split('=');
      // console.log('itemArr', itemArr);
      query[itemArr[0]] = itemArr[1];
    }
  }
  return query;
}

// * 从url中获取特定参数
function getSpecParamFromURL (param) {
  let reg = new RegExp("(^|&)" + param + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
  let r = window.location.search.substr(1).match(reg);  //匹配目标参数
  if (r != null) return unescape(r[2]); return null; //返回参数值
}

// * 添加需要强制开启功能的对象到集合中或者从将对象从集合中移除
function setForceOpenTab (param) {
  console.log('setForceOpenTab param:', param);
  if (!forceOpenTabCol['windowId' + param.windowId]) {
    forceOpenTabCol['windowId' + param.windowId] = [];
  }
  if (param.force) {
    if (forceOpenTabCol['windowId' + param.windowId].indexOf(param.tabId) === -1) {
      forceOpenTabCol['windowId' + param.windowId].push(param.tabId);
    }
  } else {
    let i = forceOpenTabCol['windowId' + param.windowId].indexOf(param.tabId);
    if (i !== -1) {
      forceOpenTabCol['windowId' + param.windowId].splice(i, 1);
    }
  }
}

// * 强制打开
function forceOpenFunc (tab) {
  console.log('forceOpenFunc tab:', tab);
  if (
    forceOpenTabCol['windowId' + tab.windowId]
    && forceOpenTabCol['windowId' + tab.windowId].indexOf(tab.tabId) !== -1
  ) {
    console.log('forceOpenFunc shouldForce');
    chrome.tabs.sendMessage(tab.tabId, {
      type: 'toggleBar'
    });
  }
}