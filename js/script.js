const pf         = document.getElementById('pf');
const innerSl    = document.getElementById('innerSlider');
const lsWrap     = document.getElementById('lsWrap');
const lsSlider   = document.getElementById('lsSlider');
const innerSlides= innerSl.querySelectorAll('.inner-slide');   // 모바일: 6개 / 데스크탑에선 앞 2개만 사용
const lsSlides   = lsSlider.querySelectorAll('.ls-slide');     // 4
const dots       = document.querySelectorAll('.dot');
const navCount   = document.getElementById('navCount');
const prevBtn    = document.getElementById('prevBtn');
const nextBtn    = document.getElementById('nextBtn');
const rotateShell = document.getElementById('rotateShell');

let gIdx = 0;
let isLandscape = false;

// 모바일/좁은 화면에서 폰이 뷰포트를 넘지 않도록 다운스케일만 적용
// (업스케일은 절대 하지 않으므로 텍스트가 흐려질 위험이 없음)
const pfScaleWrap = document.getElementById('pfScaleWrap');
const stageEl = document.getElementById('stage');
const navEl = document.querySelector('.nav');
const PF_W = 360; // .pf 실제 폭 (340 + padding 10*2)  — 세로(portrait) 기준
const PF_H = 680; // .pf 실제 높이 (660 + padding 10*2) — 세로(portrait) 기준
const LS_W = 915 * 1.5; // .ls-overlay 실제 폭  (885+30) * --ls-scale(1.5)  — 가로(landscape) 기준
const LS_H = 480 * 1.5; // .ls-overlay 실제 높이 (450+30) * --ls-scale(1.5) — 가로(landscape) 기준

// 네비 바가 실제로 차지하는 높이 + 폰과의 최소 여백
// (네비 자체 높이는 padding/폰트 변화로 매 반응형 구간마다 달라지므로 매번 측정)
const NAV_GAP = 14; // 폰 하단과 네비 바 사이 최소 간격(px)

function applyResponsiveScale(){
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const padW      = vw <= 760 ? 24 : vw <= 1100 ? 40 : 32;
  const navReserve = vw <= 760 ? 24 : vw <= 1100 ? 80 : 110;
  const availW = vw - padW;
  const availH = vh - navReserve;

  // 현재 모드(세로/가로)에 맞는 폰의 "논리적" 크기로 스케일 계산
  // (landscape 모드에서는 .ls-overlay가 더 넓고 낮은 비율이므로 LS_W/LS_H 기준으로 맞춰야
  //  실제 화면에 그려지는 크기와 겹침 판정이 일치함)
  const baseW = isLandscape ? LS_W : PF_W;
  const baseH = isLandscape ? LS_H : PF_H;
  const scale = Math.min(1, availW / baseW, availH / baseH);
  pfScaleWrap.style.zoom = scale < 1 ? scale : '';

  toggleNavVisibility(scale, baseH);
}

// 폰(또는 가로 오버레이)이 화면 중앙(.stage: align-items/justify-content center)에
// 놓였을 때 실제로 차지하는 하단 y좌표를 구해서, 네비 바가 들어갈 공간
// (NAV_GAP + 네비 높이)이 폰 베젤 아래에 남아있지 않으면 네비를 숨김.
// -> 화면 비율/크기가 어떻든 네비가 폰 베젤에 닿거나 겹치는 순간 그냥 사라짐.
function toggleNavVisibility(scale, baseH){
  if(!navEl) return;
  // 760px 이하 모바일 구간은 기존 CSS(.nav{display:none})와 동일하게 항상 숨김
  if(window.innerWidth <= 760){
    navEl.style.display = 'none';
    return;
  }
  // 직전에 display:none 상태였다면 offsetHeight가 0으로 나와 판정이 틀어지므로
  // 측정 직전 잠깐 보이는 상태로 되돌려 실제 높이를 정확히 잼
  navEl.style.display = '';
  const vh = window.innerHeight;
  const renderedH = baseH * scale;                   // 실제로 화면에 그려지는 폰 높이(px)
  const phoneBottomY = (vh / 2) + (renderedH / 2);    // 폰 하단의 뷰포트 기준 y좌표
  const spaceBelowPhone = vh - phoneBottomY;          // 폰 하단부터 화면 끝까지 남은 공간
  const navH = navEl.offsetHeight || navEl.scrollHeight || 0;

  const fits = spaceBelowPhone >= (NAV_GAP + navH);
  navEl.style.display = fits ? '' : 'none';
}
applyResponsiveScale();
window.addEventListener('resize', applyResponsiveScale);
window.addEventListener('orientationchange', applyResponsiveScale);
// 웹폰트 로딩 완료 후 네비 바 실제 높이가 바뀔 수 있으므로 한 번 더 재계산
if(document.fonts && document.fonts.ready){
  document.fonts.ready.then(applyResponsiveScale).catch(()=>{});
}

