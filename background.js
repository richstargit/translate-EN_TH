let text = ""
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.event === "settext") {
        text = message.text
    }
    if (message.event === "open") {
        sendResponse({ text });
    }
    if (message.event === "captureSelection") {
      text="Wait..."
      chrome.tabs.sendMessage(sender.tab.id, {
        event: "imageCaptured",
        dataUrl:message.dataUrl,
        startX: message.startX,
        startY: message.startY,
        width: message.width,
        height: message.height
      });
    }
    if (message.event === "downloadImage") {
        console.log("save3")
        chrome.downloads.download({
          url: message.dataUrl,
          filename: "capture.png",
          saveAs: true
        });
      }
});
  