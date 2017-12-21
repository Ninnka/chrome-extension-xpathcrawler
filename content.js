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

// Extension namespace.
var xh = xh || {};

////////////////////////////////////////////////////////////
// Generic helper functions and constants

xh.SHIFT_KEYCODE = 16;
xh.X_KEYCODE = 88;

xh.elementsShareFamily = function(primaryEl, siblingEl) {
  var p = primaryEl, s = siblingEl;
  return (p.tagName === s.tagName &&
          (!p.className || p.className === s.className) &&
          (!p.id || p.id === s.id));
};

xh.getElementIndex = function(el) {
  var index = 1;  // XPath is one-indexed
  var sib;
  for (sib = el.previousSibling; sib; sib = sib.previousSibling) {
    if (sib.nodeType === Node.ELEMENT_NODE && xh.elementsShareFamily(el, sib)) {
      index++;
    }
  }
  if (index > 1) {
    return index;
  }
  for (sib = el.nextSibling; sib; sib = sib.nextSibling) {
    if (sib.nodeType === Node.ELEMENT_NODE && xh.elementsShareFamily(el, sib)) {
      return 1;
    }
  }
  return 0;
};

xh.makeQueryForElement = function(el) {
  var query = '';
  for (; el && el.nodeType === Node.ELEMENT_NODE; el = el.parentNode) {
    var component = el.tagName.toLowerCase();
    var index = xh.getElementIndex(el);
    if (el.id) {
      component += '[@id=\'' + el.id + '\']';
    } else if (el.className) {
      component += '[@class=\'' + el.className + '\']';
    }
    if (index >= 1) {
      component += '[' + index + ']';
    }
    // If the last tag is an img, the user probably wants img/@src.
    if (query === '' && el.tagName.toLowerCase() === 'img') {
      component += '/@src';
    }
    query = '/' + component + query;
  }
  return query;
};

xh.highlight = function(els) {
  for (var i = 0, l = els.length; i < l; i++) {
    els[i].classList.add('xh-highlight');
  }
};

// * 转为xpath为css规则
xh.splitQuery = function (query) {
  console.log('splitQuery');
  if (!query) {
    return;
  }
  console.log('query', query);
  var queryArr = query.split('/');
  var newQuery = '';
  queryArr.forEach(function (ele, index, arr) {
    if(ele.indexOf('[') === -1 && xh.withoutExcludeKey(ele)) {
      newQuery = newQuery + ' ' + ele.trim();
    } else if (ele !== '' && ele.indexOf('[') !== -1) {
      let withoutDel = ele.substring(0, ele.indexOf('['));
      let delStringOnly = ele.substring(ele.indexOf('['));
      let splitRes = xh.regDelimiter(delStringOnly.trim());
      newQuery = newQuery + ' ' + withoutDel + splitRes;
    }
  });
  console.log('newQueryFinally', newQuery.trim());
  if (newQuery) {
    var matchDomArr = document.querySelectorAll(newQuery);
    xh.highlight(matchDomArr);
  }
}

