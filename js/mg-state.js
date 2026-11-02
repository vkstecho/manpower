/* FEATURE MODULE: state
 * Edit this file for related Mentor features. See AI_INDEX.md / HOW_AI_READS.md
 */
(function (MG) {
'use strict';

MG.state = {
  mobile: null,
  _chatUnsub: null,
  _dataUnsub: null,
  _lastLocalChatWrite: 0,
  isMentor: false,
  viewingAs: null,
  currentTopicId: null,
  selectedHours: 1,
  data: null
};
MG.$ = function (s) { return document.querySelector(s); };
MG.$$ = function (s) { return document.querySelectorAll(s); };

})(window.MG = window.MG || {});
