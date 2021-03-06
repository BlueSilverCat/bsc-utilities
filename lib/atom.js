"use babel";

import { createElementWithClass, isNode, setEventListener } from "./html";
import { isEmpty, isEmptyObject, isEmptyString } from "./utility";

function makeMiniEditor(text) {
  let editor = atom.workspace.buildTextEditor();

  editor.mini = true;
  editor.tabLength = 2;
  editor.softTabs = true;
  editor.softWrapped = false;
  //editor.buffer = new TextBuffer();
  editor.setText(text);
  return editor;
}

function makeMiniEditorWithView(text, cla) {
  let editor = makeMiniEditor(text);

  editor.view = atom.views.getView(editor);
  for (let i = 0; i < cla.length; ++i) {
    editor.view.classList.add(cla[i]);
  }
  return editor;
}

//for atom
function getActivatePackage(packageName) {
  let pack = atom.packages.getActivePackage(packageName);

  if (isEmpty(pack) === true) {
    pack = atom.packages.enablePackage(packageName);
  }
  return pack;
}

function checkEventClickOrEnter(evt) {
  if (evt.type === "click") {
    return true;
  }
  if (evt.type === "keydown") {
    let keyStroke = atom.keymaps.keystrokeForKeyboardEvent(evt);

    if (keyStroke === "enter") {
      return true;
    }
  }
  return false;
}

//ボタンを押された時の処理を返す
function changeToggleState(ele) {
  return (_evt) => {
    const btn = "btn";
    const sel = "selected";

    if (ele.classList.contains(btn)) {
      ele.classList.toggle(sel);
    }
  };
}

//現在の状態をボタンの見た目に反映させる
function setToggleState(ele, state) {
  const btn = "btn";
  const sel = "selected";

  if (ele.classList.contains(btn)) {
    if (state) {
      ele.classList.add(sel);
    } else {
      ele.classList.remove(sel);
    }
  }
}

function getConfigAndSetOnDidChange(configName, subscriptions, callback) {
  subscriptions.add(atom.config.onDidChange(configName, callback));
  return atom.config.get(configName);
}

//config などが変更された時に呼び出だされる関数を返す
function setChangedConfig(target, property) {
  return (evt) => {
    target[property] = evt.newValue;
  };
}

function editorDidChange(editor, target, property) {
  return (_evt) => {
    target[property] = editor.getText();
  };
}

//
function makeMiniEditorAndSetEditorDidChange(className, text, obj, propertyName, subscriptions) {
  let miniEditor = makeMiniEditorWithView(text, className);
  subscriptions.add(
    miniEditor.onDidStopChanging(editorDidChange(miniEditor, obj, propertyName))
  );
  return miniEditor;
}


//native-key-bindings classのエレメントの子にしないとdeleteなど効かない
//type
//text :
//search : 消去ボタンが出る
//textarea : 広さを変えられる
function makeInputText(type, classes, placeholder, defaultValue, func, useCapture, listners) {
  let workClasses = [];
  if (classes !== null) {
    workClasses = workClasses.concat(classes);
  }

  let ele = null;
  if (type === "text") {
    workClasses.push("input-text");
    ele = createElementWithClass("input", workClasses);
  } else if (type === "search") {
    workClasses.push("input-search");
    ele = createElementWithClass("input", workClasses);
  } else if (type === "textarea") {
    workClasses.push("input-textarea");
    ele = createElementWithClass("textparea", workClasses);
  } else {
    return null;
  }
  ele.type = type;
  if (placeholder !== null) {
    ele.placeholder = placeholder;
  }
  if (defaultValue !== null) {
    ele.defaultValue = defaultValue;
  }

  if (!isEmptyObject(func)) {
    listners.push(setEventListener(ele, "input", func, useCapture));
  }
  return ele;
}

//Look stylequide
//title: string
//checked : bool
function makeCheckbox(classes, content, checked, func, useCapture, listners) {
  let ele = createElementWithClass("label", ["input-label"].concat(classes)); //, content);

  let child = createElementWithClass("input", ["input-checkbox"].concat(classes));
  child.type = "checkbox";
  child.checked = false;
  if (checked === true) {
    child.checked = checked;
  }
  ele.appendChild(child);
  if (isNode(content)) {
    ele.appendChild(content);
  } else {
    ele.appendChild(document.createTextNode(content));
  }

  //listners.push(setEventListenerClickAndEnter(child, func, useCapture));
  if (!isEmptyObject(func)) {
    listners.push(setEventListener(ele, "click", func, useCapture)); //spaceを押すとclickイベントが起こる
  }
  return ele;
}

