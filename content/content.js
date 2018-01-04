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

// * 扩展的命名空间：xh.
var xh = xh || {};

////////////////////////////////////////////////////////////
// * 函数及常量、变量

xh.FIRST_OPEN = true;

xh.SHIFT_KEYCODE = 16; // * shift字符
xh.X_KEYCODE = 88; // * x字符
xh.ALT_KEYCODE = 18; // * alt字符
xh.CTRL_KEYCODE = 17; // * ctrl字符

xh.CONTAIN_SLI = true; // * 限制是否使用元素在同级的序号作为匹配的关键词
xh.CLASS_LIMIT = 1; // * 限制匹配关键词中所使用的class的个数

xh.TYPE_STRING = 'string';
xh.TYPE_NUMBER = 'number';
xh.TYPE_ARRAY = 'array';
xh.TYPE_OBJECT = 'object';

xh.NEW_AREA = 'newArea'; // * 新建区域
xh.SELECT_AREA = 'selectArea'; // * 选择标识区域

xh.docuBody = null; // * body对象
xh.divTmpWrapper = null;
xh.divTmp = null; // * 弹窗对象
xh.popupSelect = null; // * 弹窗里的select
xh.popupOtherInput = null; // * 弹窗里的其他输入框
xh.popupTextareaXpath = null; // * 弹窗里的xpath框
xh.popupTextareaResult = null; // * 弹窗里的result框

// * popup中的确认和取消按钮
xh.popupButtonConfirm = null;
xh.popupButtonCancel = null;

// * 输入弹框的vue实例
xh.inputBoxIns = null;

// * 优化后的css selector
xh.cssSeletorOptimizationRes = ''; // * 模糊模式
xh.cssSeletorStrictOptimizationRes = ''; // * 严格模式

xh.IS_OPEN = false; // * 功能是否开启的状态

xh.cssRuleCol = {}; // * 保存的xpath合集
xh.areaCreated = {}; // * 新建的识别区域放在这里

xh.hintIns = null; // * 操作提示实例

xh.hintDelayIns = null; // * 提示的定时器

xh.previewIns = null; // * 预览窗口的实例

xh.currentSeletorType = xh.TYPE_STRING; // * 保存当前元素的类型（已经没有用，等待相关关联的数据删除中）

xh.LEVEL_LIMIT = 3; // * 最近模糊模式的限制层级

xh.currElIsSelecting = false; // * 元素已经在选中的状态（鼠标点击了某个元素或者使用键盘快捷键来选择）
xh.currElIsSelected = true; // * 通过鼠标或键盘选中时都会保存一份选择的DOM元素

xh.currElIsMove = null; // * 保存鼠标移动时获取的元素

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