// 1100px 이하(태블릿 포함)에서는 가로 회전 없이 계속 세로 유지
function isMobile(){ return window.innerWidth <= 1100; }

function pad(n){ return String(n+1).padStart(2,'0'); }

function updateNav(){
  navCount.textContent = pad(gIdx) + ' / 06';
  prevBtn.disabled = gIdx === 0;
  nextBtn.disabled = gIdx === 5;
  dots.forEach((d,i) => d.classList.toggle('active', i === gIdx));
}

function setOrientation(landscape, instant, onDone){
  // 모바일에서는 절대 가로 모드로 전환하지 않음 -> 항상 세로 유지
  if(isMobile()) landscape = false;

  if(landscape === isLandscape){
    // 이미 같은 방향이면 전환 없이 바로 콜백 (다음 프레임에 실행해 호출 순서 일관성 유지)
    if(onDone) requestAnimationFrame(onDone);
    return;
  }
  isLandscape = landscape;

  if(instant){
    pf.classList.toggle('landscape', landscape);
    pf.style.visibility = landscape ? 'hidden' : 'visible';
    innerSl.style.display = landscape ? 'none' : 'block';
    lsWrap.style.display  = landscape ? 'block' : 'none';
    applyResponsiveScale(); // 방향 전환에 따라 폰 크기/비율이 바뀌므로 네비 위치 재계산
    if(onDone) requestAnimationFrame(onDone);
    return;
  }

  // 1) 실제 콘텐츠(텍스트 포함)는 즉시 숨겨서 전환 중 보이지 않게 함
  pf.style.visibility = 'hidden';
  lsWrap.style.display = 'none';

  // 2) 텍스트 없는 셀(shell)만 회전 애니메이션으로 보여줌
  rotateShell.classList.remove('spin-to-landscape', 'spin-to-portrait');
  // 강제 리플로우로 애니메이션 재시작 보장
  void rotateShell.offsetWidth;
  rotateShell.classList.add(landscape ? 'spin-to-landscape' : 'spin-to-portrait');

  clearTimeout(setOrientation._t);

  function swap(){
    // 3) 애니메이션이 100% 끝난 뒤(animationend) 콘텐츠를 교체 -> 셀의 마지막 프레임과
    //    실제 콘텐츠 사이에 경합(race)이 없어 한 프레임 겹쳐 보이는 깜빡임이 사라짐
    pf.classList.toggle('landscape', landscape);
    pf.style.visibility = landscape ? 'hidden' : 'visible';
    innerSl.style.display = landscape ? 'none' : 'block';
    lsWrap.style.display  = landscape ? 'block' : 'none';
    applyResponsiveScale(); // 방향 전환에 따라 폰 크기/비율이 바뀌므로 네비 위치 재계산
    // 셀은 콘텐츠가 자리잡은 다음 프레임에 숨김 -> 교체 순간에도 빈 화면이 보이지 않음
    requestAnimationFrame(() => {
      rotateShell.classList.remove('spin-to-landscape', 'spin-to-portrait');
      // 콘텐츠가 실제로 display:block이 되어 레이아웃이 잡힌 뒤에 콜백 실행
      // (scrollIntoView를 display:none 상태에서 호출하면 무시되는 문제 방지)
      if(onDone) requestAnimationFrame(onDone);
    });
  }

  let done = false;
  function onAnimEnd(e){
    if(e.target !== rotateShell) return;
    if(done) return;
    done = true;
    rotateShell.removeEventListener('animationend', onAnimEnd);
    swap();
  }
  rotateShell.addEventListener('animationend', onAnimEnd);
  // 안전장치: animationend가 누락되는 경우를 대비한 백업 타이머(애니메이션보다 살짝 길게)
  setOrientation._t = setTimeout(() => {
    if(done) return;
    done = true;
    rotateShell.removeEventListener('animationend', onAnimEnd);
    swap();
  }, 700);
}

// globalGoTo로 프로그래밍적 이동(회전 애니메이션 + smooth scroll) 중에는
// innerObs/lsObs가 중간 단계를 감지해 gIdx를 잘못 덮어쓰지 않도록 막는 플래그
let programmaticNav = false;
let programmaticNavTimer = null;

