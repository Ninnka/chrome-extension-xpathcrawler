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

xh.TYPE_STRING = 'string';
xh.TYPE_NUMBER = 'number';
xh.TYPE_ARRAY = 'array';
xh.TYPE_OBJECT = 'object';

xh.docuBody = null; // * body对象
xh.divTmp = null; // * 弹窗对象
xh.popupSelect = null; // * 弹窗里的select
xh.popupOtherInput = null; // * 弹窗里的其他输入框
xh.popupTextareaXpath = null; // * 弹窗里的xpath框
xh.popupTextareaResult = null; // * 弹窗里的result框
// * popup中的确认和取消按钮
xh.popupButtonConfirm = null;
xh.popupButtonCancel = null;

xh.IS_OPEN = false; // * 功能是否开启的状态

xh.popupSelectPreset = [
  '预设标题1',
  '预设标题2'
];

xh.cssRuleCol = {}; // * 保存的xpath合集

xh.hintIns = null; // * 操作提示实例

xh.hintDelayIns = null; // * 提示的定时器

xh.previewIns = null; // * 预览窗口的实例

xh.currentSeletorType = xh.TYPE_STRING;

// * Xpath使用
xh.elementsShareFamily = function(primaryEl, siblingEl) {
  var p = primaryEl, s = siblingEl;
  return (p.tagName === s.tagName &&
          (!p.className || p.className === s.className) &&
          (!p.id || p.id === s.id));
};

// * CSS Selector使用
xh.elementsShareFamilyCss = function (primaryEl, siblingEl) {
  // * CSS选择器部分暂时只用tag名是否相等来判断子元素们是否享有公用的父元素
  let p = primaryEl, s = siblingEl;
  return p.tagName === s.tagName;
}