// * CSS Selector使用，检查两个元素的子元素是否有相同的结构
xh.elementsShareChildConstruct = function (el, sib) {
  if ((!el.childNodes && sib.childNodes) || (el.childNodes && !sib.childNodes)) {
    return false;
  }
  let isLengthSame = el.childNodes.length === sib.childNodes.length;
  if (isLengthSame) {
    let len = el.childNodes.length;
    for (let i = 0; i < len; i++) {
      if (el.childNodes[i].nodeName !== sib.childNodes[i].nodeName) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

// * Xpath 使用，获取元素在父元素中排序
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

// * CSS Selector 使用，获取元素在父元素中排序
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

// * 判断元素所在区域是否为列表
// * 有部分相同className的同名元素，出现多个初步判断为列表
xh.getElementIndexCssWithClass = function (el) {
  let index = 1;
  let sib;
  for (sib = el.previousSibling; sib; sib = sib.previousSibling) {
    if (sib.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }
    // console.log('el', el);
    // console.log('el.className', el.className);
    // console.log('sib', sib);
    // console.log('sib.className', sib.className);
    if (((el.className !== '' && sib.className !== '') || (el.className === '' && sib.className === '')) && xh.cssClassOptimization(el.className) === xh.cssClassOptimization(sib.className)) {
      index++;
    } else if ((el.className === '' || sib.className === '') && xh.elementsShareFamilyCss(el, sib) && xh.elementsShareChildConstruct(el, sib)) {
      index++;
    }
  }
  if (index > 1) {
    return index;
  }
  for (sib = el.nextSibling; sib; sib = sib.nextSibling) {
    if (sib.nodeType !== Node.ELEMENT_NODE) {
      continue;
    }
    // console.log('el', el);
    // console.log('el.className', el.className);
    // console.log('sib', sib);
    // console.log('sib.className', sib.className);
    if (((el.className !== '' && sib.className !== '') || (el.className === '' && sib.className === '')) && xh.cssClassOptimization(el.className) === xh.cssClassOptimization(sib.className)) {
      index++;
    } else if ((el.className === '' || sib.className === '') && xh.elementsShareFamilyCss(el, sib) && xh.elementsShareChildConstruct(el, sib)) {
      index++;
    }
  }
  return index;
}

// * 创建xpath和css selector
xh.makeQueryForElement = function(el) {
  let query = '';
  let queryCss = '';
  let queryCssStrict = '';
  let hasBreak = false;
  let isFirstList = true;
  let levelLimit = xh.LEVEL_LIMIT;
  // console.log('el.textContent', el.textContent);
  // * (暂定)此处判断type（已废弃）
  // let elChildNodes = el.childNodes;
  // if (
  //   ( xh.formElementCondi(el.tagName) && !isNaN(Number(xh.getElementValue(el))) )
  //   || ( elChildNodes && elChildNodes.length === 1 && elChildNodes[0].nodeName === '#text' && !isNaN(Number(elChildNodes[0].nodeValue)) )
  // ) {
  //   xh.currentSeletorType = xh.TYPE_NUMBER;
  // }
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
    let componentCss = el.tagName.toLowerCase(); // * css selector 模糊模式用
    let componentCssStrict = el.tagName.toLowerCase(); // * css selector 严格模式用
    let index = xh.getElementIndex(el);
    let indexCss = xh.getElementIndexCss(el); // * css selector 模糊模式用
    let indexCssWithClass = xh.getElementIndexCssWithClass(el); // * css selector 模糊和严格模式用

    if (el.id) {
      component += '[@id=\'' + el.id + '\']';
      componentCss += '[id=\'' + el.id + '\']'; // * css selector 模糊模式用
      componentCssStrict += '[id=\'' + el.id + '\']'; // * css selector 严格模式用
    } else if (el.className) {
      component += '[@class=\'' + el.className + '\']';

      // * css seletor的class用经过刷选处理，目前最多只留下一个class名
      
      // * css seletor 严格模式
      componentCssStrict += '[class*=\'' + xh.cssClassOptimization(el.className.trim()) + '\']';

      // * css seletor 模糊模式 如果当前元素有可能为数组成员，则不使用class属性
      if (
        // indexCss >= 1
        // && isFirstList
        indexCss >= 1
      ) {
        if (indexCssWithClass > 1) {
          let useLen = 0;
          let elClassLen = el.className ? el.className.split(' ').length : 0;
          // * 对比当前元素兄弟元素的className长度
          let pre = el.previousSibling ? el.previousSibling : null;
          let next = el.nextSibling ? el.nextSibling : null;
          if (pre) {
            // * 与前一个元素对比
            let preClassLen = pre.className ? pre.className.split(' ').length : 0;
            if (elClassLen !== preClassLen) {
              useLen = Math.min(elClassLen, preClassLen);
            } else {
              useLen = elClassLen;
            }
          } else if (next) {
            // * 与后一个元素对比
            let nextClassLen = next.className ? next.className.split(' ').length : 0;
            if (elClassLen !== nextClassLen) {
              useLen = Math.min(elClassLen, nextClassLen);
            } else {
              useLen = elClassLen;
            }
          }
          // * 最多用一个className
          if (useLen >= 1) {
            useLen = 1;
            componentCss += '[class*=\'' + xh.cssClassOptimization(el.className.trim()) + '\']';
          }
        } 
        else {
          componentCss += '[class*=\'' + xh.cssClassOptimization(el.className.trim()) + '\']';
        }
      }
    }

    // * xpath 使用 判断是否元素在父元素中的排序（用xpath专用的规则）
    if (index >= 1) {
      component += '[' + index + ']';
    }

    // * 根据层级限制重置isFirstList
    if (levelLimit === 0 || levelLimit === '0') {
      isFirstList = false;
    }
    // console.log('levelLimit', levelLimit);

    // * css selector 模糊模式
    if (
      indexCss >= 1
      && el.tagName.toLowerCase() !== 'body'
      && !el.id
      // && indexCssWithClass === 1
      && !isFirstList
    ) {
      // * 虽有可能为数组成员，但是已经离点击的元素较远，则设置为严格匹配模式
      componentCss += ':nth-child(' + indexCss + ')';
    } else if (
      indexCss >= 1
      && indexCssWithClass > 1
      && isFirstList
    ) {
      // console.log('set isFirstList', indexCssWithClass);
      // * 有多个兄弟元素并且兄弟元素之间结构构造相似，极可能为数组成员，并且离点击的元素最为接近，则设置为模糊匹配模式
      isFirstList = false;
    }

    if (isFirstList && levelLimit > 0) {
      --levelLimit;
    }

    // * css selector 严格模式
    if (
      indexCss >= 1
      && el.tagName.toLowerCase() !== 'body'
      && !el.id
    ) {
      componentCssStrict += ':nth-child(' + indexCss + ')';
    }

    // * 如果最后的元素是img，生成xpath需要"img/@src"
    if (query === '' && el.tagName.toLowerCase() === 'img') {
      component += '~/~@src'; // * 替换了分隔符
    }
    if (el.tagName.toLowerCase() === 'img') {
      if (queryCss === '') {
        componentCss += '[src]'; // *
      }
      if (queryCssStrict === '') {
        componentCssStrict += '[src]'; // *
      }
    }

    // * 连接xpath
    query = '~/~' + component + query; // * 替换了分隔符

    // * 判断是否为直接子元素
    if (!hasBreak) {
      // * css selector 模糊模式
      if (queryCss !== '') {
        queryCss = ' >' + queryCss;
      }
      // * css selector 严格模式
      if (queryCssStrict !== '') {
        queryCssStrict = ' >' + queryCssStrict;
      }
      hasBreak = false;
    }

    queryCss = ' ' + componentCss + queryCss; // *
    queryCssStrict = ' ' + componentCssStrict + queryCssStrict; // *

    hasBreak = false; // * 重置元素直接父子关系的状态
    el = el.parentNode;
  }
  return {
    query,
    queryCss: queryCss.trim(),
    queryCssStrict: queryCssStrict.trim()
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

// * 第一次开启功能时获取
xh.getPresetData = function () {
  // return axiosInstance({
  //   method: 'get',
  //   url: '/captcha'
  // });
  return Promise.resolve(1);
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
xh.closePreview = function (event) {
  event.stopPropagation();
  xh.previewIns && (xh.previewIns.style.display = 'none');
}

// * 提交按钮的回调
xh.submitData = function (event) {
  // TODOS
  /**
   * 提交数据
   */
  event.stopPropagation();
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
    xh.previewIns.classList.add('c-preview-symbol');
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
    // let previewData = JSON.stringify(xh.cssRuleCol, null, 2);
    let previewData = JSON.stringify(xh.areaCreated, null, 2);
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
    xh.hintIns.classList.add('c-hint-symbol');
  }
  xh.hintIns.innerHTML = xh.getHintInsTemplateString({
    text: text,
    type: type
  });
  if (xh.docuBody === null) {
    xh.docuBody = document.querySelector('body');
  }
  if (!document.querySelector('.c-hint--wrapper')) {
    xh.docuBody.appendChild(xh.hintIns);
  }
}

// * 显示提示框
xh.showHint = function () {
  xh.hintIns && (xh.hintIns.style.display = 'block');
}

// * 隐藏提示框
xh.hideHint = function () {
  xh.hintIns && (xh.hintIns.style.display = 'none');
}

// * 设置提示框
xh.setHint = function (text, type) {
  xh.createHint(text, type);
  xh.showHint();
  xh.closeHintDelay(2000);
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

xh.setAreaCreateNested = function (area, data) {
  let isSuccess = false;
  let areaArr;
  if (area.trim()) {
    areaArr = area.split('/');
  } else {
    areaArr = [];
  }
  let tmpObjCurr = xh.areaCreated;
  for (let i = 0; i < areaArr.length; i++) {
    i === 0 ? (tmpObjCurr = tmpObjCurr[areaArr[i]]) : (tmpObjCurr = tmpObjCurr.meta[areaArr[i]]);
    // console.log('i', i);
    // console.log('tmpObjCurr', tmpObjCurr);
  }
  if (areaArr && areaArr.length > 0) {
    tmpObjCurr.meta = tmpObjCurr.meta ? tmpObjCurr.meta : {};
    if (!tmpObjCurr.meta[data.title]) {
      tmpObjCurr.meta[data.title] = data;
      isSuccess = true;
    }
  } else {
    if (!tmpObjCurr[data.title]) {
      tmpObjCurr[data.title] = data
      isSuccess = true;
    }
  }
  return isSuccess;
}

// * 弹窗确认按钮的回调方法
xh.confirmSavePath = function (data) {
  let isSuccess = false;
  console.log('confirm', data);
  let { title, cssSelector, cssSelectorStrict, type, action, areaSelected, isAreaIdenti, areaTitleSelected, areaNewLimit, areaNewLimitSetter } = data;
  // * 判断是否有选择的路径多级
  // * 通过action判断是新建识别区域还是选择识别区域
  if (action === xh.NEW_AREA && !areaNewLimitSetter) {
    let data = {
      title,
      cssSelector,
      cssSelectorStrict,
      type,
      isAreaIdenti
    };
    // if (areaNewLimitSetter && areaNewLimit) {
    //   let areaNewLimitArr = areaNewLimit.split('/');
    //   let tmpObjCurr = xh.areaCreated;
    //   let tmpObj = null;
    //   for (let i = 0; i < areaNewLimitArr.length; i++) {
    //     tmpObjCurr = tmpObjCurr[areaNewLimitArr[i]];
    //   }
    //   tmpObjCurr.meta = tmpObjCurr.meta ? tmpObjCurr.meta : {};
    //   tmpObjCurr.meta[data.title] = data;
    // } else {
    if (!xh.areaCreated[title]) {
      xh.areaCreated[title] = data;
      isSuccess = true;
    }
    // }
  } else if (action === xh.NEW_AREA && areaNewLimitSetter && areaNewLimit) {
    let data = {
      title,
      cssSelector,
      cssSelectorStrict,
      type,
      isAreaIdenti
    };
    isSuccess = xh.setAreaCreateNested(areaNewLimit, data);
  } else if (action === xh.SELECT_AREA) {
    let data = {
      title,
      cssSelector,
      cssSelectorStrict,
      type,
      isAreaIdenti
    };
    isSuccess = xh.setAreaCreateNested(areaSelected, data);
    // let areaCreatedArr = Object.keys(xh.areaCreated);
    // for (let item of areaCreatedArr) {
    //   if (item === areaSelected) {
    //     xh.areaCreated[item].meta = xh.areaCreated[item].meta ? xh.areaCreated[item].meta : {};
    //     xh.areaCreated[item].meta[title] = {
    //       title,
    //       cssSelector,
    //       type,
    //       isAreaIdenti
    //     }
    //   }
    // }
  }
  // * 设置选择元素的状态
  xh.currElIsSelecting = false;
  console.log('xh.areaCreated');
  console.log(xh.areaCreated);

  // * test start:
  // * 获取属性名的数组并循环判断是否有上下级关系（判断关系有无可能是object）(测试)
  // xh.cssRuleCol[title + new Date().getTime()] = data;
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

  if (isSuccess) {
    xh.closeCInputBox();
    xh.clearHighlights();
    xh.createHint('保存成功');
    xh.showHint();
    xh.closeHintDelay(2000);
  } else {
    xh.createHint('已经存在同名的区域，请使用其他名称', 'error');
    xh.showHint();
  }

  xh.currentSeletorType = xh.TYPE_STRING; // * 设置选取的元素的取值类型（待删除）
  // * 测试预览功能
  // xh.previewRquest();
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
xh.calcEleRoundPosAvalid = function () {
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

// * keyDownKeyWhiteList
xh.keyDownKeyWhiteList = [
  'Backspace',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight'
]

// * 设置全局的模糊层级
xh.setLEVEL_LIMIT = function (limit) {
  xh.LEVEL_LIMIT = limit;
  xhBarInstance.updateQueryAndBar_(xh.currElIsSelected);
}

/**
 * @argument node  |CharacterData| 类的节点（如  |Text|、|Comment| 或 |CDATASection|）。
 * @returns 若 |node| 的文字内容全为空白则传回 true，否则传回 false。
 */
xh.isAllWs = function ( node ) {
  return !(/[^\t\n\r ]/.test(node.data));
}

/**
 * @argument node  DOM1 |Node| 对象
 * @returns 若 |Text| 节点内仅有空白符或为 |Comment| 节点时，传回 true，否则传回 false。
 */
xh.isIgnorable = function ( node ){
  return ( node.nodeType == 8) || // * 注释节点
  ( (node.nodeType == 3) && xh.isAllWs(node) ); // * 仅含空白符的文字节点
}

/**
 * @list 需要过滤的tagName
 * 脚本
 * 样式
 * 注释
 */
xh.tagNameExcludeList = [
  'script',
  'style',
  '#comment',
  '#text'
];

xh.popupSelectChange = function (e) {
  // console.log('popupSelectChange', e);
  // const eV = e.target.value;
  // if (eV === '-1' || eV === -1) {
  //   xh.popupOtherInput && (xh.popupOtherInput.style.display = 'block');
  // } else {
  //   xh.popupOtherInput && (xh.popupOtherInput.style.display = 'none');
  // }
}

xh.popupOtherInputChange = function (e) {
  // console.log('popupOtherInputChange', e);
}

// * 关闭弹窗
xh.closeCInputBox = function () {
  xh.divTmpWrapper && (xh.divTmpWrapper.style.display = 'none');
}

// * 打开弹窗
xh.openCInputBox = function () {
  xh.divTmpWrapper && (xh.divTmpWrapper.style.display = 'block');
}

// * 取消按钮的回调事件
xh.cancelInputBox = function () {
  xh.closeCInputBox();
  xh.clearHighlights();
  xh.currElIsSelecting = false;
}

// * 创建弹框实例（vue版本）
xh.createInputBoxIns = function () {
  xh.inputBoxIns = new Vue({
    data: {
      areaCreated: xh.areaCreated,
      typePresets: [{
        name: '单块内容',
        value: 'object'
      }, {
        name: '列表',
        value: 'array'
      }, {
        name: '字符串',
        value: 'string'
      }, {
        name: '数值',
        value: 'number'
      }],
      titlePresets: ['标题1', '标题2', '标题3', '标题4'],
      symbolPreset: '',
      customTitle: '',
      radioArea: 'newArea',
      inputBoxTop: xhBarInstance.popupPos.y + 'px',
      inputBoxLeft: xhBarInstance.popupPos.x + 'px',
      cssSeletorOptimizationRes: xhBarInstance.queryCssSelector.trim(),
      cssSeletorStrictOptimizationRes: xhBarInstance.queryCssSelectorStrict.trim(),
      areaSelected: '',
      areaTitleSelected: this.titlePresets && this.titlePresets.length > 0 ? this.titlePresets[0] : '',
      customAreaTitle: '',
      areaNewLimit: '',
      areaNewLimitSetter: '',
      IATitleType: 'IATitlePreset',
      levelLimit: xh.LEVEL_LIMIT
    },
    methods: {
      resetDataStatus () {
        this.areaCreated = xh.areaCreated;
        this.cssSeletorOptimizationRes = xhBarInstance.queryCssSelector.trim();
        this.cssSeletorStrictOptimizationRes = xhBarInstance.queryCssSelectorStrict.trim();
        this.inputBoxTop = xhBarInstance.popupPos.y + 'px';
        this.inputBoxLeft = xhBarInstance.popupPos.x + 'px';
        this.customTitle = '';
        this.areaTitleSelected = this.titlePresets && this.titlePresets.length > 0 ? this.titlePresets[0] : '';
        this.customAreaTitle = '';
        this.IATitleType = 'IATitlePreset';
        this.areaNewLimitSetter = '';
        this.levelLimit = xh.LEVEL_LIMIT;
        this.setSymbolPresetDefault();
        this.setAreaNewLimitDefault();
        this.setRadioAreaDefault();
      },
      setAreaNewLimitDefault () {
        let arr = this.getAreaIdenti(this.areaCreated);
        if (arr.length > 0) {
          this.areaNewLimit = arr[0];
        } else {
          this.areaNewLimit = '';
        }
      },
      setSymbolPresetDefault () {
        this.symbolPreset = this.typePresets && this.typePresets.length > 0 ? this.typePresets[0].value : '';
      },
      setRadioAreaDefault () {
        let areaCreatedArr = Object.keys(this.areaCreated);
        if (areaCreatedArr.length > 0) {
          this.radioArea = 'selectArea';
          // this.areaSelected = this.areaCreated[areaCreatedArr[0]].title;
        } else {
          this.radioArea = 'newArea';
          // this.areaSelected = '';
        }
        this.areaSelected = '';
      },
      cancelInputBox (event) {
        event.stopPropagation();
        xh.cancelInputBox();
      },
      confirmSavePath () {
        let title = '';
        if (this.radioArea === xh.NEW_AREA) {
          title = this.customTitle
        } else if (this.radioArea === xh.SELECT_AREA && this.IATitleType === 'IATitlePreset') {
          title = this.areaTitleSelected;
        } else {
          title = this.customAreaTitle;
        }
        xh.confirmSavePath({
          title: title,
          type: this.symbolPreset,
          action: this.radioArea,
          cssSelector: this.cssSeletorOptimizationRes,
          cssSelectorStrict: this.cssSeletorStrictOptimizationRes,
          areaSelected: this.areaSelected,
          isAreaIdenti: this.radioArea === xh.NEW_AREA,
          areaTitleSelected: this.areaTitleSelected,
          areaNewLimit: this.areaNewLimit,
          areaNewLimitSetter: this.areaNewLimitSetter
        });
      },
      getAreaIdenti (areaCreated) {
        let res = [];
        let arr = Object.keys(areaCreated);
        for (let i of arr) {
          if (areaCreated[i].isAreaIdenti && (xhBarInstance.queryCssSelectorStrict.trim()).indexOf(areaCreated[i].cssSelectorStrict) !== -1) {
            res.push(i);
            if (areaCreated[i].meta) {
              let metas = this.getAreaIdenti(areaCreated[i].meta);
              let metasRename = metas.map((item, index, arr) => {
                item = areaCreated[i].title + '/' + item;
                // console.log('item after plus', item);
                return item;
              });
              res = res.concat(metasRename);
            }
          }
        }
        // console.log('res:', res);
        return res;
      },
      levelLimitKeydown ($event) {
        $event.stopPropagation();
        console.log('levelLimitKeydown', $event);
        if (isNaN(Number(event.key)) && xh.keyDownKeyWhiteList.indexOf(event.key) === -1) {
          console.log('NaN');
          $event.preventDefault();
        }
      },
      levelLimitChange ($event) {
        console.log('levelLimitChange', $event);
        xh.setLEVEL_LIMIT($event.target.value);
      }
    },
    computed: {
    },
    mounted () {
      // this.symbolPreset = this.typePresets && this.typePresets.length > 0 ? this.typePresets[0].value : '';
      this.setSymbolPresetDefault();
    },
    template: `
      <div id="c-input-box-ins-wrapper">
        <div id="c-input-box">
          <div class="select-input--wrapper">
            <div id="identificationArea" class="c-identification-area-select" v-show="Object.keys(this.areaCreated).length > 0">
              <div class="c-identificationAreaSelect-wrapper">
                <input type="radio" id="identificationAreaSelect" value="selectArea" v-model="radioArea"><span>选择识别区域</span>
              </div>
              <div class="c-block" v-show="radioArea === 'selectArea'">
                <select name="areaSelect" id="areaSelector" v-model="areaSelected" class="inline-b">
                  <option v-for="area in [''].concat(getAreaIdenti(this.areaCreated))" :key="area" :value="area">{{ area }}</option>
                </select>
                <div class="c-block c-talign">
                  <input type="radio" value="IATitlePreset" v-model="IATitleType" style="margin-left: 20px;">
                  <span>选择标题：</span>
                  <select name="areaTitleSelect" id="areaTitleSelector" v-model="areaTitleSelected" class="inline-b mgt-middle" style="margin-left: 20px;">
                    <option v-for="title in titlePresets" :key="title" :value="title">{{ title }}</option>
                  </select>
                </div>
                <div class="c-block c-talign">
                  <input type="radio" value="IATitleCustom" v-model="IATitleType" style="margin-left: 20px;"/>
                  <span>自定义标题：</span>
                  <input v-model="customAreaTitle" type="text" class="c-input-cl mgt-middle" id="customAreaTitle" style="margin-left: 20px;">
                </div>
              </div>
            </div>
            <div id="identificationAreaCreate" class="c-identification-area-create">
              <div class="c-identificationAreaSelect-wrapper">
                <input type="radio" id="identificationAreaCreate" value="newArea" v-model="radioArea"><span>新建识别区域</span>
              </div>
              <div class="c-block" v-show="radioArea === 'newArea'">
                <div class="c-block c-talign" v-show="Object.keys(this.areaCreated).length > 0">
                  <input type="checkbox" value="areaNewLimitSetter" id="areaNewLimitSetter" v-model="areaNewLimitSetter" style="margin-left: 20px;"/>
                  <span>设定所属区域：</span>
                  <select name="areaNewLimit" id="areaNewLimit" v-model="areaNewLimit" class="inline-b mgt-middle" style="margin-left: 20px;">
                    <option v-for="area in getAreaIdenti(this.areaCreated)" :key="area" :value="area">{{ area }}</option>
                  </select>
                </div>
                <div class="c-block c-talign">
                  <span class="middle-left">名称：</span>
                  <input v-model="customTitle" type="text" class="c-input-cl" id="popupOtherInput" style="margin-left: 0; margin-right: 0">
                </div>
                <div class="c-block c-talign">
                  <span class="middle-left">类型：</span>
                  <select name="symbolType" id="symbomSelect" v-model="symbolPreset" class="c-input-cl c-disp-ib" style="margin-left: 0; margin-right: 0">
                    <option v-for="preset in typePresets" :key="preset.value" :value="preset.value">{{ preset.name }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="c-block c-talign">
              <span class="middle-left">全局匹配层级：</span>
              <input v-model="levelLimit" type="text" class="c-input-cl middle-left mgt-middle" @keydown="levelLimitKeydown" @change="levelLimitChange">
            </div>
            <div class="c-buttons">
              <div id="popupButtonCancel" @click="cancelInputBox">取消</div>
              <div id="popupButtonConfirm" @click="confirmSavePath">确定</div>
            </div>
          </div>
        </div>
      </div>
    `
  });
}

// * 创建弹框实例和定位弹框实例
xh.fixingPopup = function (toggle, param) {
  let xpath = param && param.xpath ? param.xpath : '';
  let resultStr = param && param.resultStr ? param.resultStr : '';
  // * 保存优化过后的css规则到xh的作用域中
  xh.cssSeletorOptimizationRes = (xh.cssRuleOptimization(xhBarInstance.queryCssSelector)).trim();
  xh.cssSeletorOptimizationRes = (xh.cssRuleOptimization(xhBarInstance.queryCssSelector)).trim();
  // if (xh.docuBody) {
  //   xh.docuBody.removeChild(xh.divTmp);
  // }
  if (xhBarInstance.popupPos) {
    if (!xh.divTmpWrapper) {
      xh.divTmpWrapper = document.createElement('div');
      xh.divTmpWrapper.classList.add('c-input-box-ins-symbol');
    }
    if (!xh.divTmp) {
      xh.divTmp = document.createElement('div');
      xh.divTmp.id = 'c-input-box-ins-outcontainer';
    }
    if (xh.docuBody === null) {
      xh.docuBody = document.querySelector('body');
    }
    xh.docuBody.appendChild(xh.divTmpWrapper);
    xh.divTmpWrapper.appendChild(xh.divTmp);

    if (!xh.inputBoxIns) {
      xh.createInputBoxIns();
      xh.inputBoxIns.$mount('#c-input-box-ins-outcontainer');
    } else {
      xh.inputBoxIns.resetDataStatus();
      xh.openCInputBox();
    }
    
    let popupDomS = 
      `
        <div id="c-input-box">
          <div class="select-input--wrapper">
            <div id="identificationArea" class="c-identification-area">
              
            </div>
            <div id="identificationAreaCreate" class="c-identification-area-create">
              <div class="c-identificationAreaSelect-wrapper">
                <input type="radio" id="identificationAreaSelect" checked>新建识别区域</input>
              </div>
              <input type="text" id="popupOtherInput" placeholder="请输入自定义的标题">
              <select name="symbolType" id="symbomSelect">
                <option value=""></option>
                <option value="array">列表</option>
                <option value="object">单块内容</option>
              </select>
            </div>
            <div class="c-buttons">
              <div id="popupButtonCancel">取消</div>
              <div id="popupButtonConfirm">确定</div>
            </div>
          </div>
        </div>
      `;
      // <div class="c-textarea--wrapper wrapper--textarea-xpath">
      //         <textarea id="popupTextareaXpath" readonly="true"></textarea>
      //       </div>
      //       <div class="c-textarea--wrapper wrapper--textarea-result">
      //         <textarea id="popupTextareaResult" readonly="true"></textarea>
      //       </div>
    // xh.divTmp.innerHTML = popupDomS;

    // xh.openCInputBox();

    // * 保存popup的select和添加事件
    // xh.popupSelect = xh.divTmp.querySelector('#symbomSelect');
    // xh.popupSelect && xh.popupSelect.addEventListener('change', xh.popupSelectChange);

    // * 保存其他的输入框和添加事件
    // xh.popupOtherInput = xh.divTmp.querySelector('#popupOtherInput');
    // xh.popupOtherInput && xh.popupOtherInput.addEventListener('change', xh.popupOtherInputChange)

    // * 保存文本框(废弃)
    // xh.popupTextareaXpath = xh.divTmp.querySelector('#popupTextareaXpath');
    // xh.popupTextareaResult = xh.divTmp.querySelector('#popupTextareaResult');

    // xh.popupTextareaXpath.value = toggle ? xpath : '';
    // xh.popupTextareaResult.value = toggle ? resultStr : '';

    // * 保存按钮
    // xh.popupButtonCancel = xh.divTmp.querySelector('#popupButtonCancel')
    // xh.popupButtonConfirm = xh.divTmp.querySelector('#popupButtonConfirm')

    // xh.popupButtonCancel.addEventListener('click', xh.cancelInputBox);
    // xh.popupButtonConfirm.addEventListener('click', () => {
      // let cssSeletorOptimization = (xh.cssRuleOptimization(xhBarInstance.queryCssSelector)).trim();
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

      // let title = xh.popupOtherInput.value;
      // * 确认
      // xh.confirmSavePath({
      //   title: title,
      //   cssSelector: cssSeletorOptimization,
      //   type: xh.currentSeletorType
      // });
    // });
    
    // if (xh.docuBody === null) {
    //   xh.docuBody = document.querySelector('body');
    // }
    // xh.docuBody.appendChild(xh.divTmp);
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

// * herf白名单列表
xh.hrefWhiteListKeyWord = [
  // 'docs',
  // 'zh',
  // 'cn'
];

// * 自定义herf过滤
xh.customHrefFilter = function (value) {
  for (let item of xh.hrefWhiteListKeyWord) {
    if (value.toLowerCase().indexOf(item.toLowerCase()) !== -1) {
      return true;
    }
  }
  return false;
}

// * 判断是否允许跳转
xh.canJump = function (elTarget) {
  if (elTarget.attributes.href && xh.customHrefFilter(elTarget.attributes.href.value)) {
    return true;
  }
  return false;
}

// * 设置需要强行打开的页面的链接
xh.setNewTabForceOpenFunc = function (url) {
  console.log('url', url);
  let resUrl = '';
  let query = '';
  let hash = '';

  let separateHash = [];
  let separateParam = [];
  // let hashPosi = urlT.indexOf('#');
  // let paramPosi = urlT.indexOf('?');

  separateHash = url.split('#');
  if (separateHash.length > 1) {
    separateParam = separateHash[0].split('?');
  } else {
    separateParam = url.split('?');
  }
  if (separateHash.length > 1) {
    hash = separateHash[1];
  }
  if (separateParam.length > 1) {
    query = separateParam[1] + '&forceopen=1';
  } else if (separateParam.length <= 1) {
    query = 'forceopen=1';
  }
  resUrl = separateParam[0] + '?' + query + hash;
  return resUrl;
}

// * 创建新页面
xh.createNewTab = function (urlT) {
  console.log('urlT', urlT);
  let urlWithCustomQuery = xh.setNewTabForceOpenFunc(urlT);
  chrome.runtime.sendMessage({
    type: 'createNewTab',
    params: {
      url: urlWithCustomQuery
    }
  });
}

////////////////////////////////////////////////////////////
// xh.Bar class definition

xh.Bar = function () {
  this.boundHandleRequest_ = this.handleRequest_.bind(this);
  this.boundMouseMove_ = this.mouseMove_.bind(this);
  // this.boundKeyDown_ = this.keyDown_.bind(this);
  // * this绑定新的键盘监听
  this.boundKeyDownExtend_ = this.keyDownExtend_.bind(this);
  // * this绑定点击方法
  this.boundMouseClick = this.mouseClick_.bind(this);

  this.inDOM_ = false;
  this.currEl_ = null;
  this.currElPos = null;
  this.popupPos = null;

  // * 使用新分隔符的query
  this.queryNewSpe_ = null;
  // * css selector 模糊模式
  this.queryCssSelector = null;
  // * css selector 严格模式
  this.queryCssSelectorStrict = null;

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
  this.query_ = this.queryNewSpe_.replace(/~\/~/g, '/');
  console.log('query_:');
  console.log(this.query_);

  this.queryCssSelector = queryObj ? queryObj.queryCss : '';
  console.log('queryCssSelector:');
  console.log(this.queryCssSelector);

  this.queryCssSelectorStrict = queryObj ? queryObj.queryCssStrict : '';
  console.log('queryCssSelectorStrict:');
  console.log(this.queryCssSelectorStrict);

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

xh.Bar.prototype.prepareShowBar_ = function () {
  // this.barFrame_.classList.remove('hidden');
  // * 添加开启状态
  xh.IS_OPEN = true;
  chrome.runtime.sendMessage({
    type: 'open'
  });
  document.addEventListener('mousemove', this.boundMouseMove_);
  // * 添加点击事件
  document.addEventListener('click', this.boundMouseClick);
  // * 绑定新的键盘监听
  document.addEventListener('keydown', this.boundKeyDownExtend_);
  // * 打开弹框和显示匹配高亮(还原上次的操作状态)
  // xh.openCInputBox();
  // this.updateBar_(true);
};

// * 开启功能
xh.Bar.prototype.showBar_ = function() {
  // var that = this;
  // function impl() {
    
  // }
  // ! 判断bar.html是否在DOM里
  if (!this.inDOM_) {
    this.inDOM_ = true;
    // document.body.appendChild(this.barFrame_);
  }
  // window.setTimeout(impl, 0);
  window.setTimeout(() => {
    if (xh.FIRST_OPEN) {
      xh.getPresetData()
        .then((data) => {
          xh.FIRST_OPEN = false;
          console.log(data);
          this.prepareShowBar_();
        })
        .catch((err) => {
          console.log('http getPresetData err:', err);
        });
    } else {
      this.prepareShowBar_();
    }
  }, 0);
};

// * 关闭功能
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
    // * 移除新的键盘监听
    document.removeEventListener('keydown', that.boundKeyDownExtend_);
    // * 关闭弹框
    xh.closeCInputBox();
    xh.clearHighlights();
  }
  window.setTimeout(impl, 0);
};

// * 控制开关
xh.Bar.prototype.toggleBar_ = function() {
  // if (this.hidden_()) {
  if (!this.isOpen_()) {
    this.showBar_();
    // xh.preventHref();
  } else {
    this.hideBar_();
    xh.currElIsSelecting = false;
    // xh.unPreventHref();
  }
};

xh.Bar.prototype.setCurrEl = function (nodes) {
  let len = nodes.length;
  for (let i = 0; i < len; i++) {
    let res = this.setCurrElExcludeList(nodes[i]);
    if (res) {
      return true;
      // break;
    }
  }
  return false;
}

xh.Bar.prototype.setCurrElExcludeList = function (node) {
  if (!node) {
    return false;
  }
  let tagName = node.tagName ? node.tagName : node.nodeName;
  let className = node.className ? node.className : '';
  console.log('node.className', node.className);
  if (
    xh.tagNameExcludeList.indexOf(tagName.toLowerCase()) === -1
    && !xh.isIgnorable(node)
    && className.indexOf('c-hint-symbol') === -1
    && className.indexOf('c-input-box-ins-symbol') === -1
    && className.indexOf('c-preview-symbol') === -1
  ) {
    this.currEl_ = node;
    return true;
  }
  return false;
}

xh.Bar.prototype.setCurrElNext = function () {
  let nextSibling = xh.currElIsSelected && xh.currElIsSelected.nextSibling ? xh.currElIsSelected.nextSibling : null;
  for (; ; ) {
    let res = this.setCurrElExcludeList(nextSibling);
    if (res) {
      return true;
    } else {
      nextSibling = nextSibling && nextSibling.nextSibling ? nextSibling.nextSibling : null;
      if (!nextSibling) {
        return false;
      }
    }
  }
}

xh.Bar.prototype.setCurrElPre = function () {
  if (xh.currElIsSelected.tagName && xh.currElIsSelected.tagName.toLowerCase() === 'html') {
    return false;
  }
  let previousSibling = xh.currElIsSelected && xh.currElIsSelected.previousSibling ? xh.currElIsSelected.previousSibling : null;
  for (; ; ) {
    let res = this.setCurrElExcludeList(previousSibling);
    if (res) {
      return true;
    } else {
      previousSibling = previousSibling && previousSibling.previousSibling ? previousSibling.previousSibling : null;
      if (!previousSibling) {
        return false;
      }
    }
  }
}

// * 监听的回调方法
xh.Bar.prototype.handleRequest_ = function(request, sender, cb) {
  if (request.type === 'evaluate') {
    xh.clearHighlights();
    this.query_ = request.query;
    this.updateBar_(false);
  } else if (request.type === 'moveBar') {
    // this.barFrame_.classList.toggle('bottom');
  } else if (request.type === 'hideBar') {
    this.hideBar_();
    xh.currElIsSelecting = false;
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
  if (Object.keys(xh.areaCreated).length > 0) {
    xh.previewRquest();
  } else {
    xh.createHint('暂无数据，请添加数据', 'warning');
    xh.showHint();
    xh.closeHintDelay(2000);
  }
}

// * 删除已保存的css selector集合
xh.Bar.prototype.resetCssRuleCol = function () {
  xh.currElIsSelecting = false;
  xh.cssRuleCol = {};
  xh.createHint('取消成功');
  xh.showHint();
  xh.closeHintDelay(2000);
};

xh.Bar.prototype.mouseMove_ = function(e) {
  if (xh.currElIsMove === e.toElement) {
    return;
  }
  xh.currElIsMove = e.toElement;
  
  // if (e.shiftKey) {
  // }
};

// * 新的键盘监听方法（用于监控alt和ctrl的组合及单独使用）
xh.Bar.prototype.keyDownExtend_ = function (event) {
  // console.log('keyDownExtend_ event:', event);
  let ctrlKey = event.ctrlKey || event.metaKey;
  let altKey = event.altKey;
  let shiftKey = event.shiftKey;
  let selectChangeStatus = false;
  let selectChangeText = '';
  if (xh.currElIsSelecting) {
    if (event.keyCode === xh.X_KEYCODE && shiftKey && !ctrlKey && !altKey) {
      console.log('快速向上选择');
      let parentNode = xh.currElIsSelected && xh.currElIsSelected.parentNode ? xh.currElIsSelected.parentNode : null;
      if (parentNode && parentNode.tagName.toLowerCase() !== 'html') {
        // this.currEl_ = parentNode;
        this.setCurrElExcludeList(parentNode);
        selectChangeStatus = true;
      } else {
        selectChangeText = '没有父节点了';
      }
    } else if (event.keyCode === xh.X_KEYCODE && ctrlKey && !shiftKey && !altKey) {
      console.log('快速向下选择');
      let childNodes = xh.currElIsSelected && xh.currElIsSelected.childNodes ? xh.currElIsSelected.childNodes : [];
      if (childNodes.length > 0) {
        // this.currEl_ = childNodes[0];
        this.setCurrEl(childNodes);
        selectChangeStatus = true;
      } else {
        selectChangeText = '没有子节点了';
      }
    } else if (event.keyCode === xh.X_KEYCODE && shiftKey && ctrlKey && !altKey) {
      console.log('快速同级向下选择');
      let res = this.setCurrElNext();
      if (res) {
        selectChangeStatus = true;
      } else {
        selectChangeText = '后面没有兄弟节点了';
      }
      // let nextSibling = xh.currElIsSelected && xh.currElIsSelected.nextSibling ? xh.currElIsSelected.nextSibling : null;
      // if (nextSibling) {
      //   // this.currEl_ = nextSibling;
      //   this.setCurrElExcludeList(nextSibling);
      //   selectChangeStatus = true;
      // } else {
      //   selectChangeText = '后面没有兄弟节点了';
      // }
    } else if (event.keyCode === xh.X_KEYCODE && shiftKey && altKey && !ctrlKey) {
      console.log('快速同级向上选择');
      let res = this.setCurrElPre();
      if (res) {
        selectChangeStatus = true;
      } else {
        selectChangeText = '前面没有兄弟节点了';
      }
      // let previousSibling = xh.currElIsSelected && xh.currElIsSelected.previousSibling ? xh.currElIsSelected.previousSibling : null;
      // if (previousSibling) {
      //   // this.currEl_ = previousSibling;
      //   this.setCurrElExcludeList(previousSibling);
      //   selectChangeStatus = true;
      // } else {
      //   selectChangeText = '前面没有兄弟节点了';
      // }
    }
    if (selectChangeStatus) {
      // * 设置已选中状态
      xh.currElIsSelecting = true;
      xh.currElIsSelected = this.currEl_;
      // * 更新显示的结果，获取xpath和css selector
      this.updateQueryAndBar_(this.currEl_);
    } else if (!selectChangeStatus && selectChangeText) {
      xh.setHint(selectChangeText, 'warning');
    }
  } else if (!xh.currElIsSelecting && event.keyCode === xh.X_KEYCODE && altKey && xh.currElIsMove) {
    console.log('快速选择');
    // * 设置已选中状态
    xh.currElIsSelecting = true;
    xh.currElIsSelected = xh.currElIsMove;
    // * 更新显示的结果，获取xpath和css selector
    this.updateQueryAndBar_(xh.currElIsMove);
  }
}

// * 旧的键盘监听方法（已经废弃）
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
  // console.log('location', window.location);  
  let originS = window.location.origin;
  let flagStop = false;
  let domPath = e.path;
  let domPathL = domPath.length;
  // * 阻止冒泡
  for (let i = 0; i < domPathL; i++) {
    if (
      domPath[i]
      && domPath[i].id
      && (domPath[i].id.indexOf('c-input-box') !== -1 || domPath[i].id.indexOf('c-preview-wrapper') !== -1)
    ) {
      // * id中有c-input-box
      // * id中有c-preview-wrapper
      e.stopPropagation();
      flagStop = true;
      break;
    } else if (
      // * className中有c-hint--wrappe
      domPath[i]
      && domPath[i].className
      && domPath[i].className.indexOf('c-hint--wrapper') !== -1
    ) {
      e.stopPropagation();
      flagStop = true;
      break;
    }
  }
  if (!flagStop) {
    // * 保存点击的节点
    this.currEl_ = e.toElement;
  }
  // * 阻止a标签默认事件（目前层级设为3）
  if (e.target.tagName === 'A') {
    e.preventDefault();
    if (xh.canJump(e.target)) {
      let urlT = e.target.attributes.href.value;
      let href = urlT;
      if (href.indexOf('http') === -1 && href.indexOf('https') === -1) {
        urlT = originS + href;
      }
      console.log('urlT', urlT);
      flagStop = true;
      xh.createNewTab(urlT);
    }
  } else if (xh.checkParentHref(e)) {
    e.preventDefault();
    if (e.target.parentNode && xh.canJump(e.target.parentNode)) {
      let urlT = e.target.parentNode.attributes.href.value;
      let href = urlT;
      if (href.indexOf('http') === -1 && href.indexOf('https') === -1) {
        urlT = originS + href;
      }
      console.log('urlT', urlT);
      flagStop = true;
      xh.createNewTab(urlT);
    }
  } else if (xh.checkParentHref(e.target.parentNode)) {
    e.preventDefault();
    if (e.target.parentNode && e.target.parentNode.parentNode && xh.canJump(e.target.parentNode.parentNode)) {
      let urlT = e.target.parentNode.parentNode.attributes.href.value;
      let href = urlT;
      if (href.indexOf('http') === -1 && href.indexOf('https') === -1) {
        urlT = originS + href;
      }
      console.log('urlT', urlT);
      flagStop = true;
      xh.createNewTab(urlT);
    }
  }
  // * 如果已经获取到元素并且没有被阻止冒泡则显示弹框
  if (
    this.currEl_
    && !flagStop
  ) {
    // * 设置已选中状态
    xh.currElIsSelecting = true;
    xh.currElIsSelected = this.currEl_;
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