function globalGoTo(g, instant){
  g = Math.max(0, Math.min(5, g));
  gIdx = g;

  // 새 이동이 시작되면 잠금 걸고, 이전 타이머는 취소
  programmaticNav = true;
  clearTimeout(programmaticNavTimer);

  if(isMobile()){
    // 모바일: 6개 슬라이드 모두 세로 폰 안에서 스크롤로 이동, 회전 없음
    setOrientation(false, true, () => {
      innerSlides[g].scrollIntoView({behavior: instant ? 'auto' : 'smooth', block:'nearest'});
    });
  } else if(g <= 1){
    setOrientation(false, instant, () => {
      innerSlides[g].scrollIntoView({behavior: instant ? 'auto' : 'smooth', block:'nearest'});
    });
  } else {
    const idx = g - 2;
    setOrientation(true, instant, () => {
      lsSlides[idx].scrollIntoView({behavior: instant ? 'auto' : 'smooth', inline:'start', block:'nearest'});
    });
  }
  updateNav();

  // 회전(최대 700ms) + smooth scroll 시간을 넉넉히 덮도록 잠금 해제 지연
  programmaticNavTimer = setTimeout(() => {
    programmaticNav = false;
  }, instant ? 50 : 900);
}

function navigate(dir){
  globalGoTo(gIdx + dir);
}

/* ── 세로 폰 내부 슬라이드 감지 (모바일에서는 6개 전체, 데스크탑에서는 앞 2개) ── */
const innerObs = new IntersectionObserver(entries => {
  if(programmaticNav) return; // globalGoTo로 이동 중에는 옵저버가 gIdx를 덮어쓰지 않음
  entries.forEach(e => {
    if(e.isIntersecting && e.intersectionRatio >= 0.6){
      const idx = Array.from(innerSlides).indexOf(e.target);
      if(idx < 0) return;
      if(isMobile()){
        gIdx = idx; updateNav();
      } else if(!isLandscape && idx <= 1){
        gIdx = idx; updateNav();
      }
    }
  });
}, { threshold:0.6, root:innerSl });
innerSlides.forEach(s => innerObs.observe(s));

/* ── 가로 폰 내부 슬라이드 감지 (데스크탑 전용) ── */
const lsObs = new IntersectionObserver(entries => {
  if(programmaticNav) return; // globalGoTo로 이동 중에는 옵저버가 gIdx를 덮어쓰지 않음
  entries.forEach(e => {
    if(e.isIntersecting && e.intersectionRatio >= 0.7 && isLandscape && !isMobile()){
      const idx = Array.from(lsSlides).indexOf(e.target);
      if(idx >= 0){ gIdx = idx + 2; updateNav(); }
    }
  });
}, { threshold:0.7, root:lsSlider });
lsSlides.forEach(s => lsObs.observe(s));

/* ── 키보드 ── */
document.addEventListener('keydown', e => {
  if(e.key==='ArrowDown'||e.key==='ArrowRight') navigate(1);
  if(e.key==='ArrowUp'  ||e.key==='ArrowLeft' ) navigate(-1);
});

/* ── 마우스 휠 (탁탁 걸리는 느낌, 데스크탑 위주) ── */
let wheelLock = false;
document.addEventListener('wheel', e => {
  e.preventDefault();
  if(wheelLock) return;
  wheelLock = true;
  if(e.deltaY > 10 || e.deltaX > 10) navigate(1);
  else if(e.deltaY < -10 || e.deltaX < -10) navigate(-1);
  setTimeout(()=> wheelLock = false, 700);
}, { passive:false });

/* ── 터치 스와이프 (모바일에서는 항상 세로 스와이프만 다음/이전으로 처리) ── */
let tx0 = 0, ty0 = 0;
document.addEventListener('touchstart', e => {
  tx0 = e.touches[0].clientX;
  ty0 = e.touches[0].clientY;
});
document.addEventListener('touchend', e => {
  // 모바일에서는 CSS scroll-snap이 페이지 이동을 전담함.
  // 여기서 navigate()까지 같이 호출하면 스와이프 한 번에 스냅 이동 + 강제 이동이
  // 겹쳐져서 한 번에 2페이지씩 넘어가는 문제가 생기므로, 모바일은 그냥 스냅에 맡기고 return.
  if(isMobile()) return;
  const dx = tx0 - e.changedTouches[0].clientX;
  const dy = ty0 - e.changedTouches[0].clientY;
  if(Math.abs(dy) > Math.abs(dx)){
    if(Math.abs(dy) > 40) navigate(dy > 0 ? 1 : -1);
  } else {
    if(Math.abs(dx) > 40) navigate(dx > 0 ? 1 : -1);
  }
}, { passive:true });

/* ── 화면 크기 변경(데스크탑 ↔ 모바일 경계 통과) 시 현재 위치 기준으로 모드 재정렬 ── */
let lastIsMobile = isMobile();
window.addEventListener('resize', () => {
  const nowMobile = isMobile();
  if(nowMobile !== lastIsMobile){
    lastIsMobile = nowMobile;
    globalGoTo(gIdx, true);
  }
});

// init
globalGoTo(0, true);