// * Xpath使用
xh.getElementIndex = function(el) {
  var index = 1;
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

// * CSS Selector使用
xh.getElementIndexCss = function (el) {
  let index = 1;
  let sib;
  for (sib = el.previousSibling; sib; sib = sib.previousSibling) {
    if (sib.nodeType === Node.ELEMENT_NODE) {
      index++;
    }
  }
  if (index > 1) {
    return index;
  }
  for (sib = el.nextSibling; sib; sib = sib.nextSibling) {
    if (sib.nodeType === Node.ELEMENT_NODE) {
      return 1;
    }
  }
  return 0;
}

// * 创建xpath和css selector
xh.makeQueryForElement = function(el) {
  let query = '';
  let queryCss = '';
  let hasBreak = false;
  // console.log('el.textContent', el.textContent);
  // * (暂定)此处判断type
  let elChildNodes = el.childNodes;
  console.log('elChildNodes', elChildNodes);
  if (
    ( xh.formElementCondi(el.tagName) && !isNaN(Number(xh.getElementValue(el))) )
    || ( elChildNodes && elChildNodes.length === 1 && elChildNodes[0].nodeName === '#text' && !isNaN(Number(elChildNodes[0].nodeValue)) )
  ) {
    xh.currentSeletorType = xh.TYPE_NUMBER;
  }
  for (; ; ) {
    // * null
    if (!el) {
      break;
    }
    // * 不满足条件则进行下一次匹配
    if (!(el && el.nodeType === Node.ELEMENT_NODE)) {
      hasBreak = true;
      el = el.parentNode;
      continue;
    }
    let component = el.tagName.toLowerCase();
    let componentCss = el.tagName.toLowerCase(); // *
    let index = xh.getElementIndex(el);
    let indexCss = xh.getElementIndexCss(el); // *
    if (el.id) {
      component += '[@id=\'' + el.id + '\']';
      componentCss += '[id=\'' + el.id + '\']'; // *
    } else if (el.className) {
      component += '[@class=\'' + el.className + '\']';
      // * css seletor的class用经过刷选处理，目前最多只留下一个class名
      componentCss += '[class*=\'' + xh.cssClassOptimization(el.className.trim()) + '\']';
    }
    if (index >= 1) {
      component += '[' + index + ']';
    }
    // * css selector部分专用(暂时为严格匹配)
    if (indexCss >= 1) {
      componentCss += ':nth-child(' + indexCss + ')';
    }
    // * 如果最后的元素是img，生成xpath需要"img/@src"
    if (query === '' && el.tagName.toLowerCase() === 'img') {
      component += '~/~@src'; // * 替换了分隔符
    }
    if (queryCss === '' && el.tagName.toLowerCase() === 'img') {
      componentCss += '[src]'; // *
    }
    query = '~/~' + component + query; // * 替换了分隔符
    // * 判断是否为直接子元素
    if (queryCss !== '' && !hasBreak) {
      hasBreak = false;
      queryCss = ' >' + queryCss;
    }
    queryCss = ' ' + componentCss + queryCss; // *
    el = el.parentNode;
  }
  return {
    query,
    queryCss: queryCss.trim()
  };
};

xh.cssClassOptimization = function (className) {
  let classArr = className.split(' ');
  return classArr[0];
}

xh.highlight = function(els) {
  for (var i = 0, l = els.length; i < l; i++) {
    els[i].classList.add('xh-highlight');
  }
};

// * 转为xpath为css规则
xh.xpathToCssRule = function (query) {
  var queryArr = query.split('~/~'); // * 使用新的分隔符
  var newQuery = '';
  queryArr.forEach(function (ele, index, arr) {
    if (
      ele.indexOf('[') === -1
      && xh.withoutExcludeKey(ele)
    ) {
      newQuery = newQuery + ' ' + ele.trim();
    } else if (
      ele !== ''
      && ele.indexOf('[') !== -1
    ) {
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
  if (query) {
    var matchDomArr = document.querySelectorAll(query);
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
    if (
      tmpS.indexOf('=') !== -1
      && xh.withoutExcludeKey(tmpS)
      && !xh.checkChildOrder(tmpS)
    ) {
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
    } else if (
      xh.checkChildOrder(tmpS)
      && xh.CONTAIN_SLI
    ) {
      res = res + ':nth-of-type('+ tmpS.substring(1, tmpS.length - 1) + ')';
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
  if (
    parent
    && parent.tagName === 'A'
  // && parent.childNodes
  // && parent.childNodes.length === 1
  ) {
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

xh.clearHighlights = function () {
  var els = document.querySelectorAll('.xh-highlight');
  for (var i = 0, l = els.length; i < l; i++) {
    els[i].classList.remove('xh-highlight');
  }
};

xh.getPreviewInsTemplateString = function () {
  return `
    <style>
      .c-preview-wrapper {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        text-align: center;
        z-index: 1000000;
      }
      .c-preview-wrapper .c-preview-content {
        background: #ffffff;
        width: 60%;
        min-width: 500px;
        height: 600px;
        box-shadow: 0px 0px 10px #000;
      }
      .c-preview-close{
        cursor: pointer;
        position: absolute;
        width: 50px;
        height: 35px;
        line-height: 35px;
        top: 3px;
        right: 0;
        font-size: 20px;
        line-height: 35px;
      }
      .c-preview-wrapper .c-preview-title {
        margin: 0;
        padding: 10px;
        background: rgb(180, 185, 191);
        position: relative;
      }
      .c-preview-data {
        background: rgb(236, 236, 236);
        height: 70%;
        width: 90%;
        margin: 20px auto;
        overflow: auto;
        text-align: left;
        color: #080 !important;
        line-height: 1.3;
      }
      .c-previwe-bottons {
        margin-top: 20px;
        display: flex;
        justify-content: space-around;
        align-items: center;
      }
      .c-previwe-button { 
        cursor: pointer;
        padding: .5em 2em .55em;  
        text-shadow: 0 1px 1px rgba(0,0,0,.3);  
        border-radius: .5em;  
        box-shadow: 0 1px 2px rgba(0,0,0,.2);  
      }
      
      /* blue */
      .c-previwe-button.blue {  
        color: #d9eef7;  
        background: #0095cd;
      }
      .c-previwe-button.blue:hover {  
        background: #007ead;
      }
      .c-previwe-button.blue:active {  
        color: #80bed6;
      }
      /* white */
      .c-previwe-button.white {  
        color: #606060;  
        background: #dadada;
      }  
      .c-previwe-button.white:hover {  
        background: #ededed;
      }
      .c-previwe-button.white:active {  
        color: #999;
      }
    </style>
  `
    +
  `
    <div id="c-preview-wrapper" class="c-preview-wrapper">
      <div class="c-preview-content">
        <p class="c-preview-title">数据预览<span id="c-preview-close" class="c-preview-close">X</span></p>
        <pre id="c-preview-data" class="c-preview-data"></pre>
        <div class="c-previwe-bottons">
          <div id="c-preview-button-cancel" class="c-previwe-button white">取消</div>
          <div id="c-preview-button-submit" class="c-previwe-button blue">提交</div>
        </div>
      </div>
    </div>
  `;
}

// * 打开预览的流程控制
xh.previewRquest = function () {
  if (!xh.previewIns) {
    xh.createPreviewIns();
    xh.bindPreviewListener();
    xh.setPreviewData();
  } else {
    xh.showPreview();
    xh.setPreviewData();
  }
}

// * 显示预览窗口
xh.showPreview = function () {
  xh.previewIns && (xh.previewIns.style.display = 'block');
}

// * 关闭预览窗口
xh.closePreview = function () {
  xh.previewIns && (xh.previewIns.style.display = 'none');
}

// * 提交按钮的回调
xh.submitData = function () {
  // TODOS
  /**
   * 提交数据
   */
  console.log('提交数据');
  xh.closePreview();
  xh.createHint('提交成功（假）');
  xh.showHint();
  xh.closeHintDelay(2000);
}

// * 创建预览窗口的实例
xh.createPreviewIns = function () {
  if (!xh.previewIns) {
    xh.previewIns = document.createElement('div');
  }
  xh.previewIns.innerHTML = xh.getPreviewInsTemplateString();
  if (xh.docuBody === null) {
    xh.docuBody = document.querySelector('body');
  }
  xh.docuBody.appendChild(xh.previewIns);
}

// * 绑定预览窗口内的事件
xh.bindPreviewListener = function () {
  if (xh.previewIns) {
    // * 关闭按钮
    let closeIns = xh.previewIns.querySelector('#c-preview-close');
    closeIns.addEventListener('click', xh.closePreview);
  
    // * 确认按钮
    xh.previewIns.querySelector('#c-preview-button-submit').addEventListener('click', xh.submitData);
  
    // * 取消按钮
    xh.previewIns.querySelector('#c-preview-button-cancel').addEventListener('click', xh.closePreview);
  }
}

xh.setPreviewData = function () {
  if (xh.previewIns) {
    let previewData = JSON.stringify(xh.cssRuleCol, null, 2);
    // console.log('previewData', previewData);
    xh.previewIns.querySelector('#c-preview-data').innerHTML = previewData;
  }
}

xh.getHintInsTemplateString = function (param) {
  let { text, type } = param;
  type = type ? type : 'success';
  let backgroundColor = '#67c23a';
  switch (type) {
    case 'success':
      backgroundColor = '#67c23a';
      break;
    case 'warning':
      backgroundColor = '#e6a23c';
      break;
    case 'error':
      backgroundColor = '#f56c6c';
      break;
    default:
      backgroundColor = '#67c23a';
  }
  return `
    <style>
      .c-hint--wrapper {
        position: fixed;
        width: auto;
        min-height: 40px;
        color: #ffffff;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        background: transparent;
        z-index: 99999;
      }
      .c-hint {
        box-shadow: 0px 1px 5px 0 #bbb;
        transform: translateZ(4px);
        display: inline-block;
        vertical-align: middle;
        min-width: 200px;
        line-height: 40px;
        padding: 0 16px;
        background-color: ${backgroundColor};
      }
    </style>
    <div class="c-hint--wrapper">
      <div class="c-hint">${text}</div>
    </div>
  `;
}

/**
 * 创建提示框的实例
 * @param {String} text 需要显示的文本
 */
xh.createHint = function (text, type) {
  if (!xh.hintIns) {
    xh.hintIns = document.createElement('div');
  }
  xh.hintIns.innerHTML = xh.getHintInsTemplateString({
    text: text,
    type: type
  });
  if (xh.docuBody === null) {
    xh.docuBody = document.querySelector('body');
  }
  xh.docuBody.appendChild(xh.hintIns);
}

// * 显示提示框
xh.showHint = function () {
  xh.hintIns && (xh.hintIns.style.display = 'block');
}

// * 隐藏提示框
xh.hideHint = function () {
  xh.hintIns && (xh.hintIns.style.display = 'none');
}

// * 延迟关闭提示框
xh.closeHintDelay = function (delay) {
  if (xh.hintDelayIns) {
    window.clearTimeout(xh.hintDelayIns);
  }
  xh.hintDelayIns = setTimeout(() => {
    xh.hideHint();
    xh.hintDelayIns = null;
  }, delay);
}

xh.checkObjectRelated = function (obj, data) {
  return obj;
}

// * 弹窗确认按钮的回调方法
xh.confirmSavePath = function (data) {
  console.log('confirm', data);
  /**
   * DONE:
   * 保存path
   * 关闭弹窗
   * 关闭高亮
   * 显示提示
   */
  let { title, cssSelector, type } = data;

  // * test start:
  // * 获取属性名的数组并循环判断是否有上下级关系（判断关系有无可能是object）(测试)
  xh.cssRuleCol[title + new Date().getTime()] = data;
  // let cssRuleColArr = Object.keys(xh.cssRuleCol);
  // for (let item of cssRuleColArr) {
  //   if (cssSelector.indexOf(xh.cssRuleCol[item].cssSelector) !== -1) {
  //     if (!xh.cssRuleCol[item].meta) {
  //       xh.cssRuleCol[item].meta = {};
  //       xh.cssRuleCol[item].type = 'object';
  //     }
  //     xh.cssRuleCol[item].meta[title + new Date().getTime()] = data;
  //     break;
  //   } else if (xh.cssRuleCol[item].cssSelector.indexOf(cssSelector) !== -1) {
  //     xh.cssRuleCol[title + new Date().getTime()] = data;
  //     data.meta = xh.cssRuleCol[item];
  //     data.type = 'object';
  //     delete xh.cssRuleCol[item];
  //     break;
  //   }
  // }
  // if (cssRuleColArr.length === 0) {
  //   xh.cssRuleCol[title + new Date().getTime()] = data;
  // }
  
  // * test end:
  // for (let item of cssRuleColArr) {
  //   if (xh.cssRuleCol[item].indexOf(cssSelector) !== -1) {
  //     xh.closeCInputBox();
  //     xh.clearHighlights();
  //     xh.createHint('已存在相同的<规则>', 'error');
  //     xh.showHint();
  //     xh.closeHintDelay(2000);
  //     return;
  //   }
  // }
  // if (xh.cssRuleCol[title]) {
  //   xh.cssRuleCol[title].push(cssSelector);
  // } else {
  //   xh.cssRuleCol[title] = [];
  //   xh.cssRuleCol[title].push(cssSelector);
  // }

  xh.closeCInputBox();
  xh.clearHighlights();
  xh.createHint('保存成功');
  xh.showHint();
  xh.closeHintDelay(2000);
  console.log('cssRuleCol', xh.cssRuleCol);
  xh.currentSeletorType = xh.TYPE_STRING;
  // * 测试预览功能
  xh.previewRquest();
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
  if (y > 400 + 20 + 90) {
    xhBarInstance.popupPos = {
      x: x > 200 + 20 ? (documentW - x > 200 + 20 ? x - 200 : x - 400) : x,
      y: y - 400 - 20
    }
  } else if (
    (y > 400 + 20 && y < 400 + 20 + 90)
    || documentH - y > 400 + 20
  ) {
    xhBarInstance.popupPos = {
      x: x > 200 + 20 ? (documentW - x > 200 + 20 ? x - 200 : x - 400) : x,
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

// * 关闭弹窗
xh.closeCInputBox = function () {
  xh.divTmp && (xh.divTmp.style.display = 'none');
}

// * 取消按钮的回调事件
xh.cancelInputBox = function () {
  xh.closeCInputBox();
  xh.clearHighlights();
}

// * 打开弹窗
xh.openCInputBox = function () {
  xh.divTmp && (xh.divTmp.style.display = 'block');
}

// * 创建弹框实例和定位弹框实例
xh.fixingPopup = function (toggle, param) {
  let xpath = param && param.xpath ? param.xpath : '';
  let resultStr = param && param.resultStr ? param.resultStr : '';

  if (xh.docuBody) {
    xh.docuBody.removeChild(xh.divTmp);
  }
  if (xhBarInstance.popupPos) {
    // let isShow = toggle ? 'flex' : 'none';
    xh.divTmp = document.createElement('div');
    let popupDomS = 
      `
        <style>
          #c-input-box {
            position: fixed;
            width: 400px;
            min-height: 400px;
            display: flex;
            top: ${xhBarInstance.popupPos.y}px;
            left: ${xhBarInstance.popupPos.x}px;
            z-index: 99999;
            text-align: center;
            box-sizing: border-box;
            padding: 12px;
            box-shadow: 0px 1px 5px 0 #bbb;
            background-color: #FAFAFA;
            align-items: center;
            transform: translateZ(3px);
          }
          #c-input-box .select-input--wrapper {
            width: 100%;
          }
          #c-input-box select {
            width: 80%;
            height: 40px;
            border: none;
            box-shadow: 0px 1px 5px 0 #bbb;
            margin-bottom: 20px;
          }
          #c-input-box #popupOtherInput {
            width: 80%;
            margin: 0 auto 20px;
            box-sizing: border-box;
            border: none;
            box-shadow: 0px 1px 5px 0 #bbb;
          }
          #c-input-box textarea {
            resize: none;
            border: none;
            width: 80%;
            margin: 0 auto 20px;
            height: 60px;
            overflow-y: auto;
            box-sizing: border-box;
            box-shadow: 0px 1px 5px 0 #bbb;
            vertical-align: middle;
          }
          #c-input-box .c-buttons {
            width: 80%;
            height: 40px;
            margin: auto;
            display: flex;
            justify-content: center;
          }
          .c-buttons div {
            border-radius: 4px;
            flex-grow: 0;
            flex-shrink: 1;
            width: 100px;
            height: 100%;
            color: #ffffff;
            line-height: 40px;
            margin: 0 30px;
          }
          .c-buttons div:nth-child(1) {
            background-color: #bababa;
          }
          .c-buttons div:nth-child(2) {
            color: #d9eef7;  
            background: #0095cd;
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

    // xh.openCInputBox();

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
      let cssSeletorOptimization = (xh.cssRuleOptimization(xhBarInstance.queryCssSelector)).trim();
      // TODOS:判断类型为string还是number(调用位置有误)
      // let tmpCssDom = document.querySelector(cssSeletorOp);
      // let tmpCssDomChilds = null;
      // if (xh.currentSeletorType === xh.TYPE_STRING && tmpCssDom) {
      //   tmpCssDomChilds = tmpCssDom.childNodes;
      //   console.log('tmpCssDomChilds', tmpCssDomChilds);
      //   if (tmpCssDomChilds.length === 1 && tmpCssDomChilds[0].nodeName === '#text' && !isNaN(Number(tmpCssDomChilds[0].nodeValue))) {
      //     console.log('set number');
      //     xh.currentSeletorType = xh.TYPE_NUMBER;
      //   }
      // }
      // if (xh.currentSeletorType === xh.TYPE_STRING) {
      //   if (!isNaN(Number(resultStr))) {
      //     xh.currentSeletorType = xh.TYPE_NUMBER;
      //   }
      // }

      // * 判断是否为array
      // let cssSeletorDom = document.querySelectorAll(cssSeletorOptimization);
      // if (cssSeletorDom && cssSeletorDom.length > 1) {
      //   xh.currentSeletorType = xh.TYPE_ARRAY;
      // }

      let title = xh.popupSelect.value !== -1 && xh.popupSelect.value !== '-1'  ? xh.popupSelectPreset[xh.popupSelect.value] : xh.popupOtherInput.value;
      xh.confirmSavePath({
        title: title,
        cssSelector: cssSeletorOptimization,
        type: xh.currentSeletorType
      });
    });
    
    if (xh.docuBody === null) {
      xh.docuBody = document.querySelector('body');
    }
    xh.docuBody.appendChild(xh.divTmp);
  }
}

xh.formContentTag = [
  'input',
  'select'
];

xh.formElementCondi = function (tagName) {
  if (xh.formContentTag.indexOf(tagName.toLowerCase()) !== -1) {
    return true;
  }
  return false;
}

xh.getElementValue = function (ele) {
  if (xh.formElementCondi(ele.tagName)) {
    console.log('ele.value', ele.value);
    return ele.value;
  }
}

// * 将新分隔符版本的xpath转为正式版本的xpath
xh.transformSpeQueryToOldQuery = function (querySpe) {
  return querySpe.replace(/~\/~/g, '/');
}

// * css优化到最小范围
xh.cssRuleOptimization = function (query) {
  /**
   * DONE:
   * 1：判断是否有id，没有的话返回原样
   * 2：判断最后一个id所在位置
   * 3：移除最后一个id之前的所有规则
   */
  let cssRuleOrigin = query;
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

  // * 原先的高亮（不需要使用）
  // xh.highlight(toHighlight);

  // * 进行全局匹配，使用css selector
  xh.splitQuery(xhBarInstance.queryCssSelector);
  
  // * 发送消息
  xh.fixingPopup(true, {
    xpath: xhBarInstance.query_,
    resultStr: str.trim()
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

  // * 使用新分隔符的query
  this.queryNewSpe_ = null;
  // * css selector
  this.queryCssSelector = null;

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

// * 功能是否已经打开
xh.Bar.prototype.isOpen_ = function () {
  return xh.IS_OPEN;
}

// * 更新xpath和css selector，并更新顶部的显示框（显示框已删除）
xh.Bar.prototype.updateQueryAndBar_ = function(el) {
  xh.clearHighlights();
  let queryObj = null;
  if (el) {
    queryObj = xh.makeQueryForElement(el);
  }
  this.queryNewSpe_ = queryObj ? queryObj.query : '';
  this.queryCssSelector = queryObj ? queryObj.queryCss : '';
  console.log('queryCssSelector:', this.queryCssSelector);
  this.query_ = this.queryNewSpe_.replace(/~\/~/g, '/');
  console.log('query_:', this.query_);
  // console.log(' updateQueryAndBar_ this.query_ ', this.query_ );
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

// * 显示顶部的显示框
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
    // * 打开弹框和显示匹配高亮(还原上次的操作状态)
    // xh.openCInputBox();
    // that.updateBar_(true);
  }
  // ! 判断bar.html是否在DOM里
  if (!this.inDOM_) {
    this.inDOM_ = true;
    // document.body.appendChild(this.barFrame_);
  }
  window.setTimeout(impl, 0);
};

// * 隐藏顶部的显示框
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

// * 控制顶部的显示框
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

// * 监听的回调方法
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
  } else if (request.type === 'previewAndSubmit') {
    this.previewCssRuleCol();
  } else if (request.type === 'cancelAll') {
    this.resetCssRuleCol();
  }
};

// * 预览css selector合集
xh.Bar.prototype.previewCssRuleCol = function () {
  if (Object.keys(xh.cssRuleCol).length > 0) {
    xh.previewRquest();
  } else {
    xh.createHint('暂无数据，请添加数据', 'warning');
    xh.showHint();
    xh.closeHintDelay(2000);
  }
}

// * 删除已保存的css selector集合
xh.Bar.prototype.resetCssRuleCol = function () {
  xh.cssRuleCol = {};
  xh.createHint('取消成功');
  xh.showHint();
  xh.closeHintDelay(2000);
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
  if (
    e.keyCode === xh.X_KEYCODE
    && ctrlKey
    && shiftKey
  ) {
    this.toggleBar_();
  }
  /**
   * If the user just pressed Shift and they're not holding Ctrl, update query.
   * Note that we rely on the mousemove handler to have updated this.currEl_.
   * Also, note that checking e.shiftKey wouldn't work here, since Shift is the
   * key that triggered this event.
   * 如果按住shift但没有按住ctrl时，更新query
   * this.currEl_的更新依赖鼠标移动事件
   * 并且，注意这里不会触发e.shiftKey
   */
  if (
    !this.hidden_()
    && !ctrlKey
    && e.keyCode === xh.SHIFT_KEYCODE
  ) {
    this.updateQueryAndBar_(this.currEl_);
  }
};

xh.Bar.prototype.mouseClick_ = function (e) {
  console.log('e', e);
  let flagStop = false;
  let domPath = e.path;
  let domPathL = domPath.length;
  // * 阻止冒泡
  for (let i = 0; i < domPathL; i++) {
    if (
      domPath[i]
      && domPath[i].id
      && domPath[i].id.indexOf('c-input-box') !== -1
    ) {
      // * id中有c-input-box
      e.stopPropagation();
      flagStop = true;
      break;
    } else if (
      domPath[i]
      && domPath[i].id
      && domPath[i].id.indexOf('c-preview-wrapper') !== -1
    ) {
      // * id中有c-preview-wrapper
      e.stopPropagation();
      flagStop = true;
      break;
    } else if (
      // * class中有c-hint--wrappe
      domPath[i]
      && domPath[i].className
      && domPath[i].className.indexOf('c-hint--wrapper') !== -1
    ) {
      e.stopPropagation();
      flagStop = true;
      break;
    }
  }
  // * 阻止a标签默认事件
  if (e.target.tagName === 'A') {
    e.preventDefault();
  } else if (xh.checkParentHref(e)) {
    e.preventDefault();
  } else if (xh.checkParentHref(e.target.parentNode)) {
    e.preventDefault();
  }
  // * 如果已经获取到元素并且没有被阻止冒泡则显示弹框
  if (
    this.currEl_
    && !flagStop
  ) {
    // * 计算当前元素的位置与周围可用的空间
    xh.calcTargetElePos(e);
    xh.calcEleRoundPosAvalid();
    // * 更新显示的结果，获取xpath和css selector
    this.updateQueryAndBar_(this.currEl_);
  }
}

////////////////////////////////////////////////////////////
// Initialization code

if (location.href.indexOf('acid3.acidtests.org') === -1) {
  window.xhBarInstance = new xh.Bar();
}
