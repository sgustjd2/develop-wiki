// 노트용 예시 그림 생성기. 사이트 테마(CSS 변수)를 따르는 인라인 SVG 를 만든다.
// 사용: import { fig, ui } from '../scripts/figures.mjs'; console.log(fig([...], '캡션'));
// 규칙: 마크다운 HTML 블록이 깨지지 않도록 출력에 빈 줄·앞 공백이 없다(한 줄씩).
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const W = 120, H = 80;
const t = (x, y, s, cls = 'f-text', anchor = 'start', size = 7) => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}" font-size="${size}">${esc(s)}</text>`;
const r = (x, y, w, h, cls = 'f-card', rx = 3) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}"/>`;
const c = (x, y, rad, cls) => `<circle cx="${x}" cy="${y}" r="${rad}" class="${cls}"/>`;
const ln = (x1, y1, x2, y2, cls = 'f-line') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}"/>`;
const pth = (d, cls) => `<path d="${d}" class="${cls}"/>`;
const screen = (inner) => r(8, 4, 104, 72, 'f-screen', 5) + inner;

export const ui = {
  /** 켜짐/꺼짐 스위치 */
  switch: (on = true) => r(35, 30, 50, 22, on ? 'f-fill-blue' : 'f-fill-gray', 11) + c(on ? 74 : 46, 41, 8, 'f-knob') + t(60, 66, on ? '켜짐' : '꺼짐', 'f-muted', 'middle'),
  checkbox: (state = 'checked') => r(46, 26, 28, 28, state === 'unchecked' ? 'f-box' : 'f-fill-blue', 5) + (state === 'checked' ? pth('M52 40 l6 6 l11 -13', 'f-tick') : state === 'indeterminate' ? ln(52, 40, 68, 40, 'f-tick') : '') + t(60, 68, state === 'checked' ? '선택' : state === 'indeterminate' ? '일부' : '해제', 'f-muted', 'middle'),
  radio: (sel = 1) => [0, 1, 2].map((i) => c(24, 20 + i * 20, 7, i === sel ? 'f-ring-blue' : 'f-ring') + (i === sel ? c(24, 20 + i * 20, 3.5, 'f-fill-blue') : '') + t(38, 23 + i * 20, ['옵션 A', '옵션 B', '옵션 C'][i])).join(''),
  segmented: (labels = ['일간', '주간', '월간'], sel = 1) => { const w = 84 / labels.length; return r(18, 28, 84, 24, 'f-seg', 12) + r(18 + sel * w + 2, 30, w - 4, 20, 'f-fill-blue', 10) + labels.map((l, i) => t(18 + i * w + w / 2, 43, l, i === sel ? 'f-on' : 'f-text', 'middle')).join(''); },
  toast: (msg = '저장했어요') => screen(r(20, 54, 80, 14, 'f-dark', 7) + t(60, 63.5, msg, 'f-on', 'middle', 6.5)),
  snackbar: (msg = '삭제했어요', action = '실행 취소') => screen(r(14, 54, 92, 16, 'f-dark', 3) + t(20, 64, msg, 'f-on', 'start', 6.5) + t(100, 64, action, 'f-blue-on-dark', 'end', 6.5)),
  banner: (msg = '점검 안내') => screen(r(8, 4, 104, 16, 'f-fill-amber', 5) + t(16, 14.5, msg, 'f-text', 'start', 6.5) + ln(20, 34, 100, 34) + ln(20, 46, 100, 46) + ln(20, 58, 80, 58)),
  modal: (title = '제목', buttons = ['취소', '확인']) => screen(r(0, 0, 120, 80, 'f-scrim', 5) + r(22, 18, 76, 44, 'f-card', 4) + t(60, 32, title, 'f-text', 'middle', 7.5) + ln(32, 38, 88, 38) + (buttons.length === 1 ? r(46, 46, 28, 11, 'f-fill-blue', 3) + t(60, 54, buttons[0], 'f-on', 'middle', 6.5) : r(30, 46, 28, 11, 'f-btn', 3) + t(44, 54, buttons[0], 'f-text', 'middle', 6.5) + r(62, 46, 28, 11, 'f-fill-blue', 3) + t(76, 54, buttons[1], 'f-on', 'middle', 6.5))),
  bottomSheet: () => screen(r(0, 0, 120, 80, 'f-scrim', 5) + r(8, 36, 104, 40, 'f-card', 6) + r(50, 40, 20, 3, 'f-fill-gray', 1.5) + ln(18, 54, 100, 54) + ln(18, 64, 80, 64)),
  tooltip: (msg = '설명') => screen(r(30, 16, 60, 14, 'f-dark', 3) + pth('M56 30 l4 5 l4 -5 z', 'f-dark') + r(44, 36, 32, 14, 'f-fill-blue', 7) + t(60, 46, '버튼', 'f-on', 'middle', 6.5) + t(60, 25.5, msg, 'f-on', 'middle', 6.5)),
  inlineError: (msg = '이메일 형식이 아니에요') => r(14, 22, 92, 18, 'f-input-err', 3) + t(20, 34, 'user@', 'f-text', 'start', 7) + t(14, 54, msg, 'f-err', 'start', 6.5),
  progressBar: (pct = 60) => r(14, 34, 92, 8, 'f-fill-gray', 4) + r(14, 34, 92 * pct / 100, 8, 'f-fill-blue', 4) + t(60, 58, `${pct}%`, 'f-muted', 'middle'),
  spinner: () => c(60, 36, 14, 'f-ring') + pth('M60 22 a14 14 0 0 1 14 14', 'f-arc') + t(60, 66, '불확정', 'f-muted', 'middle'),
  skeleton: () => screen(c(24, 24, 8, 'f-fill-gray') + r(38, 18, 54, 5, 'f-fill-gray', 2.5) + r(38, 28, 38, 5, 'f-fill-gray', 2.5) + r(16, 44, 88, 5, 'f-fill-gray', 2.5) + r(16, 54, 70, 5, 'f-fill-gray', 2.5) + r(16, 64, 80, 5, 'f-fill-gray', 2.5)),
  stepper: (n = 4, cur = 2) => ln(22, 36, 98, 36) + Array.from({ length: n }, (_, i) => { const x = 22 + (76 / (n - 1)) * i; return c(x, 36, 6, i < cur ? 'f-fill-blue' : i === cur ? 'f-ring-blue' : 'f-ring') + t(x, 52, `${i + 1}`, 'f-muted', 'middle'); }).join(''),
  emptyState: (msg = '아직 없어요', cta = '추가하기') => screen(r(44, 14, 32, 22, 'f-fill-gray', 4) + t(60, 49, msg, 'f-text', 'middle', 7) + r(44, 54, 32, 11, 'f-fill-blue', 5) + t(60, 62, cta, 'f-on', 'middle', 6.5)),
  heart: (on = true) => pth('M60 52 C30 34 40 16 60 28 C80 16 90 34 60 52 z', on ? 'f-fill-red' : 'f-outline') + t(60, 70, '좋아요', 'f-muted', 'middle'),
  bookmark: (on = true) => pth('M48 16 h24 v38 l-12 -9 l-12 9 z', on ? 'f-fill-blue' : 'f-outline') + t(60, 70, '저장', 'f-muted', 'middle'),
  stars: (n = 4) => Array.from({ length: 5 }, (_, i) => pth(`M${24 + i * 18} 28 l2.6 5.4 l6 .8 l-4.4 4.2 l1.1 5.9 l-5.3 -2.9 l-5.3 2.9 l1.1 -5.9 l-4.4 -4.2 l6 -.8 z`, i < n ? 'f-fill-amber' : 'f-outline')).join('') + t(60, 62, `${n} / 5`, 'f-muted', 'middle'),
  calendar: () => screen(t(60, 16, '2026년 11월', 'f-text', 'middle') + Array.from({ length: 21 }, (_, i) => { const x = 20 + (i % 7) * 13.3, y = 28 + Math.floor(i / 7) * 14; return (i === 10 ? c(x, y - 2.5, 5.5, 'f-fill-blue') : '') + t(x, y, `${i + 1}`, i === 10 ? 'f-on' : 'f-muted', 'middle', 6); }).join('')),
  dateInput: () => [['년', 22, 26], ['월', 54, 18], ['일', 80, 18]].map(([l, x, w]) => t(x + w / 2, 24, l, 'f-muted', 'middle', 6.5) + r(x, 28, w, 16, 'f-input', 3)).join('') + t(24, 40, '2026', 'f-text', 'start', 7) + t(57, 40, '11', 'f-text', 'start', 7) + t(83, 40, '24', 'f-text', 'start', 7),
  aiActions: () => r(14, 14, 92, 26, 'f-fill-gray', 4) + ln(20, 22, 96, 22) + ln(20, 30, 80, 30) + [['복사', 24], ['재생성', 44], ['좋아요', 68], ['싫어요', 92]].map(([l, x]) => r(x - 9, 50, 20, 14, 'f-btn', 7) + t(x + 1, 59.5, l, 'f-text', 'middle', 5.2)).join(''),
};

/** 항목 [{ svg, label }] 을 그리드 그림으로 감싼다 */
export function fig(items, caption = '', alt = '') {
  const cells = items.map(({ svg, label }) => `<div class="fig-item"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">${svg}</svg><span>${esc(label)}</span></div>`).join('');
  return `<figure class="fig" role="group" aria-label="${esc(alt || caption)}"><div class="fig-grid">${cells}</div>${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
}