// * 正则转换xpath为css规则
xh.regDelimiter = function (ele) {
  console.log('regDelimiter ele', ele);
  let res = '';
  const reg = /(\[[^\[]+\])/g;
  let regRes = reg.exec(ele);
  let regNum = /\[\d\]/g;
  while (regRes && regRes.lastIndex !== 0) {
    let tmpS = regRes[1];
    if (tmpS.indexOf('=') !== -1 && xh.withoutExcludeKey(tmpS) && !regNum.test(tmpS)) {
      let tmpSR = tmpS.replace('@', '');
      res = res + tmpSR.trim();
      console.log('tmp res', res);
    } else if (tmpS.indexOf('@class') !== -1) {
      let tmpSR = tmpS.replace('@', '');
      let tmpSRClass = tmpSR.substring(tmpSR.indexOf("'") + 1, tmpSR.lastIndexOf("'"));
      console.log('tmpSRClass', tmpSRClass);
      let tmpSRArr = tmpSRClass.split(' ');
      // res = res + tmpSR.trim();
      res = res + "[class*='" + tmpSRArr[0] + "']";
      console.log('tmp res class pattern', res);
    }
    regRes = reg.exec(ele);
  }
  return res;
}

// * 确认是否有需要过滤的关键字
xh.withoutExcludeKey = function (ele) {
  let length = xh.keyList.length;
  for (let i = 0; i < length; i++) {
    if (ele.indexOf(xh.keyList[i]) !== -1) {
      return false;
    }
  }
  return true;
}

// * 需要过滤的列表
xh.keyList = [
  '@src',
  'data-',
  'src',
  'class'
];

xh.addPrevent = (event) => {
  // event.preventDefault();
  console.log('event', event);
  if (event.target.tagName === 'A') {
    event.preventDefault();
  }
}

xh.preventHref = () => {
  // let ahrefs = document.querySelectorAll('a');
  // ahrefs.forEach(function (ele, index, arr) {
  //   ele.addEventListener('click', xh.addPrevent);
  // });
  document.addEventListener('click', xh.addPrevent);
}

xh.unPreventHref = () => {
  // let ahrefs = document.querySelectorAll('a');
  // ahrefs.forEach(function (ele, index, arr) {
  //   ele.removeEventListener('click', xh.addPrevent);
  // });
  document.removeEventListener('click', xh.addPrevent);
}

xh.clearHighlights = function() {
  var els = document.querySelectorAll('.xh-highlight');
  for (var i = 0, l = els.length; i < l; i++) {
    els[i].classList.remove('xh-highlight');
  }
};

// Returns [values, nodeCount]. Highlights result nodes, if applicable. Assumes
// no nodes are currently highlighted.
xh.evaluateQuery = function(query) {
  var xpathResult = null;
  var str = '';
  var nodeCount = 0;
  var toHighlight = [];

  try {
    xpathResult = document.evaluate(query, document.body, null,
                                    XPathResult.ANY_TYPE, null);
  } catch (e) {
    str = '[INVALID XPATH EXPRESSION]';
    nodeCount = 0;
  }

  if (!xpathResult) {
    return [str, nodeCount];
  }

  if (xpathResult.resultType === XPathResult.BOOLEAN_TYPE) {
    str = xpathResult.booleanValue ? '1' : '0';
    nodeCount = 1;
  } else if (xpathResult.resultType === XPathResult.NUMBER_TYPE) {
    str = xpathResult.numberValue.toString();
    nodeCount = 1;
  } else if (xpathResult.resultType === XPathResult.STRING_TYPE) {
    str = xpathResult.stringValue;
    nodeCount = 1;
  } else if (xpathResult.resultType ===
             XPathResult.UNORDERED_NODE_ITERATOR_TYPE) {
    for (var node = xpathResult.iterateNext(); node;
         node = xpathResult.iterateNext()) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        toHighlight.push(node);
      }
      if (str) {
        str += '\n';
      }
      str += node.textContent;
      nodeCount++;
    }
    if (nodeCount === 0) {
      str = '[NULL]';
    }
  } else {
    // Since we pass XPathResult.ANY_TYPE to document.evaluate(), we should
    // never get back a result type not handled above.
    str = '[INTERNAL ERROR]';
    nodeCount = 0;
  }

  xh.highlight(toHighlight);
  xh.splitQuery(query);
  return [str, nodeCount];
};

////////////////////////////////////////////////////////////
// xh.Bar class definition

xh.Bar = function() {
  this.boundHandleRequest_ = this.handleRequest_.bind(this);
  this.boundMouseMove_ = this.mouseMove_.bind(this);
  this.boundKeyDown_ = this.keyDown_.bind(this);
  // * 绑定点击方法
  this.boundMouseClick = this.mouseClick_.bind(this);

  this.inDOM_ = false;
  this.currEl_ = null;

  this.barFrame_ = document.createElement('iframe');
  this.barFrame_.src = chrome.runtime.getURL('bar.html');
  this.barFrame_.id = 'xh-bar';
  // Init to hidden so first showBar_() triggers fade-in.
  this.barFrame_.classList.add('hidden');

  document.addEventListener('keydown', this.boundKeyDown_);
  chrome.runtime.onMessage.addListener(this.boundHandleRequest_);
};