//
function makeInputNumber(classes, placeholder, min, max, defaultValue, func, useCapture, listners) {
  let ele = createElementWithClass("input", ["input-number"].concat(classes));

  ele.type = "number";
  if (min !== null) {
    ele.min = min;
  }
  if (max !== null) {
    ele.max = max;
  }
  if (placeholder !== null) {
    ele.placeholder = placeholder;
  }
  if (defaultValue !== null) {
    ele.defaultValue = defaultValue;
  }
  if (!isEmptyObject(func)) {
    listners.push(setEventListener(ele, "input", func, useCapture));
  }
  return ele;
}

//
function makeSelector(classes, options, defaultValue, func, useCapture, listners) {
  let ele = createElementWithClass("select", ["input-select"].concat(classes));

  for (let option of options) {
    let child = createElementWithClass("option", [], option);
    if (defaultValue === option) {
      child.selected = true;
    }
    ele.appendChild(child);
  }
  if (!isEmptyObject(func)) {
    listners.push(setEventListener(ele, "click", func, useCapture));
  }

  return ele;
}

//inlineType : string
//"no-inline" or null
//"inline"
//"inline-tight"
//size : string
//"normal", or null
//"extra-small"
//"small"
//"large"
//color : string
//"no-color", or null
//"primary"
//"info"
//"success"
//"warning"
//"error"
//selected : bool
//icon : string
//toggle: bool
function makeButton(classes, content, selected, size, color, inlineType, icon, inner, toggle,
  func, useCapture, listners) {
  let workClasses = ["btn"];

  switch (size) {
    case "extra-small":
      workClasses.push("btn-xs");
      break;
    case "small":
      workClasses.push("btn-sm");
      break;
    case "large":
      workClasses.push("btn-lg");
      break;
    default:
  }

  switch (color) {
    case "primary":
      workClasses.push("btn-primary");
      break;
    case "info":
      workClasses.push("btn-info");
      break;
    case "success":
      workClasses.push("btn-success");
      break;
    case "warning":
      workClasses.push("btn-warning");
      break;
    case "error":
      workClasses.push("btn-error");
      break;
    default:
  }

  switch (inlineType) {
    case "inline":
      workClasses.push("inline-block");
      break;
    case "inline-tight":
      workClasses.push("inline-block");
      break;
    default:
  }

  if (selected === true) {
    workClasses.push("selected");
  }
  if (icon !== null && icon !== "no-icon") {
    workClasses = workClasses.concat(["icon", icon]);
  }

  let ele = createElementWithClass("button", workClasses.concat(classes));
  if (content !== null) {
    ele.textContent = content;
  }
  if (inner !== null) {
    ele.innerHTML = inner;
  }
  if (toggle !== null) {
    setToggleState(ele, toggle);
    listners.push(setEventListener(ele, "click", changeToggleState(ele), useCapture));
  }
  if (!isEmptyObject(func)) {
    listners.push(setEventListener(ele, "click", func, useCapture)); //spaceを押すとclickイベントが起こる
  }
  return ele;
}

function getEditorDecoratedMarker(markers, editor) { //sort?
  let target = null;
  if (isEmptyString(editor)) {
    target = atom.workspace.getActiveTextEditor();
    if (target === "") {
      return [];
    }
  }

  let result = [];
  let activeMarkers = editor.getMarkers();
  for (let marker of markers) {
    for (let activeMarker of activeMarkers) {
      if (activeMarker === marker) {
        result.push(marker);
      }
    }
  }

  return result;
}

function destroyActiveDecoratedMarker(markers) {
  let editor = atom.workspace.getActiveTextEditor();
  if (!editor) {
    return [];
  }

  let remain = [];
  let activeMarkers = editor.getMarkers();
  for (let marker of markers) {
    for (let activeMarker of activeMarkers) {
      if (marker === activeMarker) {
        marker.destroy();
        break;
      }
    }
    if (!marker.isDestroyed()) {
      remain.push(marker);
    }
  }

  return remain;
}

