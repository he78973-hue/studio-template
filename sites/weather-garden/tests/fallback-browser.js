(async () => {
  const html = await (await fetch('./index.html')).text();
  const frame = document.createElement('iframe'); frame.id = 'qaFallback';
  frame.title = 'WebGL-disabled recovery test'; frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:999;background:#f2f5f5';
  const shim = `<script>const originalCanvasContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(['webgl','webgl2','experimental-webgl'].includes(type))return null;return originalCanvasContext.call(this,type,...args);};`;
  frame.srcdoc = html.replace('<script>', shim); document.body.appendChild(frame);
  const deadline = performance.now() + 18000;
  while (!frame.contentWindow.__weatherDebug || frame.contentWindow.__weatherDebug.state().loading) {
    if (performance.now() > deadline) throw Error('Fallback initialization timed out');
    await new Promise(r => setTimeout(r, 100));
  }
  const w = frame.contentWindow, d = frame.contentDocument;
  if (w.__weatherDebug.scene() !== null || d.querySelector('#sceneFallback').hidden || !d.querySelector('#windToggle').disabled) throw Error('Fallback UI did not activate');
  if (w.__weatherDebug.state().hours.length !== 24 || d.querySelectorAll('[data-day]').length !== 7) throw Error('Forecast data unavailable in fallback');
  return {threeDisabled:true,fallbackVisible:true,hourlyPoints:24,dayRows:7,source:w.__weatherDebug.state().source};
})()
