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

xh.SHIFT_KEYCODE = 16; // * shift字符
xh.X_KEYCODE = 88; // * x字符
xh.CONTAIN_SLI = true; // * 限制是否使用元素在同级的序号作为匹配的关键词
xh.CLASS_LIMIT = 1; // * 限制匹配关键词中所使用的class的个数

xh.docuBody = null; // * body对象
xh.divTmp = null; // * 弹窗对象
xh.popupSelect = null; // * 弹窗里的select
xh.popupOtherInput = null; // * 弹窗里的其他输入框
xh.popupTextareaXpath = null; // * 弹窗里的xpath框
xh.popupTextareaResult = null; // * 弹窗里的result框
// * popup中的确认和取消按钮
xh.popupButtonConfirm = null;
xh.popupButtonCancel = null;

xh.IS_OPEN = false;

xh.popupSelectPreset = [
  '预设标题1',
  '预设标题2'
]

xh.cssRuleCol = {}; // * 保存的xpath合集

xh.hintInsS = `
  <style>
    .c-hint--wrapper {
      position: fixed;
      width: 100%;
      min-height: 40px;
      color: #ffffff;
      top: 350px;
      left: 0;
      text-align: center;
    }
    .c-hint {
      display: inline-block;
      vertical-align: middle;
      min-width: 200px;
      line-height: 40px;
      background-color: #565656;
    }
  </style>
  <div class="c-hint--wrapper">
    <div class="c-hint">保存成功</div>
  </div>
`
xh.hintIns = null; // * 操作提示实例

xh.hintDelayIns = null; // * 提示的定时器

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

// * 创建xpath
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
xh.xpathToCssRule = function (query) {
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
  return newQuery.trim();
}

// * 全局匹配css规则
xh.splitQuery = function (query) {
  // console.log('splitQuery');
  if (!query) {
    return;
  }
  console.log('query', query);
  // var queryArr = query.split('/');
  // var newQuery = '';
  // queryArr.forEach(function (ele, index, arr) {
  //   if(ele.indexOf('[') === -1 && xh.withoutExcludeKey(ele)) {
  //     newQuery = newQuery + ' ' + ele.trim();
  //   } else if (ele !== '' && ele.indexOf('[') !== -1) {
  //     let withoutDel = ele.substring(0, ele.indexOf('['));
  //     let delStringOnly = ele.substring(ele.indexOf('['));
  //     let splitRes = xh.regDelimiter(delStringOnly.trim());
  //     newQuery = newQuery + ' ' + withoutDel + splitRes;
  //   }
  // });
  var newQuery = xh.xpathToCssRule(query);
  console.log('newQueryFinally', newQuery.trim());
  if (newQuery) {
    var matchDomArr = document.querySelectorAll(newQuery);
    xh.highlight(matchDomArr);
  }
}

// * 判断是否有序号
xh.checkChildOrder = function (str) {
  const regNum = /\[\d\]/g;
  // if (!xh.CONTAIN_SLI) {
  return regNum.test(str);
  // }
}