function logRange(range) {
  console.log(
    "start_row: ", range.start.row,
    "start_column: ", range.start.column,
    "--- end_row: ", range.end.row,
    "end_column: ", range.end.column
  );
}

function getBufferRangeSelectedMarker(range, marker, markers) {
  let markerRange = null;
  if (marker) {
    markerRange = marker.getBufferRange();
    if (markerRange.isEqual(range)) {
      return marker;
    }
  }

  for (let work of markers) {
    markerRange = work.getBufferRange();
    if (markerRange.isEqual(range)) {
      return work;
    }
  }
  return null;
}

function getChangedConfig(obj, property) {
  return (evt) => {
    obj[property] = evt.newValue;
  };
}

function appendNewLine(editor, num) {
  let oldCursorPos = editor.getCursorBufferPosition();

  for (let i = 0; i < num; ++i) {
    editor.moveToBottom();
    editor.selectToBufferPosition(editor.getCursorBufferPosition());
    editor.insertNewline();
  }
  editor.setCursorBufferPosition(oldCursorPos, { "autoscroll": true });
}

function insertString(editor, string) {
  editor.selectToBufferPosition(editor.getCursorBufferPosition());
  editor.insertText(string, {
    "select": false,
    "autoIndent": false,
    "autoIndentNewline": false,
    "autoDecreaseIndent": false,
    "normalizeLineEndings": false,
    "undo": null,
  });
}

//選択されていない場合は?
function replaceSelected(string, editor = null) {
  let workEditor = editor;
  if (isEmptyString(workEditor)) {
    workEditor = atom.workspace.getActiveTextEditor();
    if (isEmptyString(workEditor)) {
      return;
    }
  }

  workEditor.insertText(string, {
    "select": true,
    "autoIndent": false,
    "autoIndentNewline": false,
    "autoDecreaseIndent": false,
    "normalizeLineEndings": true, //trueの場合の挙動が不安定?
    "undo": null,
  });
}

//configから、名前がdefault～のものを見つけ出し、defaultを除いた部分とdefault付きの名前のペアを作る
//本当はConditionsのプロパティから作った方が良いが、名前に規則を作るなりしないといけないのでconfigから作っている
function makeDefaultNamePair(config, obj, packageName) {
  const regex = /^default/;
  let nam = "";
  let result = [];

  for (let defaultName of Object.keys(config)) {
    if (regex.test(defaultName)) {
      nam = defaultName.substr(7, 1).toLowerCase() + defaultName.substr(8); //defaultを除いて先頭文字を小文字にする
      if (obj.hasOwnProperty(nam)) {
        result.push([nam, defaultName]);
      } else {
        throw new Error(`${packageName}: makeDefaultNamePair is failed. [${nam}, ${defaultName}]`);
      }
    }
  }
  return result;
}

//名前がdefault～のconfigをgetする
//defaultNames: DefaultNamePairの戻り値
function getDefaultConfig(defaultNames, packageName, obj) {
  for (let [objName, configName] of defaultNames) {
    obj[objName] = atom.config.get(`${packageName}.${configName}`);
  }
}

//名前がdefault～のconfigにsetする
//defaultNames: DefaultNamePairの戻り値
function setDefaultConfig(defaultNames, packageName, obj) {
  for (let [objName, configName] of defaultNames) {
    atom.config.set(`${packageName}.${configName}`, obj[objName]);
  }
}

export {
  makeMiniEditor,
  makeMiniEditorWithView,
  getActivatePackage,
  changeToggleState,
  setToggleState,
  checkEventClickOrEnter,
  getConfigAndSetOnDidChange,
  setChangedConfig,
  editorDidChange,
  makeMiniEditorAndSetEditorDidChange,
  makeInputText,
  makeCheckbox,
  makeInputNumber,
  makeSelector,
  makeButton,
  getEditorDecoratedMarker,
  destroyActiveDecoratedMarker,
  logRange,
  getBufferRangeSelectedMarker,
  getChangedConfig,
  appendNewLine,
  insertString,
  replaceSelected,

  makeDefaultNamePair,
  getDefaultConfig,
  setDefaultConfig,
};
