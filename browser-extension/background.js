chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'OPEN_TRANSFORMER') return;

  const targetUrl = message.url
    ? `https://lector-el-norte-zw6m-rolsufg8j-tomipucelas-projects.vercel.app/?url=${encodeURIComponent(message.url)}`
    : 'https://lector-el-norte-zw6m-rolsufg8j-tomipucelas-projects.vercel.app/';

  chrome.tabs.create({ url: targetUrl }, () => {
    sendResponse({ ok: true });
  });

  return true;
});