// * 正则转换xpath为css规则
xh.regDelimiter = function (ele) {
  // console.log('regDelimiter ele', ele);
  let res = '';
  const reg = /(\[[^\[]+\])/g;
  let regRes = reg.exec(ele);
  
  while (regRes && regRes.lastIndex !== 0) {
    let tmpS = regRes[1];
    if (tmpS.indexOf('=') !== -1 && xh.withoutExcludeKey(tmpS) && !xh.checkChildOrder(tmpS)) {
      let tmpSR = tmpS.replace('@', '');
      res = res + tmpSR.trim();
      // console.log('tmp res', res);
    } else if (tmpS.indexOf('@class') !== -1) {
      let tmpSR = tmpS.replace('@', '');
      let tmpSRClass = tmpSR.substring(tmpSR.indexOf("'") + 1, tmpSR.lastIndexOf("'"));
      // console.log('tmpSRClass', tmpSRClass);
      let tmpSRArr = tmpSRClass.split(' ');
      // res = res + tmpSR.trim();
      res = res + "[class*='" + tmpSRArr[0] + "']";
      // console.log('tmp res class pattern', res);
    } else if (xh.checkChildOrder(tmpS) && xh.CONTAIN_SLI) {
      res = res + ':nth-child('+ tmpS.substring(1, tmpS.length - 1) + ')';
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

// * 判断父级是否有a标签
xh.checkParentHref = function (e) {
  const parent = e.target ? e.target.parentNode : e.parentNode;
  if (parent.tagName === 'A'
  && parent.childNodes
  && parent.childNodes.length === 1) {
    return true;
  } else {
    return false;
  }
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

xh.createHint = function () {
  xh.hintIns = document.createElement('div');
  xh.hintIns.innerHTML = xh.hintInsS;
  document.body.appendChild(xh.hintIns);
}

xh.showHint = function () {
  xh.hintIns && (xh.hintIns.style.display = 'block');
}

xh.hideHint = function () {
  xh.hintIns && (xh.hintIns.style.display = 'none');
}

xh.closeHintDelay = function (delay) {
  if (xh.hintDelayIns) {
    window.clearTimeout(xh.hintDelayIns);
  }
  xh.hintDelayIns = setTimeout(() => {
    xh.hideHint();
    xh.hintDelayIns = null;
  }, delay);
}

xh.confirmSavePath = function (data) {
  console.log('confirmSavePath', data);
  /**
   * DONE:
   * 保存path
   * 关闭弹窗
   * 关闭高亮
   * 显示提示
   */
  let { title, cssSelector } = data;
  if (xh.cssRuleCol[title]) {
    xh.cssRuleCol[title].push(cssSelector);
  } else {
    xh.cssRuleCol[title] = [];
    xh.cssRuleCol[title].push(cssSelector);
  }
  // console.log('xh.cssRuleCol', xh.cssRuleCol);
  xh.closeCInputBox();
  xh.clearHighlights();
  if (xh.hintIns) {
    xh.showHint();
    xh.closeHintDelay(2500);
  } else {
    xh.createHint();
    xh.showHint();
    xh.closeHintDelay(2500);
  }
  console.log('xh.cssRuleCol', xh.cssRuleCol);
}

// * 计算当前元素的位置
xh.calcTargetElePos = function (e) {
  // console.log('calcTargetElePos', e);
  xhBarInstance.currElPos = {
    x: e.clientX,
    y: e.clientY
  };
  // console.log('xhBarInstance.currElPos', xhBarInstance.currElPos);
}

// * 计算元素周围可用的空间
xh.calcEleRoundPosAvalid = function (e) {
  const documentW = window.innerWidth;
  const documentH = window.innerHeight;
  // console.log('documentW', documentW);
  // console.log('documentH', documentH);
  const x = xhBarInstance.currElPos.x;
  const y = xhBarInstance.currElPos.y;
  // * 判断上方的位置
  if (y > 420 + 90) {
    xhBarInstance.popupPos = {
      x: x > 220 ? (documentW - x > 220 ? x - 200 : x - 400) : x,
      y: y - 420
    }
  } else if ((y > 420 && y < 420 + 90) || documentH - y > 420) {
    xhBarInstance.popupPos = {
      x: x > 220 ? (documentW - x > 220 ? x - 200 : x - 400) : x,
      y: y + 30
    }
  } else {
    xhBarInstance.popupPos = {
      x: (documentW - x) / 2,
      y: (documentH - y) / 2
    }
  }
  // console.log('xhBarInstance.popupPos', xhBarInstance.popupPos);
}

xh.popupSelectChange = function (e) {
  // console.log('popupSelectChange', e);
  const eV = e.target.value;
  if (eV === '-1' || eV === -1) {
    xh.popupOtherInput && (xh.popupOtherInput.style.display = 'block');
  } else {
    xh.popupOtherInput && (xh.popupOtherInput.style.display = 'none');
  }
}

xh.popupOtherInputChange = function (e) {
  // console.log('popupOtherInputChange', e);
}

xh.closeCInputBox = function () {
  xh.divTmp && (xh.divTmp.querySelector('#c-input-box').style.display = 'none');
}

xh.cancelInputBox = function () {
  xh.closeCInputBox();
  xh.clearHighlights();
}

xh.openCInputBox = function () {
  xh.divTmp && (xh.divTmp.querySelector('#c-input-box').style.display = 'block');
}

// * 创建弹框实例和定位弹框实例
xh.fixingPopup = function (toggle, param) {
  let xpath = param && param.xpath ? param.xpath : '';
  let resultStr = param && param.resultStr ? param.resultStr : '';

  if (xh.docuBody) {
    xh.docuBody.removeChild(xh.divTmp);
  }
  if (xhBarInstance.popupPos) {
    let isShow = toggle ? 'block' : 'none';
    xh.divTmp = document.createElement('div');
    let popupDomS = 
      `
        <style>
          #c-input-box {
            position: fixed;
            width: 400px;
            min-height: 400px;
            // background-color: red;
            display: ${isShow};
            top: ${xhBarInstance.popupPos.y}px;
            left: ${xhBarInstance.popupPos.x}px;
            z-index: 99999;
            text-align: center;
            box-sizing: border-box;
            padding: 12px;
            box-shadow: 0px 0px 0 2px #bbb;
            border: 1px solid #bbb;
            background-color: #FAFAFA;
          }
          #c-input-box select {
            width: 80%;
            height: 40px;
            border: 1px solid #bbb;
            margin-bottom: 10px;
          }
          #c-input-box #popupOtherInput {
            width: 80%;
            margin: 10px auto;
            box-sizing: border-box;
          }
          #c-input-box textarea {
            resize: none;
            width: 80%;
            margin: 0 auto 10px;
            height: 60px;
            overflow-y: auto;
            box-sizing: border-box;
          }
          #c-input-box .c-buttons {
            width: 80%;
            height: 40px;
            margin: auto;
            display: flex;
            justify-content: center;
          }
          .c-buttons div {
            border-radius: 8px;
            flex-grow: 0;
            flex-shrink: 1;
            width: 100px;
            height: 100%;
            color: #ffffff;
            line-height: 40px;
            margin: 0 30px;
          }
          .c-buttons div:nth-child(1) {
            background-color: #565656;
          }
          .c-buttons div:nth-child(2) {
            background-color: #565656;
          }
        </style>
      `
       +
      `
        <div id="c-input-box">
          <div class="select-input--wrapper">
            <select name="symbol" id="symbomSelect">
              <option value="0">此处为预选标题1</option>
              <option value="1">此处为预选标题2</option>
              <option value="-1">其他</option>
            </select>
            <input type="text" id="popupOtherInput" placeholder="请输入自定义的标题" style="display: none;">
            <div class="c-textarea--wrapper wrapper--textarea-xpath">
              <textarea id="popupTextareaXpath" readonly="true"></textarea>
            </div>
            <div class="c-textarea--wrapper wrapper--textarea-result">
              <textarea id="popupTextareaResult" readonly="true"></textarea>
            </div>
            <div class="c-buttons">
              <div id="popupButtonCancel">取消</div>
              <div id="popupButtonConfirm">确定</div>
            </div>
          </div>
        </div>
      `;
    xh.divTmp.innerHTML = popupDomS;

    xh.openCInputBox();

    // * 保存popup的select和添加事件
    xh.popupSelect = xh.divTmp.querySelector('#symbomSelect');
    xh.popupSelect && xh.popupSelect.addEventListener('change', xh.popupSelectChange);

    // * 保存其他的输入框和添加事件
    xh.popupOtherInput = xh.divTmp.querySelector('#popupOtherInput');
    xh.popupOtherInput && xh.popupOtherInput.addEventListener('change', xh.popupOtherInputChange)

    // * 保存文本框
    xh.popupTextareaXpath = xh.divTmp.querySelector('#popupTextareaXpath');
    xh.popupTextareaResult = xh.divTmp.querySelector('#popupTextareaResult');

    xh.popupTextareaXpath.value = toggle ? xpath : '';
    xh.popupTextareaResult.value = toggle ? resultStr : '';

    // * 保存按钮
    xh.popupButtonCancel = xh.divTmp.querySelector('#popupButtonCancel')
    xh.popupButtonConfirm = xh.divTmp.querySelector('#popupButtonConfirm')

    xh.popupButtonCancel.addEventListener('click', xh.cancelInputBox);
    xh.popupButtonConfirm.addEventListener('click', () => {
      let title = xh.popupSelect.value !== -1 && xh.popupSelect.value !== '-1'  ? xh.popupSelectPreset[xh.popupSelect.value] : xh.popupOtherInput.value;
      xh.confirmSavePath({
        title: title,
        cssSelector: xh.cssRuleOptimization(xpath)
      });
    });
    
    if (xh.docuBody === null) {
      xh.docuBody = document.querySelector('body');
    }
    xh.docuBody.appendChild(xh.divTmp);

    // chrome.runtime.sendMessage({
    //   type: 'fixingPopup',
    //   query: {
    //     show: true,
    //     x: xhBarInstance.popupPos.x,
    //     y: xhBarInstance.popupPos.y
    //   },
    //   results: null
    // });
  }
}

// * css优化到最小范围
xh.cssRuleOptimization = function (xpath) {
  /**
   * DONE:
   * 1：判断是否有id，没有的话返回原样
   * 2：判断最后一个id所在位置
   * 3：移除最后一个id之前的所有规则
   */
  let cssRuleOrigin = xh.xpathToCssRule(xpath);
  let regId = /(id=)/g;
  if (!regId.test(cssRuleOrigin)) {
    return cssRuleOrigin;
  }
  let cssRuleArr = cssRuleOrigin.split(' ');
  // console.log('cssRuleArr', cssRuleArr);
  let cssRuleArrL = cssRuleArr.length;
  let cssRuleLastIdIndex;
  for (let i = cssRuleArrL - 1; i >=0 ; i--) {
    if (cssRuleArr[i].indexOf('id=') !== -1) {
      cssRuleLastIdIndex = i;
      break;
    }
  }
  let cssRuleSplit = cssRuleArr.splice(cssRuleLastIdIndex);
  // console.log('cssRuleSplit', cssRuleSplit);
  let cssRuleResult = cssRuleSplit.join(' ');
  // console.log('cssRuleResult', cssRuleResult);
  return cssRuleResult;
}

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

  // * 进行全局匹配
  xh.splitQuery(query);
  
  // * 发送消息
  xh.fixingPopup(true, {
    xpath: query,
    resultStr: str
  });
  return [str, nodeCount];
};

////////////////////////////////////////////////////////////
// xh.Bar class definition

xh.Bar = function () {
  this.boundHandleRequest_ = this.handleRequest_.bind(this);
  this.boundMouseMove_ = this.mouseMove_.bind(this);
  this.boundKeyDown_ = this.keyDown_.bind(this);
  // * 绑定点击方法
  this.boundMouseClick = this.mouseClick_.bind(this);

  this.inDOM_ = false;
  this.currEl_ = null;
  this.currElPos = null;
  this.popupPos = null;

  // this.barFrame_ = document.createElement('iframe');
  // this.barFrame_.src = chrome.runtime.getURL('bar.html');
  // this.barFrame_.id = 'xh-bar';
  // Init to hidden so first showBar_() triggers fade-in.
  // this.barFrame_.classList.add('hidden');

  // document.addEventListener('keydown', this.boundKeyDown_);
  chrome.runtime.onMessage.addListener(this.boundHandleRequest_);
};

xh.Bar.prototype.hidden_ = function() {
  // return this.barFrame_.classList.contains('hidden');
};

xh.Bar.prototype.isOpen_ = function () {
  return xh.IS_OPEN;
}

xh.Bar.prototype.updateQueryAndBar_ = function(el) {
  xh.clearHighlights();
  this.query_ = el ? xh.makeQueryForElement(el) : '';
  console.log('this.query_ ', this.query_ );
  this.updateBar_(true);
};

// ! 更新bar.html相关显示(暂不需要)
xh.Bar.prototype.updateBar_ = function(updateQuery) {
  var results = this.query_ ? xh.evaluateQuery(this.query_) : ['', 0];
  // chrome.runtime.sendMessage({
  //   type: 'update',
  //   query: updateQuery ? this.query_ : null,
  //   results: results
  // });
};

xh.Bar.prototype.showBar_ = function() {
  var that = this;
  function impl() {
    // that.barFrame_.classList.remove('hidden');
    // * 添加开启状态
    xh.IS_OPEN = true;
    chrome.runtime.sendMessage({
      type: 'open'
    });
    document.addEventListener('mousemove', that.boundMouseMove_);
    // * 添加点击事件
    document.addEventListener('click', that.boundMouseClick);
    // * 打开弹框
    xh.openCInputBox();
    that.updateBar_(true);
    console.log('showBar');
  }
  // ! 判断bar.html是否在DOM里
  if (!this.inDOM_) {
    this.inDOM_ = true;
    // document.body.appendChild(this.barFrame_);
  }
  window.setTimeout(impl, 0);
};

xh.Bar.prototype.hideBar_ = function() {
  var that = this;
  function impl() {
    // that.barFrame_.classList.add('hidden');
    // * 添加关闭状态
    xh.IS_OPEN = false;
    chrome.runtime.sendMessage({
      type: 'close'
    });
    document.removeEventListener('mousemove', that.boundMouseMove_);
    // * 移除点击事件
    document.removeEventListener('click', that.boundMouseClick);
    // * 关闭弹框
    xh.closeCInputBox();
    xh.clearHighlights();
  }
  window.setTimeout(impl, 0);
};

xh.Bar.prototype.toggleBar_ = function() {
  // if (this.hidden_()) {
  if (!this.isOpen_()) {
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
    // this.barFrame_.classList.toggle('bottom');
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
  let flagPopup = false;
  let domPath = e.path;
  let domPathL = domPath.length;
  for (let i = 0; i < domPathL; i++) {
    if (domPath[i] && domPath[i].id && domPath[i].id.indexOf('c-input-box') !== -1) {
      e.stopPropagation();
      flagPopup = true;
      break;
    }
  }
  if (e.target.tagName === 'A') {
    e.preventDefault();
  } else if (xh.checkParentHref(e)) {
    e.preventDefault();
  } else if (xh.checkParentHref(e.target.parentNode)) {
    e.preventDefault();
  }
  // console.log('flagPopup', flagPopup);
  if (this.currEl_ && !flagPopup) {
    // * 计算当前元素的位置与周围可用的空间
    xh.calcTargetElePos(e);
    xh.calcEleRoundPosAvalid();
    // * 更新显示的结果，获取xpath
    this.updateQueryAndBar_(this.currEl_);
  }
}

////////////////////////////////////////////////////////////
// Initialization code

if (location.href.indexOf('acid3.acidtests.org') === -1) {
  window.xhBarInstance = new xh.Bar();
}