xh.Bar.prototype.hidden_ = function() {
  return this.barFrame_.classList.contains('hidden');
};

xh.Bar.prototype.updateQueryAndBar_ = function(el) {
  xh.clearHighlights();
  this.query_ = el ? xh.makeQueryForElement(el) : '';
  this.updateBar_(true);
};

xh.Bar.prototype.updateBar_ = function(updateQuery) {
  var results = this.query_ ? xh.evaluateQuery(this.query_) : ['', 0];
  chrome.runtime.sendMessage({
    type: 'update',
    query: updateQuery ? this.query_ : null,
    results: results
  });
};

xh.Bar.prototype.showBar_ = function() {
  var that = this;
  function impl() {
    that.barFrame_.classList.remove('hidden');
    document.addEventListener('mousemove', that.boundMouseMove_);
    // * 添加点击事件
    document.addEventListener('click', that.boundMouseClick);
    that.updateBar_(true);
  }
  if (!this.inDOM_) {
    this.inDOM_ = true;
    document.body.appendChild(this.barFrame_);
  }
  window.setTimeout(impl, 0);
};

xh.Bar.prototype.hideBar_ = function() {
  var that = this;
  function impl() {
    that.barFrame_.classList.add('hidden');
    document.removeEventListener('mousemove', that.boundMouseMove_);
    // * 移除点击事件
    document.removeEventListener('click', that.boundMouseClick);
    xh.clearHighlights();
  }
  window.setTimeout(impl, 0);
};

xh.Bar.prototype.toggleBar_ = function() {
  if (this.hidden_()) {
    this.showBar_();
    // xh.preventHref();
  } else {
    this.hideBar_();
    // xh.unPreventHref();
  }
};

xh.Bar.prototype.handleRequest_ = function(request, sender, cb) {
  if (request.type === 'evaluate') {
    xh.clearHighlights();
    this.query_ = request.query;
    this.updateBar_(false);
  } else if (request.type === 'moveBar') {
    // Move iframe to a different part of the screen.
    this.barFrame_.classList.toggle('bottom');
  } else if (request.type === 'hideBar') {
    this.hideBar_();
    // xh.unPreventHref();
    window.focus();
  } else if (request.type === 'toggleBar') {
    this.toggleBar_();
  }
};

xh.Bar.prototype.mouseMove_ = function(e) {
  if (this.currEl_ === e.toElement) {
    return;
  }
  this.currEl_ = e.toElement;
  
  // if (e.shiftKey) {
  // }
};

xh.Bar.prototype.keyDown_ = function(e) {
  var ctrlKey = e.ctrlKey || e.metaKey;
  var shiftKey = e.shiftKey;
  if (e.keyCode === xh.X_KEYCODE && ctrlKey && shiftKey) {
    this.toggleBar_();
  }
  // If the user just pressed Shift and they're not holding Ctrl, update query.
  // Note that we rely on the mousemove handler to have updated this.currEl_.
  // Also, note that checking e.shiftKey wouldn't work here, since Shift is the
  // key that triggered this event.
  if (!this.hidden_() && !ctrlKey && e.keyCode === xh.SHIFT_KEYCODE) {
    this.updateQueryAndBar_(this.currEl_);
  }
};

xh.Bar.prototype.mouseClick_ = function (e) {
  console.log('e', e);
  if (e.target.tagName === 'A') {
    e.preventDefault();
  }
  if (this.currEl_) {
    this.updateQueryAndBar_(this.currEl_);
  }
}

////////////////////////////////////////////////////////////
// Initialization code

if (location.href.indexOf('acid3.acidtests.org') === -1) {
  window.xhBarInstance = new xh.Bar();
}
